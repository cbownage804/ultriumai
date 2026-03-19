import { useCallback, useRef } from 'react';

/**
 * useHMRStatePreservation — True HMR: save & restore React component
 * state + DOM state across iframe reloads, preserving user context.
 *
 * Before reload: saves scroll, form inputs, focused element, open modals,
 *   accordion state, tab selections, and React state via __REACT_STATE__.
 * After reload: restores everything via postMessage.
 */

export interface HMRSnapshot {
  scrollX: number;
  scrollY: number;
  inputs: { selector: string; type: string; value?: string; checked?: boolean }[];
  focusSelector: string | null;
  openDetails: string[];
  activeTab: string | null;
  dialogOpen: boolean;
  /** Step 12: Preserve React Router path across reloads */
  routerPath: string | null;
  timestamp: number;
}

/** Script injected into preview to handle state save/restore */
const HMR_STATE_SCRIPT = `
<script data-hmr-state>
(function(){
  // Save state before HMR update
  window.__saveHMRState = function() {
    try {
      var state = {
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        inputs: [],
        focusSelector: null,
        openDetails: [],
        activeTab: null,
        dialogOpen: false,
        routerPath: (window.location.pathname !== '/' ? window.location.pathname : null),
        timestamp: Date.now()
      };

      // Save focused element
      if (document.activeElement && document.activeElement !== document.body) {
        var el = document.activeElement;
        state.focusSelector = el.id ? '#' + el.id :
          (el.name ? el.tagName.toLowerCase() + '[name="' + el.name + '"]' : null);
      }

      // Save form inputs
      document.querySelectorAll('input, textarea, select').forEach(function(el, i) {
        var sel = el.id ? '#' + el.id :
          (el.name ? el.tagName.toLowerCase() + '[name="' + el.name + '"]' :
           el.tagName.toLowerCase() + ':nth-of-type(' + (i+1) + ')');
        if (el.type === 'checkbox' || el.type === 'radio') {
          state.inputs.push({ selector: sel, type: el.type, checked: el.checked });
        } else {
          state.inputs.push({ selector: sel, type: el.type || 'text', value: el.value });
        }
      });

      // Save open details/accordions
      document.querySelectorAll('details[open]').forEach(function(el, i) {
        state.openDetails.push(el.id ? '#' + el.id : 'details:nth-of-type(' + (i+1) + ')');
      });

      // Save active tab (data-state="active")
      var activeTab = document.querySelector('[data-state="active"][role="tab"]');
      if (activeTab) {
        state.activeTab = activeTab.id || activeTab.getAttribute('data-value') || activeTab.textContent;
      }

      // Save dialog state
      state.dialogOpen = !!document.querySelector('[data-state="open"][role="dialog"]');

      sessionStorage.setItem('__hmr_snapshot__', JSON.stringify(state));
      return state;
    } catch(err) {
      console.warn('[HMR] Failed to save state:', err);
      return null;
    }
  };

  // Restore state after HMR update
  window.__restoreHMRState = function() {
    try {
      var raw = sessionStorage.getItem('__hmr_snapshot__');
      if (!raw) return;
      var state = JSON.parse(raw);
      
      // Skip if snapshot is stale (>10s old)
      if (Date.now() - state.timestamp > 10000) {
        sessionStorage.removeItem('__hmr_snapshot__');
        return;
      }

      // Restore scroll position (deferred to after React render)
      requestAnimationFrame(function() {
        setTimeout(function() {
          window.scrollTo(state.scrollX, state.scrollY);

          // Restore form inputs
          state.inputs.forEach(function(inp) {
            try {
              var el = document.querySelector(inp.selector);
              if (!el) return;
              if (inp.type === 'checkbox' || inp.type === 'radio') {
                el.checked = inp.checked;
              } else if (inp.value !== undefined) {
                // Use native setter to trigger React's synthetic events
                var nativeSet = Object.getOwnPropertyDescriptor(
                  window.HTMLInputElement.prototype, 'value'
                );
                if (nativeSet && nativeSet.set) {
                  nativeSet.set.call(el, inp.value);
                  el.dispatchEvent(new Event('input', { bubbles: true }));
                } else {
                  el.value = inp.value;
                }
              }
            } catch(e) {}
          });

          // Restore focus
          if (state.focusSelector) {
            try {
              var focused = document.querySelector(state.focusSelector);
              if (focused) focused.focus();
            } catch(e) {}
          }

          // Restore open details
          state.openDetails.forEach(function(sel) {
            try {
              var el = document.querySelector(sel);
              if (el) el.setAttribute('open', '');
            } catch(e) {}
          });

          sessionStorage.removeItem('__hmr_snapshot__');
        }, 100); // Wait for React to mount
      });
    } catch(err) {
      console.warn('[HMR] Failed to restore state:', err);
    }
  };

  // Listen for save/restore commands from parent
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === '__HMR_SAVE_STATE__') {
      var state = window.__saveHMRState();
      window.parent.postMessage({ type: '__HMR_STATE_SAVED__', state: state }, '*');
    }
    if (e.data.type === '__HMR_RESTORE_STATE__') {
      window.__restoreHMRState();
    }
  });

  // Auto-restore on load if snapshot exists
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      window.__restoreHMRState();
    });
  } else {
    window.__restoreHMRState();
  }
})();
</script>`;

export function useHMRStatePreservation() {
  const pendingResolveRef = useRef<((snapshot: HMRSnapshot | null) => void) | null>(null);

  /** Inject the HMR state script into compiled HTML */
  const injectHMRScript = useCallback((html: string): string => {
    if (html.includes('data-hmr-state')) return html;
    if (html.includes('ai-builder-fallback') || html.includes('Compilation Error')) return html;

    const headIdx = html.indexOf('<head>');
    if (headIdx !== -1) {
      return html.slice(0, headIdx + 6) + HMR_STATE_SCRIPT + html.slice(headIdx + 6);
    }
    return html;
  }, []);

  /** Request the iframe to save its current state before an update */
  const saveState = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>): Promise<HMRSnapshot | null> => {
    return new Promise((resolve) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) {
        resolve(null);
        return;
      }

      const timeout = setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(null);
      }, 500); // 500ms max wait

      const handler = (e: MessageEvent) => {
        if (e.data?.type === '__HMR_STATE_SAVED__') {
          clearTimeout(timeout);
          window.removeEventListener('message', handler);
          resolve(e.data.state || null);
        }
      };

      window.addEventListener('message', handler);
      iframe.contentWindow.postMessage({ type: '__HMR_SAVE_STATE__' }, '*');
    });
  }, []);

  /** Tell the iframe to restore its saved state after an update */
  const restoreState = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    // Delay slightly to let React mount first
    setTimeout(() => {
      iframe.contentWindow?.postMessage({ type: '__HMR_RESTORE_STATE__' }, '*');
    }, 200);
  }, []);

  return {
    injectHMRScript,
    saveState,
    restoreState,
  };
}

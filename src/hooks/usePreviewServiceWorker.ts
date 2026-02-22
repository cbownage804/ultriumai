/**
 * usePreviewServiceWorker — Gap 4 + Gap 5 (HMR)
 * 
 * Manages the preview Service Worker lifecycle:
 * - Registers the SW on mount
 * - Sends compiled HTML to the SW via postMessage
 * - Provides a stable preview URL for the iframe src
 * - Supports soft reload for JS changes (preserves scroll/form state)
 * - Falls back to srcdoc if SW registration fails
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const PREVIEW_PATH = '/__preview__/index.html';

export interface PreviewSWState {
  /** Whether the SW is ready to serve content */
  isReady: boolean;
  /** The URL to use as iframe src (or null if SW unavailable — use srcdoc fallback) */
  previewUrl: string | null;
  /** Send new compiled HTML to the SW */
  updatePreview: (html: string, options?: { softReload?: boolean }) => void;
  /** Force the iframe to reload from the SW */
  refreshPreview: () => void;
  /** Current content version */
  version: number;
  /** Trigger a soft reload of the iframe (preserves scroll/form state) */
  softReload: (iframeRef: React.RefObject<HTMLIFrameElement | null>) => void;
}

/**
 * State preservation script injected before soft reloads.
 * Captures scroll position and form input values, restores them after reload.
 */
const STATE_RESTORE_SCRIPT = `
<script data-hmr-restore>
(function() {
  // Check for saved state from before soft reload
  try {
    var saved = sessionStorage.getItem('__hmr_state__');
    if (!saved) return;
    sessionStorage.removeItem('__hmr_state__');
    var state = JSON.parse(saved);
    
    // Restore scroll position after DOM is ready
    requestAnimationFrame(function() {
      setTimeout(function() {
        if (state.scrollX || state.scrollY) {
          window.scrollTo(state.scrollX || 0, state.scrollY || 0);
        }
        // Restore form inputs
        if (state.inputs) {
          state.inputs.forEach(function(inp) {
            try {
              var el = document.querySelector(inp.selector);
              if (!el) return;
              if (inp.type === 'checkbox' || inp.type === 'radio') {
                el.checked = inp.checked;
              } else if (el.tagName === 'SELECT') {
                el.value = inp.value;
              } else {
                el.value = inp.value;
              }
            } catch(e) {}
          });
        }
        // Restore expanded details/accordions
        if (state.openDetails) {
          state.openDetails.forEach(function(sel) {
            try {
              var el = document.querySelector(sel);
              if (el) el.open = true;
            } catch(e) {}
          });
        }
      }, 100);
    });
  } catch(e) {}
})();
</script>`;

export function usePreviewServiceWorker(): PreviewSWState {
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);
  const swRef = useRef<ServiceWorker | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // Register the Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.info('[PreviewSW] Service Workers not supported — using srcdoc fallback');
      return;
    }

    let cancelled = false;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/preview-sw.js', {
          scope: '/__preview__/',
        });
        
        if (cancelled) return;
        registrationRef.current = registration;

        const sw = registration.active || registration.installing || registration.waiting;
        if (sw) {
          if (sw.state === 'activated') {
            swRef.current = sw;
            setIsReady(true);
            console.info('[PreviewSW] Service Worker ready');
          } else {
            sw.addEventListener('statechange', () => {
              if (sw.state === 'activated' && !cancelled) {
                swRef.current = sw;
                setIsReady(true);
                console.info('[PreviewSW] Service Worker activated');
              }
            });
          }
        }

        registration.addEventListener('updatefound', () => {
          const newSw = registration.installing;
          if (newSw) {
            newSw.addEventListener('statechange', () => {
              if (newSw.state === 'activated' && !cancelled) {
                swRef.current = newSw;
                setIsReady(true);
              }
            });
          }
        });
      } catch (err) {
        console.warn('[PreviewSW] Registration failed — using srcdoc fallback:', err);
      }
    };

    register();

    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PREVIEW_UPDATED') {
        setVersion(event.data.version);
      }
    };
    navigator.serviceWorker.addEventListener('message', messageHandler);

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('message', messageHandler);
    };
  }, []);

  const updatePreview = useCallback((html: string, options?: { softReload?: boolean }) => {
    const sw = swRef.current || navigator.serviceWorker?.controller;
    if (!sw) return;
    
    // For soft reloads, inject the state restoration script
    let finalHtml = html;
    if (options?.softReload) {
      finalHtml = html.replace('</body>', STATE_RESTORE_SCRIPT + '</body>');
    }
    
    const newVersion = Date.now();
    sw.postMessage({ 
      type: 'UPDATE_PREVIEW', 
      html: finalHtml, 
      version: newVersion,
      softReload: !!options?.softReload,
    });
    setVersion(newVersion);
  }, []);

  /** Trigger a soft reload: save state, update SW content, reload iframe */
  const doSoftReload = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    try {
      // Save current state into the iframe's sessionStorage before reload
      iframe.contentWindow.postMessage({ type: '__SAVE_STATE_FOR_HMR__' }, '*');
      
      // Give the iframe a moment to save state, then reload
      setTimeout(() => {
        try {
          iframe.contentWindow?.location.reload();
        } catch {
          // Cross-origin — force reload via src reassignment
          const src = iframe.src;
          if (src) {
            iframe.src = '';
            requestAnimationFrame(() => { iframe.src = src; });
          }
        }
      }, 50);
    } catch {
      // If we can't access contentWindow, just reload
      const src = iframe.src;
      if (src) {
        iframe.src = '';
        requestAnimationFrame(() => { iframe.src = src; });
      }
    }
  }, []);

  const refreshPreview = useCallback(() => {
    setVersion(Date.now());
  }, []);

  return {
    isReady,
    previewUrl: isReady ? PREVIEW_PATH : null,
    updatePreview,
    refreshPreview,
    version,
    softReload: doSoftReload,
  };
}

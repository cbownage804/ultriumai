import { useCallback, useRef } from 'react';

/**
 * usePreviewHealthMonitor — Detects blank renders and infinite loops
 * in the preview iframe. Surfaces actionable errors instead of
 * leaving the user with a frozen white screen.
 */

export interface PreviewHealthIssue {
  type: 'blank_screen' | 'infinite_loop' | 'unresponsive';
  message: string;
  detectedAt: number;
}

/** Script injected into compiled HTML to detect infinite loops and blank screens */
const HEALTH_MONITOR_SCRIPT = `
<script data-preview-health>
(function(){
  // ── Infinite loop detection ──
  var renderCount = 0;
  var renderTimer = null;
  var RENDER_THRESHOLD = 200; // Max renders per second before flagging
  var originalSetState = null;

  // Patch React's setState to count renders
  var origCreateElement = document.createElement;
  
  // Monitor for excessive re-renders via MutationObserver
  var mutationCount = 0;
  var mutationTimer = null;
  var MUTATION_THRESHOLD = 500; // Max DOM mutations per second
  
  var observer = new MutationObserver(function(mutations) {
    mutationCount += mutations.length;
    if (!mutationTimer) {
      mutationTimer = setTimeout(function() {
        if (mutationCount > MUTATION_THRESHOLD) {
          window.parent.postMessage({
            type: '__PREVIEW_HEALTH__',
            issue: 'infinite_loop',
            message: 'Possible infinite re-render loop detected (' + mutationCount + ' DOM mutations/sec)',
            source: 'preview-health-monitor'
          }, '*');
          observer.disconnect(); // Stop monitoring to prevent further spam
        }
        mutationCount = 0;
        mutationTimer = null;
      }, 1000);
    }
  });

  // Start observing after the app mounts
  setTimeout(function() {
    var root = document.getElementById('root');
    if (root) {
      observer.observe(root, { childList: true, subtree: true, characterData: true });
    }
  }, 500);

  // ── Blank screen detection ──
  setTimeout(function() {
    var root = document.getElementById('root');
    if (!root) return;
    
    // Check if root has any visible content
    var hasContent = root.children.length > 0 || root.textContent.trim().length > 0;
    var isVisible = root.offsetHeight > 0;
    
    if (!hasContent || !isVisible) {
      // Double-check after another delay (React may still be mounting)
      setTimeout(function() {
        hasContent = root.children.length > 0 || root.textContent.trim().length > 0;
        isVisible = root.offsetHeight > 0;
        
        if (!hasContent || !isVisible) {
          window.parent.postMessage({
            type: '__PREVIEW_HEALTH__',
            issue: 'blank_screen',
            message: 'App rendered but the screen appears blank (root has ' + root.children.length + ' children, height: ' + root.offsetHeight + 'px)',
            source: 'preview-health-monitor'
          }, '*');
        }
      }, 3000);
    }
  }, 2000);

  // ── Unresponsive detection (no paint in 10s) ──
  var hasPainted = false;
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(function() { hasPainted = true; });
    setTimeout(function() {
      if (!hasPainted) {
        window.parent.postMessage({
          type: '__PREVIEW_HEALTH__',
          issue: 'unresponsive',
          message: 'Preview iframe has not painted within 10 seconds',
          source: 'preview-health-monitor'
        }, '*');
      }
    }, 10000);
  }
})();
</script>`;

export function usePreviewHealthMonitor() {
  const issueRef = useRef<PreviewHealthIssue | null>(null);
  const callbackRef = useRef<((issue: PreviewHealthIssue) => void) | null>(null);

  /** Register a callback to receive health issues */
  const onHealthIssue = useCallback((cb: (issue: PreviewHealthIssue) => void) => {
    callbackRef.current = cb;
  }, []);

  /** Start listening for health messages from the iframe */
  const startMonitoring = useCallback(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type !== '__PREVIEW_HEALTH__') return;
      if (event.data?.source !== 'preview-health-monitor') return;

      const issue: PreviewHealthIssue = {
        type: event.data.issue,
        message: event.data.message,
        detectedAt: Date.now(),
      };

      console.warn('[PreviewHealth]', issue.type, ':', issue.message);
      issueRef.current = issue;
      callbackRef.current?.(issue);
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  /** Inject the health monitor script into compiled HTML */
  const injectHealthMonitor = useCallback((html: string): string => {
    // Don't double-inject
    if (html.includes('data-preview-health')) return html;
    // Don't inject into fallback/error HTML
    if (html.includes('ai-builder-fallback') || html.includes('Compilation Error')) return html;

    // Insert after opening <head>
    const headIdx = html.indexOf('<head>');
    if (headIdx !== -1) {
      return html.slice(0, headIdx + 6) + HEALTH_MONITOR_SCRIPT + html.slice(headIdx + 6);
    }
    return html;
  }, []);

  const getLastIssue = useCallback(() => issueRef.current, []);
  const clearIssue = useCallback(() => { issueRef.current = null; }, []);

  return {
    onHealthIssue,
    startMonitoring,
    injectHealthMonitor,
    getLastIssue,
    clearIssue,
  };
}

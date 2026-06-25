import { useCallback } from 'react';

/**
 * useViteErrorOverlay — Injects a Vite-style error overlay into the
 * preview iframe showing compilation errors with clickable file paths
 * and syntax-highlighted code snippets.
 */

const ERROR_OVERLAY_SCRIPT = `
<script data-error-overlay>
(function(){
  var overlayEl = null;

  function createOverlay(errors) {
    removeOverlay();
    
    var overlay = document.createElement('div');
    overlay.id = '__vite_error_overlay__';
    overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(0,0,0,0.85);backdrop-filter:blur(4px);overflow-y:auto;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;color:#e5e5e5;padding:24px;';
    
    var container = document.createElement('div');
    container.style.cssText = 'max-width:800px;margin:0 auto;';
    
    // Header
    var header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;';
    var title = document.createElement('h2');
    title.style.cssText = 'font-size:16px;font-weight:600;color:#f87171;margin:0;display:flex;align-items:center;gap:8px;';
    title.innerHTML = '<span style="font-size:20px">⚠️</span> Build Error';
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = 'background:rgba(255,255,255,0.1);border:none;color:#fff;width:28px;height:28px;border-radius:6px;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;';
    closeBtn.onclick = removeOverlay;
    header.appendChild(title);
    header.appendChild(closeBtn);
    container.appendChild(header);
    
    // Error cards
    errors.forEach(function(err) {
      var card = document.createElement('div');
      card.style.cssText = 'background:rgba(248,113,113,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:16px;margin-bottom:12px;';
      
      // File path
      if (err.file) {
        var filePath = document.createElement('div');
        filePath.style.cssText = 'font-size:12px;color:#93c5fd;cursor:pointer;margin-bottom:8px;text-decoration:underline;text-decoration-style:dotted;';
        filePath.textContent = err.file + (err.line ? ':' + err.line : '') + (err.column ? ':' + err.column : '');
        filePath.onclick = function() {
          window.parent.postMessage({
            type: '__OPEN_FILE__',
            file: err.file,
            line: err.line || 1,
            column: err.column || 1
          }, '*');
        };
        card.appendChild(filePath);
      }
      
      // Error message
      var msg = document.createElement('pre');
      msg.style.cssText = 'font-size:13px;line-height:1.5;color:#fca5a5;white-space:pre-wrap;word-break:break-word;margin:0;';
      msg.textContent = err.message;
      card.appendChild(msg);
      
      // Code frame (if available)
      if (err.frame) {
        var frame = document.createElement('pre');
        frame.style.cssText = 'font-size:12px;line-height:1.6;color:#a3a3a3;background:rgba(0,0,0,0.3);border-radius:4px;padding:12px;margin-top:8px;overflow-x:auto;';
        // Highlight the error line
        var lines = err.frame.split('\\n');
        frame.innerHTML = lines.map(function(line) {
          if (line.match(/^\\s*>\\s/)) {
            return '<span style="color:#f87171;font-weight:600">' + escapeHtml(line) + '</span>';
          }
          if (line.match(/^\\s*\\|\\s*\\^/)) {
            return '<span style="color:#fbbf24">' + escapeHtml(line) + '</span>';
          }
          return escapeHtml(line);
        }).join('\\n');
        card.appendChild(frame);
      }
      
      container.appendChild(card);
    });
    
    // Tip
    var tip = document.createElement('div');
    tip.style.cssText = 'font-size:11px;color:#737373;margin-top:8px;';
    tip.textContent = 'Click file paths to open in editor. Press Esc to dismiss.';
    container.appendChild(tip);
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    overlayEl = overlay;
    
    // Esc to close
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        removeOverlay();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }
  
  function removeOverlay() {
    if (overlayEl) {
      overlayEl.remove();
      overlayEl = null;
    }
  }
  
  function escapeHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  
  // Listen for error overlay commands from parent
  window.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === '__SHOW_ERROR_OVERLAY__') {
      createOverlay(e.data.errors || []);
    }
    if (e.data.type === '__CLEAR_ERROR_OVERLAY__') {
      removeOverlay();
    }
  });
  
  window.__showErrorOverlay = createOverlay;
  window.__clearErrorOverlay = removeOverlay;
})();
</script>`;

export interface OverlayError {
  message: string;
  file?: string;
  line?: number;
  column?: number;
  frame?: string;
}

export function useViteErrorOverlay() {
  /** Inject the error overlay script into compiled HTML */
  const injectErrorOverlay = useCallback((html: string): string => {
    if (html.includes('data-error-overlay')) return html;
    if (html.includes('ai-builder-fallback')) return html;

    const headIdx = html.indexOf('</head>');
    if (headIdx !== -1) {
      return html.slice(0, headIdx) + ERROR_OVERLAY_SCRIPT + html.slice(headIdx);
    }
    return html;
  }, []);

  /** Show error overlay in the iframe */
  const showOverlay = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>, errors: OverlayError[]) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({
      type: '__SHOW_ERROR_OVERLAY__',
      errors,
    }, '*');
  }, []);

  /** Clear error overlay in the iframe */
  const clearOverlay = useCallback((iframeRef: React.RefObject<HTMLIFrameElement | null>) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage({ type: '__CLEAR_ERROR_OVERLAY__' }, '*');
  }, []);

  return {
    injectErrorOverlay,
    showOverlay,
    clearOverlay,
  };
}

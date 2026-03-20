import { useCallback, useRef } from 'react';

/**
 * Injects a lightweight runtime error overlay into compiled HTML.
 * Catches uncaught errors and unhandled promise rejections inside the
 * preview iframe, displaying a friendly overlay instead of a white screen.
 *
 * IMPORTANT: This runs INSIDE the iframe, not in the parent. The script
 * is injected into the <head> of the compiled HTML before rendering.
 */
const OVERLAY_SCRIPT = `
<script data-runtime-overlay>
(function(){
  var overlay=null;
  var errorQueue=[];
  var MAX_ERRORS=5;

  function createOverlay(){
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='__runtime-error-overlay';
    overlay.style.cssText='position:fixed;inset:0;z-index:999999;background:rgba(10,10,20,0.95);color:#fff;font-family:system-ui,sans-serif;overflow-y:auto;padding:24px;display:flex;flex-direction:column;align-items:center';
    overlay.innerHTML='<div style="max-width:600px;width:100%;text-align:center"><h2 style="color:#f87171;font-size:18px;margin:0 0 8px">⚠️ Runtime Error</h2><p style="color:rgba(255,255,255,0.6);font-size:13px;margin:0 0 16px">An error occurred while running your app</p><div id="__re-list" style="text-align:left;width:100%"></div><div style="display:flex;gap:8px;justify-content:center;margin-top:16px"><button id="__re-fix" style="padding:6px 16px;border-radius:6px;border:1px solid rgba(56,189,248,0.4);background:rgba(56,189,248,0.15);color:#38bdf8;cursor:pointer;font-size:12px;font-weight:600">⚡ Fix with AI</button><button id="__re-dismiss" style="padding:6px 16px;border-radius:6px;border:1px solid rgba(255,255,255,0.15);background:rgba(255,255,255,0.08);color:#fff;cursor:pointer;font-size:12px">Dismiss</button></div></div>';
    document.body.appendChild(overlay);
    document.getElementById('__re-dismiss').onclick=function(){overlay.style.display='none'};
    document.getElementById('__re-fix').onclick=function(){
      var msgs=errorQueue.map(function(e){return e.msg}).join('; ');
      var first=errorQueue[0]||{};
      window.parent.postMessage({
        type:'__FIX_WITH_AI__',
        message:msgs,
        source:first.source||'',
        line:first.line||0,
        errors:errorQueue
      },'*');
      overlay.style.display='none';
    };
    return overlay;
  }

  function addError(msg,source,line){
    if(errorQueue.length>=MAX_ERRORS) return;
    errorQueue.push({msg:msg,source:source,line:line});
    var ov=createOverlay();
    ov.style.display='flex';
    var list=document.getElementById('__re-list');
    if(!list) return;
    var item=document.createElement('div');
    item.style.cssText='background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);border-radius:8px;padding:12px;margin-bottom:8px;font-size:12px';
    item.innerHTML='<div style="color:#f87171;font-weight:600;margin-bottom:4px">'+escapeHtml(msg)+'</div>'+(source?'<div style="color:rgba(255,255,255,0.4);font-size:11px">'+escapeHtml(source)+(line?':'+line:'')+'</div>':'');
    list.appendChild(item);
  }

  function escapeHtml(s){
    var d=document.createElement('div');d.textContent=s;return d.innerHTML;
  }

  window.addEventListener('error',function(e){
    if(e.message==='ResizeObserver loop') return;
    if(/ResizeObserver/.test(e.message||'')) return;
    addError(e.message||'Unknown error',e.filename,e.lineno);
    window.parent.postMessage({type:'__RUNTIME_ERROR__',message:e.message||'Unknown error',source:e.filename||'',line:e.lineno||0},'*');
  });

  window.addEventListener('unhandledrejection',function(e){
    var msg=e.reason?(e.reason.message||String(e.reason)):'Unhandled promise rejection';
    addError(msg,'','');
    window.parent.postMessage({type:'__RUNTIME_ERROR__',message:msg,source:'',line:0},'*');
  });
})();
</script>`;

export function useRuntimeErrorOverlay() {
  const enabledRef = useRef(true);

  /**
   * Inject the runtime error overlay script into compiled HTML.
   * Inserts right after <head> or at the start of the HTML.
   */
  const injectOverlay = useCallback((html: string): string => {
    if (!enabledRef.current) return html;
    // Don't double-inject
    if (html.includes('data-runtime-overlay')) return html;
    // Don't inject into fallback/error HTML
    if (html.includes('ai-builder-fallback') || html.includes('Compilation Error')) return html;

    // Insert after opening <head> tag
    const headIdx = html.indexOf('<head>');
    if (headIdx !== -1) {
      return html.slice(0, headIdx + 6) + OVERLAY_SCRIPT + html.slice(headIdx + 6);
    }
    // Fallback: insert after <html> or at start
    const htmlIdx = html.indexOf('<html');
    if (htmlIdx !== -1) {
      const closeTag = html.indexOf('>', htmlIdx);
      if (closeTag !== -1) {
        return html.slice(0, closeTag + 1) + '<head>' + OVERLAY_SCRIPT + '</head>' + html.slice(closeTag + 1);
      }
    }
    return OVERLAY_SCRIPT + html;
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return { injectOverlay, setEnabled };
}

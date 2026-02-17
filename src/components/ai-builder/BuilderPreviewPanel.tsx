import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Copy, CheckCircle, Maximize2, Minimize2, ExternalLink, RefreshCw, Activity,
  ArrowLeft, ArrowRight, Globe, Lock, Wrench, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ErrorConsole, type PreviewError } from './ErrorConsole';
import { PreviewZoomControls } from './PreviewZoomControls';
import { VisualEditOverlay } from './VisualEditOverlay';
import { ResponsivePreviewBar, type ViewportMode, getViewportWidth } from './ResponsivePreviewBar';
import { SkeletonPreview } from './SkeletonPreview';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';
import previewBg from '@/assets/preview-placeholder-bg.jpg';

interface BuilderPreviewPanelProps {
  html: string | null;
  isGenerating: boolean;
  onFixError?: (errorMessage: string) => void;
  onSmartFixError?: (error: import('./ErrorConsole').PreviewError, context: string) => void;
  onAIEditRequest?: (selector: string, elementContext: string, prompt: string) => void;
  isProcessingAIEdit?: boolean;
  projectFiles?: ProjectFile[];
  isStreamingPreview?: boolean;
  completedFileCount?: number;
  children?: React.ReactNode;
  onErrorUpdate?: (errors: PreviewError[]) => void;
  fixAttemptCount?: number;
  maxFixAttempts?: number;
  isVisualEditActive?: boolean;
  onToggleVisualEdit?: () => void;
  onVisualEdit?: (selector: string, property: string, value: string) => void;
  /** Called when a new error is detected — for auto-fix pipeline */
  onAutoFixError?: (error: PreviewError) => void;
  /** External iframe ref for hot-patching */
  externalIframeRef?: React.RefObject<HTMLIFrameElement | null>;
  /** External viewport mode control */
  externalViewportMode?: ViewportMode;
  onExternalViewportChange?: (mode: ViewportMode) => void;
  /** Called when user wants to regenerate after exhausted fix attempts */
  onStartOver?: () => void;
}

export function BuilderPreviewPanel({ html, isGenerating, onFixError, onSmartFixError, onAIEditRequest, isProcessingAIEdit, projectFiles, isStreamingPreview, completedFileCount, children, fixAttemptCount, maxFixAttempts, isVisualEditActive: externalVisualEdit, onToggleVisualEdit: externalToggleVisualEdit, onVisualEdit, onAutoFixError, externalIframeRef, externalViewportMode, onExternalViewportChange, onStartOver }: BuilderPreviewPanelProps) {
  const [internalViewportMode, setInternalViewportMode] = useState<ViewportMode>('desktop');
  const viewportMode = externalViewportMode ?? internalViewportMode;
  const setViewportMode = onExternalViewportChange ?? setInternalViewportMode;
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const [internalVisualEdit, setInternalVisualEdit] = useState(false);
  const isVisualEditActive = externalVisualEdit ?? internalVisualEdit;
  const toggleVisualEdit = externalToggleVisualEdit ?? (() => setInternalVisualEdit(v => !v));
  const [currentUrl, setCurrentUrl] = useState('/');
  const [urlHistory, setUrlHistory] = useState<string[]>(['/']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [zoom, setZoom] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const internalIframeRef = useRef<HTMLIFrameElement>(null);
  const iframeRef = externalIframeRef || internalIframeRef;

  const viewportWidth = getViewportWidth(viewportMode);

  // Inject error + console + network capture + hot-patch listener script into HTML
  const htmlWithErrorCapture = html ? html.replace(
    '</head>',
    `<script>
window.addEventListener('error', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: e.message, source: e.filename, line: e.lineno, col: e.colno }, '*');
});
// === LIVE PREVIEW HOT-PATCH LISTENER ===
window.addEventListener('message', function(e) {
  if (!e.data || e.data.type !== '__LIVE_PATCH__') return;
  var patches = e.data.patches || [];
  for (var i = 0; i < patches.length; i++) {
    var p = patches[i];
    if (p.kind === 'css') {
      var styleId = '__hotcss_' + p.path.replace(/[^a-z0-9]/gi, '_');
      var existing = document.getElementById(styleId);
      if (existing) {
        existing.textContent = p.content;
      } else {
        var style = document.createElement('style');
        style.id = styleId;
        style.textContent = p.content;
        document.head.appendChild(style);
      }
    } else if (p.kind === 'html-body') {
      document.body.innerHTML = p.content;
    }
  }
  window.parent.postMessage({ type: '__LIVE_PATCH_ACK__', count: patches.length }, '*');
});
window.addEventListener('unhandledrejection', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Unhandled Promise: ' + (e.reason?.message || e.reason || 'Unknown'), source: '', line: 0 }, '*');
});
['log','info','warn','error'].forEach(function(level) {
  var orig = console[level];
  console[level] = function() {
    var msg = Array.from(arguments).join(' ');
    window.parent.postMessage({ type: '__CONSOLE_LOG__', level: level, message: msg, source: 'console.' + level, line: 0 }, '*');
    if (level === 'error' || level === 'warn') {
      window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: msg, source: 'console.' + level, line: 0, isWarning: level === 'warn' }, '*');
    }
    orig.apply(console, arguments);
  };
});
// === IFRAME NAVIGATION GUARD ===
// 1. Block anchor link navigation (prevents recursive app loading)
document.addEventListener('click', function(e) {
  var anchor = e.target.closest ? e.target.closest('a') : null;
  if (!anchor) return;
  var href = anchor.getAttribute('href');
  if (!href) return;
  if (href.startsWith('javascript:') || href.startsWith('blob:') || href.startsWith('data:') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
  if (href.startsWith('#')) {
    e.preventDefault();
    var target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  e.preventDefault();
  console.info('[Preview] Navigation blocked: ' + href);
  window.parent.postMessage({ type: '__PREVIEW_NAV__', href: href }, '*');
});
// 2. Block form submissions that navigate away
document.addEventListener('submit', function(e) {
  var form = e.target;
  if (form && form.tagName === 'FORM' && form.getAttribute('action')) {
    e.preventDefault();
    console.info('[Preview] Form submit blocked: ' + form.getAttribute('action'));
  }
});
// 3. Block window.open to prevent pop-under recursion
window.open = function(url) {
  console.info('[Preview] window.open blocked: ' + url);
  window.parent.postMessage({ type: '__PREVIEW_NAV__', href: url, newTab: true }, '*');
  return null;
};
// 4. Block top-level navigation attempts
window.addEventListener('beforeunload', function(e) { e.preventDefault(); });
// Network logger
(function() {
  var origFetch = window.fetch;
  window.fetch = function() {
    var url = arguments[0];
    if (typeof url === 'object' && url.url) url = url.url;
    var method = (arguments[1] && arguments[1].method) || 'GET';
    var start = performance.now();
    return origFetch.apply(this, arguments).then(function(resp) {
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: String(url), status: resp.status, duration: Math.round(performance.now() - start) }, '*');
      return resp;
    }).catch(function(err) {
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: method, url: String(url), status: 0, duration: Math.round(performance.now() - start) }, '*');
      throw err;
    });
  };
  var origXHR = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._netMethod = method;
    this._netUrl = url;
    this._netStart = performance.now();
    this.addEventListener('loadend', function() {
      window.parent.postMessage({ type: '__NETWORK_LOG__', method: this._netMethod, url: String(this._netUrl), status: this.status, duration: Math.round(performance.now() - this._netStart) }, '*');
    });
    return origXHR.apply(this, arguments);
  };
})();
</script>
</head>`
  ) : null;

  // Listen for error messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__PREVIEW_ERROR__') {
        const newError: PreviewError = {
          id: crypto.randomUUID(),
          message: e.data.message,
          source: e.data.source || undefined,
          line: e.data.line || undefined,
          timestamp: new Date(),
          type: e.data.isWarning ? 'warning' : 'error',
        };
        setErrors(prev => {
          if (prev.some(p => p.message === e.data.message)) return prev;
          const updated = [...prev.slice(-19), newError];
          // Auto-fix pipeline: notify parent of new errors (only actual errors, not warnings)
          if (!e.data.isWarning && onAutoFixError && !isGenerating) {
            setTimeout(() => onAutoFixError(newError), 500);
          }
          return updated;
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onAutoFixError, isGenerating]);

  useEffect(() => { setErrors([]); setCurrentUrl('/'); setUrlHistory(['/']); setHistoryIndex(0); }, [html]);

  // Listen for navigation messages from iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === '__NAV_CHANGE__' && e.data.url) {
        setCurrentUrl(e.data.url);
        setUrlHistory(prev => [...prev.slice(0, historyIndex + 1), e.data.url]);
        setHistoryIndex(prev => prev + 1);
      }
      // Handle blocked navigation attempts — update URL bar to show intent
      if (e.data?.type === '__PREVIEW_NAV__' && e.data.href) {
        const href = e.data.href;
        // For hash links, update the URL bar
        if (href.startsWith('#')) {
          setCurrentUrl('/' + href);
        } else if (href.startsWith('/')) {
          setCurrentUrl(href);
          setUrlHistory(prev => [...prev.slice(0, historyIndex + 1), href]);
          setHistoryIndex(prev => prev + 1);
        }
        // External URLs — just log, don't update
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [historyIndex]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < urlHistory.length - 1;

  const copyHTML = useCallback(() => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied');
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const openInNewTab = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    window.open(URL.createObjectURL(blob), '_blank');
  }, [html]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const handleVisualEdit = useCallback((selector: string, property: string, value: string) => {
    // Persist edits back to project files via parent
    onVisualEdit?.(selector, property, value);
  }, [onVisualEdit]);

  const ToolButton = ({ icon: Icon, onClick, disabled, title, active }: {
    icon: typeof Copy; onClick: () => void; disabled?: boolean; title: string; active?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center transition-all",
        active ? "text-emerald-400" : "text-white/25 hover:text-white/50 hover:bg-white/5",
        disabled && "opacity-30 pointer-events-none"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-[#0d0d14] relative">
      {children}
      {/* Toolbar */}
      {html && (
        <div className="flex flex-col border-b border-white/[0.06] bg-[#0a0a10] shrink-0">
          {/* Address bar — Lovable-style single row */}
          <div className="flex items-center gap-1.5 px-2 h-10">
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => { if (canGoBack) { setHistoryIndex(i => i - 1); setCurrentUrl(urlHistory[historyIndex - 1]); } }}
                disabled={!canGoBack}
                className={cn("h-6 w-6 rounded-md flex items-center justify-center transition-colors", canGoBack ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08]")}
              >
                <ArrowLeft className="h-3 w-3" />
              </button>
              <button
                onClick={() => { if (canGoForward) { setHistoryIndex(i => i + 1); setCurrentUrl(urlHistory[historyIndex + 1]); } }}
                disabled={!canGoForward}
                className={cn("h-6 w-6 rounded-md flex items-center justify-center transition-colors", canGoForward ? "text-white/40 hover:text-white/70 hover:bg-white/5" : "text-white/[0.08]")}
              >
                <ArrowRight className="h-3 w-3" />
              </button>
              <button
                onClick={() => setIframeKey(k => k + 1)}
                className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {/* URL bar */}
            <div className="flex-1 flex items-center gap-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg h-7 px-2.5 hover:border-white/[0.1] transition-colors">
              <Lock className="h-2.5 w-2.5 text-emerald-400/60 shrink-0" />
              <span className="text-[11px] text-white/40 font-mono truncate">
                localhost:3000{currentUrl}
              </span>
            </div>

            {/* Right toolbar */}
            <div className="flex items-center gap-0.5">
              <ResponsivePreviewBar active={viewportMode} onChange={setViewportMode} />
              {viewportWidth > 0 && (
                <span className="text-[9px] text-white/15 font-mono">
                  {viewportWidth}px
                </span>
              )}

              <div className="h-4 w-px bg-white/[0.06] mx-1" />

              <VisualEditOverlay
                isActive={isVisualEditActive}
                onToggle={toggleVisualEdit}
                onEditApply={handleVisualEdit}
                onAIEditRequest={onAIEditRequest}
                isProcessingAIEdit={isProcessingAIEdit}
                iframeRef={iframeRef}
              />
              <PreviewZoomControls zoom={zoom} onZoomChange={setZoom} />
              <ToolButton icon={copied ? CheckCircle : Copy} onClick={copyHTML} title="Copy HTML" active={copied} />
              <ToolButton icon={ExternalLink} onClick={openInNewTab} title="Open in tab" />
              <ToolButton icon={isFullscreen ? Minimize2 : Maximize2} onClick={toggleFullscreen} title="Fullscreen" />
            </div>

            {/* Streaming indicator */}
            {(isGenerating || isStreamingPreview) && (
              <div className="flex items-center gap-1.5 text-[10px] text-amber-400/60 shrink-0">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>{isStreamingPreview && completedFileCount ? `${completedFileCount} files` : 'building'}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 min-h-0 flex items-stretch justify-center">
        {html ? (
          <div
            className={cn(
              'h-full transition-all duration-300',
              viewportMode !== 'desktop' && 'mx-auto rounded-lg border border-white/[0.06] shadow-2xl shadow-black/50 my-4'
            )}
            style={{
              width: viewportWidth > 0 ? `${viewportWidth}px` : '100%',
              maxWidth: '100%',
              height: viewportMode === 'desktop' ? '100%' : 'calc(100% - 32px)',
            }}
          >
            <iframe
              ref={iframeRef}
              key={iframeKey}
              srcDoc={htmlWithErrorCapture || ''}
              className="w-full h-full border-0 bg-white rounded-[inherit] origin-top-left"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              title="App Preview"
              style={{
                transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined,
                width: zoom !== 100 ? `${10000 / zoom}%` : '100%',
                height: zoom !== 100 ? `${10000 / zoom}%` : '100%',
              }}
            />
          </div>
        ) : isGenerating ? (
          <SkeletonPreview />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full text-center relative overflow-hidden">
            {/* Vibrant background image — full bleed */}
            <img src={previewBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a12]/90 via-[#0a0a12]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-violet-500/[0.06]" />
            
            <div className="relative z-10 space-y-8 px-6">
              {/* Glowing icon */}
              <div className="relative mx-auto w-fit">
                <div className="absolute -inset-6 bg-cyan-500/20 rounded-full blur-2xl animate-pulse" />
                <div className="absolute -inset-4 bg-violet-500/15 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="relative h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/30 via-violet-500/25 to-fuchsia-500/20 border border-cyan-400/20 flex items-center justify-center mx-auto shadow-2xl shadow-cyan-500/30 backdrop-blur-xl">
                  <Activity className="h-9 w-9 text-cyan-300" />
                </div>
              </div>
              
              {/* Title */}
              <div className="space-y-3">
                <h3 className="font-bold text-3xl tracking-tight bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent">
                  Live Preview
                </h3>
                <p className="text-base text-white/50 max-w-[340px] mx-auto leading-relaxed">
                  Describe what you want to build and watch your app come to life in real-time
                </p>
              </div>
              
              {/* Feature pills */}
              <div className="flex items-center gap-3 justify-center flex-wrap">
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400" /> Hot reload
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-violet-400 shadow-sm shadow-violet-400" /> Multi-file
                </span>
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" /> Responsive
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lovable-style error overlay banner */}
      {errors.length > 0 && errors.some(e => e.type === 'error') && (
        <div className="absolute bottom-0 left-0 right-0 z-20 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-red-950/95 backdrop-blur-sm border-t border-red-500/30">
            {/* Error summary bar */}
            <div className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs font-medium text-red-300">
                    {errors.filter(e => e.type === 'error').length} error{errors.filter(e => e.type === 'error').length > 1 ? 's' : ''}
                  </span>
                </div>
                <span className="text-[11px] text-red-200/70 truncate">
                  {errors.find(e => e.type === 'error')?.message.slice(0, 120)}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {fixAttemptCount !== undefined && maxFixAttempts !== undefined && fixAttemptCount > 0 && (
                  <span className="text-[10px] text-red-400/60">
                    Attempt {fixAttemptCount}/{maxFixAttempts}
                  </span>
                )}
                {onSmartFixError && (
                  <button
                    onClick={() => {
                      const firstError = errors.find(e => e.type === 'error');
                      if (!firstError) return;
                      const errorFile = firstError.source && projectFiles
                        ? projectFiles.find(f => firstError.source?.includes(f.path))
                        : null;
                      const ctx = [
                        `Error: "${firstError.message}"`,
                        firstError.source ? `Source: ${firstError.source}${firstError.line ? `:${firstError.line}` : ''}` : '',
                        errorFile ? `\nFile content (${errorFile.path}):\n\`\`\`\n${errorFile.content}\n\`\`\`` : '',
                      ].filter(Boolean).join('\n');
                      onSmartFixError(firstError, ctx);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/30 border border-red-500/40 text-red-100 text-xs font-medium hover:bg-red-500/40 transition-colors"
                  >
                    <Wrench className="h-3 w-3" />
                    Try to fix
                  </button>
                )}
                <button
                  onClick={() => setErrors([])}
                  className="h-6 w-6 rounded-md flex items-center justify-center text-red-300/50 hover:text-red-200 hover:bg-red-500/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Console */}
      <ErrorConsole
        errors={errors}
        onClear={() => setErrors([])}
        onFixRequest={(err) => onFixError?.(`Fix this error in my app: "${err.message}"${err.source ? ` (in ${err.source}${err.line ? `:${err.line}` : ''})` : ''}`)}
        onSmartFixRequest={(err, ctx) => {
          setErrors(prev => prev.map(e => e.id === err.id ? { ...e, fixAttempts: err.fixAttempts } : e));
          onSmartFixError?.(err, ctx);
        }}
        projectFiles={projectFiles}
        onStartOver={onStartOver}
      />
    </div>
  );
}

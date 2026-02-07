import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Copy, CheckCircle, Maximize2, Minimize2, ExternalLink, RefreshCw, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { ErrorConsole, type PreviewError } from './ErrorConsole';
import { DevicePresetPicker, DEVICE_PRESETS, type DevicePreset } from './DevicePresetPicker';
import { VisualEditOverlay } from './VisualEditOverlay';
import type { ProjectFile } from '@/hooks/useProjectFileSystem';

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
}

export function BuilderPreviewPanel({ html, isGenerating, onFixError, onSmartFixError, onAIEditRequest, isProcessingAIEdit, projectFiles, isStreamingPreview, completedFileCount, children, fixAttemptCount, maxFixAttempts }: BuilderPreviewPanelProps) {
  const [activePreset, setActivePreset] = useState('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [errors, setErrors] = useState<PreviewError[]>([]);
  const [isVisualEditActive, setIsVisualEditActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentPreset = DEVICE_PRESETS.find(p => p.id === activePreset) || DEVICE_PRESETS[0];

  // Inject error + console + network capture script into HTML
  const htmlWithErrorCapture = html ? html.replace(
    '</head>',
    `<script>
window.addEventListener('error', function(e) {
  window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: e.message, source: e.filename, line: e.lineno, col: e.colno }, '*');
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
        setErrors(prev => {
          if (prev.some(p => p.message === e.data.message)) return prev;
          return [...prev.slice(-19), {
            id: crypto.randomUUID(),
            message: e.data.message,
            source: e.data.source || undefined,
            line: e.data.line || undefined,
            timestamp: new Date(),
            type: e.data.isWarning ? 'warning' : 'error',
          }];
        });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  useEffect(() => { setErrors([]); }, [html]);

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

  const handleVisualEdit = useCallback((_selector: string, _property: string, _value: string) => {
    // Visual edits are applied directly in the iframe
    // Could be enhanced to persist edits back to source files
  }, []);

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
        <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] bg-black/30 shrink-0">
          <div className="flex items-center gap-1">
            <DevicePresetPicker activePreset={activePreset} onSelect={(p) => setActivePreset(p.id)} />
            {currentPreset.width > 0 && (
              <span className="text-[9px] text-white/20 font-mono ml-1">
                {currentPreset.width}×{currentPreset.height}
              </span>
            )}
            {(isGenerating || isStreamingPreview) && (
              <div className="flex items-center gap-1.5 ml-3 text-[10px] text-amber-400/60">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>
                  {isStreamingPreview && completedFileCount ? `updating... (${completedFileCount} files)` : 'updating...'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <VisualEditOverlay
              isActive={isVisualEditActive}
              onToggle={() => setIsVisualEditActive(!isVisualEditActive)}
              onEditApply={handleVisualEdit}
              onAIEditRequest={onAIEditRequest}
              isProcessingAIEdit={isProcessingAIEdit}
              iframeRef={iframeRef}
            />
            <ToolButton icon={RefreshCw} onClick={() => setIframeKey(k => k + 1)} title="Refresh" />
            <ToolButton icon={copied ? CheckCircle : Copy} onClick={copyHTML} title="Copy HTML" active={copied} />
            <ToolButton icon={ExternalLink} onClick={openInNewTab} title="Open in tab" />
            <ToolButton icon={isFullscreen ? Minimize2 : Maximize2} onClick={toggleFullscreen} title="Fullscreen" />
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-0">
        {html ? (
          <div
            className={cn(
              'h-full transition-all duration-300',
              activePreset !== 'desktop' && 'mx-auto rounded-lg border border-white/[0.06] shadow-2xl shadow-black/50 my-4'
            )}
            style={{
              width: currentPreset.width > 0 ? `${currentPreset.width}px` : '100%',
              maxWidth: '100%',
              height: activePreset === 'desktop' ? '100%' : 'calc(100% - 32px)',
            }}
          >
            <iframe
              ref={iframeRef}
              key={iframeKey}
              srcDoc={htmlWithErrorCapture || ''}
              className="w-full h-full border-0 bg-white rounded-[inherit]"
              sandbox="allow-scripts allow-forms"
              title="App Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-white/[0.04] flex items-center justify-center">
                <Activity className="h-9 w-9 text-white/10" />
              </div>
            </div>
            <div>
              <h3 className="font-medium text-white/50 text-sm">Live Preview</h3>
              <p className="text-xs text-white/20 max-w-[200px] mt-1">
                Your app will render here in real-time as it's built.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Auto-fix banner */}
      {errors.length > 0 && errors.some(e => e.type === 'error') && onSmartFixError && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-top-2 duration-300">
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs hover:bg-red-500/30 transition-colors backdrop-blur-sm shadow-lg"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            AI can fix this — click to auto-fix
            {fixAttemptCount !== undefined && maxFixAttempts !== undefined && fixAttemptCount > 0 && (
              <span className="text-[10px] text-red-400/60 ml-1">
                (Attempt {fixAttemptCount}/{maxFixAttempts})
              </span>
            )}
          </button>
        </div>
      )}

      {/* Error Console */}
      <ErrorConsole
        errors={errors}
        onClear={() => setErrors([])}
        onFixRequest={(err) => onFixError?.(`Fix this error in my app: "${err.message}"${err.source ? ` (in ${err.source}${err.line ? `:${err.line}` : ''})` : ''}`)}
        onSmartFixRequest={(err, ctx) => {
          // Update fixAttempts in local state
          setErrors(prev => prev.map(e => e.id === err.id ? { ...e, fixAttempts: err.fixAttempts } : e));
          onSmartFixError?.(err, ctx);
        }}
        projectFiles={projectFiles}
      />
    </div>
  );
}

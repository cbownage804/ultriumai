import { useState, useRef, useCallback } from 'react';
import {
  Monitor, Smartphone, Tablet, Copy, CheckCircle,
  Maximize2, Minimize2, ExternalLink, RefreshCw, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BuilderPreviewPanelProps {
  html: string | null;
  isGenerating: boolean;
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<DeviceMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function BuilderPreviewPanel({ html, isGenerating }: BuilderPreviewPanelProps) {
  const [device, setDevice] = useState<DeviceMode>('desktop');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

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
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [html]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  const DeviceButton = ({ mode, icon: Icon }: { mode: DeviceMode; icon: typeof Monitor }) => (
    <button
      onClick={() => setDevice(mode)}
      className={cn(
        "h-7 w-7 rounded-md flex items-center justify-center transition-all",
        device === mode
          ? "bg-white/10 text-white"
          : "text-white/25 hover:text-white/50 hover:bg-white/5"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );

  const ToolButton = ({ icon: Icon, onClick, disabled, title, active }: {
    icon: typeof Monitor; onClick: () => void; disabled?: boolean; title: string; active?: boolean;
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
    <div ref={containerRef} className="flex flex-col h-full bg-[#0d0d14]">
      {/* Toolbar */}
      {html && (
        <div className="flex items-center justify-between px-3 h-9 border-b border-white/[0.06] bg-black/30 shrink-0">
          <div className="flex items-center gap-0.5">
            <DeviceButton mode="desktop" icon={Monitor} />
            <DeviceButton mode="tablet" icon={Tablet} />
            <DeviceButton mode="mobile" icon={Smartphone} />
            {isGenerating && (
              <div className="flex items-center gap-1.5 ml-3 text-[10px] text-amber-400/60">
                <Activity className="h-3 w-3 animate-pulse" />
                <span>updating...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-0.5">
            <ToolButton icon={RefreshCw} onClick={() => setIframeKey(k => k + 1)} title="Refresh" />
            <ToolButton icon={copied ? CheckCircle : Copy} onClick={copyHTML} title="Copy HTML" active={copied} />
            <ToolButton icon={ExternalLink} onClick={openInNewTab} title="Open in tab" />
            <ToolButton
              icon={isFullscreen ? Minimize2 : Maximize2}
              onClick={toggleFullscreen}
              title="Fullscreen"
            />
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-0">
        {html ? (
          <div
            className={cn(
              'h-full transition-all duration-300',
              device !== 'desktop' && 'mx-auto rounded-lg border border-white/[0.06] shadow-2xl shadow-black/50 my-4'
            )}
            style={{
              width: DEVICE_WIDTHS[device],
              maxWidth: '100%',
              height: device === 'desktop' ? '100%' : 'calc(100% - 32px)',
            }}
          >
            <iframe
              key={iframeKey}
              srcDoc={html}
              className="w-full h-full border-0 bg-white rounded-[inherit]"
              sandbox="allow-scripts allow-forms"
              title="App Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-cyan-500/5 to-violet-500/5 border border-white/[0.04] flex items-center justify-center">
                <Monitor className="h-9 w-9 text-white/10" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-r from-cyan-500/20 to-violet-500/20 flex items-center justify-center border border-white/[0.06]">
                <Activity className="h-2.5 w-2.5 text-cyan-400/50" />
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
    </div>
  );
}

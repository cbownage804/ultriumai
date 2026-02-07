import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Monitor, Smartphone, Tablet, Download, Code, Copy, CheckCircle,
  Maximize2, Minimize2, ExternalLink, Sparkles,
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
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const copyHTML = useCallback(() => {
    if (!html) return;
    navigator.clipboard.writeText(html);
    setCopied(true);
    toast.success('HTML copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  }, [html]);

  const downloadHTML = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'app.html';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML downloaded');
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

  return (
    <div ref={containerRef} className="flex flex-col h-full bg-muted/30">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background">
        <div className="flex items-center gap-1">
          <Button
            variant={device === 'desktop' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice('desktop')}
          >
            <Monitor className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'tablet' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice('tablet')}
          >
            <Tablet className="h-4 w-4" />
          </Button>
          <Button
            variant={device === 'mobile' ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setDevice('mobile')}
          >
            <Smartphone className="h-4 w-4" />
          </Button>
          {isGenerating && (
            <Badge variant="secondary" className="ml-2 animate-pulse text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Building...
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={showCode ? 'secondary' : 'ghost'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowCode(!showCode)}
            disabled={!html}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={copyHTML}
            disabled={!html}
          >
            {copied ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={downloadHTML}
            disabled={!html}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={openInNewTab}
            disabled={!html}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 flex items-start justify-center">
        {showCode && html ? (
          <pre className="bg-background border border-border rounded-lg p-4 text-xs overflow-auto w-full max-h-full font-mono">
            <code>{html}</code>
          </pre>
        ) : html ? (
          <div
            className={cn(
              'rounded-lg shadow-lg overflow-hidden transition-all duration-300 h-full',
              device !== 'desktop' && 'border border-border'
            )}
            style={{
              width: DEVICE_WIDTHS[device],
              maxWidth: '100%',
            }}
          >
            <iframe
              srcDoc={html}
              className="w-full h-full border-0 bg-background"
              sandbox="allow-scripts allow-forms"
              title="App Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-4">
            <div className="h-20 w-20 rounded-3xl bg-primary/5 flex items-center justify-center">
              <Monitor className="h-10 w-10 text-primary/30" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Live Preview</h3>
              <p className="text-sm max-w-xs">
                Describe what you want to build in the chat and your app will appear here in real-time.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useCallback } from 'react';
import { Share2, Copy, CheckCircle, ExternalLink, X } from 'lucide-react';
import { toast } from 'sonner';

interface SharePreviewProps {
  html: string | null;
  projectName: string;
}

export function SharePreview({ html, projectName }: SharePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const createShareLink = useCallback(async () => {
    if (!html) return;
    setIsCreating(true);
    try {
      // Create a data URL based share (client-side only, no server needed)
      const blob = new Blob([`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} — Preview</title>
</head>
<body>
${html}
</body>
</html>`], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      setShareUrl(url);
      setIsOpen(true);
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  }, [html, projectName]);

  const copyLink = useCallback(() => {
    if (!shareUrl) return;
    // Since blob URLs can't be shared, we copy the HTML to clipboard for sharing
    if (html) {
      navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copied — paste it anywhere to share');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl, html]);

  const openPreview = useCallback(() => {
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  }, [html]);

  if (!html) return null;

  return (
    <>
      <button
        onClick={createShareLink}
        disabled={isCreating}
        className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        title="Share preview"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Share</span>
      </button>

      {/* Share Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl p-5 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Share2 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Share Preview</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="text-xs text-white/40">Share your app preview with others by copying the HTML or opening in a new tab.</p>

            <div className="space-y-2">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all text-left"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
                <div>
                  <div className="text-xs font-medium text-white/80">{copied ? 'Copied!' : 'Copy HTML'}</div>
                  <div className="text-[10px] text-white/30">Copy the full HTML to share via paste</div>
                </div>
              </button>

              <button
                onClick={openPreview}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all text-left"
              >
                <ExternalLink className="h-4 w-4 text-white/40" />
                <div>
                  <div className="text-xs font-medium text-white/80">Open in New Tab</div>
                  <div className="text-[10px] text-white/30">Preview as a standalone page</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

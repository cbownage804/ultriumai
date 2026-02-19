import { useState, useCallback, useEffect, useRef } from 'react';
import { Share2, Copy, CheckCircle, ExternalLink, X, QrCode, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import QRCode from 'qrcode';

interface SharePreviewProps {
  html: string | null;
  projectName: string;
  /** Pre-computed shareable URL from hosting hook */
  shareUrl?: string | null;
  /** Instantly upload and get URL */
  onInstantUpload?: () => Promise<string | null>;
  isUploading?: boolean;
}

export function SharePreview({ html, projectName, shareUrl: externalUrl, onInstantUpload, isUploading }: SharePreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localUrl, setLocalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = externalUrl || localUrl;

  // Generate QR code when URL is available
  useEffect(() => {
    if (!shareUrl) { setQrDataUrl(null); return; }
    QRCode.toDataURL(shareUrl, {
      width: 200,
      margin: 2,
      color: { dark: '#ffffffee', light: '#0d0d1800' },
    }).then(setQrDataUrl).catch(() => setQrDataUrl(null));
  }, [shareUrl]);

  const createShareLink = useCallback(async () => {
    if (!html) return;
    setIsCreating(true);
    try {
      if (onInstantUpload) {
        const url = await onInstantUpload();
        if (url) {
          setLocalUrl(url);
          setIsOpen(true);
          return;
        }
      }
      // Fallback: open blob URL in dialog
      setLocalUrl(null);
      setIsOpen(true);
    } catch {
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  }, [html, onInstantUpload]);

  const copyLink = useCallback(() => {
    const url = shareUrl;
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success('Share link copied!');
      setTimeout(() => setCopied(false), 2000);
    } else if (html) {
      navigator.clipboard.writeText(html);
      setCopied(true);
      toast.success('HTML copied — paste it anywhere to share');
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl, html]);

  const openPreview = useCallback(() => {
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    } else if (html) {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    }
  }, [shareUrl, html]);

  if (!html) return null;

  return (
    <>
      <button
        onClick={createShareLink}
        disabled={isCreating || isUploading}
        className="h-7 px-2.5 rounded-md flex items-center gap-1.5 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-colors"
        title="Share preview"
      >
        {(isCreating || isUploading) ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
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
              <button onClick={() => { setIsOpen(false); setShowQr(false); }} className="h-6 w-6 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {shareUrl ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.08]">
                <div className="flex-1 text-[11px] text-cyan-400 truncate font-mono">{shareUrl}</div>
              </div>
            ) : (
              <p className="text-xs text-white/40">Share your app preview with others by copying the HTML or opening in a new tab.</p>
            )}

            <div className="space-y-2">
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all text-left"
              >
                {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4 text-white/40" />}
                <div>
                  <div className="text-xs font-medium text-white/80">{copied ? 'Copied!' : (shareUrl ? 'Copy Link' : 'Copy HTML')}</div>
                  <div className="text-[10px] text-white/30">{shareUrl ? 'Anyone with the link can view' : 'Copy the full HTML to share via paste'}</div>
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

              {/* QR Code toggle */}
              <button
                onClick={() => setShowQr(v => !v)}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-white/[0.08] hover:border-cyan-500/20 hover:bg-cyan-500/[0.03] transition-all text-left"
              >
                <QrCode className="h-4 w-4 text-white/40" />
                <div>
                  <div className="text-xs font-medium text-white/80">{showQr ? 'Hide QR Code' : 'Show QR Code'}</div>
                  <div className="text-[10px] text-white/30">Scan with your phone for mobile testing</div>
                </div>
              </button>

              {/* QR Code display */}
              {showQr && qrDataUrl && (
                <div className="flex flex-col items-center gap-2 py-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <img src={qrDataUrl} alt="Preview QR Code" className="w-[160px] h-[160px] rounded-lg" />
                  <p className="text-[10px] text-white/30">Scan to open on mobile</p>
                </div>
              )}

              {showQr && !qrDataUrl && !shareUrl && (
                <div className="flex items-center justify-center py-4 text-[11px] text-white/30">
                  QR code requires a shareable URL. Connect hosting to enable.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

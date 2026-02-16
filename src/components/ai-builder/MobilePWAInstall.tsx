import { useState } from 'react';
import { Smartphone, Download, X, QrCode, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface MobilePWAInstallProps {
  previewUrl?: string | null;
  publishedUrl?: string | null;
}

export function MobilePWAInstall({ previewUrl, publishedUrl }: MobilePWAInstallProps) {
  const [showPanel, setShowPanel] = useState(false);
  const url = publishedUrl || previewUrl;

  if (!url) return null;

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(url);
    toast.success('URL copied — open on your phone to test');
  };

  return (
    <>
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={cn(
          "h-7 px-2 rounded-lg flex items-center gap-1.5 text-[11px] transition-all border",
          showPanel
            ? "text-cyan-400 bg-cyan-500/10 border-cyan-500/30"
            : "text-white/25 hover:text-white/50 hover:bg-white/5 border-transparent"
        )}
        title="Mobile Preview"
      >
        <Smartphone className="h-3 w-3" />
        <span className="hidden lg:inline">Mobile</span>
      </button>

      {showPanel && (
        <div className="absolute top-full right-0 mt-2 z-50 w-72 bg-[#0d0d14] border border-white/[0.08] rounded-xl shadow-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium text-white/80">Mobile Preview</span>
            </div>
            <button onClick={() => setShowPanel(false)} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60">
              <X className="h-3 w-3" />
            </button>
          </div>

          <p className="text-[11px] text-white/40 leading-relaxed">
            Open this URL on your phone to preview your app. Add to home screen for a native app-like experience.
          </p>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/60 font-mono truncate">{url}</p>
            </div>
            <button
              onClick={handleCopyUrl}
              className="h-6 px-2 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-medium hover:bg-cyan-500/20 transition-colors flex items-center gap-1 shrink-0"
            >
              <Share2 className="h-2.5 w-2.5" />
              Copy
            </button>
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] text-white/25 uppercase tracking-wider font-medium">How to install</p>
            <div className="space-y-1">
              {[
                { step: '1', text: 'Open the URL on your mobile browser' },
                { step: '2', text: 'Tap Share → "Add to Home Screen"' },
                { step: '3', text: 'Launch from home screen like a native app' },
              ].map(({ step, text }) => (
                <div key={step} className="flex items-start gap-2 text-[11px]">
                  <span className="h-4 w-4 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] text-white/30 font-medium shrink-0 mt-0.5">{step}</span>
                  <span className="text-white/50">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {publishedUrl && (
            <div className="pt-1 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/60">
                <Download className="h-3 w-3" />
                <span>Published — ready for mobile install</span>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

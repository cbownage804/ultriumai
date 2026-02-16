import { X, Globe, ExternalLink } from 'lucide-react';

interface CustomDomainPanelProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl?: string;
}

export function CustomDomainPanel({ isOpen, onClose, previewUrl }: CustomDomainPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.06]">
              <Globe className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Custom Domains</h2>
              <p className="text-[10px] text-white/30">Connect your own domain</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Preview URL */}
          {previewUrl && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-[11px] font-mono text-white/50 truncate flex-1">{previewUrl}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/30 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Default</span>
            </div>
          )}

          {/* Coming Soon notice */}
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.06] to-transparent text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
              <Globe className="h-6 w-6 text-violet-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Coming Soon</h3>
              <p className="text-[11px] text-white/40 mt-1 max-w-[280px]">
                Custom domain support is on our roadmap. You'll be able to connect your own domain and have SSL provisioned automatically.
              </p>
            </div>
            <span className="text-[9px] px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-400 font-medium tracking-wide uppercase">
              On Roadmap
            </span>
          </div>

          <div className="text-[11px] text-white/25 text-center">
            For now, your app is available at your <code className="text-white/40 bg-white/5 px-1 rounded">.apps.ultriumai.com</code> subdomain.
          </div>
        </div>
      </div>
    </div>
  );
}

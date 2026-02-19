import { X, ShieldCheck } from 'lucide-react';
import type { GDPRComponent } from '@/hooks/useGDPRCompliance';

interface Props {
  open: boolean;
  onClose: () => void;
  components: GDPRComponent[];
  companyName: string;
  contactEmail: string;
  onSetCompanyName: (v: string) => void;
  onSetContactEmail: (v: string) => void;
  onGenerateAll: () => GDPRComponent[];
  onInsertCode: (code: string, filename: string) => void;
}

export function GDPRPanel({ open, onClose, components, companyName, contactEmail, onSetCompanyName, onSetContactEmail, onGenerateAll, onInsertCode }: Props) {
  if (!open) return null;
  const typeIcon = (t: string) => t === 'cookie-banner' ? '🍪' : t === 'privacy-policy' ? '📋' : t === 'data-export' ? '📦' : t === 'account-deletion' ? '🗑️' : '📝';
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#12121a] border border-white/[0.08] rounded-xl w-[600px] max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /><span className="text-sm font-medium text-white">GDPR Compliance Kit</span></div>
          <button onClick={onClose} className="text-white/30 hover:text-white/60"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Company Name</label>
              <input value={companyName} onChange={e => onSetCompanyName(e.target.value)} className="w-full px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded text-xs text-white/70" placeholder="Your Company" />
            </div>
            <div>
              <label className="text-[10px] text-white/30 block mb-1">Contact Email</label>
              <input value={contactEmail} onChange={e => onSetContactEmail(e.target.value)} className="w-full px-2 py-1.5 bg-white/[0.05] border border-white/[0.08] rounded text-xs text-white/70" placeholder="privacy@example.com" />
            </div>
          </div>

          <button onClick={onGenerateAll} className="px-3 py-1.5 text-xs bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30">
            Generate All GDPR Components
          </button>

          {components.map(c => (
            <div key={c.id} className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{typeIcon(c.type)}</span>
                  <span className="text-xs text-white/70">{c.name}</span>
                </div>
                <button onClick={() => onInsertCode(c.code, c.name)} className="text-[10px] text-cyan-400 hover:text-cyan-300">Insert</button>
              </div>
              <div className="text-[10px] text-white/30 mt-1">{c.code.split('\n').length} lines • {c.lastUpdated.toLocaleDateString()}</div>
            </div>
          ))}

          {components.length === 0 && <div className="text-center text-white/20 text-xs py-6">Configure your company info above and click Generate</div>}
        </div>
      </div>
    </div>
  );
}

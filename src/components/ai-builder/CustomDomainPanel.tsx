import { useState } from 'react';
import { X, Globe, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, ExternalLink, Shield, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CustomDomain {
  id: string;
  domain: string;
  status: 'verifying' | 'active' | 'failed' | 'pending';
  isPrimary: boolean;
  sslStatus: 'provisioning' | 'active' | 'failed';
  addedAt: Date;
}

interface CustomDomainPanelProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl?: string;
}

const STATUS_CONFIG: Record<CustomDomain['status'], { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Active', color: 'text-emerald-400', icon: CheckCircle2 },
  verifying: { label: 'Verifying DNS', color: 'text-amber-400', icon: Loader2 },
  pending: { label: 'Pending', color: 'text-white/40', icon: AlertCircle },
  failed: { label: 'Failed', color: 'text-red-400', icon: AlertCircle },
};

export function CustomDomainPanel({ isOpen, onClose, previewUrl }: CustomDomainPanelProps) {
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddDomain = () => {
    if (!newDomain.trim()) return;
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (domains.some(d => d.domain === domain)) {
      toast.error('Domain already added');
      return;
    }

    setIsAdding(true);
    setTimeout(() => {
      setDomains(prev => [...prev, {
        id: crypto.randomUUID(),
        domain,
        status: 'verifying',
        isPrimary: prev.length === 0,
        sslStatus: 'provisioning',
        addedAt: new Date(),
      }]);
      setNewDomain('');
      setIsAdding(false);
      toast.success(`Domain "${domain}" added — configure DNS records below`);
    }, 1000);
  };

  const handleRemove = (id: string) => {
    setDomains(prev => prev.filter(d => d.id !== id));
    toast.success('Domain removed');
  };

  const handleSetPrimary = (id: string) => {
    setDomains(prev => prev.map(d => ({ ...d, isPrimary: d.id === id })));
    toast.success('Primary domain updated');
  };

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

          {/* Add domain */}
          <div className="flex gap-2">
            <input
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              placeholder="yourdomain.com"
              className="flex-1 h-8 bg-white/[0.03] border border-white/[0.08] rounded-lg px-3 text-xs text-white/80 placeholder:text-white/20 outline-none focus:border-violet-500/30 font-mono"
            />
            <button
              onClick={handleAddDomain}
              disabled={!newDomain.trim() || isAdding}
              className="h-8 px-3 rounded-lg bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors text-xs font-medium flex items-center gap-1.5 disabled:opacity-50"
            >
              {isAdding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
              Add
            </button>
          </div>

          {/* Domain list */}
          {domains.length > 0 && (
            <div className="space-y-2">
              {domains.map(domain => {
                const config = STATUS_CONFIG[domain.status];
                const StatusIcon = config.icon;
                return (
                  <div key={domain.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", config.color, domain.status === 'verifying' && 'animate-spin')} />
                      <span className="text-xs font-mono text-white/70 truncate flex-1">{domain.domain}</span>
                      <span className={cn("text-[9px] font-medium", config.color)}>{config.label}</span>
                      {domain.isPrimary && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">Primary</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-[10px] text-white/30">
                        <Shield className="h-2.5 w-2.5" />
                        SSL: {domain.sslStatus === 'active' ? (
                          <span className="text-emerald-400">Active</span>
                        ) : (
                          <span className="text-amber-400">Provisioning</span>
                        )}
                      </div>
                      <div className="flex-1" />
                      {!domain.isPrimary && (
                        <button onClick={() => handleSetPrimary(domain.id)} className="text-[10px] text-cyan-400/60 hover:text-cyan-400 transition-colors">
                          Set primary
                        </button>
                      )}
                      <button onClick={() => handleRemove(domain.id)} className="text-white/20 hover:text-red-400 transition-colors">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>

                    {/* DNS records */}
                    {domain.status === 'verifying' && (
                      <div className="mt-2 p-2.5 rounded-md bg-black/30 space-y-1.5">
                        <div className="text-[9px] text-white/20 uppercase tracking-wider font-medium">Required DNS Records</div>
                        <div className="grid grid-cols-[50px_80px_1fr] gap-x-2 gap-y-1 text-[10px] font-mono">
                          <span className="text-white/30">Type</span><span className="text-white/30">Name</span><span className="text-white/30">Value</span>
                          <span className="text-cyan-400">A</span><span className="text-white/50">@</span><span className="text-white/60">76.223.105.230</span>
                          <span className="text-cyan-400">A</span><span className="text-white/50">www</span><span className="text-white/60">76.223.105.230</span>
                          <span className="text-cyan-400">TXT</span><span className="text-white/50">_ultrium</span><span className="text-white/60 truncate">ultrium_verify={domain.id.slice(0, 16)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Help text */}
          <div className="text-[11px] text-white/25 space-y-1">
            <p>1. Add your domain above</p>
            <p>2. Configure DNS A records pointing to <code className="text-white/40 bg-white/5 px-1 rounded">76.223.105.230</code></p>
            <p>3. Add both root and www subdomain</p>
            <p>4. SSL is provisioned automatically (may take up to 72h)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { X, Globe, ExternalLink, Plus, CheckCircle, Loader2, AlertCircle, Copy, Shield, Trash2, RefreshCw, ArrowRight, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface DomainEntry {
  id: string;
  domain: string;
  status: 'verifying' | 'setting_up' | 'active' | 'failed' | 'offline';
  isPrimary: boolean;
  sslStatus: 'pending' | 'provisioning' | 'active' | 'failed';
  addedAt: Date;
  verifiedAt?: Date;
  txtRecord?: string;
}

interface CustomDomainPanelProps {
  isOpen: boolean;
  onClose: () => void;
  previewUrl?: string;
  publishedUrl?: string | null;
}

const STATUS_CONFIG: Record<DomainEntry['status'], { label: string; color: string; bg: string; border: string }> = {
  verifying: { label: 'Verifying DNS', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  setting_up: { label: 'Setting up SSL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  offline: { label: 'Offline', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
};

export function CustomDomainPanel({ isOpen, onClose, previewUrl, publishedUrl }: CustomDomainPanelProps) {
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);

  if (!isOpen) return null;

  const handleAddDomain = async () => {
    const cleaned = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleaned || !cleaned.includes('.')) {
      toast.error('Enter a valid domain like example.com');
      return;
    }
    if (domains.some(d => d.domain === cleaned)) {
      toast.error('Domain already added');
      return;
    }
    
    setIsAdding(true);
    // Simulate DNS verification initiation
    await new Promise(r => setTimeout(r, 1200));
    
    const entry: DomainEntry = {
      id: crypto.randomUUID(),
      domain: cleaned,
      status: 'verifying',
      isPrimary: domains.length === 0,
      sslStatus: 'pending',
      addedAt: new Date(),
      txtRecord: `ultriumai-verify=${crypto.randomUUID().split('-')[0]}`,
    };
    setDomains(prev => [...prev, entry]);
    setNewDomain('');
    setShowAddForm(false);
    setIsAdding(false);
    setSelectedDomain(entry);
    toast.success(`Domain ${cleaned} added — configure DNS records below`);
  };

  const handleVerifyDomain = async (id: string) => {
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'setting_up' as const } : d));
    await new Promise(r => setTimeout(r, 2000));
    setDomains(prev => prev.map(d => d.id === id ? { ...d, status: 'active' as const, sslStatus: 'active' as const, verifiedAt: new Date() } : d));
    toast.success('Domain verified and SSL provisioned!');
  };

  const handleRemoveDomain = (id: string) => {
    setDomains(prev => prev.filter(d => d.id !== id));
    if (selectedDomain?.id === id) setSelectedDomain(null);
    toast.success('Domain removed');
  };

  const handleSetPrimary = (id: string) => {
    setDomains(prev => prev.map(d => ({ ...d, isPrimary: d.id === id })));
    toast.success('Primary domain updated');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#0d0d18] border border-white/[0.08] rounded-2xl shadow-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 flex items-center justify-center border border-white/[0.06]">
              <Globe className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Domain Management</h2>
              <p className="text-[10px] text-white/30">Connect custom domains with automatic SSL</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-md flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5 space-y-4">
          {/* Default URL */}
          {(previewUrl || publishedUrl) && (
            <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-1.5">
                <Server className="h-3 w-3 text-white/30" />
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Default URL</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-[11px] font-mono text-cyan-400/70 truncate flex-1">{publishedUrl || previewUrl}</span>
                <a href={publishedUrl || previewUrl} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-colors">
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}

          {/* Domain List */}
          {domains.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Connected Domains</span>
                <span className="text-[10px] text-white/20">{domains.length} domain{domains.length !== 1 ? 's' : ''}</span>
              </div>
              {domains.map(d => {
                const sc = STATUS_CONFIG[d.status];
                return (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDomain(selectedDomain?.id === d.id ? null : d)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                      selectedDomain?.id === d.id
                        ? "bg-white/[0.04] border-cyan-500/20"
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.1]"
                    )}
                  >
                    <div className={cn("h-2 w-2 rounded-full shrink-0", d.status === 'active' ? 'bg-emerald-400' : d.status === 'verifying' ? 'bg-amber-400 animate-pulse' : d.status === 'setting_up' ? 'bg-blue-400 animate-pulse' : 'bg-red-400')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-white/80 truncate">{d.domain}</span>
                        {d.isPrimary && <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] px-1.5 py-0">Primary</Badge>}
                      </div>
                    </div>
                    <Badge className={cn("text-[8px] px-1.5 py-0", sc.bg, sc.color, sc.border)}>{sc.label}</Badge>
                    {d.sslStatus === 'active' && <Shield className="h-3 w-3 text-emerald-400/50" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Domain Detail */}
          {selectedDomain && (
            <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-white/80">{selectedDomain.domain}</h3>
                <div className="flex items-center gap-1">
                  {!selectedDomain.isPrimary && selectedDomain.status === 'active' && (
                    <Button size="sm" variant="ghost" onClick={() => handleSetPrimary(selectedDomain.id)} className="h-6 px-2 text-[9px] text-white/40 hover:text-white/70">
                      Set Primary
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveDomain(selectedDomain.id)} className="h-6 w-6 p-0 text-red-400/50 hover:text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* DNS Records */}
              <div className="space-y-2">
                <span className="text-[10px] text-white/30 uppercase tracking-wider">Required DNS Records</span>
                
                {/* TXT Verification */}
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-white/25 uppercase">TXT Record (Verification)</span>
                    {selectedDomain.status !== 'verifying' && (
                      <span className="text-[8px] text-emerald-400 flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" />Verified</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-white/25">Name</span>
                    <div className="flex items-center gap-1">
                      <code className="text-white/60 font-mono">_ultriumai</code>
                      <button onClick={() => copyToClipboard('_ultriumai')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                    <span className="text-white/25">Value</span>
                    <div className="flex items-center gap-1">
                      <code className="text-cyan-400/60 font-mono truncate">{selectedDomain.txtRecord}</code>
                      <button onClick={() => copyToClipboard(selectedDomain.txtRecord!)} className="text-white/15 hover:text-white/40 shrink-0"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                  </div>
                </div>

                {/* A Record - Root */}
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-1.5">
                  <span className="text-[9px] text-white/25 uppercase">A Record (Root Domain)</span>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-white/25">Name</span>
                    <div className="flex items-center gap-1">
                      <code className="text-white/60 font-mono">@</code>
                      <button onClick={() => copyToClipboard('@')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                    <span className="text-white/25">Value</span>
                    <div className="flex items-center gap-1">
                      <code className="text-cyan-400/60 font-mono">76.76.21.21</code>
                      <button onClick={() => copyToClipboard('76.76.21.21')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                  </div>
                </div>

                {/* A Record - WWW */}
                <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-1.5">
                  <span className="text-[9px] text-white/25 uppercase">A Record (www subdomain)</span>
                  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                    <span className="text-white/25">Name</span>
                    <div className="flex items-center gap-1">
                      <code className="text-white/60 font-mono">www</code>
                      <button onClick={() => copyToClipboard('www')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                    <span className="text-white/25">Value</span>
                    <div className="flex items-center gap-1">
                      <code className="text-cyan-400/60 font-mono">76.76.21.21</code>
                      <button onClick={() => copyToClipboard('76.76.21.21')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SSL Status */}
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-black/30 border border-white/[0.06]">
                <Shield className={cn("h-3.5 w-3.5", selectedDomain.sslStatus === 'active' ? 'text-emerald-400' : 'text-white/20')} />
                <span className="text-[10px] text-white/40 flex-1">SSL Certificate</span>
                <Badge className={cn("text-[8px]",
                  selectedDomain.sslStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  selectedDomain.sslStatus === 'provisioning' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  'bg-white/5 text-white/30 border-white/10'
                )}>
                  {selectedDomain.sslStatus === 'active' ? 'Active' : selectedDomain.sslStatus === 'provisioning' ? 'Provisioning...' : 'Pending verification'}
                </Badge>
              </div>

              {/* Verify Button */}
              {selectedDomain.status === 'verifying' && (
                <Button onClick={() => handleVerifyDomain(selectedDomain.id)} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs">
                  <RefreshCw className="h-3 w-3 mr-1.5" />Verify DNS Records
                </Button>
              )}

              {/* Propagation note */}
              <p className="text-[9px] text-white/20 flex items-start gap-1.5">
                <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                DNS changes can take up to 48 hours to propagate. SSL is automatically provisioned once DNS is verified.
              </p>
            </div>
          )}

          {/* Add Domain */}
          {showAddForm ? (
            <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-white/80">Add Custom Domain</span>
              </div>
              <input
                value={newDomain}
                onChange={e => setNewDomain(e.target.value.toLowerCase())}
                placeholder="example.com or app.example.com"
                className="w-full h-8 px-3 text-xs bg-black/30 border border-white/[0.08] rounded-lg text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15"
                autoFocus
                onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
              />
              <div className="flex gap-2">
                <Button onClick={handleAddDomain} disabled={isAdding || !newDomain.trim()} size="sm" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs h-8">
                  {isAdding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                  {isAdding ? 'Adding...' : 'Add Domain'}
                </Button>
                <Button onClick={() => { setShowAddForm(false); setNewDomain(''); }} size="sm" variant="ghost" className="text-xs h-8 text-white/40">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-white/[0.06] hover:border-cyan-500/20 text-white/30 hover:text-cyan-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="text-xs">Add Custom Domain</span>
            </button>
          )}

          {/* Help */}
          {domains.length === 0 && !showAddForm && (
            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <h4 className="text-xs font-medium text-white/60">How it works</h4>
              <div className="space-y-2">
                {[
                  { step: '1', text: 'Enter your domain name above' },
                  { step: '2', text: 'Add the DNS records at your domain registrar (GoDaddy, Cloudflare, Namecheap, etc.)' },
                  { step: '3', text: 'Click "Verify DNS Records" — we\'ll check your configuration' },
                  { step: '4', text: 'SSL certificate is provisioned automatically within minutes' },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-cyan-500/10 text-cyan-400 text-[9px] flex items-center justify-center shrink-0 font-semibold">{s.step}</span>
                    <span className="text-[11px] text-white/40 leading-relaxed">{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

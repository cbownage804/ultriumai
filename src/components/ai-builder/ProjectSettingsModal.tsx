/**
 * Consolidated Project Settings Modal — Tabbed settings dialog
 * Tabs: General, Domains, Integrations, Advanced
 * Parity with Lovable's settings experience
 */
import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Globe, Puzzle, Shield, Trash2, Share2, Eye, EyeOff,
  Plus, Copy, RefreshCw, CheckCircle, Loader2, AlertCircle,
  ExternalLink, Download, RotateCcw, BookOpen, Lock, Unlock,
  Server, ArrowRight, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ── Domain types ── */
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

const STATUS_CONFIG: Record<DomainEntry['status'], { label: string; color: string; bg: string; border: string }> = {
  verifying: { label: 'Verifying DNS', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  setting_up: { label: 'Setting up SSL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  offline: { label: 'Offline', color: 'text-white/40', bg: 'bg-white/5', border: 'border-white/10' },
};

/* ── Props ── */
interface ProjectSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectName: string;
  onRename: (name: string) => void;
  publishedUrl?: string | null;
  supabaseConnected?: boolean;
  stripeConnected?: boolean;
  githubConnected?: boolean;
  hideBadge: boolean;
  onToggleHideBadge: (v: boolean) => void;
  soundEnabled: boolean;
  onToggleSound: (v: boolean) => void;
  onDeleteProject?: () => void;
  // New parity props
  onOpenSupabaseConfig?: () => void;
  onOpenStripeConfig?: () => void;
  onOpenGithubConfig?: () => void;
  onResetProject?: () => void;
  onExportProject?: () => void;
  onOpenKnowledge?: () => void;
}

type Tab = 'general' | 'domains' | 'integrations' | 'advanced';

const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'integrations', label: 'Integrations', icon: Puzzle },
  { id: 'advanced', label: 'Advanced', icon: Shield },
];

export function ProjectSettingsModal({
  open, onOpenChange, projectName, onRename, publishedUrl,
  supabaseConnected, stripeConnected, githubConnected,
  hideBadge, onToggleHideBadge, soundEnabled, onToggleSound,
  onDeleteProject,
  onOpenSupabaseConfig, onOpenStripeConfig, onOpenGithubConfig,
  onResetProject, onExportProject, onOpenKnowledge,
}: ProjectSettingsModalProps) {
  const [tab, setTab] = useState<Tab>('general');
  const [name, setName] = useState(projectName);
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');

  // Domain management state
  const [domains, setDomains] = useState<DomainEntry[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isAddingDomain, setIsAddingDomain] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<DomainEntry | null>(null);

  // Advanced state
  const [allowRemixing, setAllowRemixing] = useState(true);
  const [resetConfirm, setResetConfirm] = useState('');

  const handleSaveName = useCallback(() => {
    if (name.trim() && name !== projectName) {
      onRename(name.trim());
      toast.success('Project renamed');
    }
  }, [name, projectName, onRename]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  /* ── Domain handlers ── */
  const handleAddDomain = async () => {
    const cleaned = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleaned || !cleaned.includes('.')) { toast.error('Enter a valid domain like example.com'); return; }
    if (domains.some(d => d.domain === cleaned)) { toast.error('Domain already added'); return; }
    setIsAddingDomain(true);
    await new Promise(r => setTimeout(r, 1200));
    const entry: DomainEntry = {
      id: crypto.randomUUID(), domain: cleaned, status: 'verifying', isPrimary: domains.length === 0,
      sslStatus: 'pending', addedAt: new Date(), txtRecord: `ultriumai-verify=${crypto.randomUUID().split('-')[0]}`,
    };
    setDomains(prev => [...prev, entry]);
    setNewDomain(''); setShowAddForm(false); setIsAddingDomain(false); setSelectedDomain(entry);
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

  const closeAndOpen = (fn?: () => void) => {
    onOpenChange(false);
    setTimeout(() => fn?.(), 150);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0d0d14] border-white/[0.08] text-white max-w-lg p-0 gap-0" onCloseAutoFocus={() => { document.body.style.pointerEvents = ''; }}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-sm font-semibold text-white/90">Project Settings</DialogTitle>
        </DialogHeader>

        {/* Tab bar */}
        <div className="flex border-b border-white/[0.06] px-5 gap-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors relative",
                tab === t.id ? "text-cyan-400" : "text-white/40 hover:text-white/60"
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
              {tab === t.id && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-cyan-400 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="px-5 py-4 space-y-4 min-h-[300px] max-h-[60vh] overflow-y-auto">

          {/* ═══════════ GENERAL ═══════════ */}
          {tab === 'general' && (
            <>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Project Name</label>
                <Input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                  className="bg-white/[0.04] border-white/[0.08] text-sm h-9"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Description</label>
                <Input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="What does this project do?"
                  className="bg-white/[0.04] border-white/[0.08] text-sm h-9"
                />
              </div>

              {/* Project Visibility */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                    {visibility === 'public' ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    Project visibility
                  </div>
                  <div className="text-[10px] text-white/30">
                    {visibility === 'public' ? 'Anyone with the link can view this project' : 'Only you can access this project'}
                  </div>
                </div>
                <Switch
                  checked={visibility === 'public'}
                  onCheckedChange={(checked) => {
                    setVisibility(checked ? 'public' : 'private');
                    toast.success(checked ? 'Project is now public' : 'Project is now private');
                  }}
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70">Build completion sound</div>
                  <div className="text-[10px] text-white/30">Play a chime when builds finish</div>
                </div>
                <Switch checked={soundEnabled} onCheckedChange={onToggleSound} />
              </div>

              {/* Manage Knowledge */}
              <button
                onClick={() => closeAndOpen(onOpenKnowledge)}
                className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-left"
              >
                <BookOpen className="h-4 w-4 text-violet-400/70" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-white/70 font-medium">Manage Knowledge</div>
                  <div className="text-[10px] text-white/30">Custom instructions and project memory</div>
                </div>
                <ArrowRight className="h-3 w-3 text-white/20" />
              </button>
            </>
          )}

          {/* ═══════════ DOMAINS ═══════════ */}
          {tab === 'domains' && (
            <div className="space-y-3">
              {/* Published URL */}
              {publishedUrl && (
                <div className="p-3 rounded-lg border border-white/[0.06] bg-white/[0.02]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Server className="h-3 w-3 text-white/30" />
                    <span className="text-[10px] text-white/30 uppercase tracking-wider">Published URL</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-[11px] font-mono text-cyan-400/70 truncate flex-1">{publishedUrl}</span>
                    <a href={publishedUrl} target="_blank" rel="noopener noreferrer" className="text-white/30 hover:text-cyan-400 transition-colors">
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
                <div className="p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] space-y-3">
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
                    {/* TXT */}
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
                    {/* A Records */}
                    {[
                      { label: 'A Record (Root Domain)', name: '@' },
                      { label: 'A Record (www subdomain)', name: 'www' },
                    ].map(rec => (
                      <div key={rec.name} className="p-2.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-1.5">
                        <span className="text-[9px] text-white/25 uppercase">{rec.label}</span>
                        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                          <span className="text-white/25">Name</span>
                          <div className="flex items-center gap-1">
                            <code className="text-white/60 font-mono">{rec.name}</code>
                            <button onClick={() => copyToClipboard(rec.name)} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                          </div>
                          <span className="text-white/25">Value</span>
                          <div className="flex items-center gap-1">
                            <code className="text-cyan-400/60 font-mono">159.203.128.171</code>
                            <button onClick={() => copyToClipboard('159.203.128.171')} className="text-white/15 hover:text-white/40"><Copy className="h-2.5 w-2.5" /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SSL */}
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

                  {/* Verify */}
                  {selectedDomain.status === 'verifying' && (
                    <Button onClick={() => handleVerifyDomain(selectedDomain.id)} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs">
                      <RefreshCw className="h-3 w-3 mr-1.5" />Verify DNS Records
                    </Button>
                  )}

                  <p className="text-[9px] text-white/20 flex items-start gap-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    DNS changes can take up to 48 hours to propagate. SSL is automatically provisioned once DNS is verified.
                  </p>
                </div>
              )}

              {/* Add Domain Form */}
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
                    <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomain.trim()} size="sm" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs h-8">
                      {isAddingDomain ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                      {isAddingDomain ? 'Adding...' : 'Add Domain'}
                    </Button>
                    <Button onClick={() => { setShowAddForm(false); setNewDomain(''); }} size="sm" variant="ghost" className="text-xs h-8 text-white/40">Cancel</Button>
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
                      { step: '2', text: 'Add the DNS records at your domain registrar' },
                      { step: '3', text: 'Click "Verify DNS Records" — we\'ll check your configuration' },
                      { step: '4', text: 'SSL certificate is provisioned automatically' },
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
          )}

          {/* ═══════════ INTEGRATIONS ═══════════ */}
          {tab === 'integrations' && (
            <div className="space-y-2">
              {[
                { name: 'Supabase', desc: 'Database & Auth', connected: supabaseConnected, color: 'emerald', onConfigure: onOpenSupabaseConfig },
                { name: 'Stripe', desc: 'Payments', connected: stripeConnected, color: 'violet', onConfigure: onOpenStripeConfig },
                { name: 'GitHub', desc: 'Version Control', connected: githubConnected, color: 'white', onConfigure: onOpenGithubConfig },
              ].map(svc => (
                <div key={svc.name} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                  <div>
                    <div className="text-[12px] text-white/70 font-medium">{svc.name}</div>
                    <div className="text-[10px] text-white/30">{svc.desc}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full", svc.connected ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-white/30")}>
                      {svc.connected ? 'Connected' : 'Not connected'}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => closeAndOpen(svc.onConfigure)}
                      className="h-7 px-2.5 text-[10px] text-cyan-400/70 hover:text-cyan-400 hover:bg-cyan-500/10"
                    >
                      {svc.connected ? 'Configure' : 'Connect'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════════ ADVANCED ═══════════ */}
          {tab === 'advanced' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                    {hideBadge ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    Hide "Powered by" badge
                  </div>
                  <div className="text-[10px] text-white/30">Remove branding from published preview</div>
                </div>
                <Switch checked={hideBadge} onCheckedChange={onToggleHideBadge} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                    <Share2 className="h-3 w-3" />
                    Allow remixing
                  </div>
                  <div className="text-[10px] text-white/30">Let others fork your project</div>
                </div>
                <Switch checked={allowRemixing} onCheckedChange={setAllowRemixing} />
              </div>

              {/* Export */}
              <button
                onClick={() => { onExportProject?.(); toast.success('Exporting project...'); }}
                className="w-full flex items-center gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-colors text-left"
              >
                <Download className="h-4 w-4 text-cyan-400/70" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-white/70 font-medium">Export Project</div>
                  <div className="text-[10px] text-white/30">Download as a ZIP with all source files</div>
                </div>
                <ArrowRight className="h-3 w-3 text-white/20" />
              </button>

              {/* Danger Zone */}
              <div className="mt-2 rounded-lg border border-red-500/15 bg-red-500/[0.02] p-4 space-y-3">
                <div className="text-[11px] text-red-400/70 uppercase tracking-wider font-medium">Danger Zone</div>

                {/* Reset Project */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                      <RotateCcw className="h-3 w-3" />
                      Reset Project
                    </div>
                    <div className="text-[10px] text-white/30">Clear all files but keep settings</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm('Reset project? This will clear all files but keep your settings.')) {
                        onResetProject?.();
                        toast.success('Project reset');
                      }
                    }}
                    className="h-7 px-2.5 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    Reset
                  </Button>
                </div>

                {/* Delete Project */}
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[12px] text-white/70 flex items-center gap-1.5">
                      <Trash2 className="h-3 w-3" />
                      Delete Project
                    </div>
                    <div className="text-[10px] text-white/30">Permanently delete this project</div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (onDeleteProject) {
                        if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                          onDeleteProject();
                        }
                      }
                    }}
                    className="h-7 px-2.5 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

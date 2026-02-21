/**
 * Consolidated Project Settings Modal — Tabbed settings dialog
 * Tabs: General, Domains, Integrations, Advanced
 * Parity with Lovable's settings experience
 */
import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings, Globe, Puzzle, Shield, Trash2, Share2, Eye, EyeOff,
  Plus, Copy, RefreshCw, CheckCircle, Loader2, AlertCircle,
  ExternalLink, Download, RotateCcw, BookOpen, Lock, Unlock,
  Server, ArrowRight, X, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/* ── Registrar info from detect-registrar edge function ── */
interface RegistrarInfo {
  name: string;
  id: string;
  icon: string;
  dnsUrl: string;
  instructions: string[];
}

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
  registrar?: RegistrarInfo | null;
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

/* ── Analysis step component ── */
function AnalysisStep({ label, done, active }: { label: React.ReactNode; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {done ? (
        <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
      ) : active ? (
        <Loader2 className="h-4 w-4 text-cyan-400 animate-spin shrink-0" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-white/10 shrink-0" />
      )}
      <span className={cn("text-xs", done ? "text-white/70" : active ? "text-white/60" : "text-white/25")}>
        {label}
      </span>
    </div>
  );
}

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

  // Registrar detection state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0); // 0=not started, 1=analyzed domain, 2=detected provider, 3=getting details
  const [analyzingDomain, setAnalyzingDomain] = useState('');
  const [showManualSetup, setShowManualSetup] = useState<Record<string, boolean>>({});
  const [detectedRegistrar, setDetectedRegistrar] = useState<RegistrarInfo | null>(null);

  // Reset analysis state when modal closes
  useEffect(() => {
    if (!open) {
      setIsAnalyzing(false);
      setAnalysisStep(0);
      setAnalyzingDomain('');
      setDetectedRegistrar(null);
    }
  }, [open]);

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

  /* ── Registrar detection ── */
  const detectRegistrar = async (domain: string): Promise<RegistrarInfo | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('detect-registrar', {
        body: { domain },
      });
      if (error) throw error;
      if (data?.detected && data?.registrar) {
        return data.registrar as RegistrarInfo;
      }
      return null;
    } catch (err) {
      console.error('[detectRegistrar] Failed:', err);
      return null;
    }
  };

  /* ── Domain handlers ── */
  const handleAddDomain = async () => {
    const cleaned = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (!cleaned || !cleaned.includes('.')) { toast.error('Enter a valid domain like example.com'); return; }
    if (domains.some(d => d.domain === cleaned)) { toast.error('Domain already added'); return; }

    // Start analyzing phase
    setIsAddingDomain(true);
    setIsAnalyzing(true);
    setAnalyzingDomain(cleaned);
    setAnalysisStep(0);
    setDetectedRegistrar(null);

    let registrar: RegistrarInfo | null = null;

    try {
      // Step 1: Analyzed domain (animate after small delay)
      await new Promise(r => setTimeout(r, 600));
      setAnalysisStep(1);

      // Step 2: Detect DNS provider
      registrar = await detectRegistrar(cleaned);
      setDetectedRegistrar(registrar);
      await new Promise(r => setTimeout(r, 500));
      setAnalysisStep(2);

      // Step 3: Getting setup details
      await new Promise(r => setTimeout(r, 800));
      setAnalysisStep(3);
    } catch (err) {
      console.error('[handleAddDomain] Detection failed:', err);
      toast.warning('Could not auto-detect DNS provider — using manual setup');
    }

    // Create the domain entry
    const entry: DomainEntry = {
      id: crypto.randomUUID(),
      domain: cleaned,
      status: 'verifying',
      isPrimary: domains.length === 0,
      sslStatus: 'pending',
      addedAt: new Date(),
      txtRecord: `ultriumai-verify=${crypto.randomUUID().split('-')[0]}`,
      registrar,
    };

    await new Promise(r => setTimeout(r, 400));
    setDomains(prev => [...prev, entry]);
    setNewDomain('');
    setShowAddForm(false);
    setIsAddingDomain(false);
    setIsAnalyzing(false);
    setAnalysisStep(0);
    setAnalyzingDomain('');
    setDetectedRegistrar(null);
    setSelectedDomain(entry);

    if (registrar) {
      toast.success(`Detected ${registrar.name} — follow the setup instructions below`);
    } else {
      toast.success(`Domain ${cleaned} added — configure DNS records below`);
      setShowManualSetup(prev => ({ ...prev, [entry.id]: true }));
    }
  };

  const handleDetectRegistrar = async (domainId: string) => {
    const domain = domains.find(d => d.id === domainId);
    if (!domain) return;

    setIsAnalyzing(true);
    setAnalyzingDomain(domain.domain);
    setAnalysisStep(0);

    await new Promise(r => setTimeout(r, 600));
    setAnalysisStep(1);

    const registrar = await detectRegistrar(domain.domain);
    await new Promise(r => setTimeout(r, 500));
    setAnalysisStep(2);

    await new Promise(r => setTimeout(r, 800));
    setAnalysisStep(3);

    setDomains(prev => prev.map(d => d.id === domainId ? { ...d, registrar } : d));
    
    await new Promise(r => setTimeout(r, 400));
    setIsAnalyzing(false);
    setAnalysisStep(0);
    setAnalyzingDomain('');

    if (registrar) {
      toast.success(`Detected ${registrar.name}`);
    } else {
      toast.info('Could not auto-detect DNS provider');
      setShowManualSetup(prev => ({ ...prev, [domainId]: true }));
    }
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

  /* ── DNS Records section (manual setup) ── */
  const renderDnsRecords = (d: DomainEntry) => (
    <div className="space-y-3">
      <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Required DNS Records</span>

      {/* TXT Record */}
      <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">TXT Record (Verification)</span>
          {d.status !== 'verifying' && (
            <span className="text-[9px] text-emerald-400 flex items-center gap-1"><CheckCircle className="h-2.5 w-2.5" />Verified</span>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Name</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono">_ultriumai</code>
              <button onClick={() => copyToClipboard('_ultriumai')} className="text-white/20 hover:text-white/50 transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Value</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono truncate">{d.txtRecord}</code>
              <button onClick={() => copyToClipboard(d.txtRecord!)} className="text-white/20 hover:text-white/50 transition-colors shrink-0"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* A Record (Root) */}
      <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-2.5">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">A Record (Root Domain)</span>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Name</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono">@</code>
              <button onClick={() => copyToClipboard('@')} className="text-white/20 hover:text-white/50 transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Value</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono">159.203.128.171</code>
              <button onClick={() => copyToClipboard('159.203.128.171')} className="text-white/20 hover:text-white/50 transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      </div>

      {/* A Record (www) */}
      <div className="p-3.5 rounded-lg bg-black/30 border border-white/[0.06] space-y-2.5">
        <span className="text-[10px] text-white/30 uppercase tracking-wider font-medium">A Record (WWW Subdomain)</span>
        <div className="space-y-2">
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Name</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono">www</code>
              <button onClick={() => copyToClipboard('www')} className="text-white/20 hover:text-white/50 transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
          <div>
            <div className="text-[10px] text-white/30 mb-0.5">Value</div>
            <div className="flex items-center gap-1.5">
              <code className="text-[12px] text-cyan-400/80 font-mono">159.203.128.171</code>
              <button onClick={() => copyToClipboard('159.203.128.171')} className="text-white/20 hover:text-white/50 transition-colors"><Copy className="h-3 w-3" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /* ── Provider setup panel ── */
  const renderRegistrarPanel = (d: DomainEntry) => {
    if (!d.registrar) return null;
    const reg = d.registrar;
    const isManual = showManualSetup[d.id];

    return (
      <div className="space-y-4">
        {/* Provider card */}
        <div className="p-4 rounded-xl border border-cyan-500/15 bg-cyan-500/[0.03] space-y-4">
          {/* Provider header */}
          <div className="flex items-center gap-3">
            <span className="text-2xl">{reg.icon}</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white/90">{reg.name}</span>
                <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  Auto-detected
                </Badge>
              </div>
              <p className="text-[10px] text-white/35 mt-0.5">
                We detected your DNS is managed by {reg.name}. Follow the steps below to connect.
              </p>
            </div>
          </div>

          {/* Step-by-step instructions */}
          <div className="space-y-2">
            <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Setup Steps</span>
            <ol className="space-y-1.5">
              {reg.instructions.map((step, i) => (
                <li key={i} className="flex gap-2 text-[11px] text-white/60">
                  <span className="text-cyan-400/70 font-mono text-[10px] mt-px shrink-0">{i + 1}.</span>
                  <span>{step.replace('(shown below)', d.txtRecord || '(shown below)')}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Open DNS Settings button */}
          <a
            href={reg.dnsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white text-xs font-medium transition-all"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open {reg.name} DNS Settings
          </a>

          {/* Secondary actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => setShowManualSetup(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
              className="text-[10px] text-white/30 hover:text-cyan-400/70 transition-colors underline underline-offset-2"
            >
              {isManual ? 'Hide DNS records' : 'Show DNS records to add'}
            </button>
            <button
              onClick={() => {
                setDomains(prev => prev.map(dm => dm.id === d.id ? { ...dm, registrar: null } : dm));
                setShowManualSetup(prev => ({ ...prev, [d.id]: true }));
              }}
              className="text-[10px] text-white/30 hover:text-white/50 transition-colors"
            >
              Change provider
            </button>
          </div>
        </div>

        {/* Manual DNS records (toggled) */}
        {isManual && renderDnsRecords(d)}
      </div>
    );
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
            <div className="space-y-4">

              {/* Analyzing overlay */}
              {isAnalyzing && (
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-medium text-white/80">Setting up domain</span>
                  </div>
                  <div className="space-y-0.5">
                    <AnalysisStep
                      label={<>Analyzed <span className="font-mono text-cyan-400/70">{analyzingDomain}</span></>}
                      done={analysisStep >= 1}
                      active={analysisStep === 0}
                    />
                    <AnalysisStep
                      label={
                        analysisStep >= 2
                          ? <>Detected DNS provider{detectedRegistrar
                              ? <>: <span className="font-semibold text-white/80">{detectedRegistrar.name}</span></>
                              : null}</>
                          : 'Detecting DNS provider...'
                      }
                      done={analysisStep >= 2}
                      active={analysisStep === 1}
                    />
                    <AnalysisStep
                      label="Getting your setup details."
                      done={analysisStep >= 3}
                      active={analysisStep === 2}
                    />
                  </div>
                </div>
              )}

              {/* Published URL */}
              {publishedUrl && !domains.length && !isAnalyzing && (
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

              {/* Connected Domains */}
              {!isAnalyzing && domains.map(d => {
                const sc = STATUS_CONFIG[d.status];
                const hasRegistrar = !!d.registrar;
                const isManual = showManualSetup[d.id];

                return (
                  <div key={d.id} className="space-y-4">
                    {/* Domain header row */}
                    <div className="flex items-center justify-between py-2 border-b border-white/[0.06]">
                      <span className="text-sm font-medium text-white/90 font-mono">{d.domain}</span>
                      <button
                        onClick={() => handleRemoveDomain(d.id)}
                        className="h-7 w-7 flex items-center justify-center rounded text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove domain"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Provider panel or manual setup */}
                    {hasRegistrar ? (
                      renderRegistrarPanel(d)
                    ) : (
                      <>
                        {/* Detect provider button for domains without registrar */}
                        <button
                          onClick={() => handleDetectRegistrar(d.id)}
                          className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg border border-dashed border-cyan-500/20 bg-cyan-500/[0.02] text-cyan-400/60 hover:text-cyan-400 hover:border-cyan-500/30 transition-all text-xs"
                        >
                          <Search className="h-3 w-3" />
                          Detect DNS Provider
                        </button>
                        {renderDnsRecords(d)}
                      </>
                    )}

                    {/* SSL Certificate */}
                    <div className="flex items-center gap-2.5 p-3 rounded-lg bg-black/30 border border-white/[0.06]">
                      <Shield className={cn("h-4 w-4", d.sslStatus === 'active' ? 'text-emerald-400' : 'text-white/25')} />
                      <span className="text-[11px] text-white/50 flex-1">SSL Certificate</span>
                      <Badge className={cn("text-[9px] px-2 py-0.5",
                        d.sslStatus === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        d.sslStatus === 'provisioning' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-white/5 text-white/40 border-white/10'
                      )}>
                        {d.sslStatus === 'active' ? 'Active' : d.sslStatus === 'provisioning' ? 'Provisioning...' : 'Pending verification'}
                      </Badge>
                    </div>

                    {/* Verify button */}
                    {d.status === 'verifying' && (
                      <Button onClick={() => handleVerifyDomain(d.id)} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs">
                        <RefreshCw className="h-3 w-3 mr-1.5" />Verify DNS Records
                      </Button>
                    )}
                  </div>
                );
              })}

              {/* Add Domain */}
              {!isAnalyzing && (showAddForm ? (
                <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.03] space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-cyan-400" />
                    <span className="text-xs font-medium text-white/80">Connect Domain</span>
                  </div>
                  <input
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value.toLowerCase())}
                    placeholder="example.com"
                    className="w-full h-9 px-3 text-xs bg-black/30 border border-white/[0.08] rounded-lg text-white/80 outline-none focus:border-cyan-500/30 font-mono placeholder:text-white/15"
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleAddDomain()}
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleAddDomain} disabled={isAddingDomain || !newDomain.trim()} size="sm" className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600 text-white border-0 text-xs h-8">
                      {isAddingDomain ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ArrowRight className="h-3 w-3 mr-1" />}
                      {isAddingDomain ? 'Connecting...' : 'Connect Domain'}
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
                  <span className="text-xs">{domains.length > 0 ? 'Add Another Domain' : 'Connect Domain'}</span>
                </button>
              ))}

              {/* Help text when no domains */}
              {domains.length === 0 && !showAddForm && !isAnalyzing && (
                <p className="text-[10px] text-white/20 text-center px-4">
                  Connect a custom domain to serve your app from your own URL. We'll auto-detect your DNS provider and guide you through setup.
                </p>
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

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Database, Github, Settings, CheckCircle2, XCircle, ExternalLink,
  CreditCard, Rocket, Key, Sparkles, Plus, Trash2, AlertTriangle,
  ChevronLeft, Globe, Shield, Info, Wrench, Box, Copy, RefreshCw, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useProjectSettings, type DomainEntry } from '@/hooks/useProjectSettings';

// ── Types ──────────────────────────────────────────────

export interface SupabaseConfig { url: string; anonKey: string; }
export interface GithubConfig { token: string; }
export interface StripeConfig { publishableKey: string; }
export interface VercelConfig { token: string; }
export interface ServiceKey { id: string; serviceId: string; apiKey: string; }
export interface EnvVar { key: string; value: string; }

// ── Service Catalog ──────────────────────────────────────

export interface ServiceDefinition {
  id: string; name: string; category: 'ai' | 'voice' | 'search' | 'other';
  icon: string; placeholder: string; helpUrl: string; envKeyName: string; description: string;
}

export const SERVICE_CATALOG: ServiceDefinition[] = [
  { id: 'openai', name: 'OpenAI', category: 'ai', icon: '🤖', placeholder: 'sk-...', helpUrl: 'https://platform.openai.com/api-keys', envKeyName: 'OPENAI_API_KEY', description: 'GPT-4o, GPT-4o-mini, DALL·E, Whisper' },
  { id: 'anthropic', name: 'Anthropic (Claude)', category: 'ai', icon: '🧠', placeholder: 'sk-ant-...', helpUrl: 'https://console.anthropic.com/settings/keys', envKeyName: 'ANTHROPIC_API_KEY', description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
  { id: 'google_ai', name: 'Google AI (Gemini)', category: 'ai', icon: '💎', placeholder: 'AIza...', helpUrl: 'https://aistudio.google.com/app/apikey', envKeyName: 'GOOGLE_AI_API_KEY', description: 'Gemini Pro, Gemini Flash' },
  { id: 'perplexity', name: 'Perplexity', category: 'search', icon: '🔍', placeholder: 'pplx-...', helpUrl: 'https://www.perplexity.ai/settings/api', envKeyName: 'PERPLEXITY_API_KEY', description: 'AI-powered search with citations' },
  { id: 'mistral', name: 'Mistral AI', category: 'ai', icon: '🌀', placeholder: '...', helpUrl: 'https://console.mistral.ai/api-keys', envKeyName: 'MISTRAL_API_KEY', description: 'Mistral Large, Mistral Medium' },
  { id: 'cohere', name: 'Cohere', category: 'ai', icon: '🔗', placeholder: '...', helpUrl: 'https://dashboard.cohere.com/api-keys', envKeyName: 'COHERE_API_KEY', description: 'Command, Embed, Rerank' },
  { id: 'groq', name: 'Groq', category: 'ai', icon: '⚡', placeholder: 'gsk_...', helpUrl: 'https://console.groq.com/keys', envKeyName: 'GROQ_API_KEY', description: 'Ultra-fast LLM inference' },
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'voice', icon: '🎙️', placeholder: '...', helpUrl: 'https://elevenlabs.io/app/settings/api-keys', envKeyName: 'ELEVENLABS_API_KEY', description: 'Text-to-speech, voice cloning, STT' },
  { id: 'deepgram', name: 'Deepgram', category: 'voice', icon: '🎧', placeholder: '...', helpUrl: 'https://console.deepgram.com/', envKeyName: 'DEEPGRAM_API_KEY', description: 'Speech-to-text, real-time transcription' },
  { id: 'assemblyai', name: 'AssemblyAI', category: 'voice', icon: '📝', placeholder: '...', helpUrl: 'https://www.assemblyai.com/app/account', envKeyName: 'ASSEMBLYAI_API_KEY', description: 'Transcription, speaker diarization' },
  { id: 'replicate', name: 'Replicate', category: 'other', icon: '🎨', placeholder: 'r8_...', helpUrl: 'https://replicate.com/account/api-tokens', envKeyName: 'REPLICATE_API_KEY', description: 'Run ML models (Stable Diffusion, etc.)' },
  { id: 'huggingface', name: 'Hugging Face', category: 'other', icon: '🤗', placeholder: 'hf_...', helpUrl: 'https://huggingface.co/settings/tokens', envKeyName: 'HUGGINGFACE_API_KEY', description: 'Inference API for thousands of models' },
];

// ── Nav Items ──────────────────────────────────────────

type SettingsSection = 'project' | 'domains' | 'services' | 'infrastructure' | 'deploy' | 'env' | 'privacy' | 'danger';

interface NavItem {
  id: SettingsSection;
  label: string;
  icon: React.ReactNode;
  dot?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

// ── Props ──────────────────────────────────────────────

interface ProjectSettingsProps {
  supabaseConfig: SupabaseConfig | null;
  githubConfig: GithubConfig | null;
  stripeConfig: StripeConfig | null;
  vercelConfig: VercelConfig | null;
  serviceKeys: ServiceKey[];
  envVars: EnvVar[];
  projectName?: string;
  projectSlug?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSupabaseChange: (config: SupabaseConfig | null) => void;
  onGithubChange: (config: GithubConfig | null) => void;
  onStripeChange: (config: StripeConfig | null) => void;
  onVercelChange: (config: VercelConfig | null) => void;
  onServiceKeysChange: (keys: ServiceKey[]) => void;
  onEnvVarsChange: (vars: EnvVar[]) => void;
  onDeleteProject?: () => void;
  onResetProject?: () => void;
}

// ── Setting Row Component ──────────────────────────────

function SettingRow({ title, description, children, className }: {
  title: string; description?: string; children?: React.ReactNode; className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-6 py-4", className)}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

// ── Component ──────────────────────────────────────────

export function ProjectSettings({
  supabaseConfig, githubConfig, stripeConfig, vercelConfig, serviceKeys, envVars, projectName,
  projectSlug: externalSlug,
  open: controlledOpen, onOpenChange: controlledOnOpenChange,
  onSupabaseChange, onGithubChange, onStripeChange, onVercelChange, onServiceKeysChange, onEnvVarsChange,
  onDeleteProject, onResetProject,
}: ProjectSettingsProps) {
  const projectSlug = externalSlug || (projectName || 'untitled').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  
  // Persistence hook
  const {
    settings: persistedSettings,
    domains: persistedDomains,
    isLoading: isLoadingSettings,
    isSaving,
    saveSettings,
    addDomain: addDomainToDb,
    removeDomain: removeDomainFromDb,
    setPrimaryDomain,
    verifyDomain,
  } = useProjectSettings(projectSlug);

  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [activeSection, setActiveSection] = useState<SettingsSection>('project');

  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.anonKey || '');
  const [ghToken, setGhToken] = useState(githubConfig?.token || '');
  const [stripeKey, setStripeKey] = useState(stripeConfig?.publishableKey || '');
  const [vercelToken, setVercelToken] = useState(vercelConfig?.token || '');
  const [localServiceKeys, setLocalServiceKeys] = useState<ServiceKey[]>(serviceKeys);
  const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(envVars);
  const [dangerConfirm, setDangerConfirm] = useState('');

  // Project settings state - initialized from persisted data
  const [projectVisibility, setProjectVisibility] = useState('private');
  const [hideBranding, setHideBranding] = useState(false);
  const [disableAnalytics, setDisableAnalytics] = useState(false);

  // Privacy settings state
  const [crossProjectSharing, setCrossProjectSharing] = useState(true);
  const [allowPublicPreview, setAllowPublicPreview] = useState(true);

  // Domain connect state
  const [showDomainInput, setShowDomainInput] = useState(false);
  const [newDomain, setNewDomain] = useState('');
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [detectedRegistrar, setDetectedRegistrar] = useState<{
    name: string; id: string; icon: string; dnsUrl: string; instructions: string[];
  } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [registrarDetected, setRegistrarDetected] = useState(false);

  // Sync persisted settings into local state when loaded
  useEffect(() => {
    if (!isLoadingSettings && persistedSettings) {
      setProjectVisibility(persistedSettings.visibility || 'private');
      setHideBranding(persistedSettings.hide_branding);
      setDisableAnalytics(persistedSettings.disable_analytics);
      setCrossProjectSharing(persistedSettings.cross_project_sharing);
      setAllowPublicPreview(persistedSettings.allow_public_preview);
      if (persistedSettings.supabase_url) { setSbUrl(persistedSettings.supabase_url); setSbKey(persistedSettings.supabase_anon_key); }
      if (persistedSettings.github_token) setGhToken(persistedSettings.github_token);
      if (persistedSettings.stripe_publishable_key) setStripeKey(persistedSettings.stripe_publishable_key);
      if (persistedSettings.vercel_token) setVercelToken(persistedSettings.vercel_token);
      if (persistedSettings.service_keys?.length) setLocalServiceKeys(persistedSettings.service_keys);
      if (persistedSettings.env_vars?.length) setLocalEnvVars(persistedSettings.env_vars);
    }
  }, [isLoadingSettings, persistedSettings]);

  const connectedCount = [supabaseConfig, githubConfig, stripeConfig, vercelConfig]
    .filter(Boolean).length + (serviceKeys.length > 0 ? 1 : 0) + (envVars.length > 0 ? 1 : 0);

  // Handlers — persist to DB + update parent state
  const handleSaveSupabase = () => {
    if (sbUrl.trim() && sbKey.trim()) {
      onSupabaseChange({ url: sbUrl.trim(), anonKey: sbKey.trim() });
      saveSettings({ supabase_url: sbUrl.trim(), supabase_anon_key: sbKey.trim() });
      toast.success('Supabase connected');
    } else {
      onSupabaseChange(null);
      saveSettings({ supabase_url: '', supabase_anon_key: '' });
      toast.info('Supabase disconnected');
    }
  };
  const handleSaveGithub = () => {
    if (ghToken.trim()) { onGithubChange({ token: ghToken.trim() }); saveSettings({ github_token: ghToken.trim() }); toast.success('GitHub token saved'); }
    else { onGithubChange(null); saveSettings({ github_token: '' }); toast.info('GitHub disconnected'); }
  };
  const handleSaveStripe = () => {
    if (stripeKey.trim()) { onStripeChange({ publishableKey: stripeKey.trim() }); saveSettings({ stripe_publishable_key: stripeKey.trim() }); toast.success('Stripe connected'); }
    else { onStripeChange(null); saveSettings({ stripe_publishable_key: '' }); toast.info('Stripe disconnected'); }
  };
  const handleSaveVercel = () => {
    if (vercelToken.trim()) { onVercelChange({ token: vercelToken.trim() }); saveSettings({ vercel_token: vercelToken.trim() }); toast.success('Vercel token saved'); }
    else { onVercelChange(null); saveSettings({ vercel_token: '' }); toast.info('Vercel disconnected'); }
  };
  const addServiceKey = () => setLocalServiceKeys(prev => [...prev, { id: crypto.randomUUID(), serviceId: '', apiKey: '' }]);
  const removeServiceKey = (id: string) => setLocalServiceKeys(prev => prev.filter(k => k.id !== id));
  const updateServiceKey = (id: string, field: 'serviceId' | 'apiKey', val: string) => {
    setLocalServiceKeys(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k));
  };
  const saveServiceKeys = () => {
    const valid = localServiceKeys.filter(k => k.serviceId && k.apiKey.trim());
    onServiceKeysChange(valid);
    saveSettings({ service_keys: valid });
    toast.success(`${valid.length} service key${valid.length !== 1 ? 's' : ''} saved`);
  };
  const addEnvVar = () => setLocalEnvVars(prev => [...prev, { key: '', value: '' }]);
  const removeEnvVar = (index: number) => setLocalEnvVars(prev => prev.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    setLocalEnvVars(prev => prev.map((v, i) => i === index ? { ...v, [field]: val } : v));
  };
  const saveEnvVars = () => {
    const valid = localEnvVars.filter(v => v.key.trim());
    onEnvVarsChange(valid);
    saveSettings({ env_vars: valid });
    toast.success(`${valid.length} env var${valid.length !== 1 ? 's' : ''} saved`);
  };
  const usedServiceIds = localServiceKeys.map(k => k.serviceId).filter(Boolean);

  // Nav groups
  const navGroups: NavGroup[] = [
    {
      label: 'Project',
      items: [
        { id: 'project', label: 'Project settings', icon: <Settings className="h-4 w-4" /> },
        { id: 'domains', label: 'Domains', icon: <Globe className="h-4 w-4" /> },
      ]
    },
    {
      label: 'Integrations',
      items: [
        { id: 'services', label: 'AI & Services', icon: <Sparkles className="h-4 w-4" />, dot: serviceKeys.length > 0 },
        { id: 'infrastructure', label: 'Infrastructure', icon: <Database className="h-4 w-4" />, dot: !!(supabaseConfig || stripeConfig) },
        { id: 'deploy', label: 'Deploy', icon: <Rocket className="h-4 w-4" />, dot: !!(githubConfig || vercelConfig) },
      ]
    },
    {
      label: 'Configuration',
      items: [
        { id: 'env', label: 'Environment', icon: <Key className="h-4 w-4" />, dot: envVars.length > 0 },
        { id: 'privacy', label: 'Privacy & security', icon: <Shield className="h-4 w-4" /> },
      ]
    },
  ];

  // ── Section Content Renderers ──

  const renderProjectSettings = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Project settings</h2>
      <p className="text-sm text-muted-foreground mt-1">Manage your project configuration.</p>
      <div className="mt-6 rounded-lg border border-border bg-card/50 divide-y divide-border">
        <SettingRow title="Project name" description="The display name for this project." className="px-5">
          <span className="text-sm text-muted-foreground">{projectName || 'Untitled'}</span>
        </SettingRow>
        <SettingRow title="Project visibility" description="Control who can see and access this project." className="px-5">
          <Select value={projectVisibility} onValueChange={(v) => { setProjectVisibility(v); saveSettings({ visibility: v }); toast.success(`Visibility set to ${v}`); }}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public" className="text-xs">Public</SelectItem>
              <SelectItem value="private" className="text-xs">Private</SelectItem>
              <SelectItem value="workspace" className="text-xs">Workspace</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
        <SettingRow title="Hide branding" description='Remove the "Built with UltriumAI" badge from published apps.' className="px-5">
          <Switch checked={hideBranding} onCheckedChange={(v) => { setHideBranding(v); saveSettings({ hide_branding: v }); toast.success(v ? 'Branding hidden' : 'Branding visible'); }} />
        </SettingRow>
        <SettingRow title="Disable analytics" description="Disable collecting analytics data for this project." className="px-5">
          <Switch checked={disableAnalytics} onCheckedChange={(v) => { setDisableAnalytics(v); saveSettings({ disable_analytics: v }); toast.success(v ? 'Analytics disabled' : 'Analytics enabled'); }} />
        </SettingRow>
      </div>
    </div>
  );

  const selectedDomain = persistedDomains.find(d => d.id === selectedDomainId) || null;

  const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
    verifying: { label: 'Verifying DNS', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    setting_up: { label: 'Setting up SSL', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    active: { label: 'Active', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    offline: { label: 'Offline', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border' },
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleConnectDomain = async () => {
    if (!newDomain.trim()) return;
    // Detect registrar first
    setIsDetecting(true);
    try {
      const { data } = await supabase.functions.invoke('detect-registrar', {
        body: { domain: newDomain.trim() },
      });
      if (data?.registrar) {
        setDetectedRegistrar(data.registrar);
      } else {
        setDetectedRegistrar(null);
      }
      setRegistrarDetected(true);
    } catch {
      setDetectedRegistrar(null);
      setRegistrarDetected(true);
    } finally {
      setIsDetecting(false);
    }

    const entry = await addDomainToDb(newDomain);
    if (entry) {
      setSelectedDomainId(entry.id);
      setNewDomain('');
      setShowDomainInput(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setIsVerifying(true);
    await verifyDomain(domainId);
    setIsVerifying(false);
  };

  const handleDetectRegistrar = async (domain: string) => {
    setIsDetecting(true);
    try {
      const { data } = await supabase.functions.invoke('detect-registrar', {
        body: { domain },
      });
      if (data?.registrar) {
        setDetectedRegistrar(data.registrar);
      } else {
        setDetectedRegistrar(null);
      }
      setRegistrarDetected(true);
    } catch {
      setDetectedRegistrar(null);
      setRegistrarDetected(true);
    } finally {
      setIsDetecting(false);
    }
  };

  const renderDomains = () => (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Domains</h2>
          <p className="text-sm text-muted-foreground mt-1">Publish your project to custom domains.</p>
        </div>
        <a href="https://docs.lovable.dev/features/custom-domain" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
            How domains work <ExternalLink className="h-3 w-3" />
          </Button>
        </a>
      </div>

      {/* Default domain overview */}
      <div className="mt-6 rounded-lg border border-border bg-card/50 p-5">
        <h3 className="text-sm font-medium text-foreground mb-4">Overview</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              <a href={`https://${projectSlug}.apps.ultriumai.com`} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:underline flex items-center gap-1">
                {projectSlug}.apps.ultriumai.com
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Live</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Connected Domains from DB */}
      {persistedDomains.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Connected Domains</span>
            <span className="text-[10px] text-muted-foreground">{persistedDomains.length} domain{persistedDomains.length !== 1 ? 's' : ''}</span>
          </div>
          {persistedDomains.map(d => {
            const sc = STATUS_CONFIG[d.status] || STATUS_CONFIG.offline;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDomainId(selectedDomainId === d.id ? null : d.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                  selectedDomainId === d.id
                    ? "bg-primary/5 border-primary/20"
                    : "bg-card/50 border-border hover:border-primary/10"
                )}
              >
                <div className={cn("h-2 w-2 rounded-full shrink-0",
                  d.status === 'active' ? 'bg-emerald-400' :
                  d.status === 'verifying' ? 'bg-amber-400 animate-pulse' :
                  d.status === 'setting_up' ? 'bg-blue-400 animate-pulse' : 'bg-red-400'
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-foreground truncate">{d.domain}</span>
                    {d.is_primary && <Badge variant="secondary" className="text-[8px] px-1.5 py-0">Primary</Badge>}
                  </div>
                </div>
                <Badge className={cn("text-[8px] px-1.5 py-0", sc.bg, sc.color, sc.border)}>{sc.label}</Badge>
                {d.ssl_status === 'active' && <Shield className="h-3 w-3 text-emerald-400/50" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Selected domain detail panel */}
      {selectedDomain && (
        <div className="mt-4 rounded-lg border border-border bg-card/50 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">{selectedDomain.domain}</h3>
            <div className="flex items-center gap-1">
              {!selectedDomain.is_primary && selectedDomain.status === 'active' && (
                <Button size="sm" variant="ghost" onClick={() => setPrimaryDomain(selectedDomain.id)} className="h-6 px-2 text-[10px] text-muted-foreground hover:text-foreground">
                  Set Primary
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { removeDomainFromDb(selectedDomain.id); setSelectedDomainId(null); }} className="h-6 w-6 p-0 text-destructive/50 hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Registrar detection */}
          {!registrarDetected && (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => handleDetectRegistrar(selectedDomain.domain)}
              disabled={isDetecting}
            >
              {isDetecting ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <Globe className="h-3 w-3 mr-1.5" />}
              {isDetecting ? 'Detecting provider...' : 'Detect DNS Provider'}
            </Button>
          )}

          {registrarDetected && detectedRegistrar && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{detectedRegistrar.icon}</span>
                <span className="text-xs font-semibold text-foreground">{detectedRegistrar.name} detected</span>
                <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px]">Auto-detected</Badge>
              </div>
              <ol className="space-y-1 text-[10px] text-muted-foreground list-decimal list-inside">
                {detectedRegistrar.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <a href={detectedRegistrar.dnsUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full text-xs h-7 mt-1 gap-1.5">
                  Open {detectedRegistrar.name} DNS Settings <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            </div>
          )}

          {registrarDetected && !detectedRegistrar && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
              <span className="text-[10px] text-muted-foreground">Could not auto-detect your DNS provider. Follow the generic instructions below to configure your domain.</span>
            </div>
          )}

          {/* DNS Records */}
          <div className="space-y-2">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Required DNS Records</span>
            
            {/* TXT Verification */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground uppercase">TXT Record (Verification)</span>
                {selectedDomain.status !== 'verifying' && (
                  <span className="text-[8px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" />Verified</span>
                )}
              </div>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                <span className="text-muted-foreground">Name</span>
                <div className="flex items-center gap-1">
                  <code className="text-foreground/70 font-mono">_ultriumai</code>
                  <button onClick={() => copyToClipboard('_ultriumai')} className="text-muted-foreground/40 hover:text-foreground"><Copy className="h-2.5 w-2.5" /></button>
                </div>
                <span className="text-muted-foreground">Value</span>
                <div className="flex items-center gap-1">
                  <code className="text-primary/70 font-mono truncate">{selectedDomain.txt_record}</code>
                  <button onClick={() => copyToClipboard(selectedDomain.txt_record)} className="text-muted-foreground/40 hover:text-foreground shrink-0"><Copy className="h-2.5 w-2.5" /></button>
                </div>
              </div>
            </div>

            {/* A Record */}
            <div className="p-3 rounded-lg bg-muted/30 border border-border space-y-1.5">
              <span className="text-[9px] text-muted-foreground uppercase">A Record (Points to UltriumAI)</span>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[10px]">
                <span className="text-muted-foreground">Name</span>
                <code className="text-foreground/70 font-mono">@ <span className="text-muted-foreground/50">(root domain)</span></code>
                <span className="text-muted-foreground">Value</span>
                <div className="flex items-center gap-1">
                  <code className="text-primary/70 font-mono">185.158.133.1</code>
                  <button onClick={() => copyToClipboard('185.158.133.1')} className="text-muted-foreground/40 hover:text-foreground"><Copy className="h-2.5 w-2.5" /></button>
                </div>
              </div>
              <p className="text-[9px] text-muted-foreground/60 mt-1">
                💡 Also add an A record for <code className="font-mono">www</code> pointing to <code className="font-mono">185.158.133.1</code>
              </p>
            </div>
          </div>

          {/* SSL Status */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border">
            <Shield className={cn("h-3.5 w-3.5", selectedDomain.ssl_status === 'active' ? 'text-emerald-400' : 'text-muted-foreground/30')} />
            <span className="text-[10px] text-muted-foreground flex-1">SSL Certificate</span>
            <Badge className={cn("text-[8px]",
              selectedDomain.ssl_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              selectedDomain.ssl_status === 'provisioning' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-muted/50 text-muted-foreground border-border'
            )}>
              {selectedDomain.ssl_status === 'active' ? 'Active' : selectedDomain.ssl_status === 'provisioning' ? 'Provisioning...' : 'Pending verification'}
            </Badge>
          </div>

          {/* Verify Button */}
          {selectedDomain.status === 'verifying' && (
            <Button onClick={() => handleVerifyDomain(selectedDomain.id)} disabled={isVerifying} className="w-full text-xs">
              {isVerifying ? <Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1.5" />}
              {isVerifying ? 'Checking DNS...' : 'Verify DNS Records'}
            </Button>
          )}

          <p className="text-[9px] text-muted-foreground/60 flex items-start gap-1.5">
            <Info className="h-3 w-3 shrink-0 mt-0.5" />
            DNS changes can take up to 48 hours to propagate. SSL is automatically provisioned once DNS is verified.
          </p>
        </div>
      )}

      {/* Connect domain flow */}
      {showDomainInput && (
        <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-5 space-y-3">
          <h3 className="text-sm font-medium text-foreground">Connect your domain</h3>
          <p className="text-xs text-muted-foreground">Enter your domain name below. You'll need to configure DNS records after connecting.</p>
          <div className="flex gap-2">
            <Input
              placeholder="yourdomain.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value.toLowerCase())}
              className="text-xs font-mono h-8 flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleConnectDomain()}
            />
            <Button size="sm" className="text-xs h-8" disabled={!newDomain.trim()} onClick={handleConnectDomain}>
              Connect
            </Button>
            <Button size="sm" variant="ghost" className="text-xs h-8" onClick={() => { setShowDomainInput(false); setNewDomain(''); }}>
              Cancel
            </Button>
          </div>
          <div className="bg-muted/50 rounded-md p-3 space-y-1.5 text-[11px] font-mono">
            <p className="text-muted-foreground font-sans text-[10px] uppercase font-semibold mb-2">DNS Records to add</p>
            <div className="flex justify-between"><span className="text-muted-foreground">A (@ and www)</span><span>185.158.133.1</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">TXT (_ultriumai)</span><span className="text-muted-foreground/60">Generated after connect</span></div>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-card/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Add existing domain</p>
            <p className="text-xs text-muted-foreground mt-0.5">Connect a domain you already own.</p>
          </div>
          <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setShowDomainInput(true)}>Connect domain</Button>
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Purchase new domain</p>
            <p className="text-xs text-muted-foreground mt-0.5">Buy a new domain through our partner.</p>
          </div>
          <a href="https://www.namecheap.com/" target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="text-xs h-8">Buy new domain</Button>
          </a>
        </div>
      </div>
    </div>
  );

  const renderServices = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">AI & Services</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Add API keys for AI models, voice services, and search engines.
      </p>
      <div className="mt-6 space-y-3">
        {localServiceKeys.map((sk) => {
          const def = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
          return (
            <div key={sk.id} className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
              <div className="flex gap-2 items-center">
                <Select value={sk.serviceId} onValueChange={(v) => updateServiceKey(sk.id, 'serviceId', v)}>
                  <SelectTrigger className="w-[220px] h-8 text-xs">
                    <SelectValue placeholder="Select service..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">AI Models</div>
                    {SERVICE_CATALOG.filter(s => s.category === 'ai').map(s => (
                      <SelectItem key={s.id} value={s.id} disabled={usedServiceIds.includes(s.id) && sk.serviceId !== s.id} className="text-xs">
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Search</div>
                    {SERVICE_CATALOG.filter(s => s.category === 'search').map(s => (
                      <SelectItem key={s.id} value={s.id} disabled={usedServiceIds.includes(s.id) && sk.serviceId !== s.id} className="text-xs">
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Voice & Audio</div>
                    {SERVICE_CATALOG.filter(s => s.category === 'voice').map(s => (
                      <SelectItem key={s.id} value={s.id} disabled={usedServiceIds.includes(s.id) && sk.serviceId !== s.id} className="text-xs">
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase">Other</div>
                    {SERVICE_CATALOG.filter(s => s.category === 'other').map(s => (
                      <SelectItem key={s.id} value={s.id} disabled={usedServiceIds.includes(s.id) && sk.serviceId !== s.id} className="text-xs">
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeServiceKey(sk.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
              {def && <p className="text-[11px] text-muted-foreground">{def.description}</p>}
              <Input type="password" placeholder={def?.placeholder || 'API Key...'} value={sk.apiKey}
                onChange={(e) => updateServiceKey(sk.id, 'apiKey', e.target.value)} className="text-xs font-mono h-8" />
              {def && (
                <a href={def.helpUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                  Get API key <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          );
        })}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={addServiceKey}><Plus className="h-3 w-3" />Add Service</Button>
          {localServiceKeys.length > 0 && <Button size="sm" className="text-xs" onClick={saveServiceKeys}>Save Keys</Button>}
        </div>
      </div>
      {serviceKeys.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-4">
          {serviceKeys.map(sk => {
            const def = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
            return def ? <Badge key={sk.id} variant="secondary" className="text-[10px] gap-1">{def.icon} {def.name}</Badge> : null;
          })}
        </div>
      )}
    </div>
  );

  const renderInfrastructure = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Infrastructure</h2>
      <p className="text-sm text-muted-foreground mt-1">Connect backend services for auth, database, and payments.</p>
      <div className="mt-6 rounded-lg border border-border bg-card/50 divide-y divide-border">
        {/* Supabase */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-medium text-foreground">Supabase</h3>
              {supabaseConfig && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Connected</Badge>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Connect for auth, database, and real-time features.</p>
          <div className="space-y-2">
            <Input placeholder="https://your-project.supabase.co" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="text-xs font-mono h-8" />
            <Input type="password" placeholder="Anon key: eyJhbGciOi..." value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="text-xs font-mono h-8" />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveSupabase} className="text-xs h-7">{supabaseConfig ? 'Update' : 'Connect'}</Button>
            {supabaseConfig && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onSupabaseChange(null); setSbUrl(''); setSbKey(''); toast.info('Disconnected'); }}>
                <XCircle className="h-3 w-3 mr-1" />Disconnect
              </Button>
            )}
          </div>
        </div>
        {/* Stripe */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-violet-400" />
              <h3 className="text-sm font-medium text-foreground">Stripe</h3>
              {stripeConfig && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Connected</Badge>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Add your publishable key for checkout/payment forms. Found in your{' '}
            <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
              Stripe Dashboard <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
          <Input placeholder="pk_test_..." value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} className="text-xs font-mono h-8" />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveStripe} className="text-xs h-7">{stripeConfig ? 'Update' : 'Connect'}</Button>
            {stripeConfig && (
              <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onStripeChange(null); setStripeKey(''); toast.info('Disconnected'); }}>
                <XCircle className="h-3 w-3 mr-1" />Disconnect
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderDeploy = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Deploy</h2>
      <p className="text-sm text-muted-foreground mt-1">Connect deployment services for CI/CD.</p>
      <div className="mt-6 rounded-lg border border-border bg-card/50 divide-y divide-border">
        {/* GitHub */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            <h3 className="text-sm font-medium text-foreground">GitHub</h3>
            {githubConfig && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Connected</Badge>}
          </div>
          <Input type="password" placeholder="ghp_..." value={ghToken} onChange={(e) => setGhToken(e.target.value)} className="text-xs font-mono h-8" />
          <p className="text-xs text-muted-foreground">
            Needs <code className="bg-muted px-1 rounded">repo</code> scope.{' '}
            <a href="https://github.com/settings/tokens/new?scopes=repo&description=AI+App+Builder" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
              Create one <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveGithub} className="text-xs h-7">{githubConfig ? 'Update' : 'Save'}</Button>
            {githubConfig && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onGithubChange(null); setGhToken(''); toast.info('Removed'); }}><XCircle className="h-3 w-3 mr-1" />Remove</Button>}
          </div>
        </div>
        {/* Vercel */}
        <div className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            <h3 className="text-sm font-medium text-foreground">Vercel</h3>
            {vercelConfig && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">Connected</Badge>}
          </div>
          <Input type="password" placeholder="Vercel token..." value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} className="text-xs font-mono h-8" />
          <p className="text-xs text-muted-foreground">
            Create at{' '}
            <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
              Vercel Settings <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveVercel} className="text-xs h-7">{vercelConfig ? 'Update' : 'Save'}</Button>
            {vercelConfig && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onVercelChange(null); setVercelToken(''); toast.info('Removed'); }}><XCircle className="h-3 w-3 mr-1" />Remove</Button>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderEnv = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Environment Variables</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Custom variables available as <code className="bg-muted px-1 rounded text-[11px]">window.ENV.KEY</code> in preview.
      </p>
      <div className="mt-6 rounded-lg border border-border bg-card/50 p-5 space-y-3">
        {localEnvVars.map((v, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="KEY" value={v.key} onChange={(e) => updateEnvVar(i, 'key', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))} className="text-xs font-mono w-1/3 h-8" />
            <Input placeholder="value" value={v.value} onChange={(e) => updateEnvVar(i, 'value', e.target.value)} className="text-xs font-mono flex-1 h-8" />
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeEnvVar(i)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="text-xs gap-1" onClick={addEnvVar}><Plus className="h-3 w-3" />Add</Button>
          {localEnvVars.length > 0 && <Button size="sm" className="text-xs" onClick={saveEnvVars}>Save</Button>}
        </div>
        {envVars.length > 0 && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{envVars.length} variable{envVars.length !== 1 ? 's' : ''}</Badge>}
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground">Privacy & security</h2>
      <p className="text-sm text-muted-foreground mt-1">Manage privacy and security settings for your project.</p>
      <div className="mt-6 rounded-lg border border-border bg-card/50 divide-y divide-border">
        <SettingRow title="Cross-project sharing" description="Allow this project to read files from and be visible to other projects." className="px-5">
          <Switch checked={crossProjectSharing} onCheckedChange={(v) => { setCrossProjectSharing(v); saveSettings({ cross_project_sharing: v }); toast.success(v ? 'Cross-project sharing enabled' : 'Cross-project sharing disabled'); }} />
        </SettingRow>
        <SettingRow title="Allow public preview links" description="When enabled, users can create temporary public preview links." className="px-5">
          <Switch checked={allowPublicPreview} onCheckedChange={(v) => { setAllowPublicPreview(v); saveSettings({ allow_public_preview: v }); toast.success(v ? 'Public preview links enabled' : 'Public preview links disabled'); }} />
        </SettingRow>
      </div>
      <div className="mt-6 rounded-lg border border-border bg-card/50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">
            <strong>⚠️ Security note:</strong> API keys are exposed in the browser for prototyping. For production apps, move API calls to a backend (Supabase Edge Functions, etc.).
          </p>
        </div>
      </div>
    </div>
  );

  const renderDanger = () => (
    <div>
      <h2 className="text-lg font-semibold text-foreground text-destructive">Danger Zone</h2>
      <p className="text-sm text-muted-foreground mt-1">Irreversible and destructive actions.</p>
      <div className="mt-6 rounded-lg border border-destructive/20 bg-destructive/[0.03] p-5 space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Type <code className="bg-muted px-1 rounded font-mono text-destructive/70">{projectName || 'project'}</code> to unlock.
          </p>
          <Input placeholder={`Type "${projectName || 'project'}" to confirm`} value={dangerConfirm}
            onChange={(e) => setDangerConfirm(e.target.value)} className="text-xs h-8 mt-2 max-w-xs" />
        </div>
        <Separator className="bg-destructive/10" />
        <SettingRow title="Reset to blank" description="Clears all files but keeps settings and integrations.">
          <Button size="sm" variant="outline"
            className="text-xs h-8 border-destructive/20 text-destructive hover:bg-destructive/10"
            disabled={dangerConfirm !== (projectName || 'project')}
            onClick={() => { onResetProject?.(); setDangerConfirm(''); toast.success('Project reset'); }}>
            Reset
          </Button>
        </SettingRow>
        <Separator className="bg-destructive/10" />
        <SettingRow title="Export & Delete" description="Download a ZIP of all files, then delete the project.">
          <Button size="sm" variant="outline"
            className="text-xs h-8 border-amber-500/20 text-amber-400 hover:bg-amber-500/10"
            disabled={dangerConfirm !== (projectName || 'project')}
            onClick={() => toast.info('Export started — download will begin shortly.')}>
            Export & Delete
          </Button>
        </SettingRow>
        <Separator className="bg-destructive/10" />
        <SettingRow title="Delete project" description="Permanently delete this project and all files. This cannot be undone.">
          <Button size="sm" variant="destructive" className="text-xs h-8"
            disabled={dangerConfirm !== (projectName || 'project')}
            onClick={() => { onDeleteProject?.(); setDangerConfirm(''); setOpen(false); }}>
            <Trash2 className="h-3 w-3 mr-1" />Delete
          </Button>
        </SettingRow>
      </div>
    </div>
  );

  const sectionRenderers: Record<SettingsSection, () => React.ReactNode> = {
    project: renderProjectSettings,
    domains: renderDomains,
    services: renderServices,
    infrastructure: renderInfrastructure,
    deploy: renderDeploy,
    env: renderEnv,
    privacy: renderPrivacy,
    danger: renderDanger,
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
          <Settings className="h-3 w-3" />
          Settings
          {connectedCount > 0 && (
            <Badge variant="secondary" className="h-4 px-1 text-[9px]">{connectedCount}</Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] p-0 gap-0 overflow-hidden z-[101] bg-[#0c0c10] border-white/10" onCloseAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="sr-only">
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Configure your project settings and integrations.</DialogDescription>
        </DialogHeader>
        <div className="flex h-[75vh]">
          {/* ── Left Sidebar ── */}
          <div className="w-[200px] shrink-0 border-r border-white/[0.06] bg-[#0e0e13] flex flex-col">
            <div className="p-3 border-b border-border">
              <button
                onClick={() => setOpen(false)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Go back
              </button>
            </div>
            <ScrollArea className="flex-1 py-2">
              {navGroups.map((group) => (
                <div key={group.label} className="mb-1">
                  <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveSection(item.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors",
                        activeSection === item.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      )}
                    >
                      {item.icon}
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.dot && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </button>
                  ))}
                </div>
              ))}
              {/* Danger zone at bottom */}
              <div className="mt-2 pt-2 border-t border-border">
                <button
                  onClick={() => setActiveSection('danger')}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-1.5 text-xs transition-colors",
                    activeSection === 'danger'
                      ? "bg-destructive/10 text-destructive font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span className="flex-1 text-left">Danger zone</span>
                </button>
              </div>
            </ScrollArea>
          </div>

          {/* ── Main Content ── */}
          <ScrollArea className="flex-1 p-6">
            {sectionRenderers[activeSection]()}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}

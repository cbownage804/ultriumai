import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database, Github, Settings, CheckCircle2, XCircle, ExternalLink,
  CreditCard, Rocket, Key, Brain, Plus, Trash2, Mic, Sparkles, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export interface GithubConfig {
  token: string;
}

export interface StripeConfig {
  publishableKey: string;
}

export interface VercelConfig {
  token: string;
}

export interface ServiceKey {
  id: string;
  serviceId: string;
  apiKey: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

// ── Service Catalog ──────────────────────────────────────

export interface ServiceDefinition {
  id: string;
  name: string;
  category: 'ai' | 'voice' | 'search' | 'other';
  icon: string; // emoji
  placeholder: string;
  helpUrl: string;
  envKeyName: string; // injected as window.ENV[envKeyName]
  description: string;
}

export const SERVICE_CATALOG: ServiceDefinition[] = [
  // AI Providers
  { id: 'openai', name: 'OpenAI', category: 'ai', icon: '🤖', placeholder: 'sk-...', helpUrl: 'https://platform.openai.com/api-keys', envKeyName: 'OPENAI_API_KEY', description: 'GPT-4o, GPT-4o-mini, DALL·E, Whisper' },
  { id: 'anthropic', name: 'Anthropic (Claude)', category: 'ai', icon: '🧠', placeholder: 'sk-ant-...', helpUrl: 'https://console.anthropic.com/settings/keys', envKeyName: 'ANTHROPIC_API_KEY', description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
  { id: 'google_ai', name: 'Google AI (Gemini)', category: 'ai', icon: '💎', placeholder: 'AIza...', helpUrl: 'https://aistudio.google.com/app/apikey', envKeyName: 'GOOGLE_AI_API_KEY', description: 'Gemini Pro, Gemini Flash' },
  { id: 'perplexity', name: 'Perplexity', category: 'search', icon: '🔍', placeholder: 'pplx-...', helpUrl: 'https://www.perplexity.ai/settings/api', envKeyName: 'PERPLEXITY_API_KEY', description: 'AI-powered search with citations' },
  { id: 'mistral', name: 'Mistral AI', category: 'ai', icon: '🌀', placeholder: '...', helpUrl: 'https://console.mistral.ai/api-keys', envKeyName: 'MISTRAL_API_KEY', description: 'Mistral Large, Mistral Medium' },
  { id: 'cohere', name: 'Cohere', category: 'ai', icon: '🔗', placeholder: '...', helpUrl: 'https://dashboard.cohere.com/api-keys', envKeyName: 'COHERE_API_KEY', description: 'Command, Embed, Rerank' },
  { id: 'groq', name: 'Groq', category: 'ai', icon: '⚡', placeholder: 'gsk_...', helpUrl: 'https://console.groq.com/keys', envKeyName: 'GROQ_API_KEY', description: 'Ultra-fast LLM inference' },
  // Voice & Audio
  { id: 'elevenlabs', name: 'ElevenLabs', category: 'voice', icon: '🎙️', placeholder: '...', helpUrl: 'https://elevenlabs.io/app/settings/api-keys', envKeyName: 'ELEVENLABS_API_KEY', description: 'Text-to-speech, voice cloning, STT' },
  { id: 'deepgram', name: 'Deepgram', category: 'voice', icon: '🎧', placeholder: '...', helpUrl: 'https://console.deepgram.com/', envKeyName: 'DEEPGRAM_API_KEY', description: 'Speech-to-text, real-time transcription' },
  { id: 'assemblyai', name: 'AssemblyAI', category: 'voice', icon: '📝', placeholder: '...', helpUrl: 'https://www.assemblyai.com/app/account', envKeyName: 'ASSEMBLYAI_API_KEY', description: 'Transcription, speaker diarization' },
  // Other
  { id: 'replicate', name: 'Replicate', category: 'other', icon: '🎨', placeholder: 'r8_...', helpUrl: 'https://replicate.com/account/api-tokens', envKeyName: 'REPLICATE_API_KEY', description: 'Run ML models (Stable Diffusion, etc.)' },
  { id: 'huggingface', name: 'Hugging Face', category: 'other', icon: '🤗', placeholder: 'hf_...', helpUrl: 'https://huggingface.co/settings/tokens', envKeyName: 'HUGGINGFACE_API_KEY', description: 'Inference API for thousands of models' },
];

// ── Props ──────────────────────────────────────────────

interface ProjectSettingsProps {
  supabaseConfig: SupabaseConfig | null;
  githubConfig: GithubConfig | null;
  stripeConfig: StripeConfig | null;
  vercelConfig: VercelConfig | null;
  serviceKeys: ServiceKey[];
  envVars: EnvVar[];
  projectName?: string;
  onSupabaseChange: (config: SupabaseConfig | null) => void;
  onGithubChange: (config: GithubConfig | null) => void;
  onStripeChange: (config: StripeConfig | null) => void;
  onVercelChange: (config: VercelConfig | null) => void;
  onServiceKeysChange: (keys: ServiceKey[]) => void;
  onEnvVarsChange: (vars: EnvVar[]) => void;
  onDeleteProject?: () => void;
  onResetProject?: () => void;
}

// ── Component ──────────────────────────────────────────

export function ProjectSettings({
  supabaseConfig, githubConfig, stripeConfig, vercelConfig, serviceKeys, envVars, projectName,
  onSupabaseChange, onGithubChange, onStripeChange, onVercelChange, onServiceKeysChange, onEnvVarsChange,
  onDeleteProject, onResetProject,
}: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.anonKey || '');
  const [ghToken, setGhToken] = useState(githubConfig?.token || '');
  const [stripeKey, setStripeKey] = useState(stripeConfig?.publishableKey || '');
  const [vercelToken, setVercelToken] = useState(vercelConfig?.token || '');
  const [localServiceKeys, setLocalServiceKeys] = useState<ServiceKey[]>(serviceKeys);
  const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(envVars);

  const connectedCount = [supabaseConfig, githubConfig, stripeConfig, vercelConfig]
    .filter(Boolean).length + (serviceKeys.length > 0 ? 1 : 0) + (envVars.length > 0 ? 1 : 0);

  // ── Supabase / Stripe / GitHub / Vercel handlers (unchanged logic) ──
  const handleSaveSupabase = () => {
    if (sbUrl.trim() && sbKey.trim()) { onSupabaseChange({ url: sbUrl.trim(), anonKey: sbKey.trim() }); toast.success('Supabase connected'); }
    else { onSupabaseChange(null); toast.info('Supabase disconnected'); }
  };
  const handleSaveGithub = () => {
    if (ghToken.trim()) { onGithubChange({ token: ghToken.trim() }); toast.success('GitHub token saved'); }
    else { onGithubChange(null); toast.info('GitHub disconnected'); }
  };
  const handleSaveStripe = () => {
    if (stripeKey.trim()) { onStripeChange({ publishableKey: stripeKey.trim() }); toast.success('Stripe connected'); }
    else { onStripeChange(null); toast.info('Stripe disconnected'); }
  };
  const handleSaveVercel = () => {
    if (vercelToken.trim()) { onVercelChange({ token: vercelToken.trim() }); toast.success('Vercel token saved'); }
    else { onVercelChange(null); toast.info('Vercel disconnected'); }
  };

  // ── Service Keys handlers ──
  const addServiceKey = () => {
    setLocalServiceKeys(prev => [...prev, { id: crypto.randomUUID(), serviceId: '', apiKey: '' }]);
  };
  const removeServiceKey = (id: string) => {
    setLocalServiceKeys(prev => prev.filter(k => k.id !== id));
  };
  const updateServiceKey = (id: string, field: 'serviceId' | 'apiKey', val: string) => {
    setLocalServiceKeys(prev => prev.map(k => k.id === id ? { ...k, [field]: val } : k));
  };
  const saveServiceKeys = () => {
    const valid = localServiceKeys.filter(k => k.serviceId && k.apiKey.trim());
    onServiceKeysChange(valid);
    toast.success(`${valid.length} service key${valid.length !== 1 ? 's' : ''} saved`);
  };

  // ── Env Vars handlers ──
  const addEnvVar = () => setLocalEnvVars(prev => [...prev, { key: '', value: '' }]);
  const removeEnvVar = (index: number) => setLocalEnvVars(prev => prev.filter((_, i) => i !== index));
  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    setLocalEnvVars(prev => prev.map((v, i) => i === index ? { ...v, [field]: val } : v));
  };
  const saveEnvVars = () => {
    const valid = localEnvVars.filter(v => v.key.trim());
    onEnvVarsChange(valid);
    toast.success(`${valid.length} env var${valid.length !== 1 ? 's' : ''} saved`);
  };

  const usedServiceIds = localServiceKeys.map(k => k.serviceId).filter(Boolean);
  const [dangerConfirm, setDangerConfirm] = useState('');

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
      <DialogContent className="sm:max-w-xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Connect services, APIs, and configure your project.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="services">
          <TabsList className="grid w-full grid-cols-6 h-9">
            <TabsTrigger value="services" className="text-[10px] gap-1 px-1">
              <Sparkles className="h-3 w-3" />
              <span className="hidden sm:inline">Services</span>
              {serviceKeys.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="infra" className="text-[10px] gap-1 px-1">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">Infra</span>
              {(supabaseConfig || stripeConfig) && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="deploy" className="text-[10px] gap-1 px-1">
              <Rocket className="h-3 w-3" />
              <span className="hidden sm:inline">Deploy</span>
              {(githubConfig || vercelConfig) && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="env" className="text-[10px] gap-1 px-1">
              <Key className="h-3 w-3" />
              <span className="hidden sm:inline">Env</span>
              {envVars.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="danger" className="text-[10px] gap-1 px-1">
              <AlertTriangle className="h-3 w-3" />
              <span className="hidden sm:inline">Danger</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="text-[10px] gap-1 px-1">
              ℹ️
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[55vh] pr-2">
            {/* ── AI, Voice & Search Services ── */}
            <TabsContent value="services" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Add API keys for AI models, voice services, and search engines. These are injected into the preview as <code className="bg-muted px-1 rounded text-[11px]">window.ENV.KEY</code> and the AI will generate code that uses them.
              </p>

              <div className="space-y-3">
                {localServiceKeys.map((sk) => {
                  const def = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
                  return (
                    <div key={sk.id} className="rounded-lg border border-border p-3 space-y-2">
                      <div className="flex gap-2 items-center">
                        <Select value={sk.serviceId} onValueChange={(v) => updateServiceKey(sk.id, 'serviceId', v)}>
                          <SelectTrigger className="w-[200px] h-8 text-xs">
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
                      {def && (
                        <p className="text-[11px] text-muted-foreground">{def.description}</p>
                      )}
                      <Input
                        type="password"
                        placeholder={def?.placeholder || 'API Key...'}
                        value={sk.apiKey}
                        onChange={(e) => updateServiceKey(sk.id, 'apiKey', e.target.value)}
                        className="text-xs font-mono h-8"
                      />
                      {def && (
                        <a href={def.helpUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:underline inline-flex items-center gap-0.5">
                          Get API key <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  );
                })}

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={addServiceKey}>
                    <Plus className="h-3 w-3" />Add Service
                  </Button>
                  {localServiceKeys.length > 0 && (
                    <Button size="sm" className="text-xs" onClick={saveServiceKeys}>
                      Save Keys
                    </Button>
                  )}
                </div>
              </div>

              {serviceKeys.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {serviceKeys.map(sk => {
                    const def = SERVICE_CATALOG.find(s => s.id === sk.serviceId);
                    return def ? (
                      <Badge key={sk.id} variant="secondary" className="text-[10px] gap-1">
                        {def.icon} {def.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── Infrastructure (Supabase + Stripe) ── */}
            <TabsContent value="infra" className="space-y-6 pt-4">
              {/* Supabase */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><Database className="h-3 w-3" /> Supabase</h4>
                <p className="text-[11px] text-muted-foreground">Connect for auth, database, and real-time features in the live preview.</p>
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
                {supabaseConfig && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Connected</Badge>}
              </div>

              {/* Stripe */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><CreditCard className="h-3 w-3" /> Stripe</h4>
                <p className="text-[11px] text-muted-foreground">Add your publishable key for live checkout/payment forms.</p>
                <Input placeholder="pk_test_..." value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} className="text-xs font-mono h-8" />
                <p className="text-[11px] text-muted-foreground">
                  Found in your <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Stripe Dashboard <ExternalLink className="h-2.5 w-2.5" /></a>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveStripe} className="text-xs h-7">{stripeConfig ? 'Update' : 'Connect'}</Button>
                  {stripeConfig && (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onStripeChange(null); setStripeKey(''); toast.info('Disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Disconnect
                    </Button>
                  )}
                </div>
                {stripeConfig && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Connected</Badge>}
              </div>
            </TabsContent>

            {/* ── Deploy (GitHub + Vercel) ── */}
            <TabsContent value="deploy" className="space-y-6 pt-4">
              {/* GitHub */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><Github className="h-3 w-3" /> GitHub</h4>
                <Input type="password" placeholder="ghp_..." value={ghToken} onChange={(e) => setGhToken(e.target.value)} className="text-xs font-mono h-8" />
                <p className="text-[11px] text-muted-foreground">
                  Needs <code className="bg-muted px-1 rounded">repo</code> scope. <a href="https://github.com/settings/tokens/new?scopes=repo&description=AI+App+Builder" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Create one <ExternalLink className="h-2.5 w-2.5" /></a>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveGithub} className="text-xs h-7">{githubConfig ? 'Update' : 'Save'}</Button>
                  {githubConfig && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onGithubChange(null); setGhToken(''); toast.info('Removed'); }}><XCircle className="h-3 w-3 mr-1" />Remove</Button>}
                </div>
                {githubConfig && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Token saved</Badge>}
              </div>

              {/* Vercel */}
              <div className="space-y-3 border-t border-border pt-4">
                <h4 className="text-xs font-semibold flex items-center gap-1.5"><Rocket className="h-3 w-3" /> Vercel</h4>
                <Input type="password" placeholder="Vercel token..." value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} className="text-xs font-mono h-8" />
                <p className="text-[11px] text-muted-foreground">
                  Create at <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">Vercel Settings <ExternalLink className="h-2.5 w-2.5" /></a>
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveVercel} className="text-xs h-7">{vercelConfig ? 'Update' : 'Save'}</Button>
                  {vercelConfig && <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => { onVercelChange(null); setVercelToken(''); toast.info('Removed'); }}><XCircle className="h-3 w-3 mr-1" />Remove</Button>}
                </div>
                {vercelConfig && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Token saved</Badge>}
              </div>
            </TabsContent>

            {/* ── Environment Variables ── */}
            <TabsContent value="env" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Custom variables available as <code className="bg-muted px-1 rounded text-[11px]">window.ENV.KEY</code> in preview.
              </p>
              <div className="space-y-2">
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
              </div>
              {envVars.length > 0 && <Badge variant="secondary" className="text-[10px] gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />{envVars.length} variable{envVars.length !== 1 ? 's' : ''}</Badge>}
            </TabsContent>

            {/* ── Danger Zone ── */}
            <TabsContent value="danger" className="space-y-4 pt-4">
              <div className="rounded-lg border border-red-500/20 bg-red-500/[0.03] p-4 space-y-5">
                <h4 className="text-xs font-semibold text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />Danger Zone
                </h4>

                <p className="text-[11px] text-muted-foreground">
                  Type <code className="bg-muted px-1 rounded font-mono text-red-400/70">{projectName || 'project'}</code> to unlock destructive actions.
                </p>
                <Input
                  placeholder={`Type "${projectName || 'project'}" to confirm`}
                  value={dangerConfirm}
                  onChange={(e) => setDangerConfirm(e.target.value)}
                  className="text-xs h-8"
                />

                {/* Reset project */}
                <div className="space-y-2 pb-3 border-b border-red-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Reset to blank</p>
                      <p className="text-[11px] text-muted-foreground">Clears all files but keeps settings and integrations.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                      disabled={dangerConfirm !== (projectName || 'project')}
                      onClick={() => { onResetProject?.(); setDangerConfirm(''); toast.success('Project reset'); }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>

                {/* Export & Delete */}
                <div className="space-y-2 pb-3 border-b border-red-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Export & Delete</p>
                      <p className="text-[11px] text-muted-foreground">Download a ZIP of all files, then delete the project.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-amber-500/20 text-amber-400 hover:bg-amber-500/10 hover:text-amber-300"
                      disabled={dangerConfirm !== (projectName || 'project')}
                      onClick={() => { toast.info('Export started — download will begin shortly.'); }}
                    >
                      Export & Delete
                    </Button>
                  </div>
                </div>

                {/* Delete project */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-white/70">Delete project</p>
                      <p className="text-[11px] text-muted-foreground">Permanently delete this project and all files. This cannot be undone.</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="text-xs h-8"
                      disabled={dangerConfirm !== (projectName || 'project')}
                      onClick={() => { onDeleteProject?.(); setDangerConfirm(''); setOpen(false); }}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── About ── */}
            <TabsContent value="about" className="space-y-3 pt-4">
              <p className="text-sm text-muted-foreground">
                <strong>How API keys work:</strong> Service keys and env vars are injected into the preview iframe as <code className="bg-muted px-1 rounded text-[11px]">window.ENV.KEY_NAME</code>. The AI is informed about which services are available and generates code that uses them.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>⚠️ Security note:</strong> API keys are exposed in the browser for prototyping. For production apps, move API calls to a backend (Supabase Edge Functions, etc.).
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Supported services:</strong> {SERVICE_CATALOG.length} services across AI, voice/audio, search, and more. Add any service from the Services tab.
              </p>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

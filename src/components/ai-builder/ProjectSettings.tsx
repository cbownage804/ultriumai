import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Database, Github, Settings, CheckCircle2, XCircle, ExternalLink,
  CreditCard, Rocket, Key, Brain, Plus, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

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

export interface OpenAIConfig {
  apiKey: string;
}

export interface EnvVar {
  key: string;
  value: string;
}

interface ProjectSettingsProps {
  supabaseConfig: SupabaseConfig | null;
  githubConfig: GithubConfig | null;
  stripeConfig: StripeConfig | null;
  vercelConfig: VercelConfig | null;
  openaiConfig: OpenAIConfig | null;
  envVars: EnvVar[];
  onSupabaseChange: (config: SupabaseConfig | null) => void;
  onGithubChange: (config: GithubConfig | null) => void;
  onStripeChange: (config: StripeConfig | null) => void;
  onVercelChange: (config: VercelConfig | null) => void;
  onOpenAIChange: (config: OpenAIConfig | null) => void;
  onEnvVarsChange: (vars: EnvVar[]) => void;
}

export function ProjectSettings({
  supabaseConfig, githubConfig, stripeConfig, vercelConfig, openaiConfig, envVars,
  onSupabaseChange, onGithubChange, onStripeChange, onVercelChange, onOpenAIChange, onEnvVarsChange,
}: ProjectSettingsProps) {
  const [open, setOpen] = useState(false);
  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.anonKey || '');
  const [ghToken, setGhToken] = useState(githubConfig?.token || '');
  const [stripeKey, setStripeKey] = useState(stripeConfig?.publishableKey || '');
  const [vercelToken, setVercelToken] = useState(vercelConfig?.token || '');
  const [openaiKey, setOpenaiKey] = useState(openaiConfig?.apiKey || '');
  const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(envVars);

  const connectedCount = [supabaseConfig, githubConfig, stripeConfig, vercelConfig, openaiConfig]
    .filter(Boolean).length + (envVars.length > 0 ? 1 : 0);

  const handleSaveSupabase = () => {
    if (sbUrl.trim() && sbKey.trim()) {
      onSupabaseChange({ url: sbUrl.trim(), anonKey: sbKey.trim() });
      toast.success('Supabase connected');
    } else {
      onSupabaseChange(null);
      toast.info('Supabase disconnected');
    }
  };

  const handleSaveGithub = () => {
    if (ghToken.trim()) {
      onGithubChange({ token: ghToken.trim() });
      toast.success('GitHub token saved');
    } else {
      onGithubChange(null);
      toast.info('GitHub disconnected');
    }
  };

  const handleSaveStripe = () => {
    if (stripeKey.trim()) {
      onStripeChange({ publishableKey: stripeKey.trim() });
      toast.success('Stripe connected');
    } else {
      onStripeChange(null);
      toast.info('Stripe disconnected');
    }
  };

  const handleSaveVercel = () => {
    if (vercelToken.trim()) {
      onVercelChange({ token: vercelToken.trim() });
      toast.success('Vercel token saved');
    } else {
      onVercelChange(null);
      toast.info('Vercel disconnected');
    }
  };

  const handleSaveOpenAI = () => {
    if (openaiKey.trim()) {
      onOpenAIChange({ apiKey: openaiKey.trim() });
      toast.success('OpenAI API key saved');
    } else {
      onOpenAIChange(null);
      toast.info('OpenAI disconnected');
    }
  };

  const addEnvVar = () => {
    setLocalEnvVars(prev => [...prev, { key: '', value: '' }]);
  };

  const removeEnvVar = (index: number) => {
    setLocalEnvVars(prev => prev.filter((_, i) => i !== index));
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', val: string) => {
    setLocalEnvVars(prev => prev.map((v, i) => i === index ? { ...v, [field]: val } : v));
  };

  const saveEnvVars = () => {
    const valid = localEnvVars.filter(v => v.key.trim());
    onEnvVarsChange(valid);
    toast.success(`${valid.length} environment variable${valid.length !== 1 ? 's' : ''} saved`);
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
      <DialogContent className="sm:max-w-xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Connect external services to enhance your generated apps.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="supabase">
          <TabsList className="grid w-full grid-cols-6 h-9">
            <TabsTrigger value="supabase" className="text-[10px] gap-1 px-1">
              <Database className="h-3 w-3" />
              <span className="hidden sm:inline">Supabase</span>
              {supabaseConfig && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="stripe" className="text-[10px] gap-1 px-1">
              <CreditCard className="h-3 w-3" />
              <span className="hidden sm:inline">Stripe</span>
              {stripeConfig && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="github" className="text-[10px] gap-1 px-1">
              <Github className="h-3 w-3" />
              <span className="hidden sm:inline">GitHub</span>
              {githubConfig && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="vercel" className="text-[10px] gap-1 px-1">
              <Rocket className="h-3 w-3" />
              <span className="hidden sm:inline">Vercel</span>
              {vercelConfig && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="openai" className="text-[10px] gap-1 px-1">
              <Brain className="h-3 w-3" />
              <span className="hidden sm:inline">AI</span>
              {openaiConfig && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="env" className="text-[10px] gap-1 px-1">
              <Key className="h-3 w-3" />
              <span className="hidden sm:inline">Env</span>
              {envVars.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-green-500" />}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="max-h-[55vh]">
            {/* Supabase */}
            <TabsContent value="supabase" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Connect your Supabase project to enable auth, database, and real-time features in the live preview.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sb-url" className="text-xs">Project URL</Label>
                  <Input id="sb-url" placeholder="https://your-project.supabase.co" value={sbUrl} onChange={(e) => setSbUrl(e.target.value)} className="text-sm font-mono" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sb-key" className="text-xs">Anon / Public Key</Label>
                  <Input id="sb-key" type="password" placeholder="eyJhbGciOi..." value={sbKey} onChange={(e) => setSbKey(e.target.value)} className="text-sm font-mono" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveSupabase} className="text-xs">{supabaseConfig ? 'Update' : 'Connect'}</Button>
                  {supabaseConfig && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { onSupabaseChange(null); setSbUrl(''); setSbKey(''); toast.info('Supabase disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Disconnect
                    </Button>
                  )}
                </div>
              </div>
              {supabaseConfig && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Connected — AI will generate Supabase-powered code</Badge>}
            </TabsContent>

            {/* Stripe */}
            <TabsContent value="stripe" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Add your Stripe publishable key to enable live checkout forms, payment elements, and subscription flows in the preview.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="stripe-key" className="text-xs">Publishable Key</Label>
                  <Input id="stripe-key" placeholder="pk_test_..." value={stripeKey} onChange={(e) => setStripeKey(e.target.value)} className="text-sm font-mono" />
                  <p className="text-[11px] text-muted-foreground">
                    Found in your{' '}
                    <a href="https://dashboard.stripe.com/test/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Stripe Dashboard <ExternalLink className="h-2.5 w-2.5" />
                    </a>. This is a publishable (public) key — safe to use in client code.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveStripe} className="text-xs">{stripeConfig ? 'Update' : 'Connect'}</Button>
                  {stripeConfig && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { onStripeChange(null); setStripeKey(''); toast.info('Stripe disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Disconnect
                    </Button>
                  )}
                </div>
              </div>
              {stripeConfig && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Connected — AI will generate Stripe payment code</Badge>}
            </TabsContent>

            {/* GitHub */}
            <TabsContent value="github" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Add a GitHub Personal Access Token to push your project to a new repository.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="gh-token" className="text-xs">Personal Access Token</Label>
                  <Input id="gh-token" type="password" placeholder="ghp_..." value={ghToken} onChange={(e) => setGhToken(e.target.value)} className="text-sm font-mono" />
                  <p className="text-[11px] text-muted-foreground">
                    Needs <code className="bg-muted px-1 rounded">repo</code> scope.{' '}
                    <a href="https://github.com/settings/tokens/new?scopes=repo&description=AI+App+Builder" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Create one <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveGithub} className="text-xs">{githubConfig ? 'Update' : 'Save Token'}</Button>
                  {githubConfig && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { onGithubChange(null); setGhToken(''); toast.info('GitHub disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Remove
                    </Button>
                  )}
                </div>
              </div>
              {githubConfig && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Token saved — use "Push to GitHub" to create a repo</Badge>}
            </TabsContent>

            {/* Vercel */}
            <TabsContent value="vercel" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Add your Vercel token to deploy generated apps with one click. Includes automatic SSL and custom domain support.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="vercel-token" className="text-xs">Vercel Token</Label>
                  <Input id="vercel-token" type="password" placeholder="..." value={vercelToken} onChange={(e) => setVercelToken(e.target.value)} className="text-sm font-mono" />
                  <p className="text-[11px] text-muted-foreground">
                    Create one at{' '}
                    <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      Vercel Settings <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveVercel} className="text-xs">{vercelConfig ? 'Update' : 'Save Token'}</Button>
                  {vercelConfig && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { onVercelChange(null); setVercelToken(''); toast.info('Vercel disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Remove
                    </Button>
                  )}
                </div>
              </div>
              {vercelConfig && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Token saved — use "Deploy to Vercel" button</Badge>}
            </TabsContent>

            {/* OpenAI */}
            <TabsContent value="openai" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Add an OpenAI API key to let the AI generate apps with built-in AI chat, summarization, content generation, and more.
              </p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="openai-key" className="text-xs">OpenAI API Key</Label>
                  <Input id="openai-key" type="password" placeholder="sk-..." value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} className="text-sm font-mono" />
                  <p className="text-[11px] text-muted-foreground">
                    Get yours at{' '}
                    <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-0.5">
                      OpenAI Platform <ExternalLink className="h-2.5 w-2.5" />
                    </a>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveOpenAI} className="text-xs">{openaiConfig ? 'Update' : 'Save Key'}</Button>
                  {openaiConfig && (
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => { onOpenAIChange(null); setOpenaiKey(''); toast.info('OpenAI disconnected'); }}>
                      <XCircle className="h-3 w-3 mr-1" />Remove
                    </Button>
                  )}
                </div>
              </div>
              {openaiConfig && <Badge variant="secondary" className="text-xs gap-1"><CheckCircle2 className="h-3 w-3 text-green-500" />Connected — AI will generate apps with built-in AI features</Badge>}
            </TabsContent>

            {/* Environment Variables */}
            <TabsContent value="env" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Define custom environment variables available as <code className="bg-muted px-1 rounded text-[11px]">window.ENV.KEY</code> in preview and included in exports.
              </p>
              <div className="space-y-2">
                {localEnvVars.map((v, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input
                      placeholder="KEY"
                      value={v.key}
                      onChange={(e) => updateEnvVar(i, 'key', e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''))}
                      className="text-xs font-mono w-1/3"
                    />
                    <Input
                      placeholder="value"
                      value={v.value}
                      onChange={(e) => updateEnvVar(i, 'value', e.target.value)}
                      className="text-xs font-mono flex-1"
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeEnvVar(i)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={addEnvVar}>
                    <Plus className="h-3 w-3" />Add Variable
                  </Button>
                  {localEnvVars.length > 0 && (
                    <Button size="sm" className="text-xs" onClick={saveEnvVars}>
                      Save Variables
                    </Button>
                  )}
                </div>
              </div>
              {envVars.length > 0 && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  {envVars.length} variable{envVars.length !== 1 ? 's' : ''} configured
                </Badge>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

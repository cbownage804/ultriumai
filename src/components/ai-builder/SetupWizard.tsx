import { useState } from 'react';
import {
  X, Database, Shield, Key, Rocket, Globe, CheckCircle2, ExternalLink,
  ArrowRight, ArrowLeft, CreditCard, Zap, ChevronDown, ChevronUp, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { SupabaseConfig, StripeConfig, EnvVar } from './ProjectSettings';

interface SetupWizardProps {
  open: boolean;
  onClose: () => void;
  supabaseConfig: SupabaseConfig | null;
  stripeConfig: StripeConfig | null;
  envVars: EnvVar[];
  onSupabaseChange: (config: SupabaseConfig | null) => void;
  onStripeChange: (config: StripeConfig | null) => void;
  onEnvVarsChange: (vars: EnvVar[]) => void;
  onOpenAuth: () => void;
  onOpenDeploy: () => void;
}

const STEPS = [
  { id: 'supabase', label: 'Database', icon: Database, description: 'Connect Supabase for auth, database & storage' },
  { id: 'auth', label: 'Authentication', icon: Shield, description: 'Set up sign-in methods for your users' },
  { id: 'payments', label: 'Payments', icon: CreditCard, description: 'Add Stripe for billing & subscriptions' },
  { id: 'env', label: 'Environment', icon: Key, description: 'Configure API keys & secrets' },
  { id: 'deploy', label: 'Deploy', icon: Rocket, description: 'Publish or export your app' },
] as const;

type StepId = typeof STEPS[number]['id'];

export function SetupWizard({
  open, onClose,
  supabaseConfig, stripeConfig, envVars,
  onSupabaseChange, onStripeChange, onEnvVarsChange,
  onOpenAuth, onOpenDeploy,
}: SetupWizardProps) {
  const [activeStep, setActiveStep] = useState<StepId>('supabase');
  const [sbUrl, setSbUrl] = useState(supabaseConfig?.url || '');
  const [sbKey, setSbKey] = useState(supabaseConfig?.anonKey || '');
  const [stripeKey, setStripeKey] = useState(stripeConfig?.publishableKey || '');
  const [localEnvVars, setLocalEnvVars] = useState<EnvVar[]>(envVars.length > 0 ? envVars : [{ key: '', value: '' }]);
  const [expandedTip, setExpandedTip] = useState(true);

  if (!open) return null;

  const stepIndex = STEPS.findIndex(s => s.id === activeStep);
  const isComplete = (id: StepId) => {
    if (id === 'supabase') return !!supabaseConfig;
    if (id === 'auth') return !!supabaseConfig; // auth requires supabase
    if (id === 'payments') return !!stripeConfig;
    if (id === 'env') return envVars.length > 0;
    if (id === 'deploy') return false;
    return false;
  };

  const completedCount = STEPS.filter(s => isComplete(s.id)).length;

  const handleSaveSupabase = () => {
    if (sbUrl.trim() && sbKey.trim()) {
      onSupabaseChange({ url: sbUrl.trim(), anonKey: sbKey.trim() });
      toast.success('Supabase connected!');
    } else {
      toast.error('Please enter both URL and anon key');
    }
  };

  const handleSaveStripe = () => {
    if (stripeKey.trim()) {
      onStripeChange({ publishableKey: stripeKey.trim() });
      toast.success('Stripe connected!');
    } else {
      toast.error('Please enter your publishable key');
    }
  };

  const handleSaveEnvVars = () => {
    const valid = localEnvVars.filter(v => v.key.trim() && v.value.trim());
    onEnvVarsChange(valid);
    toast.success(`${valid.length} variable${valid.length !== 1 ? 's' : ''} saved`);
  };

  const goNext = () => {
    if (stepIndex < STEPS.length - 1) setActiveStep(STEPS[stepIndex + 1].id);
  };
  const goPrev = () => {
    if (stepIndex > 0) setActiveStep(STEPS[stepIndex - 1].id);
  };

  return (
    <div className="w-80 border-r border-white/[0.06] bg-[#0d0d14] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
          <span className="text-xs font-medium text-white/80">Setup Guide</span>
          <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px] h-4 px-1.5">
            {completedCount}/{STEPS.length - 1}
          </Badge>
        </div>
        <button onClick={onClose} className="h-5 w-5 rounded flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5">
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Progress steps */}
      <div className="px-3 py-2 border-b border-white/[0.06] space-y-0.5 shrink-0">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const done = isComplete(step.id);
          const active = activeStep === step.id;
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-all text-left",
                active ? "bg-white/[0.06] text-white/90" : "text-white/40 hover:text-white/60 hover:bg-white/[0.03]"
              )}
            >
              <div className={cn(
                "h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] transition-all",
                done ? "bg-emerald-500/20 text-emerald-400" :
                active ? "bg-cyan-500/20 text-cyan-400" : "bg-white/[0.04] text-white/25"
              )}>
                {done ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-2.5 w-2.5" />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-medium block truncate">{step.label}</span>
              </div>
              {done && <span className="text-[8px] text-emerald-400/60 shrink-0">Done</span>}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {activeStep === 'supabase' && (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white/80">Connect Supabase</h4>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Supabase provides your database, authentication, file storage, and real-time features — just like Lovable Cloud.
                </p>
              </div>

              {/* Tip */}
              <button
                onClick={() => setExpandedTip(!expandedTip)}
                className="w-full flex items-center gap-2 p-2 rounded-md bg-cyan-500/[0.06] border border-cyan-500/10 text-left"
              >
                <Globe className="h-3 w-3 text-cyan-400 shrink-0" />
                <span className="text-[10px] text-cyan-400/80 flex-1">How to get your credentials</span>
                {expandedTip ? <ChevronUp className="h-3 w-3 text-cyan-400/40" /> : <ChevronDown className="h-3 w-3 text-cyan-400/40" />}
              </button>
              {expandedTip && (
                <ol className="space-y-1.5 text-[10px] text-white/40 list-decimal list-inside pl-1">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">supabase.com/dashboard</a></li>
                  <li>Create a new project (or select existing)</li>
                  <li>Navigate to <strong className="text-white/60">Settings → API</strong></li>
                  <li>Copy <strong className="text-white/60">Project URL</strong> and <strong className="text-white/60">anon public key</strong></li>
                  <li>Paste them below</li>
                </ol>
              )}

              <div className="space-y-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40">Project URL</label>
                  <Input
                    placeholder="https://your-project.supabase.co"
                    value={sbUrl}
                    onChange={e => setSbUrl(e.target.value)}
                    className="h-7 text-[11px] bg-black/30 border-white/[0.08] text-white/80 font-mono placeholder:text-white/15"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/40">Anon Key</label>
                  <Input
                    type="password"
                    placeholder="eyJhbGciOi..."
                    value={sbKey}
                    onChange={e => setSbKey(e.target.value)}
                    className="h-7 text-[11px] bg-black/30 border-white/[0.08] text-white/80 font-mono placeholder:text-white/15"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSupabase} size="sm" className="flex-1 h-7 text-[11px] bg-emerald-500 hover:bg-emerald-600 text-white border-0">
                  {supabaseConfig ? 'Update' : 'Connect'}
                </Button>
                {supabaseConfig && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Connected
                  </Badge>
                )}
              </div>

              {supabaseConfig && (
                <p className="text-[9px] text-emerald-400/50 text-center">
                  ✓ Database, Auth, Storage & Realtime ready
                </p>
              )}
            </>
          )}

          {activeStep === 'auth' && (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white/80">Authentication</h4>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Set up how your users sign in — email/password, magic links, Google, GitHub, and more.
                </p>
              </div>

              {!supabaseConfig ? (
                <div className="p-3 rounded-lg bg-amber-500/[0.06] border border-amber-500/15 space-y-2">
                  <p className="text-[10px] text-amber-400/80">
                    Connect Supabase first to enable authentication.
                  </p>
                  <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setActiveStep('supabase')}>
                    <ArrowLeft className="h-2.5 w-2.5 mr-1" />
                    Go to Supabase Setup
                  </Button>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] space-y-2">
                    <p className="text-[10px] text-white/50">
                      Supabase Auth supports email/password, magic link, phone, and OAuth providers (Google, GitHub, Apple, etc.).
                    </p>
                    <ol className="space-y-1 text-[10px] text-white/40 list-decimal list-inside">
                      <li>Open the <strong className="text-white/60">Auth Config</strong> panel to toggle providers</li>
                      <li>For OAuth, configure credentials in your <a href={`${supabaseConfig.url.replace('.supabase.co', '')}/auth/providers`} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Supabase Dashboard</a></li>
                      <li>Click "Generate Auth Pages" to create login/signup UI</li>
                    </ol>
                  </div>

                  <Button
                    onClick={() => { onOpenAuth(); onClose(); }}
                    className="w-full h-8 text-[11px] bg-violet-500 hover:bg-violet-600 text-white border-0"
                  >
                    <Shield className="h-3 w-3 mr-1.5" />
                    Open Auth Config
                  </Button>

                  <a
                    href="https://supabase.com/docs/guides/auth"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] text-cyan-400/60 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Supabase Auth Docs
                  </a>
                </>
              )}
            </>
          )}

          {activeStep === 'payments' && (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white/80">Stripe Payments</h4>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Accept payments, manage subscriptions, and handle billing with Stripe.
                </p>
              </div>

              <div className="p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] space-y-1.5">
                <p className="text-[10px] text-white/40">
                  Get your publishable key from <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Stripe Dashboard → API Keys</a>.
                </p>
                <p className="text-[9px] text-white/25">
                  Only the <strong className="text-white/40">publishable</strong> key goes here. Secret keys should be in Edge Functions.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-white/40">Publishable Key</label>
                <Input
                  placeholder="pk_live_... or pk_test_..."
                  value={stripeKey}
                  onChange={e => setStripeKey(e.target.value)}
                  className="h-7 text-[11px] bg-black/30 border-white/[0.08] text-white/80 font-mono placeholder:text-white/15"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveStripe} size="sm" className="flex-1 h-7 text-[11px] bg-violet-500 hover:bg-violet-600 text-white border-0">
                  {stripeConfig ? 'Update' : 'Connect'}
                </Button>
                {stripeConfig && (
                  <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] flex items-center gap-1">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Connected
                  </Badge>
                )}
              </div>

              <p className="text-[9px] text-white/20 italic">Optional — skip if your app doesn't need payments.</p>
            </>
          )}

          {activeStep === 'env' && (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white/80">Environment Variables</h4>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Store API keys, secrets, and config values. These are injected as{' '}
                  <code className="text-cyan-400/60 bg-black/30 px-1 rounded text-[9px]">window.ENV.KEY</code> in your app.
                </p>
              </div>

              <div className="space-y-2">
                {localEnvVars.map((v, i) => (
                  <div key={i} className="space-y-1 p-2 rounded-md bg-white/[0.02] border border-white/[0.04]">
                    <Input
                      value={v.key}
                      onChange={e => setLocalEnvVars(prev => prev.map((p, j) => j === i ? { ...p, key: e.target.value } : p))}
                      placeholder="KEY_NAME"
                      className="h-6 text-[10px] bg-black/30 border-white/[0.06] text-white/80 font-mono uppercase"
                    />
                    <Input
                      type="password"
                      value={v.value}
                      onChange={e => setLocalEnvVars(prev => prev.map((p, j) => j === i ? { ...p, value: e.target.value } : p))}
                      placeholder="value"
                      className="h-6 text-[10px] bg-black/30 border-white/[0.06] text-white/60 font-mono"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-6 text-[9px] bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/70"
                  onClick={() => setLocalEnvVars(prev => [...prev, { key: '', value: '' }])}
                >
                  + Add Variable
                </Button>
              </div>

              <Button onClick={handleSaveEnvVars} size="sm" className="w-full h-7 text-[11px] bg-cyan-500 hover:bg-cyan-600 text-white border-0">
                Save Variables
              </Button>

              <p className="text-[9px] text-white/20 italic">Optional — skip if your app doesn't need API keys.</p>
            </>
          )}

          {activeStep === 'deploy' && (
            <>
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-white/80">Deploy Your App</h4>
                <p className="text-[10px] text-white/30 leading-relaxed">
                  Publish to a live URL, export for self-hosting, or deploy to Vercel.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => { onOpenDeploy(); onClose(); }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 hover:border-cyan-500/30 transition-all text-left"
                >
                  <Globe className="h-4 w-4 text-cyan-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/80">Publish to Live URL</p>
                    <p className="text-[9px] text-white/30">Deploy to yourapp.apps.ultriumai.com</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/20 shrink-0" />
                </button>

                <button
                  onClick={() => { onOpenDeploy(); onClose(); }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left"
                >
                  <Rocket className="h-4 w-4 text-white/40 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/70">Full-Stack Export</p>
                    <p className="text-[9px] text-white/25">Download React + Vite + Supabase project</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/20 shrink-0" />
                </button>

                <button
                  onClick={() => { onOpenDeploy(); onClose(); }}
                  className="w-full flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] transition-all text-left"
                >
                  <Zap className="h-4 w-4 text-white/40 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-white/70">Deploy to Vercel</p>
                    <p className="text-[9px] text-white/25">One-click deploy with environment variables</p>
                  </div>
                  <ArrowRight className="h-3 w-3 text-white/20 shrink-0" />
                </button>
              </div>

              <div className="p-2.5 rounded-md bg-emerald-500/[0.06] border border-emerald-500/10">
                <p className="text-[10px] text-emerald-400/70 leading-relaxed">
                  <strong>For production with 40+ users:</strong> Use Full-Stack Export with your own Supabase project for guaranteed scalability.
                </p>
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      {/* Navigation footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.06] shrink-0">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-[10px] text-white/30 hover:text-white/60"
          onClick={goPrev}
          disabled={stepIndex === 0}
        >
          <ArrowLeft className="h-2.5 w-2.5 mr-1" />
          Back
        </Button>
        {stepIndex < STEPS.length - 1 ? (
          <Button
            size="sm"
            className="h-6 text-[10px] bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border-0"
            onClick={goNext}
          >
            Next
            <ArrowRight className="h-2.5 w-2.5 ml-1" />
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-6 text-[10px] bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border-0"
            onClick={onClose}
          >
            Done
            <CheckCircle2 className="h-2.5 w-2.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
}

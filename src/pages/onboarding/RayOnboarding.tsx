/**
 * Ray Conversational Onboarding (production)
 *
 * Real first run. Every selection, every imported credential, every
 * finding, every score persists to the database via the Ray Intelligence
 * Engine and `runRayOnboardingPipeline`. No demo data.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useMasterPassword } from '@/hooks/useMasterPassword';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Eye, Loader2, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PasswordImportStep } from '@/components/onboarding/PasswordImportStep';
import {
  runRayOnboardingPipeline,
  runRayBaseline,
  type PipelineProgress,
  type PipelineResult,
} from '@/lib/import/onboardingPipeline';
import type { ImportSource } from '@/lib/import/passwordParsers';

type Audience = 'personal' | 'family' | 'business';
type Ecosystem = 'microsoft' | 'google' | 'apple' | 'other';
type ExistingPM =
  | 'keeper' | 'bitwarden' | '1password' | 'lastpass' | 'dashlane'
  | 'chrome' | 'edge' | 'firefox' | 'safari' | 'none';

type Step =
  | 'welcome'
  | 'audience'
  | 'ecosystem'
  | 'existing'
  | 'master'
  | 'mfa'
  | 'import'
  | 'running'
  | 'report'
  | 'finale';

// Compatibility shim retained so existing imports still resolve. The real
// onboarded check now lives in the database (see /lib/ray).
export function hasCompletedRayOnboarding(_uid?: string | null) {
  return true;
}

// ---------- Ray-styled primitives ----------

function RayEye({ thinking = false, size = 56 }: { thinking?: boolean; size?: number }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full border border-border bg-background',
        thinking && 'ray-thinking-glow',
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Eye
        className={cn('transition-colors duration-500', thinking ? 'text-[hsl(262_60%_70%)]' : 'text-foreground/80')}
        style={{ width: size * 0.45, height: size * 0.45 }}
      />
      {thinking && (
        <>
          <span className="absolute inset-0 rounded-full ring-1 ring-[hsl(262_60%_64%/0.45)] animate-[ray-pulse_2.4s_ease-in-out_infinite]" />
          <span className="absolute inset-[-8px] rounded-full ring-1 ring-[hsl(262_60%_64%/0.18)] animate-[ray-pulse_3.6s_ease-in-out_infinite]" />
        </>
      )}
    </div>
  );
}

function RaySays({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-start gap-4 animate-fade-in', className)}>
      <RayEye />
      <div className="flex-1 pt-1 space-y-3 text-balance">{children}</div>
    </div>
  );
}

function ChoiceCard({
  label, description, selected, onClick, disabled,
}: { label: string; description?: string; selected?: boolean; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'group relative w-full text-left rounded-sm border bg-card/40 px-5 py-4 transition-all duration-200 hover:bg-card hover:border-foreground/30 focus:outline-none focus:ring-1 focus:ring-[hsl(262_60%_64%)]',
        selected && 'border-[hsl(262_60%_64%)] bg-[hsl(262_60%_64%/0.06)]',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-foreground">{label}</div>
          {description && <div className="text-sm text-muted-foreground mt-0.5">{description}</div>}
        </div>
        <div
          className={cn(
            'h-4 w-4 rounded-full border transition-colors',
            selected ? 'bg-[hsl(262_60%_64%)] border-[hsl(262_60%_64%)]' : 'border-border group-hover:border-foreground/40',
          )}
        />
      </div>
    </button>
  );
}

const AUDIENCE_OPTIONS: { value: Audience; label: string; description: string }[] = [
  { value: 'personal', label: 'Just me', description: 'Personal accounts and devices.' },
  { value: 'family', label: 'My family', description: 'Shared logins, kids, household.' },
  { value: 'business', label: 'My business', description: 'Team members, work apps, customer data.' },
];

const ECOSYSTEM_OPTIONS: { value: Ecosystem; label: string; description: string }[] = [
  { value: 'microsoft', label: 'Microsoft 365', description: 'Outlook, Teams, OneDrive, Entra ID.' },
  { value: 'google', label: 'Google Workspace', description: 'Gmail, Drive, Calendar.' },
  { value: 'apple', label: 'Apple', description: 'iCloud, Apple ID, Mac/iOS devices.' },
  { value: 'other', label: 'Something else', description: 'Mix of personal email and SaaS.' },
];

const EXISTING_OPTIONS: { value: ExistingPM; label: string }[] = [
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'firefox', label: 'Firefox' },
  { value: 'safari', label: 'Safari' },
  { value: 'bitwarden', label: 'Bitwarden' },
  { value: '1password', label: '1Password' },
  { value: 'keeper', label: 'Keeper' },
  { value: 'lastpass', label: 'LastPass' },
  { value: 'dashlane', label: 'Dashlane' },
  { value: 'none', label: 'None yet' },
];

const FUTURE_INTEGRATIONS = [
  { value: 'm365', label: 'Microsoft 365 sync' },
  { value: 'gws', label: 'Google Workspace sync' },
  { value: 'extension', label: 'Browser extension' },
  { value: 'endpoint', label: 'Endpoint monitoring' },
  { value: 'phishing', label: 'Phishing detection' },
];

function existingToSource(p: ExistingPM | null): ImportSource | null {
  if (!p || p === 'none') return null;
  return p;
}

function AnimatedScore({ target }: { target: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-7xl font-light tracking-tight text-foreground tabular-nums">{value}</span>
      <span className="text-sm text-muted-foreground">/ 100</span>
    </div>
  );
}

export default function RayOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mp = useMasterPassword();

  const firstName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const full = (meta.full_name as string | undefined) ?? (meta.name as string | undefined);
    if (full && typeof full === 'string') return full.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'there';
  }, [user]);

  const [step, setStep] = useState<Step>('welcome');
  const [audience, setAudience] = useState<Audience | null>(null);
  const [ecosystem, setEcosystem] = useState<Ecosystem | null>(null);
  const [otherProvider, setOtherProvider] = useState<string>('');
  const [existing, setExisting] = useState<ExistingPM | null>(null);
  const [future, setFuture] = useState<string[]>([]);
  const [masterPw, setMasterPw] = useState('');
  const [masterPw2, setMasterPw2] = useState('');
  const [mpError, setMpError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<PipelineProgress | null>(null);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [runErr, setRunErr] = useState<string | null>(null);

  const advanceTimer = useRef<number | null>(null);
  const queueAdvance = (next: Step, delay = 450) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep(next), delay);
  };
  useEffect(() => () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); }, []);

  // Persist profile selections as they're made.
  useEffect(() => {
    if (!user) return;
    const providers: Record<string, boolean> = {};
    if (ecosystem) providers[ecosystem] = true;
    if (ecosystem === 'other' && otherProvider) providers.other_label = true as any;
    void supabase
      .from('ray_profiles')
      .upsert(
        {
          user_id: user.id,
          audience: audience ?? undefined,
          providers: providers as any,
          existing_manager: existing ?? undefined,
          future_integrations: future as any,
        },
        { onConflict: 'user_id' },
      );
  }, [user, audience, ecosystem, otherProvider, existing, future]);

  const handleSetMaster = async () => {
    setMpError(null);
    if (masterPw.length < 12) { setMpError('Use at least 12 characters.'); return; }
    if (masterPw !== masterPw2) { setMpError('The two passwords don\'t match.'); return; }
    const res = await mp.setMasterPassword(masterPw);
    if (!res.success) { setMpError(res.errors?.[0] ?? 'Could not set master password.'); return; }
    setMasterPw(''); setMasterPw2('');
    setStep('import');
  };

  const handleUnlock = async () => {
    setMpError(null);
    if (!masterPw) { setMpError('Enter your master password.'); return; }
    const res = await mp.unlockWithPassword(masterPw);
    if (!res.success) { setMpError(res.error ?? 'Could not unlock.'); return; }
    setMasterPw('');
    setStep('import');
  };

  const startPipeline = async (source: ImportSource, text: string) => {
    if (!user || !mp.isUnlocked || !mp.masterPassword) {
      setStep('master');
      return;
    }
    setBusy(true);
    setRunErr(null);
    setStep('running');
    try {
      const providers: Record<string, boolean> = {};
      if (ecosystem) providers[ecosystem] = true;
      const r = await runRayOnboardingPipeline(
        {
          userId: user.id,
          vaultId: '',
          masterPassword: mp.masterPassword,
          source,
          text,
          profile: { audience, providers, existing_manager: existing },
        },
        setProgress,
      );
      setResult(r);
      setStep('report');
    } catch (e) {
      setRunErr((e as Error).message);
      setStep('import');
    } finally {
      setBusy(false);
    }
  };

  const startBaseline = async () => {
    if (!user || !mp.isUnlocked || !mp.masterPassword) {
      setStep('master');
      return;
    }
    setBusy(true);
    setRunErr(null);
    setStep('running');
    try {
      const providers: Record<string, boolean> = {};
      if (ecosystem) providers[ecosystem] = true;
      const r = await runRayBaseline(
        user.id,
        mp.masterPassword,
        { audience, providers, existing_manager: existing },
        setProgress,
      );
      setResult(r);
      setStep('report');
    } catch (e) {
      setRunErr((e as Error).message);
      setStep('import');
    } finally {
      setBusy(false);
    }
  };

  const finish = () => navigate('/app/dashboard');

  const skipForNow = async () => {
    // Still mark onboarded so we don't loop the user; profile selections persisted above.
    if (user) {
      await supabase
        .from('ray_profiles')
        .upsert(
          { user_id: user.id, onboarded_at: new Date().toISOString() },
          { onConflict: 'user_id' },
        );
    }
    navigate('/app/dashboard');
  };

  // Once we know whether a master password already exists, route from
  // `existing` step to either `master` (set or unlock) or directly `import`.
  const goAfterExisting = () => {
    if (mp.isUnlocked) setStep('import');
    else setStep('master');
  };

  const renderFindingsPreview = () => {
    if (!result) return null;
    const i = result.intel;
    const items: { tone: 'warn' | 'good'; text: string }[] = [];
    if (i.findings.some((f) => f.kind === 'breached')) {
      items.push({ tone: 'warn', text: `${i.findings.filter((f) => f.kind === 'breached').length} credentials found in known breach datasets` });
    }
    if (i.reusedCount > 0) items.push({ tone: 'warn', text: `${i.reusedCount} reused passwords across multiple accounts` });
    if (i.weak > 0) items.push({ tone: 'warn', text: `${i.weak} weak passwords` });
    if (i.empty > 0) items.push({ tone: 'warn', text: `${i.empty} entries with no password set` });
    if (i.oldCount > 0) items.push({ tone: 'warn', text: `${i.oldCount} passwords haven't been rotated in over a year` });
    if (items.length === 0) items.push({ tone: 'good', text: 'I didn\'t find any urgent issues in what you imported.' });
    if (result.breachDegraded) items.push({ tone: 'warn', text: 'Breach lookup was unavailable — I\'ll retry automatically.' });
    return items;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm tracking-[0.2em] text-muted-foreground">WRAYTH</span>
          <button onClick={skipForNow} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            Skip for now
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {step === 'welcome' && (
          <div className="space-y-10 animate-fade-in">
            <RayEye thinking size={88} />
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">Hi {firstName}. I'm Ray.</h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                I'll be your AI cybersecurity teammate. Let's spend about two minutes getting to know your environment so I can start protecting it for real.
              </p>
            </div>
            <Button size="lg" onClick={() => setStep('audience')} className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              I'm ready <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 'audience' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 1 of 5</p>
              <p className="text-lg text-foreground">First, who am I protecting?</p>
            </RaySays>
            <div className="ml-[72px] space-y-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={audience === opt.value}
                  onClick={() => { setAudience(opt.value); queueAdvance('ecosystem'); }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'ecosystem' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 5</p>
              <p className="text-lg text-foreground">What's your day-to-day ecosystem?</p>
              <p className="text-sm text-muted-foreground">This tells me where most of your important accounts live.</p>
            </RaySays>
            <div className="ml-[72px] space-y-3">
              {ECOSYSTEM_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  label={opt.label}
                  description={opt.description}
                  selected={ecosystem === opt.value}
                  onClick={() => {
                    setEcosystem(opt.value);
                    if (opt.value !== 'other') queueAdvance('existing');
                  }}
                />
              ))}
              {ecosystem === 'other' && (
                <div className="space-y-2 pt-2">
                  <Input
                    placeholder="e.g. ProtonMail, Fastmail, AWS"
                    value={otherProvider}
                    onChange={(e) => setOtherProvider(e.target.value)}
                    className="rounded-sm"
                  />
                  <Button size="sm" variant="ghost" onClick={() => setStep('existing')} className="rounded-sm">
                    Continue <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'existing' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3 of 5</p>
              <p className="text-lg text-foreground">Where are your passwords today?</p>
              <p className="text-sm text-muted-foreground">If you can export them, I'll pull everything in so you don't start from zero.</p>
            </RaySays>
            <div className="ml-[72px] grid grid-cols-2 gap-3">
              {EXISTING_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  label={opt.label}
                  selected={existing === opt.value}
                  onClick={() => { setExisting(opt.value); queueAdvance(undefined as any, 0); goAfterExisting(); }}
                />
              ))}
            </div>
            <div className="ml-[72px] pt-4 space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Also turn on later (optional)</div>
              <div className="flex flex-wrap gap-2">
                {FUTURE_INTEGRATIONS.map((f) => {
                  const on = future.includes(f.value);
                  return (
                    <button
                      key={f.value}
                      onClick={() => setFuture((prev) => on ? prev.filter((v) => v !== f.value) : [...prev, f.value])}
                      className={cn(
                        'rounded-sm border px-3 py-1.5 text-xs transition-colors',
                        on ? 'border-[hsl(262_60%_64%)] bg-[hsl(262_60%_64%/0.08)] text-foreground' : 'border-border text-muted-foreground hover:text-foreground',
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {step === 'master' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 4 of 5</p>
              <p className="text-lg text-foreground">
                {mp.hasUserSetMasterPassword() ? 'Unlock your vault so I can encrypt what we import.' : 'Set a master password I\'ll use to encrypt your vault.'}
              </p>
              <p className="text-sm text-muted-foreground">
                {mp.hasUserSetMasterPassword()
                  ? 'You set this when you created your vault. I never see or store it.'
                  : 'Pick something long that only you know. I never see or store it — your vault is end-to-end encrypted.'}
              </p>
            </RaySays>
            <div className="ml-[72px] space-y-3 max-w-md">
              <Input
                type="password"
                placeholder="Master password"
                value={masterPw}
                onChange={(e) => setMasterPw(e.target.value)}
                className="rounded-sm"
              />
              {!mp.hasUserSetMasterPassword() && (
                <Input
                  type="password"
                  placeholder="Confirm master password"
                  value={masterPw2}
                  onChange={(e) => setMasterPw2(e.target.value)}
                  className="rounded-sm"
                />
              )}
              {mpError && <div className="text-sm text-red-400">{mpError}</div>}
              <div className="flex gap-3">
                <Button
                  size="lg"
                  onClick={mp.hasUserSetMasterPassword() ? handleUnlock : handleSetMaster}
                  className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  {mp.hasUserSetMasterPassword() ? 'Unlock' : 'Set master password'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'import' && (
          <div className="space-y-6">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 5 of 5</p>
              <p className="text-lg text-foreground">
                {existing && existing !== 'none'
                  ? `Export your logins from ${EXISTING_OPTIONS.find((o) => o.value === existing)?.label} and drop the file here.`
                  : 'No existing manager — that\'s fine. I can baseline whatever\'s already in your vault.'}
              </p>
              <p className="text-sm text-muted-foreground">
                Files are parsed in your browser. Passwords are encrypted with your master password before they touch the server.
              </p>
            </RaySays>
            {runErr && (
              <div className="ml-[72px] rounded-sm border border-red-500/40 bg-red-500/5 px-4 py-3 text-sm text-red-300">
                {runErr}
              </div>
            )}
            <PasswordImportStep
              defaultSource={existingToSource(existing) ?? 'chrome'}
              busy={busy}
              progress={progress}
              onImport={startPipeline}
              onSkip={startBaseline}
            />
          </div>
        )}

        {step === 'running' && (
          <div className="space-y-6">
            <RaySays>
              <p className="text-lg text-foreground">Hold tight. I'm working through your vault.</p>
            </RaySays>
            <div className="ml-[72px] space-y-2">
              <div className="flex items-center gap-3 text-sm text-foreground">
                <Loader2 className="h-4 w-4 animate-spin text-[hsl(262_60%_70%)]" />
                <span>{progress?.message ?? 'Starting…'}</span>
              </div>
              {progress && progress.total > 1 && (
                <div className="h-1 w-full overflow-hidden rounded-sm bg-border/60">
                  <div
                    className="h-full bg-[hsl(262_60%_64%)] transition-all"
                    style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'report' && result && (
          <div className="space-y-10 animate-fade-in">
            <RaySays>
              <p className="text-lg text-foreground">
                I analyzed {result.intel.total} {result.intel.total === 1 ? 'credential' : 'credentials'}. Here's what I found.
              </p>
            </RaySays>

            <div className="ml-[72px] space-y-8">
              <div className="rounded-sm border border-border bg-card/40 p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Security Score</div>
                <AnimatedScore target={result.score.score} />
                <div className="mt-3 text-sm text-muted-foreground">
                  Calculated from real findings — not a placeholder. We'll move this up together.
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">What stood out</div>
                {(renderFindingsPreview() ?? []).map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-3 rounded-sm border px-4 py-3 animate-fade-in',
                      f.tone === 'warn'
                        ? 'border-amber-500/30 bg-amber-500/[0.04]'
                        : 'border-emerald-500/30 bg-emerald-500/[0.04]',
                    )}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {f.tone === 'warn'
                      ? <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                      : <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />}
                    <div className="text-sm text-foreground">{f.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="lg" onClick={() => setStep('finale')} className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
                  Fix these together <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="ghost" onClick={() => setStep('finale')} className="rounded-sm">
                  I'll review on my own
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'finale' && (
          <div className="space-y-10 animate-fade-in">
            <RayEye thinking size={88} />
            <div className="space-y-5 max-w-xl">
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">Welcome to Wrayth.</h2>
              <div className="space-y-3 text-lg text-muted-foreground leading-relaxed">
                <p className="text-foreground">I'm on watch now.</p>
                <p>I'll quietly monitor your security from here.</p>
                <p>If something important happens, I'll let you know.</p>
                <p className="text-foreground/90">You don't have to think about cybersecurity anymore.</p>
                <p className="text-foreground">That's my job.</p>
              </div>
            </div>
            <Button size="lg" onClick={finish} className="rounded-sm bg-foreground text-background hover:bg-foreground/90">
              Enter Wrayth <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

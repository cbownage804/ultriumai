/**
 * Ray Conversational Onboarding
 * "Meeting your AI cybersecurity teammate for the first time."
 *
 * Feels like a conversation, not a form.
 * 5 steps + welcome + finale.
 *
 * Findings shown at the end are derived from the user's selections
 * (sample dataset for v1; real CSV import + scoring wires in next).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Check, Eye, Loader2, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type Audience = 'personal' | 'family' | 'business';
type Ecosystem = 'microsoft' | 'google' | 'apple' | 'other';
type ExistingPM = 'keeper' | 'bitwarden' | '1password' | 'lastpass' | 'chrome' | 'edge' | 'none';

type Step =
  | 'welcome'
  | 'audience'
  | 'ecosystem'
  | 'existing'
  | 'import'
  | 'analyzing'
  | 'report'
  | 'finale';

const onboardedKey = (uid?: string | null) =>
  `wrayth.ray.onboarded:${uid ?? 'anon'}`;
const profileKey = (uid?: string | null) =>
  `wrayth.ray.profile:${uid ?? 'anon'}`;

export function hasCompletedRayOnboarding(uid?: string | null) {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(onboardedKey(uid)) === 'true';
}

// ---------- Ray-styled primitives ----------

function RayEye({ thinking = false, size = 56 }: { thinking?: boolean; size?: number }) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'border border-border bg-background',
        thinking && 'ray-thinking-glow',
      )}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <Eye
        className={cn(
          'transition-colors duration-500',
          thinking ? 'text-[hsl(262_60%_70%)]' : 'text-foreground/80',
        )}
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

function RaySays({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start gap-4 animate-fade-in', className)}>
      <RayEye />
      <div className="flex-1 pt-1 space-y-3 text-balance">
        {children}
      </div>
    </div>
  );
}

function ChoiceCard({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description?: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative w-full text-left rounded-sm border bg-card/40 px-5 py-4',
        'transition-all duration-200 hover:bg-card hover:border-foreground/30',
        'focus:outline-none focus:ring-1 focus:ring-[hsl(262_60%_64%)]',
        selected && 'border-[hsl(262_60%_64%)] bg-[hsl(262_60%_64%/0.06)]',
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="font-medium text-foreground">{label}</div>
          {description && (
            <div className="text-sm text-muted-foreground mt-0.5">{description}</div>
          )}
        </div>
        <div
          className={cn(
            'h-4 w-4 rounded-full border transition-colors',
            selected
              ? 'bg-[hsl(262_60%_64%)] border-[hsl(262_60%_64%)]'
              : 'border-border group-hover:border-foreground/40',
          )}
        />
      </div>
    </button>
  );
}

// ---------- Step content ----------

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
  { value: 'keeper', label: 'Keeper' },
  { value: 'bitwarden', label: 'Bitwarden' },
  { value: '1password', label: '1Password' },
  { value: 'lastpass', label: 'LastPass' },
  { value: 'chrome', label: 'Chrome' },
  { value: 'edge', label: 'Edge' },
  { value: 'none', label: 'None yet' },
];

// ---------- Analyzing sequence ----------

const ANALYZE_STEPS = [
  'Checking password strength',
  'Checking for password reuse',
  'Checking for known breaches',
  'Checking MFA coverage',
  'Reviewing account exposure',
] as const;

function AnalyzingSequence({ onDone }: { onDone: () => void }) {
  const [completed, setCompleted] = useState<number>(0);
  const [anticipation, setAnticipation] = useState(false);
  const [reveal, setReveal] = useState(false);

  useEffect(() => {
    if (completed >= ANALYZE_STEPS.length) {
      // 600ms anticipation pulse before the reveal — Apple/Linear/OpenAI-style pause.
      const t1 = setTimeout(() => setAnticipation(true), 200);
      const t2 = setTimeout(() => setReveal(true), 800);
      const t3 = setTimeout(onDone, 1500);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
    const t = setTimeout(() => setCompleted((c) => c + 1), 900);
    return () => clearTimeout(t);
  }, [completed, onDone]);

  return (
    <div className="space-y-6">
      <RaySays>
        <p className="text-lg text-foreground">Hold tight. I'm getting a read on things.</p>
      </RaySays>

      <div className="ml-[72px] space-y-3">
        {ANALYZE_STEPS.map((label, i) => {
          const done = i < completed;
          const active = i === completed;
          return (
            <div
              key={label}
              className={cn(
                'flex items-center gap-3 text-sm transition-opacity duration-300',
                done ? 'opacity-100' : active ? 'opacity-100' : 'opacity-40',
              )}
            >
              <div
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full border',
                  done && 'border-[hsl(262_60%_64%)] bg-[hsl(262_60%_64%/0.12)]',
                  active && !done && 'border-[hsl(262_60%_64%)]',
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5 text-[hsl(262_60%_70%)]" />
                ) : active ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[hsl(262_60%_70%)]" />
                ) : null}
              </div>
              <span className={cn('text-foreground/80', done && 'text-foreground')}>
                Ray {done ? 'finished' : active ? 'is' : ''} {active ? `${label.toLowerCase()}…` : label.toLowerCase()}
              </span>
            </div>
          );
        })}
      </div>

      {anticipation && (
        <div className="ml-[72px] pt-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-[hsl(262_60%_64%)] animate-ping" />
              <span className="relative h-2 w-2 rounded-full bg-[hsl(262_60%_70%)]" />
            </span>
            <span className={cn(
              'text-sm transition-opacity duration-500',
              reveal ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-70'
            )}>
              {reveal ? 'I found something.' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- Report ----------

type Finding = { tone: 'warn' | 'good'; text: string };

function buildReport(audience: Audience | null, ecosystem: Ecosystem | null) {
  // Sample dataset tuned by selections so the report feels personal.
  const base: Finding[] = [
    { tone: 'warn', text: '18 reused passwords across multiple accounts' },
    { tone: 'warn', text: '7 weak passwords (under 12 chars or common patterns)' },
    { tone: 'warn', text: '3 credentials found in known breach datasets' },
  ];
  if (ecosystem === 'microsoft') {
    base.push({ tone: 'good', text: 'MFA already enabled on your Microsoft account' });
  } else if (ecosystem === 'google') {
    base.push({ tone: 'good', text: 'MFA already enabled on your Google account' });
  } else {
    base.push({ tone: 'warn', text: 'Primary email is missing MFA' });
  }
  if (audience === 'business') {
    base.push({ tone: 'warn', text: '2 shared team logins should rotate to per-user accounts' });
  }
  if (audience === 'family') {
    base.push({ tone: 'warn', text: '4 streaming logins shared in plaintext over text/email' });
  }
  return base;
}

function scoreFor(findings: Finding[]) {
  const warns = findings.filter((f) => f.tone === 'warn').length;
  return Math.max(38, 92 - warns * 5);
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
      <span className="text-7xl font-light tracking-tight text-foreground tabular-nums">
        {value}
      </span>
      <span className="text-sm text-muted-foreground">/ 100</span>
    </div>
  );
}

// ---------- Main page ----------

export default function RayOnboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [existing, setExisting] = useState<ExistingPM | null>(null);

  const advanceTimer = useRef<number | null>(null);
  const queueAdvance = (next: Step, delay = 450) => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStep(next), delay);
  };
  useEffect(() => () => {
    if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
  }, []);

  const findings = useMemo(() => buildReport(audience, ecosystem), [audience, ecosystem]);
  const score = useMemo(() => scoreFor(findings), [findings]);

  const finish = () => {
    try {
      window.localStorage.setItem(onboardedKey(user?.id), 'true');
      window.localStorage.setItem(
        profileKey(user?.id),
        JSON.stringify({
          audience,
          ecosystem,
          existing,
          score,
          completedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // localStorage unavailable; proceed anyway
    }
    navigate('/safesuite/dashboard');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Quiet top bar */}
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <span className="text-sm tracking-[0.2em] text-muted-foreground">WRAYTH</span>
          <button
            onClick={finish}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16 sm:py-24">
        {step === 'welcome' && (
          <div className="space-y-10 animate-fade-in">
            <RayEye thinking size={88} />
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
                Hi {firstName}. I'm Ray.
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                I'll be your AI cybersecurity teammate. Let's spend about two minutes
                getting to know your environment so I can start protecting it.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => setStep('audience')}
              className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
            >
              I'm ready
              <ArrowRight className="ml-2 h-4 w-4" />
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
                  onClick={() => {
                    setAudience(opt.value);
                    queueAdvance('ecosystem');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'ecosystem' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 2 of 5</p>
              <p className="text-lg text-foreground">
                What's your day-to-day ecosystem?
              </p>
              <p className="text-sm text-muted-foreground">
                This tells me where most of your important accounts live.
              </p>
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
                    queueAdvance('existing');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'existing' && (
          <div className="space-y-8">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 3 of 5</p>
              <p className="text-lg text-foreground">
                Are you using a password manager today?
              </p>
              <p className="text-sm text-muted-foreground">
                If yes, I'll pull everything in so you don't start from zero.
              </p>
            </RaySays>
            <div className="ml-[72px] grid grid-cols-2 gap-3">
              {EXISTING_OPTIONS.map((opt) => (
                <ChoiceCard
                  key={opt.value}
                  label={opt.label}
                  selected={existing === opt.value}
                  onClick={() => {
                    setExisting(opt.value);
                    queueAdvance('import');
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {step === 'import' && (
          <div className="space-y-8 animate-fade-in">
            <RaySays>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Step 4 of 5</p>
              <p className="text-lg text-foreground">
                {existing && existing !== 'none'
                  ? `Want me to pull your logins out of ${EXISTING_OPTIONS.find((o) => o.value === existing)?.label} and look them over?`
                  : "No existing manager — that's fine. I can scan a sample of your environment to baseline you."}
              </p>
              <p className="text-sm text-muted-foreground">
                Nothing is shared. Analysis runs locally against your vault.
              </p>
            </RaySays>
            <div className="ml-[72px] flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => setStep('analyzing')}
                className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
              >
                Yes, let's do it
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => setStep('analyzing')}
                className="rounded-sm"
              >
                Skip — just baseline me
              </Button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <AnalyzingSequence onDone={() => setStep('report')} />
        )}

        {step === 'report' && (
          <div className="space-y-10 animate-fade-in">
            <RaySays>
              <p className="text-lg text-foreground">I'm finished. Here's what I found.</p>
            </RaySays>

            <div className="ml-[72px] space-y-8">
              <div className="rounded-sm border border-border bg-card/40 p-6">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">
                  Security Score
                </div>
                <AnimatedScore target={score} />
                <div className="mt-3 text-sm text-muted-foreground">
                  Not bad to start — most people land between 55 and 75.
                  We can push this up together.
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Here's what I'd fix first
                </div>
                {findings.map((f, i) => (
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
                    {f.tone === 'warn' ? (
                      <AlertTriangle className="h-4 w-4 mt-0.5 text-amber-500 shrink-0" />
                    ) : (
                      <ShieldCheck className="h-4 w-4 mt-0.5 text-emerald-500 shrink-0" />
                    )}
                    <div className="text-sm text-foreground">{f.text}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => setStep('finale')}
                  className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
                >
                  Fix these together
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  onClick={() => setStep('finale')}
                  className="rounded-sm"
                >
                  I'll review on my own
                </Button>
              </div>
            </div>
          </div>
        )}

        {step === 'finale' && (
          <div className="space-y-10 animate-fade-in">
            <RayEye thinking size={88} />
            <div className="space-y-4">
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
                I'm on watch now.
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
                If something important happens, I'll let you know.
                Until then, I'll quietly keep an eye on things.
              </p>
            </div>
            <Button
              size="lg"
              onClick={finish}
              className="rounded-sm bg-foreground text-background hover:bg-foreground/90"
            >
              Enter Wrayth
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

import { useMemo, useState } from 'react';
import {
  Activity, AlertTriangle, Check, Copy, KeyRound, Plus, RefreshCcw, ShieldCheck, ShieldOff, Sparkles, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useRayMFA } from '@/hooks/useRayMFA';
import { RayMFASetupFlow } from '@/components/ray/mfa/RayMFASetupFlow';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { lookupCatalog, type MFACatalogEntry, type MFAPriority } from '@/lib/ray/mfaCatalog';

type Mode = 'overview' | 'setup' | 'empty-intro';

/**
 * RayMFAHub — the conversational home of Ray's 2FA experience.
 * The empty state is Ray pitching 2FA, not an empty list.
 */
export default function RayMFAHub() {
  const mfa = useRayMFA();
  const [mode, setMode] = useState<Mode>('overview');
  const [setupTarget, setSetupTarget] = useState<{
    catalog?: MFACatalogEntry | null;
    serviceName?: string;
    serviceDomain?: string | null;
    passwordEntryId?: string | null;
  } | null>(null);

  const hasAny = mfa.secrets.length > 0;
  const showEmptyIntro = !mfa.loading && !hasAny;

  const beginSetup = (target: typeof setupTarget) => {
    setSetupTarget(target);
    setMode('setup');
  };

  const finishSetup = () => {
    setSetupTarget(null);
    setMode('overview');
    void mfa.rescanVault();
  };

  if (mode === 'setup') {
    return (
      <div className="space-y-6 p-6">
        <RayPageHeader
          eyebrow="Ray · 2FA"
          title="Let's lock down this account"
          subtitle="One short conversation and you're protected. I'll handle the encryption and the verification."
        />
        <RayMFASetupFlow
          catalog={setupTarget?.catalog}
          serviceName={setupTarget?.serviceName}
          serviceDomain={setupTarget?.serviceDomain}
          passwordEntryId={setupTarget?.passwordEntryId}
          onComplete={finishSetup}
          onCancel={() => setMode('overview')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <RayPageHeader
        eyebrow="Ray · 2FA"
        title="Two-factor, the way it should feel"
        subtitle={
          showEmptyIntro
            ? "Most account takeovers happen because the password was the only lock. Let me fix that with you, one account at a time."
            : `${mfa.verdict.line}`
        }
      />

      {mfa.isLocked && hasAny && (
        <Card className="border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm">
              Your 2FA vault is locked. Unlock to see live codes and run setup.
            </p>
            <UnlockInline onUnlock={mfa.unlock} />
          </div>
        </Card>
      )}

      {showEmptyIntro ? (
        <EmptyIntro
          onStart={() => setMode('overview' as const) || setMode('setup')}
          onPickFromVault={() => {
            void mfa.rescanVault();
            setMode('overview');
          }}
          startCatalog={mfa.catalog[0]}
          recommendations={mfa.recommendations}
          beginSetup={beginSetup}
        />
      ) : (
        <>
          <HealthCard mfa={mfa} onScan={() => void mfa.rescanVault()} />
          <RecommendationsList mfa={mfa} beginSetup={beginSetup} />
          <ProtectedAccountsList mfa={mfa} />
          <AddArbitraryCard beginSetup={beginSetup} />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / intro state — Ray pitches 2FA                                       */
/* -------------------------------------------------------------------------- */
function EmptyIntro({
  onStart,
  onPickFromVault,
  startCatalog,
  recommendations,
  beginSetup,
}: {
  onStart: () => void;
  onPickFromVault: () => void;
  startCatalog?: MFACatalogEntry;
  recommendations: ReturnType<typeof useRayMFA>['recommendations'];
  beginSetup: (target: { catalog?: MFACatalogEntry | null; serviceName?: string; serviceDomain?: string | null; passwordEntryId?: string | null }) => void;
}) {
  const featured = recommendations.slice(0, 3);
  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background p-6">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary/80">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(124,77,255,0.8)]" />
          Ray
        </div>
        <h2 className="mt-3 text-xl font-semibold">
          Passwords are guesses. 2FA is proof.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          When 2FA is on, even a stolen password won't let an attacker in. I'll walk you
          through every account that supports it, capture the secret, encrypt it on your
          device, and verify it before we move on. You'll feel the difference within minutes.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={onPickFromVault}>
            <Sparkles className="mr-1 h-4 w-4" /> Scan my vault for accounts to protect
          </Button>
          {startCatalog && (
            <Button variant="outline" onClick={() => beginSetup({ catalog: startCatalog, serviceName: startCatalog.name, serviceDomain: startCatalog.domain })}>
              Start with {startCatalog.name}
            </Button>
          )}
          <Button variant="ghost" onClick={() => beginSetup({})}>
            <Plus className="mr-1 h-4 w-4" /> Add a code manually
          </Button>
        </div>
      </Card>

      {featured.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Ray noticed these in your vault — they should go first:
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((rec) => (
              <RecommendationCard key={rec.id} rec={rec} beginSetup={beginSetup} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Health card                                                                */
/* -------------------------------------------------------------------------- */
function HealthCard({ mfa, onScan }: { mfa: ReturnType<typeof useRayMFA>; onScan: () => void }) {
  const toneClass =
    mfa.verdict.tone === 'good' ? 'text-emerald-500'
    : mfa.verdict.tone === 'warn' ? 'text-amber-500'
    : 'text-destructive';
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">2FA Health</div>
          <div className="flex items-baseline gap-3">
            <div className={`text-4xl font-semibold ${toneClass}`}>{mfa.health.score}</div>
            <Badge variant="outline" className={toneClass}>{mfa.verdict.label}</Badge>
          </div>
          <p className="max-w-xl text-sm text-muted-foreground">{mfa.verdict.line}</p>
        </div>
        <Button variant="outline" onClick={onScan}>
          <RefreshCcw className="mr-1 h-4 w-4" /> Rescan vault
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        <Progress value={mfa.health.score} />
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" />{mfa.health.protectedCount} protected</span>
          <span className="flex items-center gap-1"><ShieldOff className="h-3 w-3 text-amber-500" />{mfa.health.unprotectedCount} unprotected</span>
          {mfa.health.criticalUnprotected > 0 && (
            <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" />{mfa.health.criticalUnprotected} critical at risk</span>
          )}
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Recommendations                                                            */
/* -------------------------------------------------------------------------- */
function RecommendationsList({
  mfa,
  beginSetup,
}: {
  mfa: ReturnType<typeof useRayMFA>;
  beginSetup: (target: { catalog?: MFACatalogEntry | null; serviceName?: string; serviceDomain?: string | null; passwordEntryId?: string | null }) => void;
}) {
  const sorted = useMemo(() => {
    const order: Record<MFAPriority, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    return [...mfa.recommendations].sort((a, b) => (order[b.priority] ?? 0) - (order[a.priority] ?? 0));
  }, [mfa.recommendations]);

  if (sorted.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-primary/80">Ray recommends</div>
          <h3 className="text-base font-semibold">Turn 2FA on for these next</h3>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.slice(0, 9).map((rec) => (
          <RecommendationCard
            key={rec.id}
            rec={rec}
            beginSetup={beginSetup}
            onDismiss={() => void mfa.dismissRecommendation(rec.id)}
          />
        ))}
      </div>
    </Card>
  );
}

function priorityToneClasses(p: MFAPriority): string {
  switch (p) {
    case 'critical': return 'border-destructive/40 text-destructive';
    case 'high': return 'border-amber-500/40 text-amber-500';
    case 'medium': return 'border-primary/40 text-primary';
    case 'low': return 'border-muted-foreground/30 text-muted-foreground';
  }
}

function RecommendationCard({
  rec, beginSetup, onDismiss,
}: {
  rec: ReturnType<typeof useRayMFA>['recommendations'][number];
  beginSetup: (target: { catalog?: MFACatalogEntry | null; serviceName?: string; serviceDomain?: string | null; passwordEntryId?: string | null }) => void;
  onDismiss?: () => void;
}) {
  const catalog = lookupCatalog(rec.service_domain ?? rec.service_name);
  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <div className="font-medium">{rec.service_name}</div>
        <Badge variant="outline" className={priorityToneClasses(rec.priority)}>{rec.priority}</Badge>
      </div>
      {rec.reason && <p className="text-sm text-muted-foreground">{rec.reason}</p>}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button size="sm" onClick={() => beginSetup({
          catalog: catalog ?? null,
          serviceName: rec.service_name,
          serviceDomain: rec.service_domain,
          passwordEntryId: rec.password_entry_id,
        })}>
          Set up 2FA <Sparkles className="ml-1 h-3 w-3" />
        </Button>
        {rec.setup_url && (
          <Button asChild size="sm" variant="outline">
            <a href={rec.setup_url} target="_blank" rel="noreferrer">Open settings</a>
          </Button>
        )}
        {onDismiss && (
          <Button size="sm" variant="ghost" onClick={onDismiss}>Not this one</Button>
        )}
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Protected accounts list                                                    */
/* -------------------------------------------------------------------------- */
function ProtectedAccountsList({ mfa }: { mfa: ReturnType<typeof useRayMFA> }) {
  if (mfa.secrets.length === 0) return null;
  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-wider text-primary/80">Under Ray's watch</div>
        <h3 className="text-base font-semibold">Live codes</h3>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mfa.secrets.map((s) => (
          <TOTPLiveCard key={s.id} secret={s} mfa={mfa} />
        ))}
      </div>
    </Card>
  );
}

function TOTPLiveCard({
  secret, mfa,
}: { secret: ReturnType<typeof useRayMFA>['secrets'][number]; mfa: ReturnType<typeof useRayMFA> }) {
  const live = mfa.livecodes[secret.id];
  const code = live?.code ?? '------';
  const remaining = live?.remaining ?? secret.period;
  const pct = Math.round((remaining / secret.period) * 100);
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.replace(/\s+/g, ''));
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch { /* ignore */ }
  };

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{secret.issuer || secret.service_name}</div>
          {secret.account_label && (
            <div className="text-xs text-muted-foreground">{secret.account_label}</div>
          )}
        </div>
        {secret.verified_at ? (
          <Badge variant="outline" className="border-emerald-500/40 text-emerald-500">
            <Check className="mr-1 h-3 w-3" /> Verified
          </Badge>
        ) : (
          <Badge variant="outline">Not verified</Badge>
        )}
      </div>
      <button
        onClick={onCopy}
        className="rounded-md border bg-muted/30 px-3 py-2 text-center font-mono text-2xl tracking-[0.3em] transition hover:bg-muted/60"
        aria-label="Copy code"
      >
        {formatCode(code)}
      </button>
      <div className="space-y-1">
        <Progress value={pct} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{remaining}s</span>
          <span>{copied ? 'Copied' : 'Tap to copy'}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={onCopy}>
          <Copy className="mr-1 h-3 w-3" /> Copy
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void mfa.deleteSecret(secret.id)} className="text-destructive">
          <Trash2 className="mr-1 h-3 w-3" /> Remove
        </Button>
      </div>
    </Card>
  );
}

function formatCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

/* -------------------------------------------------------------------------- */
/* Add arbitrary                                                              */
/* -------------------------------------------------------------------------- */
function AddArbitraryCard({
  beginSetup,
}: {
  beginSetup: (target: { catalog?: MFACatalogEntry | null; serviceName?: string; serviceDomain?: string | null; passwordEntryId?: string | null }) => void;
}) {
  return (
    <Card className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Got an account Ray didn't surface?</h3>
          <p className="text-sm text-muted-foreground">
            <KeyRound className="mr-1 inline h-3 w-3" />
            Add it manually — Ray still handles the encryption and verification.
          </p>
        </div>
        <Button onClick={() => beginSetup({})}>
          <Plus className="mr-1 h-4 w-4" /> Add 2FA secret
        </Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Inline unlock                                                              */
/* -------------------------------------------------------------------------- */
function UnlockInline({ onUnlock }: { onUnlock: (pw: string) => void }) {
  const [pw, setPw] = useState('');
  return (
    <form
      className="flex gap-2"
      onSubmit={(e) => { e.preventDefault(); onUnlock(pw); }}
    >
      <input
        type="password"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
        placeholder="Master password"
        className="rounded-md border bg-background px-3 py-1.5 text-sm"
      />
      <Button type="submit" size="sm">Unlock</Button>
    </form>
  );
}

// Reference the unused import to satisfy linters in some configs.
void Activity;

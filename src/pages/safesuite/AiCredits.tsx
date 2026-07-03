/**
 * Ray Compute — premium AI horsepower for the heavy stuff.
 *
 * Display model:
 *   Storage stays in the existing high-resolution "credit" unit for
 *   backwards compatibility with the ledger and edge functions. The UI
 *   presents everything in **Ray Compute** units — small, human-scale
 *   numbers (25 / 250 / 1,000 / 5,000) that map to intuitive per-task
 *   costs like "3 for a deep phishing investigation".
 *
 *   1 Ray Compute = COMPUTE_SCALE stored credits.
 *
 * Terminology:
 *   - Monthly Ray Compute   — included with the plan, resets each cycle.
 *   - Purchased Ray Compute — top-ups, never expire, spent last.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Gift,
  ScanSearch,
  Brain,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RayPageHeader } from '@/components/ray/RayPageHeader';
import { PageMotion } from '@/components/ray/PageMotion';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

type Credits = {
  monthly_credits_used: number | null;
  monthly_credits_limit: number | null;
  daily_credits_used: number | null;
  daily_credits_limit: number | null;
  bonus_credits: number | null;
  monthly_reset_at: string | null;
  daily_reset_at: string | null;
};

type LedgerRow = {
  id: string;
  credits_used: number;
  tokens_used: number | null;
  usage_type: string | null;
  description: string | null;
  created_at: string;
};

/* --------------------------- display conversion --------------------------- */

// Stored ledger unit → displayed "Ray Compute" unit.
// Keeps DB numbers untouched while the UI presents human-scale values.
const COMPUTE_SCALE = 1000;

/** Round to a whole Ray Compute unit, never below 1 when any credit was spent. */
const toRC = (credits: number): number => {
  if (!credits) return 0;
  const rc = credits / COMPUTE_SCALE;
  return rc < 1 ? Math.ceil(rc * 10) / 10 : Math.round(rc);
};

const fmtRC = (rc: number): string =>
  rc >= 10 || Number.isInteger(rc) ? Math.round(rc).toLocaleString() : rc.toFixed(1);

/* -------------------------------- taxonomy -------------------------------- */

const USAGE_LABELS: Record<string, string> = {
  deep_investigation: 'Advanced threat analysis',
  threat_analysis: 'Advanced threat analysis',
  log_analysis: 'Log analysis',
  documentation: 'Large document review',
  // Reserved for future work — kept so historical ledger rows still label cleanly.
  executive_report: 'Executive reports',
  policy_generation: 'Policy generation',
  compliance_analysis: 'Compliance analysis',
  remediation_plan: 'Incident response plans',
  briefing: 'Executive briefings',
  security_coach: 'Security coaching',
  powershell: 'PowerShell review',
};

// Real, quotable per-task pricing. Only lists what actually exists today.
const TASK_PRICING: { task: string; cost: number | 'Free' }[] = [
  { task: 'Ask Ray a question', cost: 'Free' },
  { task: 'Explain a security score', cost: 'Free' },
  { task: 'Security coaching (BitLocker, updates, posture)', cost: 'Free' },
  { task: 'Daily & Weekly Brief', cost: 'Free' },
  { task: 'Recommendations & guided remediation', cost: 'Free' },
  { task: 'Standard threat analysis', cost: 'Free' },
  { task: 'Advanced threat analysis (URL, email, VirusTotal)', cost: 3 },
];

// Only surface premium features that actually ship today.
const PREMIUM_FEATURES: { icon: typeof ScanSearch; title: string; sub: string }[] = [
  {
    icon: ScanSearch,
    title: 'Advanced threat analysis',
    sub: 'URL analysis, email analysis, threat reasoning, VirusTotal enrichment.',
  },
];

const ALWAYS_INCLUDED = [
  'Ray conversations',
  '24/7 monitoring',
  'AI-powered recommendations',
  'Guided remediation',
  'Daily & weekly briefs',
  'Device monitoring',
  'Device posture analysis',
  'Device timeline',
  'Security score coaching',
  'Threat monitoring',
  'Microsoft 365 monitoring',
  'Endpoint agent',
  'Timeline & audit history',
  'Organization memory',
];

// Small, memorable top-up packs. Numbers users can hold in their head.
const PACKS = [
  { rc: 25, price: 5, tag: 'Try it out' },
  { rc: 100, price: 15, tag: 'Most popular', highlight: true },
  { rc: 250, price: 30, tag: 'Team pack' },
  { rc: 500, price: 50, tag: 'Best value' },
  { rc: 1000, price: 90, tag: 'For teams' },
];

/* --------------------------------- page ---------------------------------- */

export default function AiCredits() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<Credits | null>(null);
  const [ledger, setLedger] = useState<LedgerRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: c }, { data: l }] = await Promise.all([
          supabase
            .from('user_credits')
            .select(
              'monthly_credits_used, monthly_credits_limit, daily_credits_used, daily_credits_limit, bonus_credits, monthly_reset_at, daily_reset_at',
            )
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('ai_credit_ledger')
            .select('id, credits_used, tokens_used, usage_type, description, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100),
        ]);
        if (cancelled) return;
        setCredits(
          (c as Credits) ?? {
            monthly_credits_used: 0,
            monthly_credits_limit: 0,
            daily_credits_used: 0,
            daily_credits_limit: 0,
            bonus_credits: 0,
            monthly_reset_at: null,
            daily_reset_at: null,
          },
        );
        setLedger((l as LedgerRow[]) ?? []);
      } catch {
        if (!cancelled) setError("Ray couldn't load your Ray Compute balance right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Convert stored credits → displayed Ray Compute units.
  const monthlyUsedRC = toRC(credits?.monthly_credits_used ?? 0);
  const monthlyLimitRC = toRC(credits?.monthly_credits_limit ?? 0);
  const purchasedRC = toRC(credits?.bonus_credits ?? 0);
  const planRemainingRC = Math.max(0, monthlyLimitRC - monthlyUsedRC);
  const totalRemainingRC = planRemainingRC + purchasedRC;
  const monthlyPct =
    monthlyLimitRC > 0 ? Math.min(100, Math.round((monthlyUsedRC / monthlyLimitRC) * 100)) : 0;

  // Today's usage grouped by usage_type — real data, no fabrication.
  const todayByType = useMemo(() => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const counts = new Map<string, { count: number; credits: number }>();
    for (const row of ledger) {
      if (new Date(row.created_at) < startOfDay) continue;
      const key = row.usage_type ?? 'other';
      const cur = counts.get(key) ?? { count: 0, credits: 0 };
      cur.count += 1;
      cur.credits += Number(row.credits_used) || 0;
      counts.set(key, cur);
    }
    return Array.from(counts.entries())
      .map(([type, v]) => ({
        type,
        label: USAGE_LABELS[type] ?? type.replace(/_/g, ' '),
        count: v.count,
        rc: toRC(v.credits),
      }))
      .sort((a, b) => b.rc - a.rc);
  }, [ledger]);

  return (
    <PageMotion>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <RayPageHeader
          title="Ray Compute"
          question="How much premium AI horsepower have you used this cycle?"
          explain={{
            title: 'What Ray Compute is for',
            body:
              "Most of Wrayth is unlimited. Ray Compute is only spent on advanced AI tasks that need significantly more processing power — executive reports, deep investigations, compliance analysis, and large document generation. Monitoring, recommendations, conversations, briefs, and security alerts are always included with your plan.",
          }}
        />

        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
            <Skeleton className="h-32 rounded-lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">{error}</CardContent>
          </Card>
        ) : (
          <>
            {/* Balance hero — small, human-scale numbers */}
            <Card variant="glow">
              <CardContent className="p-6 space-y-5">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Remaining this cycle
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="text-5xl font-light text-violet-300 tabular-nums">
                        {fmtRC(totalRemainingRC)}
                      </div>
                      <div className="text-sm text-muted-foreground">Ray Compute</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtRC(planRemainingRC)} monthly
                      {purchasedRC > 0 ? ` · ${fmtRC(purchasedRC)} purchased` : ''}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Monthly Ray Compute
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground tabular-nums">
                      {fmtRC(monthlyUsedRC)}{' '}
                      <span className="text-lg text-muted-foreground">
                        / {fmtRC(monthlyLimitRC)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Resets{' '}
                      {credits?.monthly_reset_at
                        ? formatDistanceToNow(new Date(credits.monthly_reset_at), {
                            addSuffix: true,
                          })
                        : 'with your plan'}
                      .
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Purchased Ray Compute
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground tabular-nums">
                      {fmtRC(purchasedRC)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Never expire. Ray uses monthly first, then these.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {fmtRC(monthlyUsedRC)} used of {fmtRC(monthlyLimitRC)} monthly
                    </span>
                    <span>{monthlyPct}%</span>
                  </div>
                  <Progress value={monthlyPct} className="h-2" />
                </div>

                {/* Quick top-off */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground mr-1">Need more?</span>
                  {[25, 100, 250].map((rc) => (
                    <Button
                      key={rc}
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 min-h-[32px] px-3 text-xs"
                    >
                      <Link to={`/app/billing?rc=${rc}`}>Buy {rc}</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Today by category */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-300" /> Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No Ray Compute spent today. Kick off an investigation, report, or policy draft
                    to see it here.
                  </p>
                ) : (
                  <ul className="divide-y divide-border/60">
                    {todayByType.map((row) => (
                      <li key={row.type} className="flex items-center justify-between py-2.5">
                        <div className="text-sm text-foreground capitalize">{row.label}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {row.count} run{row.count === 1 ? '' : 's'}
                          </span>
                          <span className="text-sm text-violet-300 tabular-nums">
                            −{fmtRC(row.rc)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* What things cost */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Brain className="h-4 w-4 text-violet-300" /> What things cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border/60">
                  {TASK_PRICING.map((t) => (
                    <li
                      key={t.task}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-foreground/90">{t.task}</span>
                      {t.cost === 'Free' ? (
                        <span className="text-xs text-emerald-300 uppercase tracking-wider">
                          Included
                        </span>
                      ) : (
                        <span className="text-violet-300 tabular-nums">
                          {t.cost} <span className="text-xs text-muted-foreground">RC</span>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Buy more */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" /> Buy more Ray Compute
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {PACKS.map((pack) => (
                    <div
                      key={pack.rc}
                      className={cn(
                        'wrayth-chamfer border p-4 flex flex-col',
                        pack.highlight
                          ? 'border-violet-400/40 bg-violet-500/5'
                          : 'border-border bg-card/40',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] uppercase tracking-wider',
                            pack.highlight && 'border-violet-400/40 text-violet-200',
                          )}
                        >
                          {pack.tag}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          ${(pack.price / pack.rc).toFixed(2)}/RC
                        </span>
                      </div>
                      <div className="mt-3 text-3xl font-light text-foreground tabular-nums">
                        {pack.rc.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Ray Compute · never expire
                      </div>
                      <div className="mt-3 text-lg font-light text-foreground">${pack.price}</div>
                      <Button
                        asChild
                        size="sm"
                        variant={pack.highlight ? 'default' : 'outline'}
                        className="mt-3 min-h-[40px]"
                      >
                        <Link to={`/app/billing?rc=${pack.rc}`}>Buy pack</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* What uses vs what's included */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-300" /> What uses Ray Compute
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {PREMIUM_FEATURES.map((f) => (
                      <li key={f.title} className="flex items-start gap-3">
                        <div className="h-8 w-8 rounded-md border border-violet-400/30 bg-violet-500/5 flex items-center justify-center shrink-0">
                          <f.icon className="h-4 w-4 text-violet-300" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm text-foreground">{f.title}</div>
                          <div className="text-xs text-muted-foreground">{f.sub}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Always included
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    These never use Ray Compute — they're part of your plan.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ALWAYS_INCLUDED.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Full ledger */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base">Recent activity</CardTitle>
                <Link
                  to="/app/billing"
                  className="text-xs text-violet-300 hover:text-violet-200 inline-flex items-center gap-1"
                >
                  Billing <ArrowRight className="h-3 w-3" />
                </Link>
              </CardHeader>
              <CardContent>
                {ledger.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No Ray Compute spent yet. Everyday Ray usage — chat, briefs, monitoring — is
                    always included.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {ledger.slice(0, 25).map((row) => {
                      const label =
                        row.description ||
                        USAGE_LABELS[row.usage_type ?? ''] ||
                        (row.usage_type ? row.usage_type.replace(/_/g, ' ') : 'AI usage');
                      const rc = toRC(Number(row.credits_used) || 0);
                      return (
                        <div key={row.id} className="flex items-center justify-between py-3 gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{label}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                              {row.tokens_used
                                ? ` · ${row.tokens_used.toLocaleString()} tokens`
                                : ''}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-violet-300 shrink-0 tabular-nums">
                            −{fmtRC(rc)} <span className="text-xs text-muted-foreground">RC</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageMotion>
  );
}

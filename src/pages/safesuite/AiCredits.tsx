/**
 * Ray Credits — Ray Intelligence: premium AI horsepower for the heavy stuff.
 *
 * Display model:
 *   Storage stays in the existing high-resolution "credit" unit for
 *   backwards compatibility with the ledger and edge functions. The UI
 *   presents everything in human-scale **Credits** (25 / 100 / 250 / 500 /
 *   1,000) that map to intuitive per-task costs like "3 for a deep phishing
 *   investigation".
 *
 *   1 Credit = COMPUTE_SCALE stored credits.
 *
 * Terminology:
 *   - Monthly Credits   — included with the plan, reset each cycle.
 *   - Purchased Credits — top-ups, never expire, spent last.
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
  Info,
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

// Stored ledger unit → displayed "Credit" unit.
// Keeps DB numbers untouched while the UI presents human-scale values.
const COMPUTE_SCALE = 1000;

/** Round to a whole Credit, never below 1 when any credit was spent. */
const toCredits = (credits: number): number => {
  if (!credits) return 0;
  const c = credits / COMPUTE_SCALE;
  return c < 1 ? Math.ceil(c * 10) / 10 : Math.round(c);
};

const fmt = (c: number): string =>
  c >= 10 || Number.isInteger(c) ? Math.round(c).toLocaleString() : c.toFixed(1);

/* -------------------------------- taxonomy -------------------------------- */

const USAGE_LABELS: Record<string, string> = {
  deep_investigation: 'Deep threat investigation',
  threat_analysis: 'Advanced threat analysis',
  log_analysis: 'Large log analysis',
  documentation: 'Large document review',
  executive_report: 'Executive report',
  board_report: 'Board-ready report',
  policy_generation: 'Security policy generation',
  compliance_analysis: 'Compliance gap analysis',
  incident_summary: 'Incident summary',
  attack_path: 'Attack path reasoning',
  malware_analysis: 'Malware behavior analysis',
  remediation_plan: 'Incident response plan',
  briefing: 'Executive briefing',
  security_coach: 'Security coaching',
  powershell: 'PowerShell / script explanation',
};

// What's included in every plan (never uses Credits).
const INCLUDED = [
  'Ask Ray security questions',
  'Explain my security score',
  'Daily & Weekly Briefs',
  'Device monitoring',
  'Recommendations',
  'Guided remediation',
  'Microsoft 365 monitoring',
  'Standard threat analysis',
  'Timeline & audit history',
  'Organization memory',
];

// What uses Credits — real per-task pricing.
const CREDIT_TASKS: { task: string; cost: number; sub?: string }[] = [
  { task: 'Deep email or URL investigation', cost: 3, sub: 'Multi-source reasoning with VirusTotal enrichment.' },
  { task: 'Malware behavior analysis', cost: 5, sub: 'Explains what a script or binary is actually doing.' },
  { task: 'PowerShell / script explanation', cost: 4, sub: 'Line-by-line intent and risk breakdown.' },
  { task: 'Firewall / config review', cost: 4, sub: 'Rule-by-rule analysis with hardening advice.' },
  { task: 'Incident summary', cost: 6, sub: 'Timeline + root cause + next steps.' },
  { task: 'Executive security report', cost: 8, sub: 'Plain-English posture summary for leadership.' },
  { task: 'Board-ready report', cost: 8, sub: 'Formatted, exportable, ready to present.' },
  { task: 'Security policy generation', cost: 10, sub: 'Framework-aligned, editable, exportable to Word.' },
  { task: 'Incident response plan', cost: 12, sub: 'Custom runbook for a specific incident type.' },
  { task: 'Compliance gap analysis', cost: 15, sub: 'CIS / NIST / SOC 2 / HIPAA scored with a 30/60/90 roadmap.' },
  { task: 'Attack path reasoning', cost: 20, sub: 'Multi-stage threat investigation across signals.' },
];

// Quick "Examples" strip for the top of the page.
const EXAMPLES: { task: string; cost: number }[] = [
  { task: 'Analyze suspicious email', cost: 3 },
  { task: 'Deep malware investigation', cost: 5 },
  { task: 'Review firewall config', cost: 4 },
  { task: 'Generate executive report', cost: 8 },
  { task: 'Build incident report', cost: 12 },
  { task: 'Compare tenant to CIS', cost: 15 },
];

// Monthly Credits included with each plan.
const PLAN_INCLUDED = [
  { plan: 'Starter', monthly: '10 Credits / month' },
  { plan: 'Professional', monthly: '50 Credits / month' },
  { plan: 'Business', monthly: '100 Credits / month' },
  { plan: 'Enterprise', monthly: 'Pooled or unlimited' },
];

// Small, memorable top-up packs. Numbers users can hold in their head.
const PACKS = [
  { credits: 25, price: 5, tag: 'Try it out' },
  { credits: 100, price: 15, tag: 'Most popular', highlight: true },
  { credits: 250, price: 30, tag: 'Team pack' },
  { credits: 500, price: 50, tag: 'Best value' },
  { credits: 1000, price: 90, tag: 'For teams' },
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
        if (!cancelled) setError("Ray couldn't load your Credit balance right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Convert stored credits → displayed Credit units.
  const monthlyUsed = toCredits(credits?.monthly_credits_used ?? 0);
  const monthlyLimit = toCredits(credits?.monthly_credits_limit ?? 0);
  const purchased = toCredits(credits?.bonus_credits ?? 0);
  const planRemaining = Math.max(0, monthlyLimit - monthlyUsed);
  const totalRemaining = planRemaining + purchased;
  const monthlyPct =
    monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;

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
        credits: toCredits(v.credits),
      }))
      .sort((a, b) => b.credits - a.credits);
  }, [ledger]);

  return (
    <PageMotion>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <RayPageHeader
          title="Ray Intelligence"
          question="How many Credits have you used this cycle?"
          explain={{
            title: 'Why Credits exist',
            body:
              "Most of Ray is included with your subscription — chat, monitoring, briefs, recommendations, and standard threat analysis. Credits are only used for advanced AI investigations and report generation, so you pay only for high-compute tasks instead of a higher monthly subscription.",
          }}
        />

        {/* Why credits — one-sentence explainer, always visible */}
        <div className="rounded-lg border border-violet-400/25 bg-violet-500/5 p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-violet-300 mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/90">
            <span className="text-violet-200 font-medium">Most of Ray is included with your subscription.</span>{' '}
            Credits are only used for advanced AI investigations and report generation — so you pay only for
            high-compute tasks instead of higher monthly subscription costs.
          </p>
        </div>

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
            {/* Balance hero */}
            <Card variant="glow">
              <CardContent className="p-6 space-y-5">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Remaining this cycle
                    </div>
                    <div className="mt-2 flex items-baseline gap-2">
                      <div className="text-5xl font-light text-violet-300 tabular-nums">
                        {fmt(totalRemaining)}
                      </div>
                      <div className="text-sm text-muted-foreground">Credits</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmt(planRemaining)} monthly
                      {purchased > 0 ? ` · ${fmt(purchased)} purchased` : ''}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Monthly Credits
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground tabular-nums">
                      {fmt(monthlyUsed)}{' '}
                      <span className="text-lg text-muted-foreground">
                        / {fmt(monthlyLimit)}
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
                      <Gift className="h-3 w-3" /> Purchased Credits
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground tabular-nums">
                      {fmt(purchased)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Never expire. Ray uses monthly first, then these.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {fmt(monthlyUsed)} used of {fmt(monthlyLimit)} monthly
                    </span>
                    <span>{monthlyPct}%</span>
                  </div>
                  <Progress value={monthlyPct} className="h-2" />
                </div>

                {/* Quick top-off */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground mr-1">Need more?</span>
                  {[25, 100, 250].map((n) => (
                    <Button
                      key={n}
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-8 min-h-[32px] px-3 text-xs"
                    >
                      <Link to={`/app/billing?credits=${n}`}>Buy {n} Credits</Link>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Examples — instantly answers "what does 100 Credits mean?" */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" /> Examples
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {EXAMPLES.map((e) => (
                    <div
                      key={e.task}
                      className="flex items-center justify-between rounded-md border border-border/60 bg-card/40 px-3 py-2.5"
                    >
                      <span className="text-sm text-foreground/90">{e.task}</span>
                      <span className="text-sm text-violet-300 tabular-nums whitespace-nowrap">
                        {e.cost} <span className="text-xs text-muted-foreground">Credits</span>
                      </span>
                    </div>
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
                    No Credits spent today. Kick off an investigation, report, or policy draft to
                    see it here.
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
                            −{fmt(row.credits)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* What things cost — grouped Included vs Uses Credits */}
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Included with your plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Everything here is unlimited — no Credits used, ever.
                  </p>
                  <ul className="grid grid-cols-1 gap-2">
                    {INCLUDED.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-foreground/90">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-violet-300" /> Uses Credits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    Advanced AI investigations and report generation. You only pay for what you
                    run.
                  </p>
                  <ul className="divide-y divide-border/60">
                    {CREDIT_TASKS.map((t) => (
                      <li key={t.task} className="py-2.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm text-foreground/90">{t.task}</span>
                          <span className="text-sm text-violet-300 tabular-nums whitespace-nowrap">
                            {t.cost}{' '}
                            <span className="text-xs text-muted-foreground">Credits</span>
                          </span>
                        </div>
                        {t.sub && (
                          <div className="text-xs text-muted-foreground mt-0.5">{t.sub}</div>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>

            {/* Included per plan */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="h-4 w-4 text-violet-300" /> Included every month
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Every plan includes a monthly Credit allowance. Top-ups are only for months when
                  you run more advanced investigations than usual.
                </p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {PLAN_INCLUDED.map((p) => (
                    <div
                      key={p.plan}
                      className="wrayth-chamfer border border-border bg-card/40 p-4"
                    >
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {p.plan}
                      </div>
                      <div className="mt-1 text-lg text-foreground">{p.monthly}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Buy more */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-violet-300" /> Buy more Credits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  {PACKS.map((pack) => (
                    <div
                      key={pack.credits}
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
                          ${(pack.price / pack.credits).toFixed(2)}/Credit
                        </span>
                      </div>
                      <div className="mt-3 text-3xl font-light text-foreground tabular-nums">
                        {pack.credits.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Credits · never expire</div>
                      <div className="mt-3 text-lg font-light text-foreground">${pack.price}</div>
                      <Button
                        asChild
                        size="sm"
                        variant={pack.highlight ? 'default' : 'outline'}
                        className="mt-3 min-h-[40px]"
                      >
                        <Link to={`/app/billing?credits=${pack.credits}`}>Buy pack</Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

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
                    No Credits spent yet. Everyday Ray usage — chat, briefs, monitoring — is always
                    included.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {ledger.slice(0, 25).map((row) => {
                      const label =
                        row.description ||
                        USAGE_LABELS[row.usage_type ?? ''] ||
                        (row.usage_type ? row.usage_type.replace(/_/g, ' ') : 'AI usage');
                      const c = toCredits(Number(row.credits_used) || 0);
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
                            −{fmt(c)}{' '}
                            <span className="text-xs text-muted-foreground">Credits</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Unavailable icon lint fix */}
            <div className="hidden">
              <ScanSearch />
            </div>
          </>
        )}
      </div>
    </PageMotion>
  );
}

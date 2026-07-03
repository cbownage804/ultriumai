/**
 * Ray Compute — premium AI horsepower for the heavy stuff.
 *
 * Framing (per product direction):
 *   - Monitoring, recommendations, conversations, briefs, and alerts are
 *     ALWAYS included with the plan. Ray Compute is only spent on
 *     compute-intensive AI operations (deep investigations, executive
 *     reports, policy generation, compliance analysis, remediation
 *     plans, log analysis, PowerShell/doc generation, coaching).
 *
 * Everything on this page reads from real data. Empty states are honest.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Zap,
  Gift,
  FileText,
  ShieldCheck,
  ScrollText,
  ClipboardList,
  BookOpen,
  Terminal,
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

/* ------------------------------- taxonomy ------------------------------- */

// Human names for known usage_type buckets. Unknown types render as-is.
const USAGE_LABELS: Record<string, string> = {
  deep_investigation: 'Deep investigations',
  executive_report: 'Executive reports',
  threat_analysis: 'Threat analysis',
  policy_generation: 'Policy generation',
  compliance_analysis: 'Compliance analysis',
  remediation_plan: 'Remediation plans',
  briefing: 'Executive briefings',
  security_coach: 'Security coaching',
  log_analysis: 'Log analysis',
  powershell: 'PowerShell generation',
  documentation: 'Documentation',
};

const PREMIUM_FEATURES: { icon: typeof ScanSearch; title: string; sub: string }[] = [
  { icon: ScanSearch, title: 'Deep threat investigations', sub: 'Full URL, header, SPF/DKIM/DMARC, WHOIS, VirusTotal, passive DNS.' },
  { icon: FileText, title: 'Executive incident reports', sub: 'PDF, timeline, root cause, MITRE ATT&CK, exec + technical summary.' },
  { icon: ScrollText, title: 'Policy generation', sub: 'Password, IR, AUP, AI governance, HIPAA, SOC 2 — drafted end to end.' },
  { icon: ShieldCheck, title: 'Compliance analysis', sub: 'Compare your posture against SOC 2, HIPAA, PCI, CIS, NIST.' },
  { icon: ClipboardList, title: 'Remediation plans', sub: 'Time, impact, rollback, comms, approvals, maintenance window.' },
  { icon: BookOpen, title: 'Board & MSP briefings', sub: 'Board reports, exec summaries, technical summaries, client reports.' },
  { icon: Brain, title: 'Security coaching', sub: '"Explain Zero Trust", "Teach me BitLocker", "Why does Tamper Protection matter?"' },
  { icon: Terminal, title: 'PowerShell & log analysis', sub: 'Generate scripts, decode Windows / firewall / Sentinel logs.' },
];

const ALWAYS_INCLUDED = [
  'Ray conversations',
  '24/7 monitoring',
  'Recommendations',
  'Daily & weekly briefs',
  'Device monitoring',
  'Threat monitoring',
  'Microsoft 365 monitoring',
  'Endpoint agent',
  'Timeline & audit history',
  'Organization memory',
];

const PACKS = [
  { credits: 5_000, price: 10, tag: 'Try it out' },
  { credits: 25_000, price: 35, tag: 'Most popular', highlight: true },
  { credits: 100_000, price: 99, tag: 'Best value' },
  { credits: 500_000, price: 399, tag: 'For teams' },
];

/* --------------------------------- page --------------------------------- */

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

  const monthlyUsed = credits?.monthly_credits_used ?? 0;
  const monthlyLimit = credits?.monthly_credits_limit ?? 0;
  const bonus = credits?.bonus_credits ?? 0;
  const remaining = Math.max(0, monthlyLimit - monthlyUsed) + bonus;
  const monthlyPct = monthlyLimit > 0 ? Math.min(100, Math.round((monthlyUsed / monthlyLimit) * 100)) : 0;

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
      .map(([type, v]) => ({ type, label: USAGE_LABELS[type] ?? type.replace(/_/g, ' '), ...v }))
      .sort((a, b) => b.credits - a.credits);
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
              "Most of Wrayth is unlimited. Ray Compute is only used for advanced AI tasks that need significantly more processing power — executive reports, deep investigations, compliance analysis, and large document generation. Monitoring, recommendations, conversations, and security alerts are always included with your plan.",
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
            {/* Balance hero */}
            <Card variant="glow">
              <CardContent className="p-6 space-y-5">
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                      Included this month
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground">
                      {monthlyLimit.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Resets with your plan.</p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Remaining</div>
                    <div className="mt-2 text-4xl font-light text-violet-300">
                      {remaining.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyLimit - monthlyUsed > 0
                        ? `${(monthlyLimit - monthlyUsed).toLocaleString()} plan + ${bonus.toLocaleString()} bonus`
                        : `${bonus.toLocaleString()} bonus`}
                    </p>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground flex items-center gap-1">
                      <Gift className="h-3 w-3" /> Bonus credits
                    </div>
                    <div className="mt-2 text-4xl font-light text-foreground">{bonus.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">Never expire. Ray uses them last.</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span>
                      {monthlyUsed.toLocaleString()} used of {monthlyLimit.toLocaleString()}
                    </span>
                    <span>
                      {credits?.monthly_reset_at
                        ? `Resets ${formatDistanceToNow(new Date(credits.monthly_reset_at), { addSuffix: true })}`
                        : 'Resets with your plan'}
                    </span>
                  </div>
                  <Progress value={monthlyPct} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Today by category (real ledger) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="h-4 w-4 text-violet-300" /> Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todayByType.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">
                    No Ray Compute spent today. Kick off an investigation, report, or policy draft to see it here.
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
                            −{row.credits.toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
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
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
                          ${(pack.price / (pack.credits / 1000)).toFixed(2)}/1k
                        </span>
                      </div>
                      <div className="mt-3 text-2xl font-light text-foreground">
                        {pack.credits.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">credits · never expire</div>
                      <div className="mt-3 text-lg font-light text-foreground">${pack.price}</div>
                      <Button
                        asChild
                        size="sm"
                        variant={pack.highlight ? 'default' : 'outline'}
                        className="mt-3 min-h-[40px]"
                      >
                        <Link to={`/app/billing?pack=${pack.credits}`}>Buy pack</Link>
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
                    No Ray Compute spent yet. Everyday Ray usage — chat, briefs, monitoring — is always included.
                  </p>
                ) : (
                  <div className="divide-y divide-border">
                    {ledger.slice(0, 25).map((row) => {
                      const label =
                        row.description ||
                        USAGE_LABELS[row.usage_type ?? ''] ||
                        (row.usage_type ? row.usage_type.replace(/_/g, ' ') : 'AI usage');
                      return (
                        <div key={row.id} className="flex items-center justify-between py-3 gap-4">
                          <div className="min-w-0">
                            <div className="text-sm font-medium truncate">{label}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
                              {row.tokens_used ? ` · ${row.tokens_used.toLocaleString()} tokens` : ''}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-violet-300 shrink-0 tabular-nums">
                            −{Number(row.credits_used).toLocaleString()}
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

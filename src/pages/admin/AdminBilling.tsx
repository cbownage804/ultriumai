/**
 * Admin → Billing & Revenue.
 *
 * SaaS control-plane dashboard: MRR/ARR + growth, subscriber lifecycle
 * (new/churn/ARPU), plan mix, 30-day revenue trend, RC consumption, and
 * a live payment activity feed. Follows the Wrayth three-state UI
 * standard — Loading → Skeleton, Empty → RayZeroState, Active → real
 * numbers only. No fabricated "$0" tiles.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign } from 'lucide-react';
import { formatTier } from '@/lib/admin/labels';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface TrendPoint { date: string; revenue: number }
interface RecentTxn { id?: string; created_at: string; amount: number; status: string; type?: string; description?: string }
interface BillingOverview {
  mrr_estimate?: number;
  arr_estimate?: number;
  growth_pct?: number;
  revenue_trend?: TrendPoint[];
  paid_subscribers?: number;
  total_subscribers?: number;
  new_subs_30d?: number;
  churned_30d?: number;
  churn_pct?: number;
  arpu?: number;
  plan_mix?: Record<string, number>;
  rc_today?: number;
  rc_30d?: number;
  purchases_today?: number;
  failed_payments?: number;
  refunds?: number;
  refunds_amount_30d?: number;
  recent_transactions?: RecentTxn[];
}

const money = (n?: number) =>
  '$' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const money2 = (n?: number) =>
  '$' + Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function AdminBilling() {
  const [d, setD] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    callAdmin<BillingOverview>('billing.overview')
      .then((res) => !cancelled && setD(res ?? {}))
      .catch(() => !cancelled && setD({}))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const hasSignal =
    !!d &&
    ((d.mrr_estimate ?? 0) > 0 ||
      (d.paid_subscribers ?? 0) > 0 ||
      (d.total_subscribers ?? 0) > 0 ||
      (d.rc_30d ?? 0) > 0 ||
      Object.keys(d.plan_mix ?? {}).length > 0 ||
      (d.recent_transactions?.length ?? 0) > 0);

  const growth = d?.growth_pct ?? 0;
  const growthPos = growth >= 0;

  return (
    <div>
      <AdminPageHeader
        title="Billing & Revenue"
        subtitle="Rolling 30-day SaaS metrics — MRR, growth, churn, plan mix, Ray Compute consumption"
      />
      <div className="p-6 space-y-6">
        <PageState
          isLoading={loading}
          hasData={hasSignal}
          loading={
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
              </div>
              <Skeleton className="h-64" />
            </div>
          }
          empty={
            <RayZeroState
              icon={BadgeDollarSign}
              title="No billing activity yet."
              body={
                <>
                  This dashboard populates from real Stripe events — succeeded payments,
                  active subscriptions, RC purchases, refunds, and failed charges. Until a
                  customer completes a checkout there is nothing meaningful to show, so
                  Wrayth won&rsquo;t pretend otherwise with a wall of &ldquo;$0&rdquo; tiles.
                </>
              }
              expectations={[
                'MRR / ARR estimates and 30-day growth versus the prior period.',
                'Subscriber lifecycle — new, churn %, ARPU, and paid vs. total.',
                'Plan mix (Pro / Business / Enterprise / MSP tiers) and revenue trend.',
                'Ray Compute consumption and pack purchases per day.',
                'Payment issues — failed charges and refunds — surfaced for triage.',
              ]}
              action={{ label: 'Open Stripe dashboard', href: 'https://dashboard.stripe.com', variant: 'outline' }}
            />
          }
        >
          {/* Top-line SaaS metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <AdminMetricCard
              label="MRR (30d run-rate)"
              value={money(d?.mrr_estimate)}
              hint={
                <span className={growthPos ? 'text-emerald-500' : 'text-destructive'}>
                  {growthPos ? '▲' : '▼'} {Math.abs(growth).toFixed(1)}% vs prior 30d
                </span>
              }
            />
            <AdminMetricCard label="ARR (est.)" value={money(d?.arr_estimate)} hint="MRR × 12" />
            <AdminMetricCard
              label="Paid subscribers"
              value={d?.paid_subscribers ?? 0}
              hint={`of ${d?.total_subscribers ?? 0} total · ARPU ${money2(d?.arpu)}`}
            />
            <AdminMetricCard
              label="Net movement (30d)"
              value={
                <span className="flex items-center gap-2">
                  <span className="text-emerald-500 inline-flex items-center gap-0.5">
                    <ArrowUpRight className="h-4 w-4" />{d?.new_subs_30d ?? 0}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-destructive inline-flex items-center gap-0.5">
                    <ArrowDownRight className="h-4 w-4" />{d?.churned_30d ?? 0}
                  </span>
                </span>
              }
              hint={`Churn ${Number(d?.churn_pct ?? 0).toFixed(1)}%`}
            />
          </div>

          {/* Revenue trend */}
          <AdminSection title="Revenue — last 30 days">
            {(d?.revenue_trend ?? []).every((p) => p.revenue === 0) ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">
                No successful payments in the last 30 days.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d?.revenue_trend ?? []}>
                    <defs>
                      <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => v.slice(5)}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => '$' + Number(v).toLocaleString()}
                      width={70}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(v: any) => [money2(Number(v)), 'Revenue']}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revFill)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </AdminSection>

          <div className="grid gap-4 md:grid-cols-2">
            <AdminSection title="Plan mix (paid tiers)">
              {Object.keys(d?.plan_mix ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No paid plans active yet.</p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(d?.plan_mix ?? {})
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([tier, count]) => {
                      const total = Object.values(d?.plan_mix ?? {}).reduce((s, c) => s + (c as number), 0);
                      const pct = total > 0 ? ((count as number) / total) * 100 : 0;
                      return (
                        <div key={tier}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{formatTier(tier)}</span>
                            <span className="text-muted-foreground">
                              {count as number} · {pct.toFixed(0)}%
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </AdminSection>

            <AdminSection title="Ray Compute (RC)">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Consumed today</div>
                  <div className="text-2xl font-bold mt-1">{Number(d?.rc_today ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Consumed 30d</div>
                  <div className="text-2xl font-bold mt-1">{Number(d?.rc_30d ?? 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Packs purchased today</div>
                  <div className="text-2xl font-bold mt-1">{d?.purchases_today ?? 0}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground tracking-wider">Refunds (30d)</div>
                  <div className="text-2xl font-bold mt-1">{money(d?.refunds_amount_30d)}</div>
                  <div className="text-xs text-muted-foreground">{d?.refunds ?? 0} events</div>
                </div>
              </div>
            </AdminSection>
          </div>

          <AdminSection title="Recent transactions">
            {(d?.recent_transactions ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No transactions in the last 60 days.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(d?.recent_transactions ?? []).map((t, i) => (
                    <TableRow key={t.id ?? `${t.created_at}-${i}`}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm">{t.description ?? '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.type ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(t.status)}>{t.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{money2(t.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </AdminSection>

          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard label="Failed payments (30d)" value={d?.failed_payments ?? 0} hint="Requires triage" />
            <AdminMetricCard label="Refunds (30d)" value={d?.refunds ?? 0} hint={money(d?.refunds_amount_30d)} />
            <AdminMetricCard label="RC purchases today" value={d?.purchases_today ?? 0} />
          </div>
        </PageState>
      </div>
    </div>
  );
}

function statusVariant(s: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  const k = (s ?? '').toLowerCase();
  if (k === 'succeeded' || k === 'completed' || k === 'paid') return 'default';
  if (k === 'failed') return 'destructive';
  if (k === 'refunded') return 'outline';
  return 'secondary';
}

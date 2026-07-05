/**
 * Admin → Billing & Revenue.
 *
 * Follows the Wrayth three-state UI standard (mem://preferences/wrayth-three-state-ui):
 *   Loading → Skeleton grid
 *   Empty   → RayZeroState explaining what will appear once payments start flowing.
 *             We do NOT render "$0 MRR" as if that were a meaningful number.
 *   Active  → Real metrics from payment_transactions / subscribers.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { BadgeDollarSign } from 'lucide-react';

interface BillingOverview {
  mrr_estimate?: number;
  arr_estimate?: number;
  paid_subscribers?: number;
  total_subscribers?: number;
  rc_today?: number;
  plan_mix?: Record<string, number>;
  failed_payments?: number;
  refunds?: number;
  purchases_today?: number;
}

export default function AdminBilling() {
  const [d, setD] = useState<BillingOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    callAdmin('billing.overview')
      .then((res) => !cancelled && setD(res ?? {}))
      .catch(() => !cancelled && setD({}))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  // "Any real signal" = any non-zero metric that would be dishonest to show as $0.
  const hasSignal =
    !!d &&
    ((d.mrr_estimate ?? 0) > 0 ||
      (d.paid_subscribers ?? 0) > 0 ||
      (d.total_subscribers ?? 0) > 0 ||
      (d.rc_today ?? 0) > 0 ||
      Object.keys(d.plan_mix ?? {}).length > 0 ||
      (d.failed_payments ?? 0) > 0 ||
      (d.refunds ?? 0) > 0 ||
      (d.purchases_today ?? 0) > 0);

  return (
    <div>
      <AdminPageHeader title="Billing & Revenue" subtitle="30-day rolling snapshot" />
      <div className="p-6 space-y-6">
        <PageState
          isLoading={loading}
          hasData={hasSignal}
          loading={
            <div className="grid gap-4 md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
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
                'MRR and ARR estimates from the last 30 days of succeeded payments.',
                'Paid vs. total subscriber counts and plan mix (Pro / Business / Enterprise).',
                'RC (Ray Compute) consumption and pack purchases per day.',
                'Payment issues — failed charges and refunds — surfaced for triage.',
              ]}
              action={{ label: 'Open Stripe dashboard', href: 'https://dashboard.stripe.com', variant: 'outline' }}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <AdminMetricCard
              label="MRR (est.)"
              value={`$${Number(d?.mrr_estimate ?? 0).toLocaleString()}`}
              hint="Sum of last 30d succeeded payments"
            />
            <AdminMetricCard
              label="ARR (est.)"
              value={`$${Number(d?.arr_estimate ?? 0).toLocaleString()}`}
            />
            <AdminMetricCard
              label="Paid subscribers"
              value={d?.paid_subscribers ?? 0}
              hint={`of ${d?.total_subscribers ?? 0} total`}
            />
            <AdminMetricCard
              label="RC consumed today"
              value={Number(d?.rc_today ?? 0).toLocaleString()}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AdminSection title="Plan mix">
              {Object.keys(d?.plan_mix ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">
                  No paid plans active yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(d?.plan_mix ?? {}).map(([tier, count]) => (
                    <div
                      key={tier}
                      className="flex justify-between text-sm border-b border-border/40 pb-1"
                    >
                      <span className="capitalize">{tier}</span>
                      <span className="font-medium">{count as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>

            <AdminSection title="Payment issues (30d)">
              <div className="space-y-2 text-sm">
                <Row label="Failed payments" value={d?.failed_payments ?? 0} />
                <Row label="Refunds" value={d?.refunds ?? 0} />
                <Row label="RC purchases today" value={d?.purchases_today ?? 0} />
              </div>
            </AdminSection>
          </div>
        </PageState>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between border-b border-border/40 pb-1">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

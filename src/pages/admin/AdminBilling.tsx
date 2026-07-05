import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminBilling() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { callAdmin('billing.overview').then(setD).catch(() => setD({})); }, []);
  return (
    <div>
      <AdminPageHeader title="Billing & Revenue" subtitle="30-day rolling snapshot" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {!d ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <AdminMetricCard label="MRR (est.)" value={`$${Number(d.mrr_estimate ?? 0).toLocaleString()}`} hint="Sum of last 30d succeeded payments" />
              <AdminMetricCard label="ARR (est.)" value={`$${Number(d.arr_estimate ?? 0).toLocaleString()}`} />
              <AdminMetricCard label="Paid subscribers" value={d.paid_subscribers ?? 0} hint={`of ${d.total_subscribers ?? 0} total`} />
              <AdminMetricCard label="RC consumed today" value={Number(d.rc_today ?? 0).toLocaleString()} />
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <AdminSection title="Plan mix">
            {!d ? <Skeleton className="h-32" /> : (
              <div className="space-y-2">
                {Object.entries(d.plan_mix ?? {}).map(([tier, count]) => (
                  <div key={tier} className="flex justify-between text-sm border-b border-border/40 pb-1">
                    <span className="capitalize">{tier}</span>
                    <span className="font-medium">{count as number}</span>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>

          <AdminSection title="Payment issues (30d)">
            {!d ? <Skeleton className="h-32" /> : (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between border-b border-border/40 pb-1"><span>Failed payments</span><span>{d.failed_payments ?? 0}</span></div>
                <div className="flex justify-between border-b border-border/40 pb-1"><span>Refunds</span><span>{d.refunds ?? 0}</span></div>
                <div className="flex justify-between border-b border-border/40 pb-1"><span>RC purchases today</span><span>{d.purchases_today ?? 0}</span></div>
              </div>
            )}
          </AdminSection>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminAgentFleet() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { callAdmin('fleet.overview').then(setD).catch(() => setD({})); }, []);
  return (
    <div>
      <AdminPageHeader title="Agent Fleet" subtitle="Every deployed Wrayth agent across the platform" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {!d ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <AdminMetricCard label="Total agents" value={d.total ?? 0} />
              <AdminMetricCard label="Online" value={d.online ?? 0} />
              <AdminMetricCard label="Offline" value={d.offline ?? 0} />
              <AdminMetricCard label="Latest release" value={d.latest_release?.version ?? '—'} hint={d.latest_release?.channel} />
            </>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminSection title="OS breakdown">
            {!d ? <Skeleton className="h-32" /> : (
              <div className="space-y-1">
                {Object.entries(d.os_counts ?? {}).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-sm border-b border-border/40 pb-1">
                    <span className="capitalize">{k}</span><span>{v as number}</span>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
          <AdminSection title="Recent agents">
            {!d ? <Skeleton className="h-32" /> :
              <div className="space-y-1 text-sm">
                {(d.recent_agents ?? []).slice(0, 15).map((a: any) => (
                  <div key={a.id} className="flex justify-between border-b border-border/40 pb-1">
                    <span>{a.hostname ?? a.id.slice(0, 8)}</span>
                    <Badge variant={a.status === 'online' ? 'default' : 'secondary'}>{a.status}</Badge>
                  </div>
                ))}
              </div>
            }
          </AdminSection>
        </div>
      </div>
    </div>
  );
}

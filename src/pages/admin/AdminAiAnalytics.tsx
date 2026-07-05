import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAiAnalytics() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { callAdmin('ai.overview').then(setD).catch(() => setD({})); }, []);
  return (
    <div>
      <AdminPageHeader title="AI Analytics" subtitle="Ray Compute usage and feature adoption (30 days)" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {!d ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <AdminMetricCard label="RC consumed (30d)" value={Number(d.rc_30d ?? 0).toLocaleString()} />
              <AdminMetricCard label="Agent runs (30d)" value={d.runs_30d ?? 0} />
              <AdminMetricCard label="Investigations (30d)" value={d.investigations_30d ?? 0} />
            </>
          )}
        </div>
        <AdminSection title="Top skills invoked">
          {!d ? <Skeleton className="h-32" /> :
            (d.top_skills ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No skill invocations recorded.</div> :
            <div className="space-y-1">
              {d.top_skills.map((s: any) => (
                <div key={s.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
                  <span className="font-mono text-xs">{s.id}</span>
                  <span className="font-medium">{s.count}</span>
                </div>
              ))}
            </div>
          }
        </AdminSection>
      </div>
    </div>
  );
}

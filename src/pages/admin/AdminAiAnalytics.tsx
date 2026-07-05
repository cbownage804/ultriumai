/**
 * Admin → AI Analytics. Three-state.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Cpu } from 'lucide-react';

interface AiOverview {
  rc_30d?: number;
  runs_30d?: number;
  investigations_30d?: number;
  top_skills?: Array<{ id: string; count: number }>;
}

export default function AdminAiAnalytics() {
  const [d, setD] = useState<AiOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<AiOverview>('ai.overview')
      .then(setD)
      .catch(() => setD({}))
      .finally(() => setLoading(false));
  }, []);

  const hasSignal =
    !!d &&
    (Number(d.rc_30d ?? 0) > 0 ||
      Number(d.runs_30d ?? 0) > 0 ||
      Number(d.investigations_30d ?? 0) > 0 ||
      (d.top_skills ?? []).length > 0);

  return (
    <div>
      <AdminPageHeader title="AI Analytics" subtitle="Ray Compute usage and feature adoption (30 days)" />
      <div className="p-6">
        <PageState
          isLoading={loading}
          hasData={hasSignal}
          loading={
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          }
          empty={
            <RayZeroState
              icon={Cpu}
              title="Ray hasn\u2019t been asked to do anything yet."
              body={
                <>
                  This dashboard tracks real Ray activity — every skill invocation, agent run,
                  and investigation across the platform. Until customers start using Ray there
                  are no runs to report, and Wrayth won&rsquo;t fabricate them.
                </>
              }
              expectations={[
                'Ray Compute (RC) consumed over the last 30 days.',
                'Total agent runs and investigations completed.',
                'Top skills invoked ranked by real call volume.',
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard label="RC consumed (30d)" value={Number(d?.rc_30d ?? 0).toLocaleString()} />
            <AdminMetricCard label="Agent runs (30d)" value={d?.runs_30d ?? 0} />
            <AdminMetricCard label="Investigations (30d)" value={d?.investigations_30d ?? 0} />
          </div>
          <AdminSection title="Top skills invoked" className="mt-6">
            {(d?.top_skills ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No skills invoked in this window.</p>
            ) : (
              <div className="space-y-1">
                {d!.top_skills!.map((s) => (
                  <div key={s.id} className="flex justify-between text-sm border-b border-border/40 pb-1">
                    <span className="font-mono text-xs">{s.id}</span>
                    <span className="font-medium">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </AdminSection>
        </PageState>
      </div>
    </div>
  );
}

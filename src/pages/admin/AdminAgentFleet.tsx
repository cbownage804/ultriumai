/**
 * Admin → Agent Fleet. Three-state.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Cpu } from 'lucide-react';

interface FleetOverview {
  total?: number;
  online?: number;
  offline?: number;
  latest_release?: { version?: string; channel?: string };
  os_counts?: Record<string, number>;
  recent_agents?: Array<{ id: string; hostname?: string; status?: string }>;
}

export default function AdminAgentFleet() {
  const [d, setD] = useState<FleetOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<FleetOverview>('fleet.overview')
      .then(setD)
      .catch(() => setD({}))
      .finally(() => setLoading(false));
  }, []);

  const hasSignal = !!d && Number(d.total ?? 0) > 0;

  return (
    <div>
      <AdminPageHeader title="Agent Fleet" subtitle="Every deployed Wrayth agent across the platform" />
      <div className="p-6">
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
              icon={Cpu}
              title="No Wrayth agents have been deployed yet."
              body={
                <>
                  Fleet metrics come from real agents checking in — one row per install,
                  per platform. Until the first customer runs the installer there are no
                  hosts to report on, so Wrayth won&rsquo;t simulate them.
                </>
              }
              expectations={[
                'Total, online, and offline agent counts refreshed as check-ins land.',
                'OS breakdown (Windows / macOS / Linux) with live percentages.',
                'The most recent agent release version and channel actually in use.',
                'A rolling list of recently seen hosts for triage.',
              ]}
              action={{ label: 'Manage releases', href: '/admin', variant: 'outline' }}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <AdminMetricCard label="Total agents" value={d?.total ?? 0} />
            <AdminMetricCard label="Online" value={d?.online ?? 0} />
            <AdminMetricCard label="Offline" value={d?.offline ?? 0} />
            <AdminMetricCard
              label="Latest release"
              value={d?.latest_release?.version ?? '—'}
              hint={d?.latest_release?.channel}
            />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AdminSection title="OS breakdown">
              {Object.keys(d?.os_counts ?? {}).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No agent OS data yet.</p>
              ) : (
                <div className="space-y-1">
                  {Object.entries(d!.os_counts!).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm border-b border-border/40 pb-1">
                      <span className="capitalize">{k}</span>
                      <span>{v as number}</span>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>
            <AdminSection title="Recent agents">
              {(d?.recent_agents ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No agents have checked in yet.</p>
              ) : (
                <div className="space-y-1 text-sm">
                  {d!.recent_agents!.slice(0, 15).map((a) => (
                    <div key={a.id} className="flex justify-between border-b border-border/40 pb-1">
                      <span>{a.hostname ?? a.id.slice(0, 8)}</span>
                      <Badge variant={a.status === 'online' ? 'default' : 'secondary'}>{a.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>
          </div>
        </PageState>
      </div>
    </div>
  );
}

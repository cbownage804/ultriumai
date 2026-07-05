/**
 * Admin → Platform Dashboard. Three-state (Loading / Empty / Active).
 * Never shows "0 / 0 / 0" tiles as if they meant something.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Activity } from 'lucide-react';

interface Overview {
  users?: number;
  orgs?: number;
  msps?: number;
  devices?: number;
  threats_24h?: number;
  rc_today?: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<Overview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<Overview>('dashboard')
      .then(setData)
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hasSignal =
    !!data &&
    (Number(data.users ?? 0) > 0 ||
      Number(data.orgs ?? 0) > 0 ||
      Number(data.msps ?? 0) > 0 ||
      Number(data.devices ?? 0) > 0 ||
      Number(data.threats_24h ?? 0) > 0 ||
      Number(data.rc_today ?? 0) > 0);

  return (
    <div>
      <AdminPageHeader title="Platform Dashboard" subtitle="Global health of the Wrayth platform" />
      <div className="p-6">
        {err && <div className="text-sm text-destructive mb-4">Failed: {err}</div>}
        <PageState
          isLoading={loading && !err}
          hasData={hasSignal}
          loading={
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          }
          empty={
            <RayZeroState
              icon={Activity}
              title="The platform is quiet — no live telemetry to summarize yet."
              body={
                <>
                  This dashboard aggregates real signals from every tenant: user counts,
                  organizations, MSPs, enrolled devices, threat detections, and Ray Compute
                  usage. Until customers begin using the platform there is nothing meaningful
                  to display — Wrayth won&rsquo;t pretend otherwise with a wall of zeros.
                </>
              }
              expectations={[
                'Live user, organization, and MSP counts across every tenant.',
                'Total enrolled devices reporting in from the Wrayth agent.',
                'Threats detected in the last 24 hours and Ray Compute consumed today.',
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <AdminMetricCard label="Users" value={data?.users ?? 0} />
            <AdminMetricCard label="Organizations" value={data?.orgs ?? 0} />
            <AdminMetricCard label="MSPs" value={data?.msps ?? 0} />
            <AdminMetricCard label="Devices" value={data?.devices ?? 0} />
            <AdminMetricCard label="Threats (24h)" value={data?.threats_24h ?? 0} />
            <AdminMetricCard label="RC used today" value={Number(data?.rc_today ?? 0).toLocaleString()} />
          </div>
        </PageState>
      </div>
    </div>
  );
}

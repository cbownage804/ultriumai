/**
 * Admin → Platform Command Center. Three-state (Loading / Empty / Active).
 * Never shows "0 / 0 / 0" tiles as if they meant something and never leaks
 * infrastructure terminology to the operator.
 */
import { useCallback, useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Button } from '@/components/ui/button';
import { Activity, AlertTriangle, RefreshCw } from 'lucide-react';
import { PlatformStatusStrip } from '@/components/admin/PlatformStatusStrip';

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
  const [retrying, setRetrying] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const result = await callAdmin<Overview>('dashboard');
      setData(result);
    } catch (e) {
      console.error('[admin-dashboard] telemetry fetch failed', e);
      setErr(
        "Ray couldn't reach the platform telemetry service. This is usually transient — the retry will pick it up automatically."
      );
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!err || retrying) return;
    const t = setTimeout(() => { setRetrying(true); load(); }, 5000);
    return () => clearTimeout(t);
  }, [err, retrying, load]);

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
      <AdminPageHeader title="Platform Command Center" subtitle="Global health of the Wrayth platform" />
      <div className="p-6 space-y-6">
        {/* Platform Health strip — always visible, driven by real service probes. */}
        <PlatformStatusStrip />

        {err && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">Unable to reach the telemetry service.</p>
              <p className="text-sm text-muted-foreground mt-1">{err}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setRetrying(true); load(); }}
              disabled={retrying}
              className="shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${retrying ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        )}

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
                  When customers begin using Wrayth this dashboard becomes your NOC.
                  Until then Wrayth won&rsquo;t pretend otherwise with a wall of zeros —
                  every tile below appears the moment its underlying signal starts flowing.
                </>
              }
              expectations={[
                'Active organizations, MSPs, and users across every tenant',
                'Devices checking in from the Wrayth agent',
                'Threats detected in the last 24 hours',
                'Ray Compute consumed today and running usage trend',
                'Fleet health: agent versions, offline endpoints, patch state',
                'Platform alerts and subscription growth',
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

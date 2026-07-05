import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { callAdmin('dashboard').then(setData).catch((e) => setErr(e.message)); }, []);

  return (
    <div>
      <AdminPageHeader title="Platform Dashboard" subtitle="Global health of the Wrayth platform" />
      <div className="p-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {err && <div className="col-span-6 text-sm text-destructive">Failed: {err}</div>}
        {!data && !err && Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        {data && (
          <>
            <AdminMetricCard label="Users" value={data.users} />
            <AdminMetricCard label="Organizations" value={data.orgs} />
            <AdminMetricCard label="MSPs" value={data.msps} />
            <AdminMetricCard label="Devices" value={data.devices} />
            <AdminMetricCard label="Threats (24h)" value={data.threats_24h} />
            <AdminMetricCard label="RC used today" value={data.rc_today.toLocaleString()} />
          </>
        )}
      </div>
    </div>
  );
}

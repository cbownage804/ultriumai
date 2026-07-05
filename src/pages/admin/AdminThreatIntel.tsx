import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function AdminThreatIntel() {
  const [d, setD] = useState<any>(null);
  useEffect(() => { callAdmin('threat.overview').then(setD).catch(() => setD({})); }, []);
  return (
    <div>
      <AdminPageHeader title="Global Threat Intelligence" subtitle="Aggregate view across every tenant" />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {!d ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />) : (
            <>
              <AdminMetricCard label="Alerts (24h)" value={d.alerts_24h ?? 0} />
              <AdminMetricCard label="Active threats" value={d.threats_active ?? 0} />
              <AdminMetricCard label="Phishing (24h)" value={d.phishing_24h ?? 0} />
            </>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <AdminSection title="Top CVEs">
            {!d ? <Skeleton className="h-32" /> :
              (d.top_cves ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No CVE data.</div> :
              <div className="space-y-1">
                {d.top_cves.slice(0, 10).map((v: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="font-mono">{v.cve_id}</span>
                    <Badge variant={v.severity === 'critical' ? 'destructive' : 'secondary'}>{v.severity ?? v.cvss_score}</Badge>
                  </div>
                ))}
              </div>
            }
          </AdminSection>
          <AdminSection title="Top attack paths">
            {!d ? <Skeleton className="h-32" /> :
              (d.top_attack_paths ?? []).length === 0 ? <div className="text-sm text-muted-foreground">No attack paths.</div> :
              <div className="space-y-1">
                {d.top_attack_paths.map((p: any) => (
                  <div key={p.id} className="flex justify-between text-sm">
                    <span>{p.name ?? p.id}</span>
                    <span className="text-xs text-muted-foreground">risk {p.risk_score ?? 0}</span>
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

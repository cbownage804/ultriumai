/**
 * Admin → Global Threat Intelligence. Three-state.
 */
import { useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { ShieldAlert } from 'lucide-react';

interface ThreatOverview {
  alerts_24h?: number;
  threats_active?: number;
  phishing_24h?: number;
  top_cves?: Array<{ cve_id: string; severity?: string; cvss_score?: number }>;
  top_attack_paths?: Array<{ id: string; name?: string; risk_score?: number }>;
}

export default function AdminThreatIntel() {
  const [d, setD] = useState<ThreatOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    callAdmin<ThreatOverview>('threat.overview')
      .then(setD)
      .catch(() => setD({}))
      .finally(() => setLoading(false));
  }, []);

  const hasSignal =
    !!d &&
    (Number(d.alerts_24h ?? 0) > 0 ||
      Number(d.threats_active ?? 0) > 0 ||
      Number(d.phishing_24h ?? 0) > 0 ||
      (d.top_cves ?? []).length > 0 ||
      (d.top_attack_paths ?? []).length > 0);

  return (
    <div>
      <AdminPageHeader title="Global Threat Intelligence" subtitle="Aggregate view across every tenant" />
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
              icon={ShieldAlert}
              title="No threats have been detected across the platform yet."
              body={
                <>
                  This dashboard aggregates real detections from every tenant&rsquo;s Wrayth
                  agents, email scanners, and identity monitors. Until threats actually land,
                  Wrayth won&rsquo;t fabricate a CVE list or an attack-path count.
                </>
              }
              expectations={[
                'Alerts triaged and active threats surfaced in the last 24 hours.',
                'Phishing detections aggregated from mailbox scanning.',
                'Top CVEs and attack paths ranked by real observation frequency.',
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <AdminMetricCard label="Alerts (24h)" value={d?.alerts_24h ?? 0} />
            <AdminMetricCard label="Active threats" value={d?.threats_active ?? 0} />
            <AdminMetricCard label="Phishing (24h)" value={d?.phishing_24h ?? 0} />
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <AdminSection title="Top CVEs">
              {(d?.top_cves ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No CVEs observed in this window.</p>
              ) : (
                <div className="space-y-1">
                  {d!.top_cves!.slice(0, 10).map((v, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="font-mono">{v.cve_id}</span>
                      <Badge variant={v.severity === 'critical' ? 'destructive' : 'secondary'}>
                        {v.severity ?? v.cvss_score}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </AdminSection>
            <AdminSection title="Top attack paths">
              {(d?.top_attack_paths ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No attack paths observed.</p>
              ) : (
                <div className="space-y-1">
                  {d!.top_attack_paths!.map((p) => (
                    <div key={p.id} className="flex justify-between text-sm">
                      <span>{p.name ?? p.id}</span>
                      <span className="text-xs text-muted-foreground">risk {p.risk_score ?? 0}</span>
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

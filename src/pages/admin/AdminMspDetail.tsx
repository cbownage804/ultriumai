/**
 * Admin → MSP detail workspace.
 *
 * Full drill-down for a single partner: identity, per-client health grid,
 * staff roster, and rolling revenue. Sourced from admin-api `msps.get`.
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { formatTier, tierBadgeVariant, relativeTime } from '@/lib/admin/labels';

interface MspDetail {
  msp: any;
  clients: any[];
  staff: any[];
  revenue: Array<{ id: string; amount: number; created_at: string; description?: string }>;
  totals: {
    clients: number;
    active_clients: number;
    endpoints: number;
    alerts: number;
    mrr: number;
    health: { healthy: number; warning: number; critical: number; unknown: number };
  };
}

const money = (n: number) => '$' + Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function AdminMspDetail() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [d, setD] = useState<MspDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    callAdmin<MspDetail>('msps.get', { id })
      .then((r) => setD(r))
      .catch(() => setD(null))
      .finally(() => setLoading(false));
  }, [id]);

  const name = d?.msp?.brand_name || d?.msp?.company_name || 'MSP';

  return (
    <div>
      <AdminPageHeader
        title={loading ? 'Loading…' : name}
        subtitle={d?.msp?.contact_email ?? undefined}
        actions={
          <Button variant="outline" size="sm" onClick={() => nav('/admin/msps')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> All MSPs
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : !d?.msp ? (
          <div className="text-sm text-muted-foreground">MSP not found.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={tierBadgeVariant(d.msp.subscription_tier)}>{formatTier(d.msp.subscription_tier)}</Badge>
              <Badge variant={d.msp.is_active === false ? 'secondary' : 'outline'}>
                {d.msp.is_active === false ? 'inactive' : 'active'}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Joined {relativeTime(d.msp.created_at)}
                {d.msp.domain ? ` · ${d.msp.domain}` : ''}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <AdminMetricCard label="Clients" value={`${d.totals.active_clients}/${d.totals.clients}`} hint="Active / total" />
              <AdminMetricCard label="Endpoints" value={d.totals.endpoints.toLocaleString()} />
              <AdminMetricCard label="Open alerts" value={d.totals.alerts.toLocaleString()} />
              <AdminMetricCard
                label="Attributed MRR"
                value={money(d.totals.mrr)}
                hint={d.totals.health.critical > 0 ? (
                  <span className="text-destructive inline-flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> {d.totals.health.critical} critical
                  </span>
                ) : 'All clients healthy'}
              />
            </div>

            <AdminSection title={`Clients (${d.clients.length})`}>
              {d.clients.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No clients onboarded under this MSP yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Billing</TableHead>
                      <TableHead className="text-right">Endpoints</TableHead>
                      <TableHead className="text-right">Alerts</TableHead>
                      <TableHead className="text-right">MRR</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.clients.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <div className="font-medium">{c.company_name}</div>
                          <div className="text-xs text-muted-foreground">{c.domain ?? c.contact_email ?? '—'}</div>
                        </TableCell>
                        <TableCell><HealthBadge state={c.health_status} /></TableCell>
                        <TableCell><Badge variant="outline" className="text-xs">{c.billing_status ?? 'unknown'}</Badge></TableCell>
                        <TableCell className="text-right font-mono text-sm">
                          {Number(c.endpoints ?? c.current_users ?? 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm">{Number(c.alerts ?? 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm">{money(Number(c.monthly_rate ?? 0))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </AdminSection>

            <div className="grid gap-4 md:grid-cols-2">
              <AdminSection title={`Staff (${d.staff.length})`}>
                {d.staff.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No staff members on this MSP.</p>
                ) : (
                  <div className="space-y-2">
                    {d.staff.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between text-sm border-b border-border/40 pb-2">
                        <div>
                          <div className="font-medium">{s.email ?? s.user_id}</div>
                          <div className="text-xs text-muted-foreground">{s.role ?? 'staff'}</div>
                        </div>
                        <span className="text-xs text-muted-foreground">{relativeTime(s.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </AdminSection>

              <AdminSection title="Revenue (last 60d)">
                {d.revenue.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic">No revenue events recorded.</p>
                ) : (
                  <div className="space-y-1 text-sm">
                    {d.revenue.slice(0, 12).map((r) => (
                      <div key={r.id} className="flex justify-between border-b border-border/40 py-1">
                        <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                        <span className="font-mono">{money(Number(r.amount ?? 0))}</span>
                      </div>
                    ))}
                  </div>
                )}
              </AdminSection>
            </div>

            <div className="text-xs text-muted-foreground pt-2 border-t border-border/50">
              MSP ID <code className="text-[11px]">{d.msp.id}</code> · <Link className="underline" to="/admin/msps">back to list</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function HealthBadge({ state }: { state?: string }) {
  const k = (state ?? '').toLowerCase();
  if (k === 'critical') return <Badge variant="destructive" className="text-xs">Critical</Badge>;
  if (k === 'warning') return <Badge className="text-xs bg-amber-500/20 text-amber-500 hover:bg-amber-500/20">Warning</Badge>;
  if (k === 'healthy') return <Badge className="text-xs bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20">Healthy</Badge>;
  return <Badge variant="outline" className="text-xs">Unknown</Badge>;
}

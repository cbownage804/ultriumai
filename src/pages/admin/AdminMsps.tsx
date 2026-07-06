/**
 * Admin → MSPs & Clients.
 *
 * Operational card grid: every MSP is a full account object with clients,
 * endpoints, alerts, MRR, and a critical-health indicator. Click through
 * to /admin/msps/:id for the full drill-down.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard } from '@/components/admin/AdminPrimitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { PageState } from '@/components/ui/page-state';
import { RayZeroState } from '@/components/ray/zero-state';
import { Briefcase, AlertTriangle, ChevronRight, Search } from 'lucide-react';
import { formatTier, tierBadgeVariant, relativeTime } from '@/lib/admin/labels';

interface MspSummary {
  id: string;
  name: string;
  tier: string;
  status: string;
  contact_email?: string;
  created_at?: string;
  clients_count: number;
  active_clients: number;
  endpoints: number;
  alerts: number;
  mrr: number;
  critical_clients: number;
  clients: Array<{ id: string; company_name: string; health_status?: string; is_active?: boolean }>;
}

const money = (n: number) => '$' + Number(n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });

export default function AdminMsps() {
  const [items, setItems] = useState<MspSummary[] | null>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    callAdmin<{ items: MspSummary[] }>('msps.list')
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]));
  }, []);

  const filtered = useMemo(() => {
    if (!items) return null;
    if (!q.trim()) return items;
    const needle = q.toLowerCase();
    return items.filter((m) => m.name.toLowerCase().includes(needle) || (m.contact_email ?? '').toLowerCase().includes(needle));
  }, [items, q]);

  const totals = useMemo(() => {
    const src = items ?? [];
    return {
      msps: src.length,
      clients: src.reduce((s, m) => s + m.clients_count, 0),
      endpoints: src.reduce((s, m) => s + m.endpoints, 0),
      mrr: src.reduce((s, m) => s + m.mrr, 0),
      critical: src.reduce((s, m) => s + m.critical_clients, 0),
    };
  }, [items]);

  return (
    <div>
      <AdminPageHeader
        title="MSPs & Clients"
        subtitle={items ? `${totals.msps} partners · ${totals.clients} downstream clients · ${totals.endpoints.toLocaleString()} endpoints` : 'Loading…'}
      />

      <div className="p-6 space-y-6">
        <PageState
          isLoading={items === null}
          hasData={(items?.length ?? 0) > 0}
          loading={
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
            </div>
          }
          empty={
            <RayZeroState
              icon={Briefcase}
              title="No MSP partners onboarded yet."
              body="MSPs appear here after they register through the reseller onboarding flow. Each MSP becomes a full workspace with its own clients, staff, and billing."
              expectations={[
                'Per-partner client counts, endpoints under management, and alert volume.',
                'Monthly recurring revenue rolled up from each MSP\u2019s downstream clients.',
                'Critical-health indicators so triage is one click away.',
              ]}
            />
          }
        >
          <div className="grid gap-4 md:grid-cols-4">
            <AdminMetricCard label="Partners" value={totals.msps} />
            <AdminMetricCard label="Downstream clients" value={totals.clients.toLocaleString()} />
            <AdminMetricCard label="Endpoints" value={totals.endpoints.toLocaleString()} />
            <AdminMetricCard
              label="MSP-attributed MRR"
              value={money(totals.mrr)}
              hint={totals.critical > 0 ? (
                <span className="text-destructive inline-flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> {totals.critical} critical client{totals.critical === 1 ? '' : 's'}
                </span>
              ) : 'All clients healthy'}
            />
          </div>

          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search MSPs by name or contact…"
              className="pl-9"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {(filtered ?? []).map((m) => (
              <Link key={m.id} to={`/admin/msps/${m.id}`} className="group">
                <Card className="h-full transition hover:border-primary/60 hover:shadow-md">
                  <CardHeader className="flex-row items-start justify-between space-y-0 pb-3">
                    <div className="min-w-0">
                      <CardTitle className="text-base truncate flex items-center gap-2">
                        {m.name}
                        {m.critical_clients > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" /> {m.critical_clients}
                          </span>
                        )}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {m.contact_email ?? 'No contact on file'} · joined {relativeTime(m.created_at)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={tierBadgeVariant(m.tier)}>{formatTier(m.tier)}</Badge>
                      <Badge variant={m.status === 'active' ? 'outline' : 'secondary'} className="text-[10px]">
                        {m.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <Stat label="Clients" value={`${m.active_clients}/${m.clients_count}`} />
                      <Stat label="Endpoints" value={m.endpoints.toLocaleString()} />
                      <Stat label="Alerts" value={m.alerts.toLocaleString()} />
                      <Stat label="MRR" value={money(m.mrr)} />
                    </div>
                    {m.clients.length > 0 && (
                      <div className="border-t border-border/50 pt-2 space-y-1">
                        {m.clients.slice(0, 3).map((c) => (
                          <div key={c.id} className="flex items-center justify-between text-xs">
                            <span className="truncate text-muted-foreground">{c.company_name}</span>
                            <HealthDot state={c.health_status} />
                          </div>
                        ))}
                        {m.clients_count > 3 && (
                          <div className="text-xs text-muted-foreground/70">+{m.clients_count - 3} more</div>
                        )}
                      </div>
                    )}
                    <div className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      Open workspace <ChevronRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
            {filtered && filtered.length === 0 && (
              <div className="col-span-2 text-sm text-muted-foreground text-center py-8">
                No MSPs match &ldquo;{q}&rdquo;.
              </div>
            )}
          </div>
        </PageState>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div className="text-sm font-semibold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function HealthDot({ state }: { state?: string }) {
  const k = (state ?? '').toLowerCase();
  const cls = k === 'critical'
    ? 'bg-destructive'
    : k === 'warning'
    ? 'bg-amber-500'
    : k === 'healthy'
    ? 'bg-emerald-500'
    : 'bg-muted-foreground/40';
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} title={state ?? 'unknown'} />;
}

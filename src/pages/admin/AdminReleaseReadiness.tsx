/**
 * Admin → Release Readiness cockpit.
 *
 * Single-glance page an operator can check before shipping a release or
 * responding to an incident. Aggregates platform health, recent errors,
 * open bugs/tickets, remediation reliability, feature flag rollout and
 * agent fleet adoption. Values come straight from admin-api → never fake.
 */
import { useCallback, useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { AdminPageHeader, AdminMetricCard, AdminSection } from '@/components/admin/AdminPrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertTriangle, XCircle, RefreshCw, Rocket, Bug, LifeBuoy, Flag, Server, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type StatusCheck = { id: string; label: string; status: 'ok' | 'degraded' | 'down' | 'not_configured'; detail?: string };

interface Readiness {
  generated_at: string;
  verdict: 'ready' | 'watch' | 'hold';
  reasons: string[];
  status_checks: StatusCheck[];
  errors: { platform_24h: number; builder_24h: number; recent: Array<any> };
  incidents: { bugs_open: number; tickets_open: number };
  remediation: { failed_24h: number; completed_24h: number };
  flags: Array<{ id: string; key?: string; enabled?: boolean; rollout_percentage?: number; updated_at?: string }>;
  release: {
    latest: { version?: string; channel?: string; published_at?: string; notes?: string } | null;
    active_devices: number;
    on_latest: number;
    adoption_pct: number | null;
  };
}

const VERDICT_MAP: Record<Readiness['verdict'], { label: string; className: string; icon: JSX.Element }> = {
  ready: { label: 'Ready to ship', className: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', icon: <CheckCircle2 className="h-4 w-4" /> },
  watch: { label: 'Ship with caution', className: 'bg-amber-500/15 text-amber-500 border-amber-500/30', icon: <AlertTriangle className="h-4 w-4" /> },
  hold:  { label: 'Hold the release', className: 'bg-destructive/15 text-destructive border-destructive/30', icon: <XCircle className="h-4 w-4" /> },
};

const STATUS_DOT: Record<StatusCheck['status'], string> = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-destructive',
  not_configured: 'bg-muted-foreground/40',
};

export default function AdminReleaseReadiness() {
  const [data, setData] = useState<Readiness | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const result = await callAdmin<Readiness>('release.readiness');
      setData(result);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div>
        <AdminPageHeader title="Release Readiness" subtitle="Single-glance signal before you ship." />
        <div className="p-6 space-y-4">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (err || !data) {
    return (
      <div>
        <AdminPageHeader title="Release Readiness" />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 flex items-start gap-3">
              <XCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">Couldn't load readiness signals</div>
                <div className="text-sm text-muted-foreground mt-1">{err ?? 'No data returned.'}</div>
              </div>
              <Button onClick={load} size="sm"><RefreshCw className="h-4 w-4 mr-2" />Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const verdict = VERDICT_MAP[data.verdict];
  const release = data.release.latest;

  return (
    <div>
      <AdminPageHeader
        title="Release Readiness"
        subtitle={`Generated ${formatDistanceToNow(new Date(data.generated_at), { addSuffix: true })}`}
        actions={
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {/* Verdict banner */}
        <div className={`rounded-lg border p-4 flex items-start gap-3 ${verdict.className}`}>
          <div className="mt-0.5">{verdict.icon}</div>
          <div className="flex-1">
            <div className="font-semibold flex items-center gap-2">
              <Rocket className="h-4 w-4" /> {verdict.label}
            </div>
            {data.reasons.length > 0 ? (
              <ul className="text-sm mt-1 list-disc list-inside space-y-0.5">
                {data.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            ) : (
              <div className="text-sm mt-1 opacity-80">All monitored signals are green over the last 24 hours.</div>
            )}
          </div>
        </div>

        {/* Headline metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <AdminMetricCard
            label="Platform errors (24h)"
            value={data.errors.platform_24h}
            hint={data.errors.builder_24h > 0 ? `${data.errors.builder_24h} builder failures` : 'No builder failures'}
          />
          <AdminMetricCard
            label="Open incidents"
            value={data.incidents.bugs_open + data.incidents.tickets_open}
            hint={`${data.incidents.bugs_open} bugs · ${data.incidents.tickets_open} tickets`}
          />
          <AdminMetricCard
            label="Remediations (24h)"
            value={`${data.remediation.completed_24h} ✓`}
            hint={data.remediation.failed_24h > 0 ? `${data.remediation.failed_24h} failed` : 'No failures'}
          />
          <AdminMetricCard
            label="Fleet on latest"
            value={data.release.adoption_pct !== null ? `${data.release.adoption_pct}%` : '—'}
            hint={`${data.release.on_latest} / ${data.release.active_devices} devices`}
          />
        </div>

        {/* Status strip */}
        <AdminSection title="Platform status">
          {data.status_checks.length === 0 ? (
            <div className="text-sm text-muted-foreground">No checks reported.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {data.status_checks.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${STATUS_DOT[c.status]}`} />
                    <span className="text-sm font-medium">{c.label}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate max-w-[50%]">
                    {c.detail ?? c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminSection>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent errors */}
          <AdminSection title="Recent errors (7d)">
            {data.errors.recent.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> No platform errors recorded.
              </div>
            ) : (
              <ul className="space-y-2">
                {data.errors.recent.map((e: any) => (
                  <li key={e.id} className="rounded-md border border-border/60 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium truncate">{e.error_type ?? 'error'}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {e.created_at ? formatDistanceToNow(new Date(e.created_at), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{e.error_message ?? e.source ?? ''}</div>
                    {e.severity && (
                      <Badge variant="outline" className="mt-1 text-[10px]">{e.severity}</Badge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>

          {/* Feature flag rollout */}
          <AdminSection title="Feature flag rollout">
            {data.flags.length === 0 ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Flag className="h-4 w-4" /> No feature flags defined.
              </div>
            ) : (
              <ul className="space-y-1">
                {data.flags.slice(0, 10).map((f) => (
                  <li key={f.id} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-block h-2 w-2 rounded-full ${f.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`} />
                      <span className="text-sm font-mono truncate">{f.key ?? f.id}</span>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {f.enabled ? `${f.rollout_percentage ?? 100}%` : 'off'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </AdminSection>
        </div>

        {/* Agent release */}
        <AdminSection title="Agent release">
          {!release ? (
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Server className="h-4 w-4" /> No agent release has been published yet.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="font-mono">{release.version ?? 'unknown'}</Badge>
                {release.channel && <Badge variant="outline">{release.channel}</Badge>}
                {release.published_at && (
                  <span className="text-xs text-muted-foreground">
                    Published {formatDistanceToNow(new Date(release.published_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              {release.notes && <div className="text-sm text-muted-foreground whitespace-pre-wrap">{release.notes}</div>}
              {data.release.adoption_pct !== null && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Fleet adoption · {data.release.on_latest} of {data.release.active_devices}
                  </div>
                  <div className="h-2 rounded bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${data.release.adoption_pct}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminSection>

        {/* Incidents shortcut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <AdminSection title="Open bugs" actions={<Bug className="h-4 w-4 text-muted-foreground" />}>
            <div className="text-3xl font-bold">{data.incidents.bugs_open}</div>
            <div className="text-xs text-muted-foreground mt-1">Reports awaiting triage or in progress.</div>
          </AdminSection>
          <AdminSection title="Open support tickets" actions={<LifeBuoy className="h-4 w-4 text-muted-foreground" />}>
            <div className="text-3xl font-bold">{data.incidents.tickets_open}</div>
            <div className="text-xs text-muted-foreground mt-1">Customer conversations still awaiting response.</div>
          </AdminSection>
        </div>

        {data.remediation.failed_24h > 0 && (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 p-3 text-sm flex items-start gap-2">
            <Zap className="h-4 w-4 mt-0.5" />
            <div>
              <strong>{data.remediation.failed_24h}</strong> remediation actions failed in the last 24 hours. Investigate before rolling out new agent versions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

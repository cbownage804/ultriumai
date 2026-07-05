/**
 * Platform Status strip for the Admin Command Center.
 *
 * Renders REAL health probes from admin-api → 'platform.status'. Never fakes
 * a green light: services that aren't configured render as neutral, not ok.
 */
import { useCallback, useEffect, useState } from 'react';
import { callAdmin } from '@/hooks/usePlatformRole';
import { cn } from '@/lib/utils';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ServiceStatus = 'ok' | 'degraded' | 'down' | 'not_configured';

interface Check {
  id: string;
  label: string;
  status: ServiceStatus;
  detail?: string;
}

interface StatusPayload {
  checks: Check[];
  checked_at: string;
}

const DOT: Record<ServiceStatus, string> = {
  ok: 'bg-emerald-500 shadow-[0_0_10px_hsl(160_84%_45%/0.55)]',
  degraded: 'bg-amber-500 shadow-[0_0_10px_hsl(38_92%_50%/0.55)]',
  down: 'bg-red-500 shadow-[0_0_10px_hsl(0_84%_60%/0.55)]',
  not_configured: 'bg-muted-foreground/40',
};

const LABEL: Record<ServiceStatus, string> = {
  ok: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
  not_configured: 'Not configured',
};

export function PlatformStatusStrip() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await callAdmin<StatusPayload>('platform.status');
      setChecks(result.checks);
      setCheckedAt(result.checked_at);
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // gentle 1-min refresh
    return () => clearInterval(t);
  }, [load]);

  const overall: ServiceStatus | null = checks
    ? checks.some((c) => c.status === 'down')
      ? 'down'
      : checks.some((c) => c.status === 'degraded')
        ? 'degraded'
        : checks.some((c) => c.status === 'ok')
          ? 'ok'
          : 'not_configured'
    : null;

  return (
    <section className="rounded-xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="h-4 w-4 text-muted-foreground shrink-0" />
          <h2 className="text-xs uppercase tracking-[0.22em] text-muted-foreground truncate">
            Platform Status
          </h2>
          {overall && (
            <span
              className={cn(
                'ml-2 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest border',
                overall === 'ok' && 'border-emerald-500/40 text-emerald-400',
                overall === 'degraded' && 'border-amber-500/40 text-amber-400',
                overall === 'down' && 'border-red-500/40 text-red-400',
                overall === 'not_configured' && 'border-border text-muted-foreground',
              )}
            >
              {overall === 'ok' && 'All systems operational'}
              {overall === 'degraded' && 'Degraded performance'}
              {overall === 'down' && 'Service disruption'}
              {overall === 'not_configured' && 'Setup incomplete'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground shrink-0">
          {checkedAt && !error && (
            <span>Checked {new Date(checkedAt).toLocaleTimeString()}</span>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => { setRefreshing(true); load(); }}
            disabled={refreshing || loading}
          >
            <RefreshCw className={cn('h-3 w-3', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-muted-foreground">
          Ray couldn&rsquo;t run the platform health checks just now. Retrying automatically on the next tick.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {loading && !checks
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-11 rounded-md bg-muted/30 animate-pulse" />
              ))
            : checks!.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-2 rounded-md border border-border/60 bg-background/40 px-3 py-2"
                  title={c.detail}
                >
                  <span className={cn('h-2 w-2 rounded-full shrink-0', DOT[c.status])} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-foreground truncate">{c.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {LABEL[c.status]}
                      {c.detail && c.status !== 'ok' ? ` · ${c.detail}` : ''}
                    </div>
                  </div>
                </div>
              ))}
        </div>
      )}
    </section>
  );
}

/**
 * DeviceSecurityHistory — 30-day chronological security feed for a
 * single device. Groups events by day and blends three sources:
 *   1. wrayth_device_actions   (queued/executed remediations)
 *   2. ray_events              (posture/detection events tagged with
 *                               this device's hostname in the payload)
 *   3. Derived milestones      (first enrollment, last check-in)
 *
 * Failures reading any one source degrade gracefully — the other
 * streams still render.
 */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import {
  Activity, CheckCircle2, XCircle, Loader2, Wifi, AlertTriangle,
  History, RotateCw, ShieldCheck, ShieldAlert, PlayCircle,
} from 'lucide-react';

interface Props {
  deviceId: string;
  hostname: string;
  lastSeenAt: string | null;
  createdAt?: string | null;
}

interface FeedItem {
  key: string;
  occurredAt: string;
  kind: 'action' | 'event' | 'milestone';
  severity: 'info' | 'warn' | 'critical' | 'success';
  title: string;
  detail?: string;
  meta?: string[];
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function severityColor(sev: FeedItem['severity']): string {
  if (sev === 'critical') return 'text-red-200';
  if (sev === 'warn') return 'text-yellow-200';
  if (sev === 'success') return 'text-emerald-200';
  return 'text-muted-foreground';
}

function iconFor(item: FeedItem) {
  if (item.kind === 'milestone') return <Wifi className="h-3.5 w-3.5 text-violet-300" />;
  if (item.kind === 'action') {
    if (item.severity === 'success') return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
    if (item.severity === 'critical') return <XCircle className="h-3.5 w-3.5 text-red-300" />;
    return <PlayCircle className="h-3.5 w-3.5 text-yellow-300" />;
  }
  if (item.severity === 'critical') return <ShieldAlert className="h-3.5 w-3.5 text-red-300" />;
  if (item.severity === 'warn') return <AlertTriangle className="h-3.5 w-3.5 text-yellow-300" />;
  if (item.severity === 'success') return <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />;
  return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function DeviceSecurityHistory({ deviceId, hostname, lastSeenAt, createdAt }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<FeedItem[]>([]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const sinceIso = new Date(Date.now() - 30 * 86_400_000).toISOString();

      const actionsPromise = supabase
        .from('wrayth_device_actions')
        .select('id, action_type, status, risk_level, requires_reboot, rollback_possible, requested_at, completed_at, previous_value, new_value, error')
        .eq('device_id', deviceId)
        .gte('requested_at', sinceIso)
        .order('requested_at', { ascending: false })
        .limit(80);

      // ray_events uses opaque entity IDs; we filter loosely by
      // hostname in the payload so we don't need the graph join here.
      const eventsPromise = supabase
        .from('ray_events')
        .select('id, event_type, severity, title, body, payload, occurred_at')
        .gte('occurred_at', sinceIso)
        .or(`payload->>device_id.eq.${deviceId},payload->>hostname.eq.${hostname}`)
        .order('occurred_at', { ascending: false })
        .limit(80);

      const [actionsRes, eventsRes] = await Promise.all([actionsPromise, eventsPromise]);
      if (cancelled) return;

      const feed: FeedItem[] = [];

      for (const a of (actionsRes.data ?? []) as any[]) {
        const when = a.completed_at || a.requested_at;
        const severity: FeedItem['severity'] =
          a.status === 'succeeded' ? 'success'
          : a.status === 'failed' ? 'critical'
          : 'info';
        const meta: string[] = [];
        if (a.risk_level && a.risk_level !== 'low') meta.push(a.risk_level);
        if (a.requires_reboot) meta.push('reboot');
        if (a.rollback_possible) meta.push('reversible');
        feed.push({
          key: `a_${a.id}`,
          occurredAt: when,
          kind: 'action',
          severity,
          title: String(a.action_type).replace(/_/g, ' '),
          detail: a.error
            || (a.previous_value || a.new_value
              ? `${a.previous_value ? JSON.stringify(a.previous_value).slice(0, 40) : ''}${a.previous_value && a.new_value ? ' → ' : ''}${a.new_value ? JSON.stringify(a.new_value).slice(0, 40) : ''}`
              : undefined),
          meta,
        });
      }

      for (const e of (eventsRes.data ?? []) as any[]) {
        const sev: FeedItem['severity'] =
          e.severity === 'critical' ? 'critical'
          : e.severity === 'warn' || e.severity === 'warning' ? 'warn'
          : e.severity === 'success' || e.severity === 'ok' ? 'success'
          : 'info';
        feed.push({
          key: `e_${e.id}`,
          occurredAt: e.occurred_at,
          kind: 'event',
          severity: sev,
          title: e.title || String(e.event_type).replace(/_/g, ' '),
          detail: e.body || undefined,
        });
      }

      if (lastSeenAt) {
        feed.push({
          key: 'm_lastseen',
          occurredAt: lastSeenAt,
          kind: 'milestone',
          severity: 'info',
          title: 'Agent check-in',
          detail: `Posture snapshot uploaded ${ago(lastSeenAt)}`,
        });
      }
      if (createdAt) {
        feed.push({
          key: 'm_enrolled',
          occurredAt: createdAt,
          kind: 'milestone',
          severity: 'success',
          title: 'Device enrolled with Ray',
        });
      }

      feed.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
      setItems(feed);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, deviceId, hostname, lastSeenAt, createdAt]);

  const grouped = useMemo(() => {
    const map = new Map<string, FeedItem[]>();
    for (const it of items) {
      const k = dayKey(it.occurredAt);
      const list = map.get(k) ?? [];
      list.push(it);
      map.set(k, list);
    }
    return Array.from(map.entries());
  }, [items]);

  return (
    <div className="border-t border-border/60 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] text-violet-200/80 hover:text-violet-100 flex items-center gap-1"
      >
        <History className="h-3 w-3" />
        {open ? 'Hide 30-day security history' : 'Show 30-day security history'}
      </button>

      {open && (
        <div className="mt-3 space-y-4 text-[12px]">
          {loading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Rebuilding this device's history…
            </div>
          )}
          {!loading && items.length === 0 && (
            <div className="text-muted-foreground">
              Nothing has happened on this device in the last 30 days. Ray will fill this in as actions run and detections fire.
            </div>
          )}
          {!loading && grouped.map(([day, list]) => (
            <div key={day}>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70 mb-1.5">{day}</div>
              <div className="space-y-1.5 border-l border-border/50 pl-3">
                {list.map((it) => (
                  <div key={it.key} className="rounded border border-border/40 bg-background/30 p-2">
                    <div className="flex items-center gap-2">
                      {iconFor(it)}
                      <span className={`font-medium ${severityColor(it.severity)}`}>{it.title}</span>
                      {it.meta?.map((m) => (
                        <Badge key={m} variant="outline" className="text-[9px] border-border/60">
                          {m === 'reversible' && <RotateCw className="h-2.5 w-2.5 mr-0.5" />}
                          {m}
                        </Badge>
                      ))}
                      <span className="ml-auto text-muted-foreground text-[10px]">{ago(it.occurredAt)}</span>
                    </div>
                    {it.detail && (
                      <div className="mt-1 text-muted-foreground text-[11px] break-words">{it.detail}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DeviceSecurityHistory;

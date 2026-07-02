/**
 * DeviceTimeline — chronological view of device events: check-ins,
 * findings, and every queued/executed action with its audit trail
 * (previous_value → new_value, rollback availability, reboot flag).
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, CheckCircle2, XCircle, RotateCw, Wifi, AlertTriangle } from 'lucide-react';

interface ActionRow {
  id: string;
  action_type: string;
  status: string;
  risk_level: string | null;
  requires_reboot: boolean | null;
  rollback_possible: boolean | null;
  requested_at: string;
  completed_at: string | null;
  previous_value: any;
  new_value: any;
  error: string | null;
}

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)}h ago`;
  return `${Math.round(diff / 86_400_000)}d ago`;
}

export function DeviceTimeline({ deviceId, lastSeenAt }: { deviceId: string; lastSeenAt: string | null }) {
  const [actions, setActions] = useState<ActionRow[] | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const { data } = await supabase
        .from('wrayth_device_actions')
        .select('id, action_type, status, risk_level, requires_reboot, rollback_possible, requested_at, completed_at, previous_value, new_value, error')
        .eq('device_id', deviceId)
        .order('requested_at', { ascending: false })
        .limit(15);
      setActions((data ?? []) as ActionRow[]);
    })();
  }, [deviceId, open]);

  return (
    <div className="border-t border-border/60 pt-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-[11px] text-violet-200/80 hover:text-violet-100 flex items-center gap-1"
      >
        <Activity className="h-3 w-3" /> {open ? 'Hide timeline' : 'Show device timeline'}
      </button>
      {open && (
        <div className="mt-2 space-y-1.5 text-[11px]">
          {lastSeenAt && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Wifi className="h-3 w-3 text-emerald-300" /> Last check-in {ago(lastSeenAt)}
            </div>
          )}
          {actions === null && <div className="flex items-center gap-1 text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>}
          {actions?.length === 0 && <div className="text-muted-foreground">No actions have been queued for this device yet.</div>}
          {actions?.map((a) => {
            const icon = a.status === 'succeeded' ? <CheckCircle2 className="h-3 w-3 text-emerald-300" />
              : a.status === 'failed' ? <XCircle className="h-3 w-3 text-red-300" />
              : <Loader2 className="h-3 w-3 animate-spin text-yellow-300" />;
            return (
              <div key={a.id} className="rounded border border-border/40 bg-background/30 p-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <span className="font-medium">{a.action_type.replace(/_/g, ' ')}</span>
                  {a.risk_level && a.risk_level !== 'low' && (
                    <Badge variant="outline" className={`text-[9px] ${a.risk_level === 'high' ? 'border-red-500/40 text-red-200' : 'border-yellow-500/40 text-yellow-200'}`}>
                      {a.risk_level}
                    </Badge>
                  )}
                  {a.requires_reboot && <Badge variant="outline" className="text-[9px] border-yellow-500/40 text-yellow-200">reboot</Badge>}
                  {a.rollback_possible && <Badge variant="outline" className="text-[9px] border-emerald-500/40 text-emerald-200"><RotateCw className="h-2.5 w-2.5 mr-0.5" />reversible</Badge>}
                  <span className="ml-auto text-muted-foreground">{ago(a.completed_at || a.requested_at)}</span>
                </div>
                {a.error && (
                  <div className="mt-1 flex items-start gap-1 text-red-200/90">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" /> {a.error}
                  </div>
                )}
                {(a.previous_value || a.new_value) && (
                  <div className="mt-1 text-muted-foreground">
                    {a.previous_value && <span>before: <code className="text-foreground/80">{JSON.stringify(a.previous_value).slice(0, 60)}</code></span>}
                    {a.previous_value && a.new_value && <span> → </span>}
                    {a.new_value && <span>after: <code className="text-foreground/80">{JSON.stringify(a.new_value).slice(0, 60)}</code></span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default DeviceTimeline;

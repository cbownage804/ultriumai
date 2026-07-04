/**
 * RemediationDispatchButton — one-click Fix It for a Ray remediation.
 * Opens a device picker (loads user's enrolled Wrayth devices), then calls
 * `agent-action-request` to queue the action. High-risk items surface an
 * inline impact confirmation dialog before dispatch.
 */
import { useEffect, useState } from 'react';
import { Loader2, MonitorSmartphone, Sparkles, AlertTriangle, ShieldCheck, RotateCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Remediation } from '@/lib/ray/remediations/catalog';

interface DeviceRow {
  id: string;
  hostname: string | null;
  os: string | null;
  last_seen_at: string | null;
  revoked_at: string | null;
}

async function dispatch(deviceId: string, r: Remediation, confirmed: boolean) {
  const { data, error } = await supabase.functions.invoke('agent-action-request', {
    body: {
      device_id: deviceId,
      action_type: r.action_type,
      params: r.defaultParams ?? {},
      confirmed,
    },
  });
  if (error) throw error;
  if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
  return data;
}

export function RemediationDispatchButton({
  remediation,
  size = 'sm',
  variant = 'outline',
  label,
  className,
}: {
  remediation: Remediation;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  label?: string;
  className?: string;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<DeviceRow[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !user?.id) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('wrayth_devices')
        .select('id, hostname, os, last_seen_at, revoked_at')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .order('last_seen_at', { ascending: false });
      if (cancelled) return;
      const rows = (data as DeviceRow[]) ?? [];
      setDevices(rows);
      if (rows.length === 1) setSelectedId(rows[0].id);
    })();
    return () => { cancelled = true; };
  }, [open, user?.id]);

  const isHigh = remediation.risk === 'high';

  const confirmAndRun = async () => {
    if (!selectedId) return;
    setBusy(true);
    try {
      await dispatch(selectedId, remediation, isHigh);
      toast.success(`Queued: ${remediation.title}`, {
        description: 'Runs on the next agent check-in (~30 seconds).',
      });
      setOpen(false);
      setSelectedId(null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      if (msg === 'confirmation_required') {
        toast.error('This action needs explicit confirmation — try again.');
      } else if (msg.startsWith('preflight_blocked')) {
        toast.error("Ray refused to run this — a safety preflight failed.");
      } else {
        toast.error(`Couldn't queue: ${msg}`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className={className}>
          <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-300" />
          {label ?? 'Fix it'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isHigh ? <AlertTriangle className="h-4 w-4 text-amber-400" /> : <ShieldCheck className="h-4 w-4 text-violet-300" />}
            {remediation.title}
          </DialogTitle>
          <DialogDescription>{remediation.why}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline" className={cn(
              'text-[10px] uppercase',
              remediation.risk === 'high' && 'border-red-500/40 text-red-300',
              remediation.risk === 'medium' && 'border-amber-500/40 text-amber-200',
              remediation.risk === 'low' && 'border-emerald-500/40 text-emerald-200',
            )}>
              {remediation.risk} risk
            </Badge>
            {remediation.reversible && (
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-200">
                <RotateCw className="h-2.5 w-2.5 mr-0.5" /> reversible
              </Badge>
            )}
            {remediation.requiresReboot && (
              <Badge variant="outline" className="text-[10px] border-yellow-500/40 text-yellow-200">
                may reboot
              </Badge>
            )}
          </div>

          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
              <MonitorSmartphone className="h-3 w-3" /> Choose a device
            </div>
            {devices === null ? (
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your devices…
              </div>
            ) : devices.length === 0 ? (
              <div className="rounded border border-dashed border-border p-3 text-sm text-muted-foreground">
                No enrolled devices yet. Install the Wrayth agent first.
              </div>
            ) : (
              <ul className="space-y-1 max-h-56 overflow-y-auto">
                {devices.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(d.id)}
                      className={cn(
                        'w-full text-left rounded border px-3 py-2 text-sm transition-colors',
                        selectedId === d.id
                          ? 'border-violet-400/60 bg-violet-500/10'
                          : 'border-border bg-background/40 hover:border-violet-400/40',
                      )}
                    >
                      <div className="font-medium truncate">{d.hostname ?? 'Unnamed device'}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.os ?? 'Windows'} · {d.last_seen_at
                          ? `seen ${formatDistanceToNow(new Date(d.last_seen_at), { addSuffix: true })}`
                          : 'never seen'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isHigh && (
            <div className="rounded border border-amber-500/40 bg-amber-500/5 p-2.5 text-[12px] text-amber-100">
              <div className="flex items-center gap-1.5 font-medium mb-1">
                <AlertTriangle className="h-3.5 w-3.5" /> High-risk action
              </div>
              This change can disrupt access.{' '}
              {remediation.reversible ? "It's reversible from the catalog." : "It cannot be automatically undone."}
              {remediation.requiresReboot && ' The device may reboot to complete.'}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
          <Button onClick={confirmAndRun} disabled={!selectedId || busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-1.5" />}
            {isHigh ? 'Confirm and queue' : 'Queue fix'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RemediationDispatchButton;

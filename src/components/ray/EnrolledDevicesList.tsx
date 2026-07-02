/**
 * EnrolledDevicesList — surfaces every Wrayth agent this user has
 * installed, along with the most recent posture findings. Ray narrates
 * the state instead of dumping a raw table.
 */
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Cpu,
  Loader2,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeviceActionsMenu } from './DeviceActionsMenu';

interface Finding {
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
}

interface Device {
  id: string;
  hostname: string;
  os: string;
  os_version: string | null;
  agent_version: string;
  last_seen_at: string | null;
  revoked_at: string | null;
  findings: Finding[];
}

function relative(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)} h ago`;
  return `${Math.round(diff / 86_400_000)} d ago`;
}

export function EnrolledDevicesList() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    const { data: rows, error } = await supabase
      .from('wrayth_devices')
      .select('id, hostname, os, os_version, agent_version, last_seen_at, revoked_at')
      .order('last_seen_at', { ascending: false, nullsFirst: false });
    if (error) {
      toast.error("I couldn't load your devices", { description: error.message });
      setDevices([]);
      return;
    }
    const { data: posture } = await supabase
      .from('wrayth_device_posture')
      .select('device_id, findings');
    const byDevice = new Map<string, Finding[]>();
    for (const p of posture ?? []) {
      byDevice.set(p.device_id, (p.findings as unknown as Finding[]) ?? []);
    }
    setDevices(
      (rows ?? []).map((r) => ({ ...r, findings: byDevice.get(r.id) ?? [] })),
    );
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel('wrayth-devices-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wrayth_devices' },
        () => load(),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wrayth_device_posture' },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const revoke = async (id: string) => {
    setRevokingId(id);
    try {
      const { error } = await supabase.functions.invoke('agent-revoke', {
        body: { device_id: id },
      });
      if (error) throw error;
      toast.success('Device revoked', {
        description: "It'll stop reporting on its next check-in.",
      });
      load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      toast.error("Couldn't revoke that device", { description: msg });
    } finally {
      setRevokingId(null);
    }
  };

  if (devices === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Checking your devices…
      </div>
    );
  }
  if (devices.length === 0) return null;

  return (
    <Card className="border-border/60 bg-card/60">
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Cpu className="h-4 w-4 text-violet-300" />
          Your devices
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {devices.map((d) => {
          const online =
            !d.revoked_at &&
            d.last_seen_at &&
            Date.now() - new Date(d.last_seen_at).getTime() < 2 * 3600_000;
          const criticals = d.findings.filter((f) => f.severity === 'critical');
          const warns = d.findings.filter((f) => f.severity === 'warn');
          return (
            <div
              key={d.id}
              className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">
                      {d.hostname}
                    </span>
                    {d.revoked_at ? (
                      <Badge variant="outline" className="text-xs">revoked</Badge>
                    ) : online ? (
                      <Badge className="bg-emerald-500/20 text-emerald-200 border-emerald-500/30 text-xs">
                        <Wifi className="mr-1 h-3 w-3" /> online
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        <WifiOff className="mr-1 h-3 w-3" /> quiet
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {d.os} · agent v{d.agent_version} · last seen {relative(d.last_seen_at)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={revokingId === d.id || !!d.revoked_at}
                  onClick={() => revoke(d.id)}
                  className="text-muted-foreground hover:text-red-300"
                >
                  {revokingId === d.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {d.findings.length > 0 && (
                <div className="space-y-1.5">
                  {criticals.length + warns.length === 0 ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-200">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      {d.findings[0].title}
                    </div>
                  ) : (
                    [...criticals, ...warns].slice(0, 3).map((f, i) => (
                      <div
                        key={i}
                        className={
                          'flex items-start gap-2 text-xs ' +
                          (f.severity === 'critical'
                            ? 'text-red-200'
                            : 'text-yellow-200')
                        }
                      >
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>
                          <span className="font-medium">{f.title}</span>{' '}
                          <span className="text-muted-foreground">{f.detail}</span>
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default EnrolledDevicesList;

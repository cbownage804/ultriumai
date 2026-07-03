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
  HardDrive,
  Lock,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeviceActionsMenu } from './DeviceActionsMenu';
import { DeviceSecurityTabs } from './DeviceSecurityTabs';
import { RayFixPanel } from './RayFixPanel';
import { DeviceTimeline } from './DeviceTimeline';
import { AgentVersionBadge } from './AgentVersionBadge';
import { AgentTrustCard } from './AgentTrustCard';

interface Finding {
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
}

interface FixStep { action_type: string; label: string; params?: Record<string, unknown>; severity: 'critical' | 'warn' }
interface Posture {
  disk_encryption?: { enabled?: boolean; percent_encrypted?: number; method?: string };
  firewall?: { enabled?: boolean; all_profiles_enabled?: boolean; profiles?: Record<string, boolean> };
  antivirus?: { enabled?: boolean; realtime_protection?: boolean; definitions_age_days?: number };
  tpm?: { present?: boolean; ready?: boolean };
  secure_boot?: { enabled?: boolean; supported?: boolean };
  uac?: { enabled?: boolean };
  remote_desktop?: { enabled?: boolean };
  local_admins?: { count?: number };
  local_admins_detail?: Array<{ name: string; enabled?: boolean; is_builtin?: boolean }>;
  disk?: { free_gb?: number; total_gb?: number };
  memory?: { free_gb?: number; total_gb?: number };
  pending_updates?: number;
  last_patch_at?: string;
  rdp_security?: { rdp_enabled?: boolean; nla_enabled?: boolean; remote_assistance_enabled?: boolean };
  browser_passwords?: {
    chrome?: { manager_disabled_by_policy?: boolean; stored_count?: number };
    edge?: { manager_disabled_by_policy?: boolean; stored_count?: number };
  };
  defender_detail?: { cloud_protection?: boolean; pua_protection?: boolean; last_quick_scan?: string; last_full_scan?: string };
  update_categories?: { security?: number; drivers?: number; feature?: number; office?: number; other?: number };
  _ray?: { score?: number; fix_plan?: FixStep[] };
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
  posture: Posture | null;
  posture_captured_at: string | null;
}

function relative(iso: string | null): string {
  if (!iso) return 'never';
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3600_000) return `${Math.round(diff / 60_000)} min ago`;
  if (diff < 86_400_000) return `${Math.round(diff / 3600_000)} h ago`;
  return `${Math.round(diff / 86_400_000)} d ago`;
}

type PostureTone = 'good' | 'warn' | 'bad' | 'unknown';

function PostureChip({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: PostureTone;
}) {
  const toneClass =
    tone === 'good'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'warn'
      ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-100'
      : tone === 'bad'
      ? 'border-red-500/30 bg-red-500/10 text-red-100'
      : 'border-border/60 bg-background/40 text-muted-foreground';
  return (
    <div className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-xs ${toneClass}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide opacity-70">{label}</div>
        <div className="truncate font-medium">{value}</div>
      </div>
    </div>
  );
}

function buildPostureChips(p: Posture): Array<{
  icon: typeof ShieldCheck;
  label: string;
  value: string;
  tone: PostureTone;
}> {
  const chips: Array<{ icon: typeof ShieldCheck; label: string; value: string; tone: PostureTone }> = [];

  if (p.disk_encryption) {
    const pct = p.disk_encryption.percent_encrypted;
    chips.push({
      icon: Lock,
      label: 'BitLocker',
      value: p.disk_encryption.enabled
        ? `On${typeof pct === 'number' && pct < 100 ? ` (${pct}%)` : ''}`
        : 'Off',
      tone: p.disk_encryption.enabled ? 'good' : 'bad',
    });
  }
  if (p.firewall) {
    const off = p.firewall.profiles
      ? Object.entries(p.firewall.profiles).filter(([, v]) => !v).map(([k]) => k)
      : [];
    chips.push({
      icon: ShieldCheck,
      label: 'Firewall',
      value: !p.firewall.enabled
        ? 'Off'
        : off.length
        ? `${off.join(', ')} off`
        : 'All profiles on',
      tone: !p.firewall.enabled ? 'bad' : off.length ? 'warn' : 'good',
    });
  }
  if (p.antivirus) {
    chips.push({
      icon: ShieldAlert,
      label: 'Antivirus',
      value: !p.antivirus.enabled
        ? 'Off'
        : p.antivirus.realtime_protection === false
        ? 'Real-time off'
        : (p.antivirus.definitions_age_days ?? 0) > 7
        ? `${p.antivirus.definitions_age_days}d old defs`
        : 'Defender active',
      tone: !p.antivirus.enabled || p.antivirus.realtime_protection === false
        ? 'bad'
        : (p.antivirus.definitions_age_days ?? 0) > 7
        ? 'warn'
        : 'good',
    });
  }
  if (p.tpm) {
    chips.push({
      icon: Cpu,
      label: 'TPM',
      value: p.tpm.ready ? 'Ready' : p.tpm.present ? 'Present' : 'Missing',
      tone: p.tpm.ready ? 'good' : p.tpm.present ? 'warn' : 'bad',
    });
  }
  if (p.secure_boot && p.secure_boot.supported) {
    chips.push({
      icon: ShieldCheck,
      label: 'Secure Boot',
      value: p.secure_boot.enabled ? 'On' : 'Off',
      tone: p.secure_boot.enabled ? 'good' : 'warn',
    });
  }
  if (p.uac) {
    chips.push({
      icon: ShieldCheck,
      label: 'UAC',
      value: p.uac.enabled ? 'On' : 'Off',
      tone: p.uac.enabled ? 'good' : 'bad',
    });
  }
  if (p.remote_desktop) {
    const nla = p.rdp_security?.nla_enabled;
    chips.push({
      icon: ShieldAlert,
      label: 'RDP',
      value: !p.remote_desktop.enabled
        ? 'Disabled'
        : nla === false
        ? 'On (no NLA)'
        : 'On + NLA',
      tone: !p.remote_desktop.enabled ? 'good' : nla === false ? 'bad' : 'warn',
    });
  }
  if (p.rdp_security?.remote_assistance_enabled) {
    chips.push({ icon: ShieldAlert, label: 'Remote Assist', value: 'Enabled', tone: 'warn' });
  }
  if (p.defender_detail) {
    chips.push({
      icon: ShieldCheck,
      label: 'Defender cloud',
      value: p.defender_detail.cloud_protection ? 'On' : 'Off',
      tone: p.defender_detail.cloud_protection ? 'good' : 'warn',
    });
    chips.push({
      icon: ShieldCheck,
      label: 'PUA protection',
      value: p.defender_detail.pua_protection ? 'On' : 'Off',
      tone: p.defender_detail.pua_protection ? 'good' : 'warn',
    });
  }
  if (p.browser_passwords) {
    const c = p.browser_passwords.chrome?.stored_count ?? 0;
    const e = p.browser_passwords.edge?.stored_count ?? 0;
    if (c > 0 || e > 0) {
      chips.push({
        icon: ShieldAlert,
        label: 'Browser pw',
        value: `${c + e} stored`,
        tone: c + e > 0 ? 'warn' : 'good',
      });
    }
  }
  if (typeof p.pending_updates === 'number') {
    const uc = p.update_categories;
    const label = uc && (uc.security || uc.drivers || uc.feature || uc.office)
      ? `${uc.security || 0} sec · ${uc.drivers || 0} drv`
      : p.pending_updates === 0 ? 'Up to date' : `${p.pending_updates} pending`;
    chips.push({
      icon: ShieldAlert,
      label: 'Updates',
      value: label,
      tone: (uc?.security ?? 0) > 0 ? 'bad' : p.pending_updates === 0 ? 'good' : p.pending_updates > 5 ? 'warn' : 'unknown',
    });
  }
  if (p.disk && typeof p.disk.free_gb === 'number' && typeof p.disk.total_gb === 'number') {
    chips.push({
      icon: HardDrive,
      label: 'Disk C:',
      value: `${p.disk.free_gb} / ${p.disk.total_gb} GB free`,
      tone: p.disk.free_gb < 10 ? 'warn' : 'good',
    });
  }
  if (p.local_admins && typeof p.local_admins.count === 'number') {
    const builtinOn = (p.local_admins_detail ?? []).some((a) => a.is_builtin && a.enabled);
    chips.push({
      icon: Cpu,
      label: 'Local admins',
      value: `${p.local_admins.count}${builtinOn ? ' (built-in on)' : ''}`,
      tone: builtinOn ? 'warn' : p.local_admins.count > 2 ? 'warn' : 'good',
    });
  }
  return chips;
}

export function EnrolledDevicesList() {
  const [devices, setDevices] = useState<Device[] | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const load = async () => {
    const { data: rows, error } = await supabase
      .from('wrayth_devices')
      .select('id, hostname, os, os_version, agent_version, last_seen_at, revoked_at, release_channel, last_update_check_at')
      // Hide devices whose agent has been uninstalled/revoked so a machine
      // that ran WraythSetup.exe /uninstall disappears from the dashboard.
      .is('revoked_at', null)
      .order('last_seen_at', { ascending: false, nullsFirst: false });
    if (error) {
      toast.error("I couldn't load your devices", { description: error.message });
      setDevices([]);
      return;
    }
    const { data: posture } = await supabase
      .from('wrayth_device_posture')
      .select('device_id, findings, payload, captured_at');
    const findingsByDevice = new Map<string, Finding[]>();
    const postureByDevice = new Map<string, Posture>();
    const postureAtByDevice = new Map<string, string>();
    for (const p of posture ?? []) {
      findingsByDevice.set(p.device_id, (p.findings as unknown as Finding[]) ?? []);
      postureByDevice.set(p.device_id, (p.payload as unknown as Posture) ?? {});
      if (p.captured_at) postureAtByDevice.set(p.device_id, p.captured_at as string);
    }
    setDevices(
      (rows ?? []).map((r) => ({
        ...r,
        findings: findingsByDevice.get(r.id) ?? [],
        posture: postureByDevice.get(r.id) ?? null,
        posture_captured_at: postureAtByDevice.get(r.id) ?? null,
      })),
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
                  <div className="text-xs text-muted-foreground truncate flex items-center gap-2 flex-wrap">
                    <span
                      title={
                        d.last_seen_at
                          ? `Last heartbeat: ${new Date(d.last_seen_at).toLocaleString()}\nAgent posts every ~30s while running; longer gaps usually mean the machine is asleep, off, or offline.`
                          : 'This device has never reported in.'
                      }
                    >
                      {d.os} · agent v{d.agent_version} · last seen {relative(d.last_seen_at)}
                    </span>
                    {d.posture_captured_at && (
                      <span
                        className="text-[10px] text-muted-foreground/70"
                        title={`Deep posture scan captured: ${new Date(d.posture_captured_at).toLocaleString()}`}
                      >
                        · posture {relative(d.posture_captured_at)}
                      </span>
                    )}
                    <AgentVersionBadge
                      current={d.agent_version}
                      deviceId={d.id}
                      channel={(d as any).release_channel ?? 'stable'}
                      lastCheckedAt={(d as any).last_update_check_at ?? null}
                    />
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

              {d.posture && (
                <RayFixPanel
                  deviceId={d.id}
                  score={d.posture._ray?.score}
                  plan={d.posture._ray?.fix_plan ?? []}
                  disabled={!online}
                />
              )}

              {d.posture && (() => {
                const chips = buildPostureChips(d.posture);
                if (!chips.length) return null;
                return (
                  <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                    {chips.map((c, i) => (
                      <PostureChip key={i} {...c} />
                    ))}
                  </div>
                );
              })()}



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
              {!d.revoked_at && (
                <div className="pt-1">
                  <DeviceActionsMenu deviceId={d.id} agentVersion={d.agent_version} disabled={!online} posture={d.posture as never} />
                </div>
              )}
              <DeviceIntelPanel deviceId={d.id} posture={d.posture as never} />
              <DeviceTimeline deviceId={d.id} lastSeenAt={d.last_seen_at} />


            </div>
          );
        })}
      </CardContent>
      <div className="px-6 pb-6"><AgentTrustCard /></div>
    </Card>
  );
}

export default EnrolledDevicesList;

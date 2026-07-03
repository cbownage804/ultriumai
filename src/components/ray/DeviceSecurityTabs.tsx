/**
 * DeviceSecurityTabs — comprehensive tabbed view of one device's posture.
 *
 * Every field here comes from the real posture payload uploaded by the
 * Wrayth agent (agent/wrayth_agent.py -> wrayth_device_posture.payload).
 * Nothing is hardcoded or mocked. If a section has no data the tab still
 * renders but says "not reported yet" so the operator can tell the
 * difference between "off" and "unknown".
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, Eye, EyeOff, KeyRound, ShieldAlert, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface SoftwareEntry { name: string; version?: string; publisher?: string }
interface AutorunEntry {
  location: string;
  name: string;
  command: string;
  exists?: boolean;
  signature?: string;
  publisher?: string;
  signed?: boolean;
}
interface ServiceEntry { name: string; display_name?: string; path?: string }
interface AdminEntry { name: string; enabled?: boolean; is_builtin?: boolean; sid?: string }
interface PortEntry { port: number; process?: string; address: string }
interface ExtensionEntry { browser: string; name?: string; version?: string; id?: string }

export interface DevicePosture {
  disk_encryption?: { enabled?: boolean; percent_encrypted?: number; method?: string };
  firewall?: {
    enabled?: boolean;
    all_profiles_enabled?: boolean;
    profiles?: Record<string, boolean>;
  };
  antivirus?: { enabled?: boolean; realtime_protection?: boolean; definitions_age_days?: number };
  tpm?: { present?: boolean; ready?: boolean; version?: string };
  secure_boot?: { enabled?: boolean; supported?: boolean };
  uac?: { enabled?: boolean };
  remote_desktop?: { enabled?: boolean };
  local_admins?: { count?: number; members?: string[] };
  local_admins_detail?: AdminEntry[];
  disk?: { free_gb?: number; total_gb?: number; used_gb?: number };
  memory?: { free_gb?: number; total_gb?: number };
  pending_updates?: number;
  last_patch_at?: string;
  uptime_seconds?: number;
  last_boot?: string;
  screen_lock_seconds?: number;
  logged_in_user?: string;
  browsers?: Array<{ name: string; version: string }>;
  rdp_security?: {
    rdp_enabled?: boolean;
    nla_enabled?: boolean;
    remote_assistance_enabled?: boolean;
    listener_port?: number;
  };
  browser_passwords?: {
    chrome?: { manager_disabled_by_policy?: boolean; stored_count?: number };
    edge?: { manager_disabled_by_policy?: boolean; stored_count?: number };
    firefox?: { manager_disabled_by_policy?: boolean; stored_count?: number };
  };
  defender_detail?: {
    cloud_protection?: boolean;
    pua_protection?: boolean;
    last_quick_scan?: string;
    last_full_scan?: string;
    sample_submission?: string;
  };
  update_categories?: { security?: number; drivers?: number; feature?: number; office?: number; other?: number };
  pending_updates_list?: Array<{ title: string; kb?: string; category?: string; is_driver?: boolean; is_optional?: boolean; is_preview?: boolean }>;
  preview_updates_available?: number;
  installed_software?: SoftwareEntry[];
  autoruns?: AutorunEntry[];
  non_ms_services?: ServiceEntry[];
  browser_extensions?: ExtensionEntry[];
  listening_ports?: PortEntry[];
}

interface Props {
  deviceId: string;
  posture: DevicePosture | null;
  capturedAt?: string | null;
}

function fmtDuration(seconds: number): string {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function Row({
  label,
  value,
  tone = 'neutral',
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: 'good' | 'warn' | 'bad' | 'neutral';
  hint?: string;
}) {
  const toneClass =
    tone === 'good'
      ? 'text-emerald-200'
      : tone === 'warn'
      ? 'text-yellow-200'
      : tone === 'bad'
      ? 'text-red-200'
      : 'text-foreground/90';
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-1.5 last:border-b-0">
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium text-muted-foreground">{label}</div>
        {hint && <div className="text-[10px] text-muted-foreground/70">{hint}</div>}
      </div>
      <div className={`text-right text-xs ${toneClass}`}>{value}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded border border-dashed border-border/50 bg-background/30 p-3 text-center text-[11px] text-muted-foreground">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground/80">
        {title}
      </div>
      <div className="rounded-md border border-border/50 bg-background/40 px-3 py-1">
        {children}
      </div>
    </div>
  );
}

function List({
  rows,
  emptyLabel,
  cap = 25,
}: {
  rows: Array<{ primary: string; secondary?: string; badge?: string; badgeTone?: 'good' | 'warn' | 'bad' }>;
  emptyLabel: string;
  cap?: number;
}) {
  if (rows.length === 0) return <Empty>{emptyLabel}</Empty>;
  const shown = rows.slice(0, cap);
  const overflow = rows.length - shown.length;
  return (
    <div className="max-h-72 space-y-0.5 overflow-y-auto rounded border border-border/40 bg-background/40 p-2">
      {shown.map((r, i) => (
        <div key={i} className="flex items-center gap-2 text-[11px]">
          <span className="truncate font-medium text-foreground/90">{r.primary}</span>
          {r.badge && (
            <Badge
              variant="outline"
              className={
                'text-[9px] ' +
                (r.badgeTone === 'good'
                  ? 'border-emerald-500/40 text-emerald-200'
                  : r.badgeTone === 'bad'
                  ? 'border-red-500/40 text-red-200'
                  : r.badgeTone === 'warn'
                  ? 'border-yellow-500/40 text-yellow-100'
                  : '')
              }
            >
              {r.badge}
            </Badge>
          )}
          {r.secondary && (
            <span className="ml-auto max-w-[55%] truncate text-muted-foreground">{r.secondary}</span>
          )}
        </div>
      ))}
      {overflow > 0 && (
        <div className="pt-1 text-[10px] text-muted-foreground">+{overflow} more</div>
      )}
    </div>
  );
}

export function DeviceSecurityTabs({ deviceId, posture, capturedAt }: Props) {
  const [recovery, setRecovery] = useState<{ key: string; id: string; capturedAt: string } | null>(
    null,
  );
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('wrayth_device_actions')
        .select('result, completed_at')
        .eq('device_id', deviceId)
        .eq('action_type', 'enable_bitlocker')
        .eq('status', 'succeeded')
        .order('completed_at', { ascending: false })
        .limit(1);
      if (cancelled) return;
      const row = (data ?? [])[0] as
        | { result: { recovery_password?: string; recovery_key_id?: string } | null; completed_at: string }
        | undefined;
      const key = row?.result?.recovery_password;
      if (key) {
        setRecovery({
          key,
          id: row?.result?.recovery_key_id ?? '',
          capturedAt: row?.completed_at ?? '',
        });
      } else {
        setRecovery(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deviceId]);

  const copyKey = async () => {
    if (!recovery?.key) return;
    try {
      await navigator.clipboard.writeText(recovery.key);
      toast.success('Recovery key copied', {
        description: 'Store it somewhere safe — a password manager is ideal.',
      });
    } catch {
      toast.error("Couldn't copy — select and copy manually.");
    }
  };

  if (!posture) {
    return (
      <Empty>
        Ray hasn't received a posture snapshot from this device yet.
        {capturedAt && <> Heartbeat is live, but the deep scan hasn't uploaded.</>}
      </Empty>
    );
  }

  const p = posture;

  const yesNo = (v: boolean | undefined, goodValue = true): { text: string; tone: 'good' | 'bad' | 'neutral' } => {
    if (v === undefined) return { text: 'Unknown', tone: 'neutral' };
    if (v === goodValue) return { text: v ? 'On' : 'Off', tone: 'good' };
    return { text: v ? 'On' : 'Off', tone: 'bad' };
  };

  return (
    <Tabs defaultValue="posture" className="w-full">
      <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 h-auto">
        <TabsTrigger value="posture" className="text-[11px]">Posture</TabsTrigger>
        <TabsTrigger value="system" className="text-[11px]">System</TabsTrigger>
        <TabsTrigger value="defender" className="text-[11px]">Defender</TabsTrigger>
        <TabsTrigger value="network" className="text-[11px]">Network</TabsTrigger>
        <TabsTrigger value="accounts" className="text-[11px]">Accounts</TabsTrigger>
        <TabsTrigger value="software" className="text-[11px]">Software</TabsTrigger>
        <TabsTrigger value="updates" className="text-[11px]">Updates</TabsTrigger>
        <TabsTrigger value="keys" className="text-[11px]">Keys</TabsTrigger>
      </TabsList>

      {/* POSTURE (hardening basics) */}
      <TabsContent value="posture" className="space-y-3 pt-3">
        <Section title="Encryption & boot integrity">
          <Row
            label="BitLocker (C:)"
            value={
              p.disk_encryption?.enabled
                ? `On${typeof p.disk_encryption.percent_encrypted === 'number' && p.disk_encryption.percent_encrypted < 100
                    ? ` · encrypting ${p.disk_encryption.percent_encrypted}%`
                    : ''}${p.disk_encryption.method ? ` · ${p.disk_encryption.method}` : ''}`
                : p.disk_encryption
                ? 'Off'
                : 'Unknown'
            }
            tone={p.disk_encryption?.enabled ? 'good' : p.disk_encryption ? 'bad' : 'neutral'}
          />
          <Row
            label="TPM"
            value={p.tpm?.ready ? 'Ready' : p.tpm?.present ? 'Present, not ready' : p.tpm ? 'Missing' : 'Unknown'}
            tone={p.tpm?.ready ? 'good' : p.tpm?.present ? 'warn' : p.tpm ? 'bad' : 'neutral'}
            hint={p.tpm?.version ? `Version ${p.tpm.version}` : undefined}
          />
          <Row
            label="Secure Boot"
            value={
              p.secure_boot?.supported === false
                ? 'Not supported'
                : p.secure_boot?.enabled
                ? 'On'
                : p.secure_boot
                ? 'Off'
                : 'Unknown'
            }
            tone={p.secure_boot?.enabled ? 'good' : p.secure_boot?.supported === false ? 'warn' : p.secure_boot ? 'bad' : 'neutral'}
          />
          <Row
            label="UAC (elevation prompts)"
            value={yesNo(p.uac?.enabled).text}
            tone={yesNo(p.uac?.enabled).tone}
          />
        </Section>

        <Section title="Firewall profiles">
          {p.firewall?.profiles ? (
            Object.entries(p.firewall.profiles).map(([name, on]) => (
              <Row key={name} label={name} value={on ? 'On' : 'Off'} tone={on ? 'good' : 'bad'} />
            ))
          ) : (
            <Row
              label="Windows Firewall"
              value={p.firewall?.enabled ? 'On' : p.firewall ? 'Off' : 'Unknown'}
              tone={p.firewall?.enabled ? 'good' : p.firewall ? 'bad' : 'neutral'}
            />
          )}
        </Section>

        <Section title="Session">
          <Row
            label="Screen lock timeout"
            value={
              typeof p.screen_lock_seconds === 'number' && p.screen_lock_seconds > 0
                ? fmtDuration(p.screen_lock_seconds)
                : 'Not configured'
            }
            tone={
              typeof p.screen_lock_seconds === 'number' && p.screen_lock_seconds > 0 && p.screen_lock_seconds <= 900
                ? 'good'
                : typeof p.screen_lock_seconds === 'number' && p.screen_lock_seconds > 0
                ? 'warn'
                : 'bad'
            }
            hint="15 minutes or less is a common baseline."
          />
          <Row
            label="Signed-in user"
            value={p.logged_in_user || 'Unknown'}
          />
        </Section>
      </TabsContent>

      {/* SYSTEM */}
      <TabsContent value="system" className="space-y-3 pt-3">
        <Section title="Hardware">
          <Row
            label="Disk C:"
            value={
              p.disk && typeof p.disk.free_gb === 'number' && typeof p.disk.total_gb === 'number'
                ? `${p.disk.free_gb} GB free of ${p.disk.total_gb} GB`
                : 'Unknown'
            }
            tone={p.disk && typeof p.disk.free_gb === 'number' ? (p.disk.free_gb < 10 ? 'bad' : p.disk.free_gb < 25 ? 'warn' : 'good') : 'neutral'}
          />
          <Row
            label="Memory"
            value={
              p.memory && typeof p.memory.free_gb === 'number' && typeof p.memory.total_gb === 'number'
                ? `${p.memory.free_gb} GB free of ${p.memory.total_gb} GB`
                : 'Unknown'
            }
          />
        </Section>
        <Section title="Uptime">
          <Row
            label="Since last boot"
            value={typeof p.uptime_seconds === 'number' ? fmtDuration(p.uptime_seconds) : 'Unknown'}
            tone={typeof p.uptime_seconds === 'number' && p.uptime_seconds > 30 * 86400 ? 'warn' : 'neutral'}
            hint={p.uptime_seconds && p.uptime_seconds > 30 * 86400 ? 'Reboot pending updates.' : undefined}
          />
          <Row
            label="Last boot at"
            value={p.last_boot || 'Unknown'}
          />
        </Section>
        <Section title="Browsers installed">
          {p.browsers && p.browsers.length > 0 ? (
            p.browsers.map((b, i) => (
              <Row key={i} label={b.name} value={b.version} />
            ))
          ) : (
            <Row label="Detected" value="None reported" tone="neutral" />
          )}
        </Section>
      </TabsContent>

      {/* DEFENDER */}
      <TabsContent value="defender" className="space-y-3 pt-3">
        <Section title="Microsoft Defender Antivirus">
          <Row
            label="Enabled"
            value={p.antivirus?.enabled ? 'Yes' : p.antivirus ? 'No' : 'Unknown'}
            tone={p.antivirus?.enabled ? 'good' : p.antivirus ? 'bad' : 'neutral'}
          />
          <Row
            label="Real-time protection"
            value={p.antivirus?.realtime_protection === false ? 'Off' : p.antivirus?.realtime_protection ? 'On' : 'Unknown'}
            tone={p.antivirus?.realtime_protection === false ? 'bad' : p.antivirus?.realtime_protection ? 'good' : 'neutral'}
          />
          <Row
            label="Signature age"
            value={
              typeof p.antivirus?.definitions_age_days === 'number'
                ? `${p.antivirus.definitions_age_days} day${p.antivirus.definitions_age_days === 1 ? '' : 's'}`
                : 'Unknown'
            }
            tone={
              typeof p.antivirus?.definitions_age_days === 'number'
                ? p.antivirus.definitions_age_days > 7
                  ? 'bad'
                  : p.antivirus.definitions_age_days > 2
                  ? 'warn'
                  : 'good'
                : 'neutral'
            }
          />
        </Section>
        <Section title="Advanced protection">
          <Row
            label="Cloud-delivered protection"
            value={p.defender_detail?.cloud_protection ? 'On' : p.defender_detail ? 'Off' : 'Unknown'}
            tone={p.defender_detail?.cloud_protection ? 'good' : p.defender_detail ? 'warn' : 'neutral'}
          />
          <Row
            label="PUA (adware) protection"
            value={p.defender_detail?.pua_protection ? 'On' : p.defender_detail ? 'Off' : 'Unknown'}
            tone={p.defender_detail?.pua_protection ? 'good' : p.defender_detail ? 'warn' : 'neutral'}
          />
          <Row
            label="Sample submission"
            value={p.defender_detail?.sample_submission || 'Unknown'}
          />
        </Section>
        <Section title="Scan history">
          <Row
            label="Last quick scan"
            value={p.defender_detail?.last_quick_scan || 'Never reported'}
          />
          <Row
            label="Last full scan"
            value={p.defender_detail?.last_full_scan || 'Never reported'}
          />
        </Section>
      </TabsContent>

      {/* NETWORK */}
      <TabsContent value="network" className="space-y-3 pt-3">
        <Section title="Remote Desktop (RDP)">
          <Row
            label="RDP listener"
            value={p.rdp_security?.rdp_enabled ? 'Enabled' : p.rdp_security ? 'Disabled' : 'Unknown'}
            tone={p.rdp_security?.rdp_enabled === false ? 'good' : p.rdp_security?.rdp_enabled ? 'warn' : 'neutral'}
          />
          <Row
            label="Network Level Authentication"
            value={
              p.rdp_security?.rdp_enabled === false
                ? 'N/A'
                : p.rdp_security?.nla_enabled === true
                ? 'Required'
                : p.rdp_security?.nla_enabled === false
                ? 'Not required'
                : 'Unknown'
            }
            tone={
              p.rdp_security?.rdp_enabled === false
                ? 'good'
                : p.rdp_security?.nla_enabled === true
                ? 'good'
                : p.rdp_security?.nla_enabled === false
                ? 'bad'
                : 'neutral'
            }
          />
          <Row
            label="Remote Assistance"
            value={p.rdp_security?.remote_assistance_enabled ? 'Allowed' : p.rdp_security ? 'Blocked' : 'Unknown'}
            tone={p.rdp_security?.remote_assistance_enabled ? 'warn' : p.rdp_security ? 'good' : 'neutral'}
          />
          {typeof p.rdp_security?.listener_port === 'number' && (
            <Row label="Listener port" value={String(p.rdp_security.listener_port)} />
          )}
        </Section>
        <Section title="Listening TCP ports">
          <List
            rows={(p.listening_ports ?? []).map((port) => ({
              primary: `${port.address}:${port.port}`,
              secondary: port.process ?? '',
            }))}
            emptyLabel="No listening ports reported."
          />
        </Section>
      </TabsContent>

      {/* ACCOUNTS */}
      <TabsContent value="accounts" className="space-y-3 pt-3">
        <Section title={`Local administrators (${p.local_admins?.count ?? 0})`}>
          <List
            rows={(p.local_admins_detail ?? []).map((a) => ({
              primary: a.name,
              badge: a.is_builtin ? 'built-in' : a.enabled === false ? 'disabled' : 'enabled',
              badgeTone: a.is_builtin
                ? a.enabled === false
                  ? 'good'
                  : 'warn'
                : a.enabled === false
                ? 'good'
                : 'warn',
              secondary: a.sid,
            }))}
            emptyLabel={
              p.local_admins?.members?.length
                ? `Names reported: ${p.local_admins.members.join(', ')}`
                : 'No admin detail reported.'
            }
          />
        </Section>
        <Section title="Browser password managers">
          {(['chrome', 'edge', 'firefox'] as const).map((b) => {
            const info = p.browser_passwords?.[b];
            if (!info) return null;
            const policyDisabled = info.manager_disabled_by_policy === true;
            const stored = info.stored_count;
            return (
              <Row
                key={b}
                label={b === 'chrome' ? 'Chrome' : b === 'edge' ? 'Edge' : 'Firefox'}
                value={
                  policyDisabled
                    ? 'Disabled by policy'
                    : typeof stored === 'number' && stored >= 0
                    ? `Enabled · ${stored} saved`
                    : 'Enabled'
                }
                tone={policyDisabled ? 'good' : typeof stored === 'number' && stored > 0 ? 'warn' : 'neutral'}
              />
            );
          })}
          {!p.browser_passwords && (
            <Row label="Status" value="Not reported yet" tone="neutral" />
          )}
        </Section>
      </TabsContent>

      {/* SOFTWARE */}
      <TabsContent value="software" className="space-y-3 pt-3">
        <Section title={`Installed software (${p.installed_software?.length ?? 0})`}>
          <List
            rows={(p.installed_software ?? []).map((s) => ({
              primary: s.name,
              secondary: [s.version, s.publisher].filter(Boolean).join(' · '),
            }))}
            emptyLabel="Not reported yet."
          />
        </Section>
        <Section title={`Startup items (${p.autoruns?.length ?? 0})`}>
          <List
            rows={(p.autoruns ?? []).map((a) => ({
              primary: a.name,
              secondary: a.command,
              badge: a.signed === true ? 'signed' : a.signed === false ? 'unsigned' : a.signature,
              badgeTone: a.signed === true ? 'good' : a.signed === false ? 'bad' : 'warn',
            }))}
            emptyLabel="No autoruns reported."
          />
        </Section>
        <Section title={`Non-Microsoft services (${p.non_ms_services?.length ?? 0})`}>
          <List
            rows={(p.non_ms_services ?? []).map((s) => ({
              primary: s.display_name || s.name,
              secondary: s.path ?? '',
            }))}
            emptyLabel="No third-party services reported."
          />
        </Section>
        <Section title={`Browser extensions (${p.browser_extensions?.length ?? 0})`}>
          <List
            rows={(p.browser_extensions ?? []).map((e) => ({
              primary: e.name || 'Unnamed extension',
              secondary: [e.browser, e.version].filter(Boolean).join(' · '),
              badge: e.id,
            }))}
            emptyLabel="No extensions reported."
          />
        </Section>
      </TabsContent>

      {/* UPDATES */}
      <TabsContent value="updates" className="space-y-3 pt-3">
        <Section title="Windows Update">
          <Row
            label="Pending updates"
            value={typeof p.pending_updates === 'number' ? String(p.pending_updates) : 'Unknown'}
            tone={
              typeof p.pending_updates === 'number'
                ? p.pending_updates === 0
                  ? 'good'
                  : p.pending_updates > 5
                  ? 'bad'
                  : 'warn'
                : 'neutral'
            }
          />
          <Row label="Last patched" value={p.last_patch_at || 'Unknown'} />
        </Section>
        <Section title="Pending updates by category">
          {p.update_categories ? (
            <>
              <Row
                label="Security"
                value={String(p.update_categories.security ?? 0)}
                tone={(p.update_categories.security ?? 0) > 0 ? 'bad' : 'good'}
              />
              <Row label="Drivers" value={String(p.update_categories.drivers ?? 0)} />
              <Row label="Feature" value={String(p.update_categories.feature ?? 0)} />
              <Row label="Office / M365" value={String(p.update_categories.office ?? 0)} />
              <Row label="Other" value={String(p.update_categories.other ?? 0)} />
            </>
          ) : (
            <Row label="Categories" value="Not reported yet" />
          )}
        </Section>
      </TabsContent>

      {/* RECOVERY KEYS */}
      <TabsContent value="keys" className="space-y-3 pt-3">
        {recovery ? (
          <div className="rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
            <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-100">
              <KeyRound className="h-3.5 w-3.5" />
              BitLocker recovery key
            </div>
            <div className="mb-2 text-[11px] text-emerald-200/80">
              Captured {recovery.capturedAt ? formatDistanceToNow(new Date(recovery.capturedAt), { addSuffix: true }) : 'recently'}.
              Save it — you'll need it if Windows can't unlock this drive on boot.
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate rounded bg-background/60 px-2 py-1 font-mono text-[11px] text-emerald-100">
                {showKey ? recovery.key : '•••••• ••••••-•••••• (hidden)'}
              </code>
              <Button size="sm" variant="ghost" onClick={() => setShowKey((s) => !s)}>
                {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
              <Button size="sm" variant="ghost" onClick={copyKey}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            {recovery.id && (
              <div className="mt-1 text-[10px] text-emerald-200/60">Key ID: {recovery.id}</div>
            )}
          </div>
        ) : (
          <Empty>
            No escrowed recovery key yet. Approve "Turn on BitLocker" from the
            actions menu and Ray will capture the recovery password here.
          </Empty>
        )}
        {p.disk_encryption?.enabled === false && (
          <div className="flex items-start gap-2 rounded-md border border-red-500/30 bg-red-500/5 p-2 text-[11px] text-red-200">
            <ShieldAlert className="h-3.5 w-3.5 mt-0.5" />
            <span>
              BitLocker is currently off on this drive, so no recovery key can be
              escrowed until it is enabled.
            </span>
          </div>
        )}
        {p.disk_encryption?.enabled && !recovery && (
          <div className="flex items-start gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/5 p-2 text-[11px] text-yellow-100">
            <ShieldCheck className="h-3.5 w-3.5 mt-0.5" />
            <span>
              BitLocker is on, but no recovery key has been escrowed through Ray.
              Run "Turn on BitLocker" once so the key is captured for you.
            </span>
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}

export default DeviceSecurityTabs;

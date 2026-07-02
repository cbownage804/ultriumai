// deno-lint-ignore-file no-explicit-any
/**
 * agent-ingest — the agent posts its posture payload here every hour.
 * Auth: Bearer <device_token>. No Supabase JWT.
 *
 * Ray's findings are computed server-side from the raw posture so the
 * agent stays dumb and the intelligence lives in one place.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

interface SoftwareEntry { name: string; version?: string; publisher?: string }
interface AutorunEntry { location: string; name: string; command: string }
interface ServiceEntry { name: string; display_name?: string; start_name?: string; path?: string }
interface ListeningPort { address: string; port: number; process?: string }
interface BrowserExtension { browser: string; id: string; name?: string; version?: string }

interface Posture {
  hostname?: string;
  os?: string;
  os_version?: string;
  agent_version?: string;
  uptime_seconds?: number;
  last_boot?: string;
  disk_encryption?: {
    enabled: boolean;
    method?: string;
    protection_status?: string;
    volume_status?: string;
    percent_encrypted?: number;
    key_protectors?: string[];
  };
  firewall?: {
    enabled: boolean;
    profiles?: Record<string, boolean>;
    all_profiles_enabled?: boolean;
  };
  antivirus?: {
    name?: string;
    enabled: boolean;
    definitions_age_days?: number;
    realtime_protection?: boolean;
    tamper_protection?: boolean;
    signature_version?: string;
  };
  tpm?: { present?: boolean; ready?: boolean; version?: string };
  secure_boot?: { enabled?: boolean; supported?: boolean };
  uac?: { enabled?: boolean };
  remote_desktop?: { enabled?: boolean };
  local_admins?: { count?: number; members?: string[] };
  disk?: { used_gb?: number; free_gb?: number; total_gb?: number };
  memory?: { total_gb?: number; free_gb?: number };
  screen_lock_seconds?: number;
  pending_updates?: number;
  last_patch_at?: string;
  browsers?: Array<{ name: string; version?: string }>;
  installed_software?: SoftwareEntry[];
  autoruns?: AutorunEntry[];
  non_ms_services?: ServiceEntry[];
  listening_ports?: ListeningPort[];
  browser_extensions?: BrowserExtension[];
  logged_in_user?: string;
  // v0.2.0 additions
  rdp_security?: { rdp_enabled?: boolean; nla_enabled?: boolean; remote_assistance_enabled?: boolean };
  local_admins_detail?: Array<{ name: string; object_class?: string; enabled?: boolean; is_builtin?: boolean; sid?: string }>;
  browser_passwords?: {
    chrome?: { manager_disabled_by_policy?: boolean; stored_count?: number };
    edge?: { manager_disabled_by_policy?: boolean; stored_count?: number };
  };
  defender_detail?: {
    last_quick_scan?: string;
    last_full_scan?: string;
    cloud_protection?: boolean;
    pua_protection?: boolean;
    sample_submission?: string;
  };
  update_categories?: {
    security?: number;
    drivers?: number;
    feature?: number;
    office?: number;
    other?: number;
  };
}

// --- Basic CVE hint table ---------------------------------------------------
// First-pass, no NVD feed. Publisher-agnostic name matches (case-insensitive
// startsWith) with a minimum-safe-version. If a match is below the floor, we
// surface a finding. Real NVD sync is a follow-up.
const CVE_FLOORS: Array<{ match: string; min: string; note: string }> = [
  { match: 'google chrome',           min: '128.0.0.0', note: 'Chrome had multiple critical V8 RCEs earlier in 2024.' },
  { match: 'mozilla firefox',         min: '128.0',     note: 'Firefox <128 has known exploited memory-safety bugs.' },
  { match: 'zoom',                    min: '5.17.0',    note: 'Older Zoom clients have known privilege-escalation CVEs.' },
  { match: '7-zip',                   min: '24.07',     note: '7-Zip <24.07 mishandles archive parsing (CVE-2024-11477).' },
  { match: 'notepad++',               min: '8.6.5',     note: 'Notepad++ <8.6.5 has an unquoted-path privilege bug.' },
  { match: 'vlc media player',        min: '3.0.20',    note: 'VLC <3.0.20 has multiple demuxer RCEs.' },
  { match: 'putty',                   min: '0.81',      note: 'PuTTY <0.81 leaks NIST P-521 private keys (CVE-2024-31497).' },
  { match: 'openvpn',                 min: '2.6.10',    note: 'OpenVPN <2.6.10 has a Windows service-impersonation bug.' },
  { match: 'wireshark',               min: '4.2.5',     note: 'Wireshark <4.2.5 has protocol-parser DoS bugs.' },
  { match: 'adobe acrobat reader',    min: '24.002',    note: 'Adobe Reader <24.002 has patched RCE chains.' },
];

function versionCompare(a: string, b: string): number {
  const pa = a.replace(/[^\d.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/[^\d.]/g, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const x = pa[i] ?? 0, y = pb[i] ?? 0;
    if (x !== y) return x - y;
  }
  return 0;
}

function findCveHits(software: SoftwareEntry[]): Array<{ name: string; version: string; note: string }> {
  const hits: Array<{ name: string; version: string; note: string }> = [];
  for (const s of software) {
    const low = (s.name || '').toLowerCase();
    const ver = s.version || '';
    if (!ver) continue;
    for (const rule of CVE_FLOORS) {
      if (low.startsWith(rule.match) && versionCompare(ver, rule.min) < 0) {
        hits.push({ name: s.name, version: ver, note: rule.note });
        break;
      }
    }
  }
  return hits;
}

function diffByKey<T>(prev: T[] | undefined, curr: T[] | undefined, key: (t: T) => string): { added: T[]; removed: T[] } {
  const prevMap = new Map((prev ?? []).map((x) => [key(x), x]));
  const currMap = new Map((curr ?? []).map((x) => [key(x), x]));
  const added: T[] = [];
  const removed: T[] = [];
  for (const [k, v] of currMap) if (!prevMap.has(k)) added.push(v);
  for (const [k, v] of prevMap) if (!currMap.has(k)) removed.push(v);
  return { added, removed };
}

function computeDriftFindings(prev: Posture | null, curr: Posture): Array<{
  severity: 'info' | 'warn' | 'critical'; title: string; detail: string;
}> {
  if (!prev) return [];
  const out: Array<{ severity: 'info' | 'warn' | 'critical'; title: string; detail: string }> = [];

  const admins = diffByKey(prev.local_admins?.members ?? [], curr.local_admins?.members ?? [], (m) => m);
  if (admins.added.length) {
    out.push({
      severity: 'critical',
      title: `New local administrator added: ${admins.added.join(', ')}`,
      detail: 'A new admin appeared on this machine since the last check-in. Verify you added them.',
    });
  }

  const autoruns = diffByKey(prev.autoruns ?? [], curr.autoruns ?? [], (a) => `${a.location}::${a.name}`);
  if (autoruns.added.length) {
    out.push({
      severity: 'warn',
      title: `${autoruns.added.length} new startup ${autoruns.added.length === 1 ? 'item' : 'items'}.`,
      detail: `New: ${autoruns.added.slice(0, 3).map((a) => a.name).join(', ')}${autoruns.added.length > 3 ? '…' : ''}`,
    });
  }

  const svc = diffByKey(prev.non_ms_services ?? [], curr.non_ms_services ?? [], (s) => s.name);
  if (svc.added.length) {
    out.push({
      severity: 'warn',
      title: `${svc.added.length} new non-Microsoft ${svc.added.length === 1 ? 'service is' : 'services are'} running.`,
      detail: `New: ${svc.added.slice(0, 3).map((s) => s.display_name || s.name).join(', ')}${svc.added.length > 3 ? '…' : ''}`,
    });
  }

  const sw = diffByKey(prev.installed_software ?? [], curr.installed_software ?? [], (s) => s.name);
  if (sw.added.length > 0 && sw.added.length <= 5) {
    out.push({
      severity: 'info',
      title: `New software installed: ${sw.added.map((s) => s.name).slice(0, 3).join(', ')}${sw.added.length > 3 ? '…' : ''}`,
      detail: "Just so you know — Ray watches for anything new that appears.",
    });
  }

  const ports = diffByKey(prev.listening_ports ?? [], curr.listening_ports ?? [], (p) => `${p.address}:${p.port}`);
  if (ports.added.length) {
    out.push({
      severity: 'warn',
      title: `${ports.added.length} new listening ${ports.added.length === 1 ? 'port' : 'ports'} exposed.`,
      detail: `Now listening: ${ports.added.slice(0, 3).map((p) => `${p.port} (${p.process || 'unknown'})`).join(', ')}`,
    });
  }
  return out;
}


function computeFindings(p: Posture): Array<{
  severity: 'info' | 'warn' | 'critical';
  title: string;
  detail: string;
}> {
  const findings: Array<{ severity: 'info' | 'warn' | 'critical'; title: string; detail: string }> = [];

  if (p.disk_encryption && !p.disk_encryption.enabled) {
    findings.push({
      severity: 'critical',
      title: 'Your disk is not encrypted.',
      detail:
        'If this machine is lost or stolen, anyone can read your files. Turn on BitLocker to fix it.',
    });
  }
  if (p.firewall) {
    if (!p.firewall.enabled) {
      findings.push({
        severity: 'warn',
        title: 'Your firewall is off.',
        detail: 'Windows Firewall is disabled. Turn it back on unless a specific tool requires it off.',
      });
    } else if (p.firewall.all_profiles_enabled === false && p.firewall.profiles) {
      const off = Object.entries(p.firewall.profiles)
        .filter(([, v]) => !v)
        .map(([k]) => k);
      if (off.length) {
        findings.push({
          severity: 'warn',
          title: `Firewall is off for the ${off.join(', ')} profile${off.length === 1 ? '' : 's'}.`,
          detail: 'Enable Windows Firewall for every network profile so you\'re covered everywhere.',
        });
      }
    }
  }
  if (p.antivirus) {
    if (!p.antivirus.enabled) {
      findings.push({
        severity: 'critical',
        title: 'No antivirus is protecting this machine.',
        detail: 'Microsoft Defender appears to be disabled with no replacement running.',
      });
    } else {
      if (p.antivirus.realtime_protection === false) {
        findings.push({
          severity: 'critical',
          title: 'Real-time antivirus protection is off.',
          detail: 'Defender is installed but not actively scanning. Turn real-time protection back on.',
        });
      }
      if (p.antivirus.tamper_protection === false) {
        findings.push({
          severity: 'warn',
          title: 'Defender tamper protection is off.',
          detail: 'Without it, malware can silently disable your antivirus.',
        });
      }
      if ((p.antivirus.definitions_age_days ?? 0) > 7) {
        findings.push({
          severity: 'warn',
          title: 'Antivirus definitions are stale.',
          detail: `Last update was ${p.antivirus.definitions_age_days} days ago. I'd expect daily.`,
        });
      }
    }
  }
  if (p.tpm && p.tpm.present === false) {
    findings.push({
      severity: 'warn',
      title: "This machine has no usable TPM.",
      detail: 'BitLocker and Windows Hello lean on the TPM for hardware-backed keys.',
    });
  }
  if (p.secure_boot && p.secure_boot.supported && p.secure_boot.enabled === false) {
    findings.push({
      severity: 'warn',
      title: 'Secure Boot is disabled.',
      detail: 'Secure Boot blocks bootkits from loading before Windows starts. Turn it on in UEFI.',
    });
  }
  if (p.uac && p.uac.enabled === false) {
    findings.push({
      severity: 'critical',
      title: 'User Account Control is disabled.',
      detail: 'Every program you run gets full admin rights silently. Re-enable UAC.',
    });
  }
  if (p.remote_desktop && p.remote_desktop.enabled) {
    findings.push({
      severity: 'warn',
      title: 'Remote Desktop is enabled.',
      detail: "If you don't use RDP, turn it off — it's a favorite target for password spraying.",
    });
  }
  if ((p.local_admins?.count ?? 0) > 2) {
    findings.push({
      severity: 'info',
      title: `${p.local_admins?.count} local administrators on this machine.`,
      detail: 'Fewer admins = smaller blast radius if one account gets compromised.',
    });
  }
  if ((p.disk?.free_gb ?? Infinity) < 10) {
    findings.push({
      severity: 'warn',
      title: 'Low disk space.',
      detail: `Only ${p.disk?.free_gb} GB free on C:. Windows updates and backups may fail.`,
    });
  }
  if ((p.pending_updates ?? 0) > 0) {
    findings.push({
      severity: (p.pending_updates ?? 0) > 5 ? 'warn' : 'info',
      title: `${p.pending_updates} pending update${p.pending_updates === 1 ? '' : 's'}.`,
      detail: "I'd install these the next time you're near a reboot.",
    });
  }
  if ((p.uptime_seconds ?? 0) > 21 * 24 * 3600) {
    findings.push({
      severity: 'warn',
      title: "You haven't rebooted in a while.",
      detail: 'Pending security patches usually need a reboot to take effect.',
    });
  }
  // v0.2.0 findings
  if (p.rdp_security?.rdp_enabled) {
    if (p.rdp_security.nla_enabled === false) {
      findings.push({
        severity: 'critical',
        title: 'RDP is on without Network Level Authentication.',
        detail: 'Attackers can hit the login screen directly. Turn NLA on — or turn RDP off.',
      });
    }
    if (p.rdp_security.remote_assistance_enabled) {
      findings.push({
        severity: 'warn',
        title: 'Remote Assistance is enabled.',
        detail: 'If you never use it, disable it — it broadens your remote-access surface.',
      });
    }
  }
  const builtinAdmin = (p.local_admins_detail ?? []).find((a) => a.is_builtin);
  if (builtinAdmin?.enabled) {
    findings.push({
      severity: 'warn',
      title: 'The built-in Administrator account is enabled.',
      detail: 'Best practice is to disable it and use a named admin instead.',
    });
  }
  if (p.browser_passwords?.chrome && (p.browser_passwords.chrome.stored_count ?? 0) > 0 && !p.browser_passwords.chrome.manager_disabled_by_policy) {
    findings.push({
      severity: 'warn',
      title: `Chrome is storing ${p.browser_passwords.chrome.stored_count} passwords locally.`,
      detail: 'Move them into a real vault and disable Chrome\'s built-in manager.',
    });
  }
  if (p.browser_passwords?.edge && (p.browser_passwords.edge.stored_count ?? 0) > 0 && !p.browser_passwords.edge.manager_disabled_by_policy) {
    findings.push({
      severity: 'warn',
      title: `Edge is storing ${p.browser_passwords.edge.stored_count} passwords locally.`,
      detail: 'Move them into a real vault and disable Edge\'s built-in manager.',
    });
  }
  if (p.defender_detail) {
    if (p.defender_detail.pua_protection === false) {
      findings.push({
        severity: 'warn',
        title: 'Defender PUA protection is off.',
        detail: 'Potentially Unwanted Apps (adware, bundleware) will slip through. Turn it on.',
      });
    }
    if (p.defender_detail.cloud_protection === false) {
      findings.push({
        severity: 'warn',
        title: 'Defender cloud protection is off.',
        detail: 'Cloud-delivered protection catches brand-new threats faster.',
      });
    }
  }
  if (p.update_categories) {
    const sec = p.update_categories.security ?? 0;
    if (sec > 0) {
      findings.push({
        severity: sec > 3 ? 'critical' : 'warn',
        title: `${sec} security update${sec === 1 ? ' is' : 's are'} pending.`,
        detail: 'Security updates should go on as soon as possible.',
      });
    }
  }

  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      title: "This machine looks healthy.",
      detail: "I'll keep watching and let you know the moment something changes.",
    });
  }
  return findings;
}

// A "fix plan" is the list of one-tap actions Ray can queue to resolve current
// findings. Kept server-side so the client just renders + posts by name.
interface FixStep { action_type: string; label: string; params?: Record<string, unknown>; severity: 'critical' | 'warn' }

function buildFixPlan(p: Posture): FixStep[] {
  const plan: FixStep[] = [];
  if (p.disk_encryption && !p.disk_encryption.enabled) {
    plan.push({ action_type: 'enable_bitlocker', label: 'Turn on BitLocker and escrow the recovery key', severity: 'critical' });
  }
  if (p.firewall && !p.firewall.enabled) {
    plan.push({ action_type: 'enable_firewall', label: 'Turn Windows Firewall back on', severity: 'critical' });
  }
  if (p.antivirus && (p.antivirus.enabled === false || p.antivirus.realtime_protection === false)) {
    plan.push({ action_type: 'enable_defender', label: 'Re-enable Defender + update signatures', severity: 'critical' });
  } else if ((p.antivirus?.definitions_age_days ?? 0) > 7) {
    plan.push({ action_type: 'update_defender_signatures', label: 'Update Defender signatures', severity: 'warn' });
  }
  if (p.defender_detail?.pua_protection === false) {
    plan.push({ action_type: 'enable_defender_pua', label: 'Enable Defender PUA protection', severity: 'warn' });
  }
  if (p.defender_detail?.cloud_protection === false) {
    plan.push({ action_type: 'enable_defender_cloud', label: 'Enable Defender cloud protection', severity: 'warn' });
  }
  if (p.rdp_security?.rdp_enabled && p.rdp_security.nla_enabled === false) {
    plan.push({ action_type: 'enable_rdp_nla', label: 'Require Network Level Auth for RDP', severity: 'critical' });
  }
  if (p.rdp_security?.remote_assistance_enabled) {
    plan.push({ action_type: 'disable_remote_assistance', label: 'Disable Remote Assistance', severity: 'warn' });
  }
  const builtin = (p.local_admins_detail ?? []).find((a) => a.is_builtin);
  if (builtin?.enabled) {
    plan.push({ action_type: 'disable_builtin_administrator', label: 'Disable the built-in Administrator', severity: 'warn' });
  }
  if (p.browser_passwords?.chrome && (p.browser_passwords.chrome.stored_count ?? 0) > 0 && !p.browser_passwords.chrome.manager_disabled_by_policy) {
    plan.push({ action_type: 'disable_browser_password_manager', label: 'Disable Chrome password manager', params: { browser: 'chrome' }, severity: 'warn' });
  }
  if (p.browser_passwords?.edge && (p.browser_passwords.edge.stored_count ?? 0) > 0 && !p.browser_passwords.edge.manager_disabled_by_policy) {
    plan.push({ action_type: 'disable_browser_password_manager', label: 'Disable Edge password manager', params: { browser: 'edge' }, severity: 'warn' });
  }
  if ((p.update_categories?.security ?? 0) > 0 || (p.pending_updates ?? 0) > 0) {
    plan.push({ action_type: 'install_windows_updates', label: 'Install pending Windows updates', severity: 'warn' });
  }
  return plan;
}

// 0–100 posture score. Simple, transparent, deterministic.
function computeSecurityScore(p: Posture, findings: Array<{ severity: string }>): number {
  let score = 100;
  for (const f of findings) {
    if (f.severity === 'critical') score -= 12;
    else if (f.severity === 'warn') score -= 5;
  }
  // Extra pull for structural gaps
  if (p.disk_encryption && !p.disk_encryption.enabled) score -= 5;
  if (p.antivirus && !p.antivirus.enabled) score -= 5;
  return Math.max(0, Math.min(100, score));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const tokenHash = await sha256Hex(token);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: device, error: dErr } = await admin
      .from('wrayth_devices')
      .select('id, user_id, revoked_at')
      .eq('device_token_hash', tokenHash)
      .maybeSingle();
    if (dErr) throw dErr;
    if (!device) {
      return new Response(JSON.stringify({ error: 'unknown_device' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (device.revoked_at) {
      return new Response(JSON.stringify({ error: 'revoked' }), {
        status: 401,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const payload: Posture = await req.json();

    // Pull previous snapshot for drift detection
    const { data: prevRow } = await admin
      .from('wrayth_device_posture')
      .select('payload')
      .eq('device_id', device.id)
      .maybeSingle();
    const prevPayload = (prevRow?.payload as Posture | undefined) ?? null;

    const findings = computeFindings(payload);
    const drift = computeDriftFindings(prevPayload, payload);
    const cveHits = findCveHits(payload.installed_software ?? []);
    for (const c of cveHits.slice(0, 5)) {
      findings.push({
        severity: 'critical',
        title: `${c.name} ${c.version} is out of date.`,
        detail: c.note,
      });
    }
    findings.push(...drift);

    const now = new Date().toISOString();

    // Update last_seen and rolling metadata on the device
    await admin
      .from('wrayth_devices')
      .update({
        last_seen_at: now,
        os_version: payload.os_version ?? undefined,
        agent_version: payload.agent_version ?? undefined,
        hostname: payload.hostname ?? undefined,
      })
      .eq('id', device.id);

    // Upsert latest posture
    await admin.from('wrayth_device_posture').upsert(
      {
        device_id: device.id,
        user_id: device.user_id,
        captured_at: now,
        payload,
        findings,
      },
      { onConflict: 'device_id' },
    );

    // Append history (best-effort)
    await admin.from('wrayth_device_posture_history').insert({
      device_id: device.id,
      user_id: device.user_id,
      captured_at: now,
      payload,
      findings,
    });


    return new Response(JSON.stringify({ ok: true, next_check_in_seconds: 3600 }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

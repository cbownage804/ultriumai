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

interface Posture {
  hostname?: string;
  os?: string;
  os_version?: string;
  agent_version?: string;
  uptime_seconds?: number;
  last_boot?: string;
  disk_encryption?: { enabled: boolean; method?: string };
  firewall?: { enabled: boolean };
  antivirus?: { name?: string; enabled: boolean; definitions_age_days?: number };
  screen_lock_seconds?: number;
  pending_updates?: number;
  last_patch_at?: string;
  browsers?: Array<{ name: string; version?: string }>;
  logged_in_user?: string;
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
  if (p.firewall && !p.firewall.enabled) {
    findings.push({
      severity: 'warn',
      title: 'Your firewall is off.',
      detail: 'Windows Firewall is disabled. Turn it back on unless a specific tool requires it off.',
    });
  }
  if (p.antivirus) {
    if (!p.antivirus.enabled) {
      findings.push({
        severity: 'critical',
        title: 'No antivirus is protecting this machine.',
        detail: 'Microsoft Defender appears to be disabled with no replacement running.',
      });
    } else if ((p.antivirus.definitions_age_days ?? 0) > 7) {
      findings.push({
        severity: 'warn',
        title: 'Antivirus definitions are stale.',
        detail: `Last update was ${p.antivirus.definitions_age_days} days ago. I'd expect daily.`,
      });
    }
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
  if (findings.length === 0) {
    findings.push({
      severity: 'info',
      title: "This machine looks healthy.",
      detail: "I'll keep watching and let you know the moment something changes.",
    });
  }
  return findings;
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
    const findings = computeFindings(payload);
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

// deno-lint-ignore-file no-explicit-any
/**
 * agent-action-request — user (one-tap approve in UI) creates an action
 * for a device they own. Auth: Supabase JWT.
 *
 * Hardening pass:
 *  - Per-action risk levels (low/medium/high).
 *  - HIGH risk requires `confirmed: true` in the body (UI shows impact copy first).
 *  - Preflight guardrails:
 *      * remove_local_admin refuses if it would leave zero enabled admins.
 *      * disable_rdp warns if the device has been reached only via RDP recently
 *        (best-effort — still requires explicit confirmation).
 *  - Stores risk_level, rollback_possible, rollback_action, requires_reboot,
 *    confirmed_by_user, and preflight result on the row for the audit trail.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Risk = 'low' | 'medium' | 'high';
interface RiskEntry { risk: Risk; reboot?: boolean; rollback?: string | null }

const RISK: Record<string, RiskEntry> = {
  enable_bitlocker:                { risk: 'medium', rollback: null },
  enable_firewall:                 { risk: 'low',    rollback: null },
  enable_defender:                 { risk: 'low',    rollback: null },
  update_defender_signatures:      { risk: 'low' },
  enable_defender_pua:             { risk: 'low',    rollback: null },
  enable_defender_cloud:           { risk: 'low',    rollback: null },
  run_defender_quick_scan:         { risk: 'low' },
  run_defender_full_scan:          { risk: 'low' },
  install_windows_updates:         { risk: 'high',   reboot: true },
  lock_screen:                     { risk: 'low' },
  sign_out_user:                   { risk: 'medium' },
  disable_rdp:                     { risk: 'high',   rollback: 'enable_rdp' },
  enable_rdp_nla:                  { risk: 'medium', rollback: null },
  disable_remote_assistance:       { risk: 'medium', rollback: null },
  disable_browser_password_manager:{ risk: 'medium', rollback: null },
  remove_local_admin:              { risk: 'high' },
  disable_builtin_administrator:   { risk: 'high',   rollback: 'enable_builtin_administrator' },
  disable_startup_item:            { risk: 'medium', rollback: null },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData, error: uErr } = await anon.auth.getUser(token);
    if (uErr || !userData?.user?.id) {
      return json({ error: 'unauthorized' }, 401);
    }
    const userId = userData.user.id;

    const body = await req.json();
    const device_id = String(body?.device_id ?? '');
    const action_type = String(body?.action_type ?? '');
    const params = body?.params && typeof body.params === 'object' ? body.params : {};
    const confirmed = !!body?.confirmed;
    const risk = RISK[action_type];
    if (!device_id || !risk) return json({ error: 'bad_request' }, 400);

    // High-risk actions require explicit confirmation — Fix Everything cannot
    // sneak one through without a per-item confirm step in the UI.
    if (risk.risk === 'high' && !confirmed) {
      return json({ error: 'confirmation_required', risk: risk.risk }, 412);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: device } = await admin
      .from('wrayth_devices')
      .select('id, user_id, revoked_at')
      .eq('id', device_id)
      .maybeSingle();
    if (!device || device.user_id !== userId) return json({ error: 'not_found' }, 404);
    if (device.revoked_at) return json({ error: 'device_revoked' }, 409);

    // Preflight — read the most recent posture snapshot to validate guardrails.
    const { data: posture } = await admin
      .from('wrayth_device_posture')
      .select('payload')
      .eq('device_id', device_id)
      .maybeSingle();
    const p = (posture?.payload as any) ?? {};
    const preflight: Record<string, unknown> = { checked_at: new Date().toISOString() };

    if (action_type === 'remove_local_admin') {
      const name = String((params as any)?.name ?? '').toLowerCase();
      const admins = (p.local_admins_detail ?? []) as Array<{ name: string; enabled?: boolean; is_builtin?: boolean }>;
      const enabledOthers = admins.filter((a) => (a.name || '').toLowerCase() !== name && a.enabled !== false);
      preflight.enabled_admins_remaining = enabledOthers.length;
      if (enabledOthers.length === 0) {
        return json({ error: 'preflight_blocked', reason: 'no_alternative_admin', message: 'Refusing to remove the last active local admin.' }, 412);
      }
      if (name.endsWith('\\administrator') || name === 'administrator') {
        return json({ error: 'preflight_blocked', reason: 'builtin_administrator', message: 'Use disable_builtin_administrator instead.' }, 412);
      }
    }

    if (action_type === 'disable_rdp') {
      preflight.rdp_currently_enabled = !!p.rdp_security?.rdp_enabled;
      preflight.warning = 'This may interrupt remote access to this machine.';
    }
    if (action_type === 'install_windows_updates') {
      preflight.warning = 'This may require a reboot to finish installing.';
    }

    const now = new Date().toISOString();
    const { data: action, error } = await admin
      .from('wrayth_device_actions')
      .insert({
        device_id,
        user_id: userId,
        action_type,
        params,
        status: 'approved',
        requested_by: userId,
        approved_at: now,
        risk_level: risk.risk,
        requires_reboot: !!risk.reboot,
        rollback_possible: risk.rollback !== undefined,
        rollback_action: risk.rollback ?? null,
        confirmed_by_user: confirmed || risk.risk !== 'high',
        preflight,
      })
      .select()
      .single();
    if (error) throw error;

    return json({ ok: true, action, preflight });
  } catch (err: any) {
    console.error('[agent-action-request] error', err?.message, err?.stack);
    return json({ error: err?.message ?? 'server_error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

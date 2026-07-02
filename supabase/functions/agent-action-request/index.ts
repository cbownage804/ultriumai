// deno-lint-ignore-file no-explicit-any
/**
 * agent-action-request — user (one-tap approve in UI) creates an action
 * for a device they own. Auth: Supabase JWT.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED = new Set([
  'enable_bitlocker',
  'enable_firewall',
  'enable_defender',
  'run_defender_quick_scan',
  'run_defender_full_scan',
  'install_windows_updates',
  'lock_screen',
  'sign_out_user',
]);

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
      console.error('[agent-action-request] auth failed', uErr?.message);
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    const body = await req.json();
    const device_id = String(body?.device_id ?? '');
    const action_type = String(body?.action_type ?? '');
    const params = body?.params && typeof body.params === 'object' ? body.params : {};
    if (!device_id || !ALLOWED.has(action_type)) {
      return new Response(JSON.stringify({ error: 'bad_request' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
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
    if (!device || device.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'not_found' }), {
        status: 404, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (device.revoked_at) {
      return new Response(JSON.stringify({ error: 'device_revoked' }), {
        status: 409, headers: { ...cors, 'Content-Type': 'application/json' },
      });
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
      })
      .select()
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true, action }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

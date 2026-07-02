// deno-lint-ignore-file no-explicit-any
/**
 * agent-action-poll — agent polls this every ~30s with its device token.
 * Returns any approved actions and marks them as dispatched.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return new Response(JSON.stringify({ error: 'missing_token' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    const hash = await sha256Hex(token);
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: device } = await admin
      .from('wrayth_devices')
      .select('id, revoked_at')
      .eq('device_token_hash', hash)
      .maybeSingle();
    if (!device) {
      return new Response(JSON.stringify({ error: 'unknown_device' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (device.revoked_at) {
      return new Response(JSON.stringify({ error: 'revoked' }), {
        status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const { data: actions, error } = await admin
      .from('wrayth_device_actions')
      .select('id, action_type, params')
      .eq('device_id', device.id)
      .eq('status', 'approved')
      .order('requested_at', { ascending: true })
      .limit(10);
    if (error) throw error;

    const ids = (actions ?? []).map((a) => a.id);
    if (ids.length > 0) {
      await admin
        .from('wrayth_device_actions')
        .update({ status: 'dispatched', dispatched_at: new Date().toISOString() })
        .in('id', ids);
    }

    return new Response(JSON.stringify({ actions: actions ?? [] }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

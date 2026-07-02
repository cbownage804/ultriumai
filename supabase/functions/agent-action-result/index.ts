// deno-lint-ignore-file no-explicit-any
/**
 * agent-action-result — agent reports the outcome of a dispatched action.
 * Body: { action_id, status: 'succeeded'|'failed'|'running', result?, error? }
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

const TERMINAL = new Set(['succeeded', 'failed', 'running']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return new Response(JSON.stringify({ error: 'missing_token' }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });
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
    if (!device || device.revoked_at) return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { ...cors, 'Content-Type': 'application/json' } },
    );

    const body = await req.json();
    const action_id = String(body?.action_id ?? '');
    const status = String(body?.status ?? '');
    if (!action_id || !TERMINAL.has(status)) {
      return new Response(JSON.stringify({ error: 'bad_request' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const patch: Record<string, unknown> = {
      status,
      result: body?.result ?? null,
      error: body?.error ?? null,
    };
    if (status === 'succeeded' || status === 'failed') {
      patch.completed_at = new Date().toISOString();
    }
    const { error } = await admin
      .from('wrayth_device_actions')
      .update(patch)
      .eq('id', action_id)
      .eq('device_id', device.id);
    if (error) throw error;

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

// deno-lint-ignore-file no-explicit-any
/**
 * agent-action-result — agent reports the outcome of a dispatched action.
 * Body: { action_id, status: 'succeeded'|'failed'|'running', result?, error? }
 *
 * When an action reaches a terminal state (succeeded|failed) we also
 * cascade the outcome to `wrayth_remediation_actions` so the unified
 * Ray remediation lifecycle actually closes instead of stalling in
 * `running` forever. This is the bridge between the low-level device
 * action queue and Ray's cross-provider remediation audit.
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

// All statuses the agent may report. `running` is an intermediate progress
// ping — accepted, but does NOT close the row.
const ACCEPTED = new Set(['succeeded', 'failed', 'running']);
const TERMINAL = new Set(['succeeded', 'failed']);

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
    if (!action_id || !ACCEPTED.has(status)) {
      return new Response(JSON.stringify({ error: 'bad_request' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const patch: Record<string, unknown> = {
      status,
      result: body?.result ?? null,
      error: body?.error ?? null,
    };
    // Rollback / before-after audit fields — agent captures these per action.
    if (body?.previous_value !== undefined) patch.previous_value = body.previous_value;
    if (body?.new_value !== undefined) patch.new_value = body.new_value;
    if (body?.rollback_possible !== undefined) patch.rollback_possible = !!body.rollback_possible;
    if (body?.rollback_action !== undefined) patch.rollback_action = body.rollback_action;
    if (body?.requires_reboot !== undefined) patch.requires_reboot = !!body.requires_reboot;
    if (TERMINAL.has(status)) {
      patch.completed_at = new Date().toISOString();
    }
    const { error } = await admin
      .from('wrayth_device_actions')
      .update(patch)
      .eq('id', action_id)
      .eq('device_id', device.id);
    if (error) throw error;

    // Cascade to Ray's unified remediation lifecycle table so
    // `wrayth_remediation_actions` rows queued through `providers/agent.ts`
    // or `remediation-queue-tick` actually close out. Without this bridge
    // every agent-dispatched remediation stays "running" indefinitely and
    // Ray's Timeline / Queue never reflects the real outcome.
    if (TERMINAL.has(status)) {
      const remediationPatch: Record<string, unknown> = {
        lifecycle_state: status === 'succeeded' ? 'completed' : 'failed',
        status,
        result: body?.result ?? null,
        error: body?.error ?? null,
        new_state: body?.new_value ?? null,
        previous_state: body?.previous_value ?? null,
      };
      const { error: remErr } = await admin
        .from('wrayth_remediation_actions')
        .update(remediationPatch)
        .eq('agent_action_id', action_id);
      if (remErr) {
        // Non-fatal: the primary device_actions update already succeeded.
        console.warn('[agent-action-result] remediation cascade failed', remErr.message);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

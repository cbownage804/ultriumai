// deno-lint-ignore-file no-explicit-any
/**
 * agent-uninstall — the agent's Windows uninstaller calls this right
 * before it wipes its config, so the device auto-removes from the
 * dashboard instead of lingering as "last seen X ago".
 *
 * Auth: Bearer <device_token> (same scheme as agent-ingest). We hash and
 * look up the device, then set revoked_at. Idempotent: repeated calls
 * are fine; unknown/already-revoked tokens still return 200 so a partial
 * uninstall never blocks the installer's cleanup step.
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const respond = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (!token) return respond({ ok: true, note: 'no_token' });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const tokenHash = await sha256Hex(token);
    const { data: device } = await supabase
      .from('wrayth_devices')
      .select('id, revoked_at')
      .eq('device_token_hash', tokenHash)
      .maybeSingle();

    if (!device) {
      // Unknown token — nothing to do, but do NOT fail: the uninstaller
      // should never be blocked by server state it can't correct.
      return respond({ ok: true, note: 'unknown_device' });
    }

    if (!device.revoked_at) {
      await supabase
        .from('wrayth_devices')
        .update({ revoked_at: new Date().toISOString() })
        .eq('id', device.id);
    }

    return respond({ ok: true, device_id: device.id });
  } catch (err: any) {
    // Still return 200 so a network hiccup can't leave WraythSetup.exe
    // aborting mid-uninstall — the dashboard has a stale-device sweep too.
    return respond({ ok: false, error: err?.message ?? 'server_error' });
  }
});

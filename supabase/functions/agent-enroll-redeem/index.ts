// deno-lint-ignore-file no-explicit-any
/**
 * agent-enroll-redeem — swap a one-time enrollment code for a long-lived
 * device_token. Called by the agent on first launch. No JWT.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

async function sha256Hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomTokenHex(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const {
      code,
      hostname,
      os,
      os_version,
      agent_version,
    }: {
      code?: string;
      hostname?: string;
      os?: string;
      os_version?: string;
      agent_version?: string;
    } = body ?? {};

    if (!code || !hostname || !os || !agent_version) {
      return new Response(JSON.stringify({ error: 'missing_fields' }), {
        status: 400,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const codeHash = await sha256Hex(code.trim().toUpperCase());
    const { data: enroll, error: eErr } = await admin
      .from('wrayth_device_enrollments')
      .select('id, user_id, expires_at, redeemed_at')
      .eq('code_hash', codeHash)
      .maybeSingle();
    if (eErr) throw eErr;
    if (!enroll) {
      return new Response(JSON.stringify({ error: 'invalid_code' }), {
        status: 404,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (enroll.redeemed_at) {
      return new Response(JSON.stringify({ error: 'already_redeemed' }), {
        status: 409,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }
    if (new Date(enroll.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: 'expired' }), {
        status: 410,
        headers: { ...cors, 'Content-Type': 'application/json' },
      });
    }

    const deviceToken = randomTokenHex(32);
    const deviceTokenHash = await sha256Hex(deviceToken);

    const { data: device, error: dErr } = await admin
      .from('wrayth_devices')
      .insert({
        user_id: enroll.user_id,
        hostname,
        os,
        os_version: os_version ?? null,
        agent_version,
        device_token_hash: deviceTokenHash,
        last_seen_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (dErr) throw dErr;

    await admin
      .from('wrayth_device_enrollments')
      .update({ redeemed_at: new Date().toISOString(), device_id: device.id })
      .eq('id', enroll.id);

    return new Response(
      JSON.stringify({ device_id: device.id, device_token: deviceToken }),
      { headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message ?? 'server_error' }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});

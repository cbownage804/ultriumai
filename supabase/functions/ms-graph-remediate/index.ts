// deno-lint-ignore-file no-explicit-any
/**
 * ms-graph-remediate — Microsoft 365 / Entra ID one-click remediations.
 *
 * Every call:
 *  1. Authenticates the Supabase user.
 *  2. Loads the user's stored Graph tokens from `ray_integrations`.
 *  3. Refreshes the token if it expires within 2 minutes.
 *  4. Dispatches by `action_type` to the right Graph endpoint.
 *  5. Returns { ok, result, previous, new } for the client audit writer.
 *
 * Actions supported (Phase 1):
 *   - force_password_reset
 *   - revoke_sessions
 *   - block_signin
 *   - unblock_signin
 *   - disable_user
 *   - reset_mfa_methods
 *   - dismiss_risky_user
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GRAPH = 'https://graph.microsoft.com/v1.0';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

interface TokenRow {
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  scopes: string[] | null;
}

async function refreshIfExpired(admin: any, userId: string, row: TokenRow): Promise<string> {
  const expiresAt = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0;
  const soon = Date.now() + 2 * 60 * 1000;
  if (expiresAt > soon) return row.access_token;
  if (!row.refresh_token) return row.access_token; // no refresh, best effort

  const clientId = Deno.env.get('AZURE_CLIENT_ID');
  const clientSecret = Deno.env.get('AZURE_CLIENT_SECRET');
  if (!clientId || !clientSecret) return row.access_token;

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: row.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  if (!res.ok) return row.access_token;
  const access = j.access_token as string;
  const refresh = (j.refresh_token as string) || row.refresh_token;
  const expiresIn = (j.expires_in as number) ?? 3600;
  await admin.from('ray_integrations').update({
    access_token: access,
    refresh_token: refresh,
    token_expires_at: new Date(Date.now() + (expiresIn - 60) * 1000).toISOString(),
  }).eq('user_id', userId).eq('provider', 'microsoft_365');
  return access;
}

async function graph(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(`${GRAPH}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: any = null;
  try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
  return { ok: res.ok, status: res.status, body: parsed };
}

// Best-effort snapshot of the user's key fields for audit "previous_state".
async function snapshotUser(token: string, userId: string) {
  const r = await graph(
    'GET',
    `/users/${encodeURIComponent(userId)}?$select=id,userPrincipalName,displayName,accountEnabled`,
    token,
  );
  return r.ok ? r.body : null;
}

async function runAction(
  action: string,
  targetId: string,
  params: Record<string, unknown>,
  token: string,
): Promise<{ result: unknown; previous?: unknown; new?: unknown }> {
  switch (action) {
    case 'force_password_reset': {
      const prev = await snapshotUser(token, targetId);
      const r = await graph('PATCH', `/users/${encodeURIComponent(targetId)}`, token, {
        passwordProfile: {
          forceChangePasswordNextSignIn: true,
        },
      });
      if (!r.ok) throw new Error(r.body?.error?.message ?? `graph_${r.status}`);
      return { result: { patched: true }, previous: prev, new: { forceChangePasswordNextSignIn: true } };
    }

    case 'revoke_sessions': {
      const r = await graph('POST', `/users/${encodeURIComponent(targetId)}/revokeSignInSessions`, token);
      if (!r.ok) throw new Error(r.body?.error?.message ?? `graph_${r.status}`);
      return { result: r.body ?? { revoked: true } };
    }

    case 'block_signin': {
      const prev = await snapshotUser(token, targetId);
      const r = await graph('PATCH', `/users/${encodeURIComponent(targetId)}`, token, {
        accountEnabled: false,
      });
      if (!r.ok) throw new Error(r.body?.error?.message ?? `graph_${r.status}`);
      return { result: { blocked: true }, previous: prev, new: { ...(prev as any), accountEnabled: false } };
    }

    case 'unblock_signin': {
      const prev = await snapshotUser(token, targetId);
      const r = await graph('PATCH', `/users/${encodeURIComponent(targetId)}`, token, {
        accountEnabled: true,
      });
      if (!r.ok) throw new Error(r.body?.error?.message ?? `graph_${r.status}`);
      return { result: { unblocked: true }, previous: prev, new: { ...(prev as any), accountEnabled: true } };
    }

    case 'disable_user': {
      const prev = await snapshotUser(token, targetId);
      const block = await graph('PATCH', `/users/${encodeURIComponent(targetId)}`, token, {
        accountEnabled: false,
      });
      if (!block.ok) throw new Error(block.body?.error?.message ?? `graph_${block.status}`);
      const revoke = await graph('POST', `/users/${encodeURIComponent(targetId)}/revokeSignInSessions`, token);
      return {
        result: { blocked: true, sessions_revoked: revoke.ok },
        previous: prev,
        new: { ...(prev as any), accountEnabled: false },
      };
    }

    case 'reset_mfa_methods': {
      // Enumerate then delete all non-password methods.
      const list = await graph('GET', `/users/${encodeURIComponent(targetId)}/authentication/methods`, token);
      if (!list.ok) throw new Error(list.body?.error?.message ?? `graph_${list.status}`);
      const methods: any[] = list.body?.value ?? [];
      const nonPassword = methods.filter((m) => m['@odata.type'] !== '#microsoft.graph.passwordAuthenticationMethod');
      const deleted: string[] = [];
      for (const m of nonPassword) {
        const t = m['@odata.type'] as string;
        // Type-to-endpoint map for the common ones.
        const seg =
          t.includes('phone') ? 'phoneMethods' :
          t.includes('microsoftAuthenticator') ? 'microsoftAuthenticatorMethods' :
          t.includes('fido2') ? 'fido2Methods' :
          t.includes('softwareOath') ? 'softwareOathMethods' :
          t.includes('email') ? 'emailMethods' :
          t.includes('windowsHelloForBusiness') ? 'windowsHelloForBusinessMethods' :
          null;
        if (!seg || !m.id) continue;
        const d = await graph('DELETE', `/users/${encodeURIComponent(targetId)}/authentication/${seg}/${m.id}`, token);
        if (d.ok) deleted.push(`${seg}/${m.id}`);
      }
      return { result: { deleted_count: deleted.length, deleted } };
    }

    case 'dismiss_risky_user': {
      const r = await graph('POST', `/identityProtection/riskyUsers/dismiss`, token, {
        userIds: [targetId],
      });
      if (!r.ok) throw new Error(r.body?.error?.message ?? `graph_${r.status}`);
      return { result: { dismissed: true } };
    }

    default:
      throw new Error(`unknown_action:${action}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) return json({ error: 'unauthorized' }, 401);

    const anon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    );
    const { data: userData, error: uErr } = await anon.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
    if (uErr || !userData?.user?.id) return json({ error: 'unauthorized' }, 401);
    const userId = userData.user.id;

    const body = await req.json();
    let action_type = String(body?.action_type ?? '');
    let target_id = String(body?.target_id ?? '');
    let params = (body?.params && typeof body.params === 'object') ? body.params : {};
    const undo_of_audit_id = body?.undo_of_audit_id ? String(body.undo_of_audit_id) : null;

    // Undo path — look up the original action's previous_state and derive the inverse.
    if (undo_of_audit_id) {
      const admin0 = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );
      const { data: orig } = await admin0
        .from('wrayth_remediation_actions')
        .select('slug, action_type, target_id, previous_state, provider')
        .eq('id', undo_of_audit_id)
        .maybeSingle();
      if (!orig) return json({ error: 'undo_target_not_found' }, 404);
      target_id = String(orig.target_id);
      // Simple inverse map — patch back to snapshot for account-enabled toggles.
      if (orig.action_type === 'block_signin' || orig.action_type === 'disable_user') {
        action_type = 'unblock_signin';
      } else if (orig.action_type === 'unblock_signin') {
        action_type = 'block_signin';
      } else {
        return json({ error: 'action_not_reversible' }, 400);
      }
      params = {};
    }

    if (!action_type || !target_id) return json({ error: 'bad_request' }, 400);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: integ } = await admin
      .from('ray_integrations')
      .select('access_token, refresh_token, token_expires_at, scopes, status')
      .eq('user_id', userId)
      .eq('provider', 'microsoft_365')
      .maybeSingle();

    if (!integ || !integ.access_token) {
      return json({ error: 'microsoft_365_not_connected' }, 409);
    }

    const token = await refreshIfExpired(admin, userId, integ as TokenRow);

    try {
      const out = await runAction(action_type, target_id, params, token);
      return json({ ok: true, ...out });
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      // Bubble up a friendly permission error to the UI.
      if (/insufficient|Authorization_RequestDenied|permission/i.test(msg)) {
        return json({
          error: 'insufficient_permissions',
          detail: msg,
          hint: 'Reconnect Microsoft 365 and grant the required admin consent.',
        }, 403);
      }
      return json({ error: msg }, 400);
    }
  } catch (err: any) {
    console.error('[ms-graph-remediate] error', err?.message, err?.stack);
    return json({ error: err?.message ?? 'server_error' }, 500);
  }
});

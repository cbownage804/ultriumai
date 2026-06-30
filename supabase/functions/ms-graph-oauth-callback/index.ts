/**
 * ms-graph-oauth-callback — Microsoft Entra ID redirect target.
 * Exchanges the auth code for tokens, stores them on ray_integrations,
 * then bounces the browser back to the app.
 *
 * GET ?code=...&state=...
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

function html(message: string, redirect?: string) {
  return `<!doctype html><meta charset="utf-8"><title>Wrayth · Microsoft 365</title>
<style>body{background:#0b0b10;color:#e8e8ef;font-family:ui-sans-serif,system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}.card{max-width:420px;padding:32px;border:1px solid #26262f;border-radius:16px;text-align:center}.dot{width:8px;height:8px;border-radius:50%;background:#8b5cf6;display:inline-block;margin-right:8px;animation:p 1.2s infinite}@keyframes p{0%,100%{opacity:.3}50%{opacity:1}}</style>
<div class="card"><h2><span class="dot"></span>Ray</h2><p>${message}</p></div>
${redirect ? `<script>setTimeout(()=>location.replace(${JSON.stringify(redirect)}),1200)</script>` : ""}`;
}

function htmlResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function callbackUrl() {
  return `${Deno.env.get("SUPABASE_URL")!}/functions/v1/ms-graph-oauth-callback`;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (errorParam) return htmlResponse(html(`Microsoft rejected the connection: ${errorParam}`));
  if (!code || !stateRaw) return htmlResponse(html("Missing code or state."), 400);

  let state: { uid: string; origin: string };
  try {
    state = JSON.parse(atob(stateRaw));
  } catch {
    return htmlResponse(html("Invalid state."), 400);
  }

  const clientId = Deno.env.get("AZURE_CLIENT_ID");
  const clientSecret = Deno.env.get("AZURE_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    return htmlResponse(html("Microsoft 365 isn't configured on the server yet."), 500);
  }

  try {
    const tokenRes = await fetch(
      "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: callbackUrl(),
          grant_type: "authorization_code",
        }),
      },
    );
    const tokenJson = await tokenRes.json();
    if (!tokenRes.ok) {
      return htmlResponse(
        html(`Token exchange failed: ${tokenJson.error_description || tokenJson.error || tokenRes.status}`),
        400,
      );
    }

    const accessToken: string = tokenJson.access_token;
    const refreshToken: string | undefined = tokenJson.refresh_token;
    const expiresIn: number = tokenJson.expires_in ?? 3600;
    const scopes: string[] = (tokenJson.scope || "").split(" ").filter(Boolean);

    // Look up the user's UPN + tenant from Graph /me
    let email = "";
    let tenantId = "";
    try {
      const meRes = await fetch("https://graph.microsoft.com/v1.0/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const me = await meRes.json();
      email = me.userPrincipalName || me.mail || "";
      // Tenant id is encoded in the JWT — decode minimally.
      const [, payload] = accessToken.split(".");
      if (payload) {
        const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
        tenantId = decoded.tid || "";
      }
    } catch (_) { /* tolerate */ }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const expiresAt = new Date(Date.now() + (expiresIn - 60) * 1000).toISOString();
    await supabase
      .from("ray_integrations")
      .upsert(
        {
          user_id: state.uid,
          provider: "microsoft_365",
          provider_tenant_id: tenantId || null,
          account_email: email || null,
          status: "connected",
          access_token: accessToken,
          refresh_token: refreshToken || null,
          token_expires_at: expiresAt,
          scopes,
          last_error: null,
          metadata: { connected_at: new Date().toISOString() },
        },
        { onConflict: "user_id,provider" },
      );

    const back =
      (state.origin && /^https?:\/\//.test(state.origin) ? state.origin : "") +
      "/app/integrations?connected=microsoft_365";
    return htmlResponse(html("Microsoft 365 connected. Returning you to Ray…", back));
  } catch (err) {
    return htmlResponse(html(`Unexpected error: ${String(err)}`), 500);
  }
});

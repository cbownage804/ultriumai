/**
 * ms-graph-sync — Pulls live security posture from Microsoft Graph for the
 * authenticated user's connected tenant and writes findings to ray_findings
 * + a ray_timeline event. Refreshes the access token if needed.
 *
 * Body: {}  (uses the caller's stored integration)
 * Returns: { ok: true, signals, summary }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

type Signal = {
  key: string;
  label: string;
  status: "ok" | "warn" | "risk" | "unknown";
  value?: string | number | null;
  detail?: string;
};

async function graph<T = any>(token: string, path: string): Promise<{ ok: boolean; status: number; data: T | null }> {
  const res = await fetch(`https://graph.microsoft.com/v1.0${path}`, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  let data: any = null;
  try { data = await res.json(); } catch { /* ignore */ }
  return { ok: res.ok, status: res.status, data };
}

async function refreshAccessToken(refreshToken: string) {
  const clientId = Deno.env.get("AZURE_CLIENT_ID")!;
  const clientSecret = Deno.env.get("AZURE_CLIENT_SECRET")!;
  const res = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error_description || json.error || `refresh ${res.status}`);
  return json as { access_token: string; refresh_token?: string; expires_in: number };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: integ } = await admin
      .from("ray_integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("provider", "microsoft_365")
      .maybeSingle();

    if (!integ || integ.status !== "connected") {
      return new Response(JSON.stringify({ error: "Microsoft 365 is not connected" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let accessToken: string = integ.access_token;
    const expiresAt = integ.token_expires_at ? new Date(integ.token_expires_at).getTime() : 0;
    if (expiresAt < Date.now() + 30_000 && integ.refresh_token) {
      try {
        const refreshed = await refreshAccessToken(integ.refresh_token);
        accessToken = refreshed.access_token;
        await admin.from("ray_integrations").update({
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token || integ.refresh_token,
          token_expires_at: new Date(Date.now() + (refreshed.expires_in - 60) * 1000).toISOString(),
        }).eq("id", integ.id);
      } catch (e) {
        await admin.from("ray_integrations").update({
          status: "error", last_error: `refresh: ${String(e)}`,
        }).eq("id", integ.id);
        return new Response(JSON.stringify({ error: "Token refresh failed. Please reconnect Microsoft 365." }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const signals: Signal[] = [];

    // 1) Security defaults / Conditional Access
    const sd = await graph<any>(accessToken, "/policies/identitySecurityDefaultsEnforcementPolicy");
    if (sd.ok && sd.data) {
      const on = !!sd.data.isEnabled;
      signals.push({
        key: "security_defaults",
        label: "Security Defaults",
        status: on ? "ok" : "warn",
        value: on ? "enabled" : "disabled",
        detail: on ? "Baseline MFA + legacy auth block is on." : "Off — rely on Conditional Access policies instead.",
      });
    } else {
      signals.push({ key: "security_defaults", label: "Security Defaults", status: "unknown", detail: `HTTP ${sd.status}` });
    }

    const ca = await graph<any>(accessToken, "/identity/conditionalAccess/policies?$select=id,displayName,state");
    if (ca.ok && Array.isArray(ca.data?.value)) {
      const enabled = ca.data.value.filter((p: any) => p.state === "enabled").length;
      signals.push({
        key: "conditional_access",
        label: "Conditional Access policies",
        status: enabled > 0 ? "ok" : "warn",
        value: enabled,
        detail: enabled > 0 ? `${enabled} enabled policy(ies).` : "No enabled Conditional Access policies.",
      });
    } else {
      signals.push({ key: "conditional_access", label: "Conditional Access policies", status: "unknown", detail: `HTTP ${ca.status}` });
    }

    // 2) Privileged role members (Global Admins)
    const ga = await graph<any>(accessToken, "/directoryRoles?$filter=displayName eq 'Global Administrator'");
    if (ga.ok && ga.data?.value?.[0]?.id) {
      const members = await graph<any>(accessToken, `/directoryRoles/${ga.data.value[0].id}/members?$select=id,userPrincipalName`);
      const count = members.data?.value?.length ?? 0;
      signals.push({
        key: "global_admins",
        label: "Global Administrators",
        status: count > 0 && count <= 4 ? "ok" : count > 4 ? "warn" : "risk",
        value: count,
        detail: count > 4 ? "Microsoft recommends 2–4 break-glass admins." : `${count} active.`,
      });
    }

    // 3) MFA registration coverage
    const mfa = await graph<any>(accessToken, "/reports/authenticationMethods/userRegistrationDetails?$top=999");
    if (mfa.ok && Array.isArray(mfa.data?.value)) {
      const total = mfa.data.value.length;
      const mfaReady = mfa.data.value.filter((u: any) => u.isMfaRegistered).length;
      const pct = total ? Math.round((mfaReady / total) * 100) : 0;
      signals.push({
        key: "mfa_coverage",
        label: "MFA registration",
        status: pct >= 95 ? "ok" : pct >= 70 ? "warn" : "risk",
        value: `${pct}%`,
        detail: `${mfaReady} of ${total} users have MFA registered.`,
      });
    }

    // 4) Secure score
    const score = await graph<any>(accessToken, "/security/secureScores?$top=1");
    if (score.ok && score.data?.value?.[0]) {
      const s = score.data.value[0];
      const pct = Math.round((s.currentScore / s.maxScore) * 100);
      signals.push({
        key: "secure_score",
        label: "Microsoft Secure Score",
        status: pct >= 70 ? "ok" : pct >= 40 ? "warn" : "risk",
        value: `${pct}%`,
        detail: `${s.currentScore}/${s.maxScore}`,
      });
    }

    // Persist as ray_findings (idempotent per key per user)
    const now = new Date().toISOString();
    for (const sig of signals) {
      const sev = sig.status === "risk" ? "critical" : sig.status === "warn" ? "warning" : "info";
      await admin.from("ray_findings").upsert(
        {
          user_id: userId,
          source: "microsoft_365",
          category: "identity",
          finding_key: `m365:${sig.key}`,
          title: `M365 · ${sig.label}`,
          summary: sig.detail || "",
          severity: sev,
          status: "open",
          metadata: { value: sig.value, signal: sig },
          observed_at: now,
        },
        { onConflict: "user_id,finding_key" } as any,
      );
    }

    await admin.from("ray_integrations").update({
      last_sync_at: now,
      status: "connected",
      last_error: null,
      metadata: { ...(integ.metadata || {}), last_signals: signals.length },
    }).eq("id", integ.id);

    // Timeline entry — best effort
    try {
      await admin.from("ray_timeline").insert({
        user_id: userId,
        event_type: "integration_sync",
        title: "Synced Microsoft 365",
        summary: `Pulled ${signals.length} signal(s) from your tenant.`,
        metadata: { provider: "microsoft_365", signals },
      });
    } catch (_) { /* table optional */ }

    return new Response(JSON.stringify({ ok: true, signals }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

/**
 * ray-sync-signals — Track 1: Real Data Hardening.
 *
 * Pulls live signals from Vault (password_entries), Scan (safescan_*),
 * and Watch (safeweb_*) for the authenticated user and upserts them
 * into ray_findings so Ray's briefing/score consume one unified source.
 *
 * Idempotent: keyed by (user_id, kind, entry_id). Safe to call every
 * dashboard mount; cheap reads only — no third-party API calls here.
 * (HIBP enrichment lives in ray-breach-check / safeweb-scanner and runs
 * on its own cadence.)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Finding = {
  user_id: string;
  entry_id: string;
  kind: string;
  severity: "low" | "medium" | "high" | "critical";
  details: Record<string, unknown>;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;
    const findings: Finding[] = [];

    // ---- Vault: passwords ----
    const { data: pwds } = await supabase
      .from("password_entries")
      .select("id,password_strength,updated_at")
      .eq("user_id", userId);
    const weak = (pwds ?? []).filter((p: any) =>
      typeof p.password_strength === "number" ? p.password_strength < 50 : false
    );
    if (weak.length > 0) {
      findings.push({
        user_id: userId,
        entry_id: `vault:weak`,
        kind: "vault.weak_passwords",
        severity: weak.length > 5 ? "high" : "medium",
        details: { count: weak.length, source: "vault" },
      });
    }

    // ---- Vault: missing 2FA (vault_totp_secrets) ----
    const { count: totpCount } = await supabase
      .from("vault_totp_secrets")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    const pwdCount = (pwds ?? []).length;
    if (pwdCount > 0 && (totpCount ?? 0) === 0) {
      findings.push({
        user_id: userId,
        entry_id: `vault:no-2fa`,
        kind: "vault.missing_2fa",
        severity: "medium",
        details: { source: "vault", password_count: pwdCount },
      });
    }

    // ---- Scan: active threats (last 30d) ----
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data: scanThreats } = await supabase
      .from("safemail_threats")
      .select("id,severity,created_at")
      .eq("user_id", userId)
      .gte("created_at", since)
      .limit(50);
    for (const t of scanThreats ?? []) {
      findings.push({
        user_id: userId,
        entry_id: `scan:${t.id}`,
        kind: "scan.threat",
        severity: normalizeSeverity((t as any).severity),
        details: { source: "scan", id: t.id },
      });
    }

    // ---- Watch: exposure (safeweb_threats active) ----
    const { data: webThreats } = await supabase
      .from("safeweb_threats")
      .select("id,severity,status,created_at")
      .eq("user_id", userId)
      .neq("status", "resolved")
      .limit(50);
    for (const t of webThreats ?? []) {
      findings.push({
        user_id: userId,
        entry_id: `watch:${t.id}`,
        kind: "watch.exposure",
        severity: normalizeSeverity((t as any).severity),
        details: { source: "watch", id: t.id },
      });
    }

    // Upsert all findings keyed by (user_id, kind, entry_id).
    if (findings.length > 0) {
      const { error: upErr } = await supabase
        .from("ray_findings")
        .upsert(findings, { onConflict: "user_id,kind,entry_id" });
      if (upErr) {
        console.warn("[ray-sync-signals] upsert failed", upErr);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        synced: findings.length,
        breakdown: {
          vault: findings.filter((f) => f.kind.startsWith("vault.")).length,
          scan: findings.filter((f) => f.kind.startsWith("scan.")).length,
          watch: findings.filter((f) => f.kind.startsWith("watch.")).length,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[ray-sync-signals] error", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function normalizeSeverity(s: unknown): Finding["severity"] {
  const v = String(s ?? "").toLowerCase();
  if (v === "critical") return "critical";
  if (v === "high") return "high";
  if (v === "low" || v === "info") return "low";
  return "medium";
}

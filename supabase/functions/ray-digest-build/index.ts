// Builds weekly Ray security digests. Aggregates recommendations, scores,
// and timeline events for each active org/user over the last 7 days into
// ray_digests. Idempotent per (org_id|user_id, week_start).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export function weekBounds(now = new Date()) {
  // Digest covers the most recently completed 7 days (Mon-Sun) in UTC.
  const end = new Date(now);
  end.setUTCHours(0, 0, 0, 0);
  const day = end.getUTCDay(); // 0 Sun..6 Sat
  const diffToMonday = ((day + 6) % 7); // days since last Mon
  const monday = new Date(end);
  monday.setUTCDate(end.getUTCDate() - diffToMonday - 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return { week_start: monday.toISOString().slice(0, 10), week_end: sunday.toISOString().slice(0, 10) };
}


async function buildForScope(
  admin: ReturnType<typeof createClient>,
  scope: { org_id: string | null; user_id: string | null },
  weekStart: string,
  weekEnd: string,
) {
  const startTs = `${weekStart}T00:00:00Z`;
  const endTs = `${weekEnd}T23:59:59Z`;

  let recQ = admin.from("ray_recommendations")
    .select("id, severity, status, category, title, first_seen_at, last_seen_at, updated_at");
  if (scope.org_id) recQ = recQ.eq("org_id", scope.org_id);
  else if (scope.user_id) recQ = recQ.eq("user_id", scope.user_id);
  const { data: recs = [] } = await recQ;

  const openInWindow = (recs ?? []).filter((r: any) =>
    r.status === "new" && r.first_seen_at >= startTs && r.first_seen_at <= endTs
  );
  const resolvedInWindow = (recs ?? []).filter((r: any) =>
    r.status === "resolved" && r.updated_at >= startTs && r.updated_at <= endTs
  );

  const counts = {
    new_findings: openInWindow.length,
    resolved: resolvedInWindow.length,
    danger: openInWindow.filter((r: any) => r.severity === "danger").length,
    warn: openInWindow.filter((r: any) => r.severity === "warn").length,
    by_category: openInWindow.reduce((acc: Record<string, number>, r: any) => {
      acc[r.category ?? "other"] = (acc[r.category ?? "other"] ?? 0) + 1;
      return acc;
    }, {}),
  };

  const highlights = [...openInWindow]
    .sort((a: any, b: any) => (b.severity === "danger" ? 1 : 0) - (a.severity === "danger" ? 1 : 0))
    .slice(0, 5)
    .map((r: any) => ({ id: r.id, severity: r.severity, title: r.title, category: r.category }));

  // Score before/after (best effort — table may not have entries for this scope)
  let score_before: number | null = null;
  let score_after: number | null = null;
  try {
    const scoreCol = scope.org_id ? "org_id" : "user_id";
    const scoreVal = scope.org_id ?? scope.user_id;
    if (scoreVal) {
      const { data: scores } = await admin
        .from("ray_security_scores")
        .select("score, created_at")
        .eq(scoreCol as any, scoreVal)
        .order("created_at", { ascending: true });
      if (scores && scores.length > 0) {
        const beforeRow = scores.find((s: any) => s.created_at <= startTs);
        const afterRow = [...scores].reverse().find((s: any) => s.created_at <= endTs);
        score_before = beforeRow?.score ?? scores[0]?.score ?? null;
        score_after = afterRow?.score ?? scores[scores.length - 1]?.score ?? null;
      }
    }
  } catch (_) { /* table shape varies, skip */ }

  const totals = {
    recommendations_open: (recs ?? []).filter((r: any) => r.status === "new").length,
    recommendations_resolved: (recs ?? []).filter((r: any) => r.status === "resolved").length,
  };

  // Scope both org_id and user_id so we never collide with a different scope
  // sharing the same week (e.g. an org row vs a solo-user row).
  let existingQ = admin
    .from("ray_digests")
    .select("id")
    .eq("week_start", weekStart);
  existingQ = scope.org_id
    ? existingQ.eq("org_id", scope.org_id).is("user_id", null)
    : existingQ.eq("user_id", scope.user_id as string).is("org_id", null);
  const { data: existing } = await existingQ.maybeSingle();


  const payload = {
    org_id: scope.org_id,
    user_id: scope.user_id,
    week_start: weekStart,
    week_end: weekEnd,
    score_before,
    score_after,
    counts,
    highlights,
    ...totals,
  };

  if (existing?.id) {
    await admin.from("ray_digests").update(payload).eq("id", existing.id);
    return { updated: existing.id };
  }
  const { data: inserted } = await admin.from("ray_digests").insert(payload).select("id").maybeSingle();
  return { created: inserted?.id };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  try {
    let scopeOverride: { org_id?: string; user_id?: string } | null = null;
    try { scopeOverride = await req.json(); } catch { /* no body */ }
    const { week_start, week_end } = weekBounds();

    const scopes: Array<{ org_id: string | null; user_id: string | null }> = [];
    if (scopeOverride?.org_id) scopes.push({ org_id: scopeOverride.org_id, user_id: null });
    else if (scopeOverride?.user_id) scopes.push({ org_id: null, user_id: scopeOverride.user_id });
    else {
      const { data: orgs } = await admin.from("organizations").select("id").limit(1000);
      for (const o of orgs ?? []) scopes.push({ org_id: (o as any).id, user_id: null });
      // Include users without an org who still have recommendations
      const { data: soloUsers } = await admin
        .from("ray_recommendations")
        .select("user_id")
        .is("org_id", null)
        .not("user_id", "is", null)
        .limit(1000);
      const seen = new Set<string>();
      for (const u of soloUsers ?? []) {
        const id = (u as any).user_id as string;
        if (id && !seen.has(id)) { seen.add(id); scopes.push({ org_id: null, user_id: id }); }
      }
    }

    const results: any[] = [];
    for (const s of scopes) {
      try { results.push({ scope: s, ...(await buildForScope(admin, s, week_start, week_end)) }); }
      catch (e) { results.push({ scope: s, error: (e as Error).message }); }
    }

    return new Response(JSON.stringify({ week_start, week_end, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ray-digest-build error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

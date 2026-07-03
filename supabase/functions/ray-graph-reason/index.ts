// ray-graph-reason: cross-skill reasoning over the Security Graph.
// Runs a handful of graph queries against ray_entities / ray_relationships /
// ray_events + ray_recommendations, and emits correlation events with stable
// dedup keys so repeated runs are idempotent.
//
// Not user-scoped: cron-driven, service-role only. verify_jwt = false.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type Admin = ReturnType<typeof createClient>;

async function emit(
  admin: Admin,
  ev: {
    org_id: string | null;
    entity_id: string;
    related_entity_id?: string | null;
    title: string;
    body?: string;
    payload?: Record<string, unknown>;
    dedup_key: string;
    severity?: "info" | "warn" | "danger";
  },
) {
  await admin.from("ray_events").upsert(
    {
      org_id: ev.org_id,
      entity_id: ev.entity_id,
      related_entity_id: ev.related_entity_id ?? null,
      event_type: "correlation",
      severity: ev.severity ?? "warn",
      title: ev.title,
      body: ev.body ?? null,
      payload: ev.payload ?? {},
      source: "ray-graph-reason",
      dedup_key: ev.dedup_key,
      occurred_at: new Date().toISOString(),
    },
    { onConflict: "dedup_key", ignoreDuplicates: true },
  );
}

/**
 * Rule 1 — Device hotspots.
 * A device with 3+ open danger/warn recommendations is a hotspot: fixing it
 * would materially move the needle. One correlation per device per day.
 */
async function detectDeviceHotspots(admin: Admin): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: recs = [] } = await admin
    .from("ray_recommendations")
    .select("subject_id, subject_type, org_id, severity, status")
    .eq("subject_type", "device")
    .eq("status", "new")
    .in("severity", ["danger", "warn"]);
  const bySubject = new Map<string, { count: number; org_id: string | null }>();
  for (const r of (recs as any[]) ?? []) {
    if (!r.subject_id) continue;
    const cur = bySubject.get(r.subject_id) ?? { count: 0, org_id: r.org_id ?? null };
    cur.count++;
    bySubject.set(r.subject_id, cur);
  }
  let count = 0;
  for (const [subjectId, { count: n, org_id }] of bySubject.entries()) {
    if (n < 3) continue;
    // Find the device entity for this subject_id
    const { data: entity } = await admin
      .from("ray_entities")
      .select("id, name")
      .eq("type", "device")
      .eq("external_id", subjectId)
      .maybeSingle();
    if (!entity) continue;
    await emit(admin, {
      org_id,
      entity_id: (entity as any).id,
      title: `Hotspot: ${(entity as any).name} has ${n} open risks`,
      body: `Fixing this device would clear ${n} outstanding recommendations.`,
      payload: { open_recs: n, subject_id: subjectId },
      dedup_key: `hotspot:device:${subjectId}:${today}`,
      severity: n >= 5 ? "danger" : "warn",
    });
    count++;
  }
  return count;
}

/**
 * Rule 2 — Breach + at-risk device on the same user.
 * If a user owns a device with any open danger recommendation AND has a
 * `breach` entity linked to them, credential compromise + weak device
 * posture is a high-signal correlation.
 */
async function detectBreachedUserAtRiskDevice(admin: Admin): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  // Users who own a breach
  const { data: breachRels = [] } = await admin
    .from("ray_relationships")
    .select("source_entity_id, target_entity_id, relationship_type")
    .in("relationship_type", ["affects", "owns"])
    .limit(2000);
  const { data: breachEntities = [] } = await admin
    .from("ray_entities")
    .select("id, user_id, org_id, name")
    .eq("type", "breach");
  const breachIds = new Set((breachEntities as any[]).map((b) => b.id));
  const userIdsWithBreach = new Set<string>();
  for (const r of (breachRels as any[]) ?? []) {
    if (breachIds.has(r.target_entity_id) || breachIds.has(r.source_entity_id)) {
      // Look up the user side of the edge
      const otherId = breachIds.has(r.target_entity_id) ? r.source_entity_id : r.target_entity_id;
      userIdsWithBreach.add(otherId);
    }
  }
  if (!userIdsWithBreach.size) return 0;

  // Devices owned by those users with open danger recs
  const { data: userEntities = [] } = await admin
    .from("ray_entities")
    .select("id, user_id, org_id, name")
    .in("id", Array.from(userIdsWithBreach));

  let count = 0;
  for (const u of (userEntities as any[]) ?? []) {
    if (!u.user_id) continue;
    const { data: openDanger = [] } = await admin
      .from("ray_recommendations")
      .select("id, subject_id, title")
      .eq("user_id", u.user_id)
      .eq("subject_type", "device")
      .eq("severity", "danger")
      .eq("status", "new")
      .limit(5);
    if (!openDanger.length) continue;
    await emit(admin, {
      org_id: u.org_id,
      entity_id: u.id,
      title: `${u.name} has a breach and a device at high risk`,
      body: `Credentials for this user appear in a known breach and their device has ${openDanger.length} open critical recommendation(s). Prioritize password rotation + device remediation together.`,
      payload: { open_danger_recs: openDanger.length },
      dedup_key: `breach-plus-device:${u.id}:${today}`,
      severity: "danger",
    });
    count++;
  }
  return count;
}

/**
 * Rule 3 — Recommendation clusters.
 * Multiple open recommendations targeting the same subject that share the
 * same category → "one fix, N risks eliminated".
 */
async function detectRecommendationClusters(admin: Admin): Promise<number> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: recs = [] } = await admin
    .from("ray_recommendations")
    .select("id, org_id, subject_id, subject_type, category, title, status")
    .eq("status", "new")
    .not("subject_id", "is", null)
    .not("category", "is", null)
    .limit(5000);
  const groups = new Map<string, { ids: string[]; org_id: string | null; subject: string; category: string; subject_type: string }>();
  for (const r of (recs as any[]) ?? []) {
    const k = `${r.category}|${r.subject_type}|${r.subject_id}`;
    const g = groups.get(k) ?? {
      ids: [],
      org_id: r.org_id ?? null,
      subject: r.subject_id,
      category: r.category,
      subject_type: r.subject_type,
    };
    g.ids.push(r.id);
    groups.set(k, g);
  }
  let count = 0;
  for (const [k, g] of groups) {
    if (g.ids.length < 3) continue;
    // Find the recommendation entity for the first rec, hang the correlation
    // off it (any is fine — links back via subject_id).
    const { data: recEntity } = await admin
      .from("ray_entities")
      .select("id")
      .eq("type", "recommendation")
      .eq("external_id", g.ids[0])
      .maybeSingle();
    if (!recEntity) continue;
    await emit(admin, {
      org_id: g.org_id,
      entity_id: (recEntity as any).id,
      title: `${g.ids.length} related ${g.category} risks on the same ${g.subject_type}`,
      body: `Resolving these together will eliminate ${g.ids.length} outstanding recommendations at once.`,
      payload: { rec_ids: g.ids, category: g.category },
      dedup_key: `cluster:${k}:${today}`,
      severity: "warn",
    });
    count++;
  }
  return count;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const results: Record<string, number> = {};
  try {
    results.device_hotspots = await detectDeviceHotspots(admin);
    results.breach_plus_device = await detectBreachedUserAtRiskDevice(admin);
    results.recommendation_clusters = await detectRecommendationClusters(admin);
  } catch (err) {
    console.error("ray-graph-reason error", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err), results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

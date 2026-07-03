// ray-graph-sync: idempotent projection from existing tables into the
// Security Graph (ray_entities, ray_relationships, ray_events).
//
// Runs unauthenticated (verify_jwt = false) and uses the service role to
// safely upsert. Called by pg_cron and manually via POST for backfill.
//
// Body (optional):
//   { "org_id": "uuid" }          → scope to a single org
//   { "backfill_timeline": true } → replay ray_org_timeline into ray_events
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

interface EntityUpsert {
  org_id: string | null;
  user_id: string | null;
  type: string;
  external_id: string;
  name: string;
  attributes?: Record<string, unknown>;
}

/**
 * Upsert an entity by (org_id, type, external_id). Returns entity id.
 * Idempotent: safe to call repeatedly.
 */
async function upsertEntity(admin: Admin, e: EntityUpsert): Promise<string | null> {
  const { data, error } = await admin
    .from("ray_entities")
    .upsert(
      {
        org_id: e.org_id,
        user_id: e.user_id,
        type: e.type,
        external_id: e.external_id,
        name: e.name,
        attributes: e.attributes ?? {},
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "org_id,type,external_id", ignoreDuplicates: false },
    )
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("upsertEntity", error);
    return null;
  }
  return (data as any)?.id ?? null;
}

async function ensureRelationship(
  admin: Admin,
  orgId: string | null,
  sourceId: string,
  targetId: string,
  relationshipType: string,
  attributes: Record<string, unknown> = {},
) {
  await admin
    .from("ray_relationships")
    .upsert(
      {
        org_id: orgId,
        source_entity_id: sourceId,
        target_entity_id: targetId,
        relationship_type: relationshipType,
        attributes,
      },
      { onConflict: "source_entity_id,target_entity_id,relationship_type", ignoreDuplicates: true },
    );
}

interface EventInsert {
  org_id: string | null;
  entity_id: string;
  related_entity_id?: string | null;
  event_type: string;
  severity?: "info" | "success" | "warn" | "danger";
  title: string;
  body?: string | null;
  payload?: Record<string, unknown>;
  source: string;
  dedup_key: string;
  occurred_at?: string;
}

async function emitEvent(admin: Admin, ev: EventInsert) {
  // dedup_key has a partial unique index; onConflict skips duplicates.
  await admin
    .from("ray_events")
    .upsert(
      {
        ...ev,
        severity: ev.severity ?? "info",
        payload: ev.payload ?? {},
      },
      { onConflict: "dedup_key", ignoreDuplicates: true },
    );
}

/** Project profiles → user entities. */
async function syncUsers(admin: Admin) {
  const { data: profiles = [] } = await admin
    .from("profiles")
    .select("id, full_name, email, org_id")
    .limit(5000);
  let count = 0;
  for (const p of (profiles as any[]) ?? []) {
    await upsertEntity(admin, {
      org_id: p.org_id ?? null,
      user_id: p.id,
      type: "user",
      external_id: p.id,
      name: p.full_name || p.email || "User",
      attributes: { email: p.email ?? null },
    });
    count++;
  }
  return count;
}

/** Project wrayth_devices → device entities + user→device relationship. */
async function syncDevices(admin: Admin) {
  const { data: devices = [] } = await admin
    .from("wrayth_devices")
    .select("id, user_id, hostname, os, os_version, last_seen_at, revoked_at")
    .is("revoked_at", null)
    .limit(5000);
  let count = 0;
  for (const d of (devices as any[]) ?? []) {
    const deviceId = await upsertEntity(admin, {
      org_id: null,
      user_id: d.user_id,
      type: "device",
      external_id: d.id,
      name: d.hostname || "Device",
      attributes: {
        os: d.os,
        os_version: d.os_version,
        last_seen_at: d.last_seen_at,
      },
    });
    if (!deviceId) continue;
    // Find/create the owning user entity
    const userId = await upsertEntity(admin, {
      org_id: null,
      user_id: d.user_id,
      type: "user",
      external_id: d.user_id,
      name: "User",
    });
    if (userId) {
      await ensureRelationship(admin, null, userId, deviceId, "owns");
    }
    count++;
  }
  return count;
}

/** Project ray_recommendations → recommendation entities + events. */
async function syncRecommendations(admin: Admin, sinceIso: string) {
  const { data: recs = [] } = await admin
    .from("ray_recommendations")
    .select(
      "id, org_id, user_id, category, severity, title, body, status, subject_type, subject_id, first_seen_at, completed_at, updated_at",
    )
    .gte("updated_at", sinceIso)
    .limit(2000);
  let count = 0;
  for (const r of (recs as any[]) ?? []) {
    const recEntity = await upsertEntity(admin, {
      org_id: r.org_id ?? null,
      user_id: r.user_id ?? null,
      type: "recommendation",
      external_id: r.id,
      name: r.title,
      attributes: {
        category: r.category,
        severity: r.severity,
        status: r.status,
        subject_type: r.subject_type,
        subject_id: r.subject_id,
      },
    });
    if (!recEntity) continue;

    // Link to subject entity if known (device/user)
    if (r.subject_type && r.subject_id) {
      const subjectType = r.subject_type === "device" ? "device" : r.subject_type === "user" ? "user" : null;
      if (subjectType) {
        const subjectEntity = await upsertEntity(admin, {
          org_id: r.org_id ?? null,
          user_id: r.user_id ?? null,
          type: subjectType,
          external_id: r.subject_id,
          name: subjectType === "device" ? "Device" : "User",
        });
        if (subjectEntity) {
          await ensureRelationship(admin, r.org_id ?? null, recEntity, subjectEntity, "affects");
        }
      }
    }

    // Emit opened event (dedup on rec id + status)
    const severity = (["info", "success", "warn", "danger"].includes(r.severity) ? r.severity : "info") as
      | "info"
      | "success"
      | "warn"
      | "danger";
    await emitEvent(admin, {
      org_id: r.org_id ?? null,
      entity_id: recEntity,
      event_type: "recommendation_opened",
      severity,
      title: r.title,
      body: r.body,
      source: "ray-graph-sync",
      dedup_key: `rec:${r.id}:opened`,
      occurred_at: r.first_seen_at ?? new Date().toISOString(),
    });

    if (r.status === "resolved" && r.completed_at) {
      await emitEvent(admin, {
        org_id: r.org_id ?? null,
        entity_id: recEntity,
        event_type: "recommendation_resolved",
        severity: "success",
        title: `Resolved: ${r.title}`,
        source: "ray-graph-sync",
        dedup_key: `rec:${r.id}:resolved:${r.completed_at}`,
        occurred_at: r.completed_at,
      });
    }
    count++;
  }
  return count;
}

/** Project ray_org_memory → memory entities. */
async function syncMemory(admin: Admin, sinceIso: string) {
  const { data: mems = [] } = await admin
    .from("ray_org_memory")
    .select("id, org_id, key, value, category, updated_at")
    .gte("updated_at", sinceIso)
    .limit(2000);
  let count = 0;
  for (const m of (mems as any[]) ?? []) {
    await upsertEntity(admin, {
      org_id: m.org_id ?? null,
      user_id: null,
      type: "memory",
      external_id: m.id,
      name: m.key,
      attributes: { value: m.value, category: m.category },
    });
    count++;
  }
  return count;
}

/** One-time backfill of ray_org_timeline → ray_events. */
async function backfillTimeline(admin: Admin) {
  const { data: rows = [] } = await admin
    .from("ray_org_timeline")
    .select("id, org_id, category, severity, summary, metadata, occurred_at")
    .limit(10000);
  let count = 0;
  for (const row of (rows as any[]) ?? []) {
    // Ensure a synthetic "org" entity to hang timeline events on
    const orgEntity = row.org_id
      ? await upsertEntity(admin, {
          org_id: row.org_id,
          user_id: null,
          type: "organization",
          external_id: row.org_id,
          name: "Organization",
        })
      : null;
    if (!orgEntity) continue;
    const severity = (["info", "success", "warn", "danger"].includes(row.severity)
      ? row.severity
      : "info") as "info" | "success" | "warn" | "danger";
    await emitEvent(admin, {
      org_id: row.org_id,
      entity_id: orgEntity,
      event_type: row.category || "legacy_timeline",
      severity,
      title: row.summary,
      payload: row.metadata ?? {},
      source: "backfill:ray_org_timeline",
      dedup_key: `legacy:${row.id}`,
      occurred_at: row.occurred_at,
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

  let body: { org_id?: string; backfill_timeline?: boolean; since_hours?: number } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const since = new Date(Date.now() - (body.since_hours ?? 24) * 3600_000).toISOString();

  const results: Record<string, number> = {};
  try {
    results.users = await syncUsers(admin);
    results.devices = await syncDevices(admin);
    results.recommendations = await syncRecommendations(admin, since);
    results.memory = await syncMemory(admin, since);
    if (body.backfill_timeline) {
      results.timeline_backfill = await backfillTimeline(admin);
    }
  } catch (err) {
    console.error("ray-graph-sync error", err);
    return new Response(
      JSON.stringify({ ok: false, error: String(err), results }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  return new Response(
    JSON.stringify({ ok: true, since, results }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});

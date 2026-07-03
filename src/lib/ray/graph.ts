/**
 * Ray Security Graph SDK — thin typed wrappers around ray_entities /
 * ray_relationships / ray_events. Read-only from the client; writes happen
 * server-side via ray-graph-sync and other edge functions using the service
 * role.
 */
import { supabase } from "@/integrations/supabase/client";

export type EntitySeverity = "info" | "success" | "warn" | "danger";

export interface RayEntity {
  id: string;
  org_id: string | null;
  user_id: string | null;
  type: string;
  external_id: string | null;
  name: string;
  attributes: Record<string, unknown>;
  first_seen_at: string;
  last_seen_at: string;
}

export interface RayEvent {
  id: string;
  org_id: string | null;
  entity_id: string;
  related_entity_id: string | null;
  event_type: string;
  severity: EntitySeverity;
  title: string;
  body: string | null;
  payload: Record<string, unknown>;
  source: string;
  dedup_key: string | null;
  occurred_at: string;
  created_at: string;
}

export interface RayRelationship {
  id: string;
  org_id: string | null;
  source_entity_id: string;
  target_entity_id: string;
  relationship_type: string;
  attributes: Record<string, unknown>;
  created_at: string;
}

export interface FetchEventsParams {
  entityId?: string;
  entityType?: string;
  severity?: EntitySeverity[];
  eventTypes?: string[];
  search?: string;
  limit?: number;
  beforeIso?: string; // cursor
}

export async function fetchEntityById(id: string): Promise<RayEntity | null> {
  const { data, error } = await supabase
    .from("ray_entities")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as RayEntity | null) ?? null;
}

export async function fetchEntityByTypeAndExternal(
  type: string,
  externalId: string,
): Promise<RayEntity | null> {
  const { data, error } = await supabase
    .from("ray_entities")
    .select("*")
    .eq("type", type)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return (data as RayEntity | null) ?? null;
}

export async function fetchEvents(params: FetchEventsParams = {}): Promise<RayEvent[]> {
  const limit = params.limit ?? 100;
  let query = supabase
    .from("ray_events")
    .select("*")
    .order("occurred_at", { ascending: false })
    .limit(limit);

  if (params.entityId) {
    query = query.or(
      `entity_id.eq.${params.entityId},related_entity_id.eq.${params.entityId}`,
    );
  }
  if (params.severity && params.severity.length) {
    query = query.in("severity", params.severity);
  }
  if (params.eventTypes && params.eventTypes.length) {
    query = query.in("event_type", params.eventTypes);
  }
  if (params.search && params.search.trim()) {
    // PostgREST .or() parses commas, parens, and dots as syntax. Strip them
    // (plus wildcard chars) so caller input can't escape the ilike operand.
    const term = params.search.trim().replace(/[%,().\\*]/g, "").slice(0, 100);
    if (term) {
      query = query.or(`title.ilike.%${term}%,body.ilike.%${term}%`);
    }
  }

  if (params.beforeIso) {
    query = query.lt("occurred_at", params.beforeIso);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data as RayEvent[]) ?? [];
}

export interface RelatedEntity {
  entity: RayEntity;
  relationship_type: string;
  direction: "outgoing" | "incoming";
}

export async function fetchRelated(entityId: string): Promise<RelatedEntity[]> {
  const { data: rels, error } = await supabase
    .from("ray_relationships")
    .select("*")
    .or(`source_entity_id.eq.${entityId},target_entity_id.eq.${entityId}`)
    .limit(100);
  if (error) throw error;
  const relRows = (rels as RayRelationship[]) ?? [];
  const ids = new Set<string>();
  for (const r of relRows) {
    ids.add(r.source_entity_id === entityId ? r.target_entity_id : r.source_entity_id);
  }
  if (!ids.size) return [];
  const { data: ents, error: entErr } = await supabase
    .from("ray_entities")
    .select("*")
    .in("id", Array.from(ids));
  if (entErr) throw entErr;
  const map = new Map<string, RayEntity>();
  for (const e of (ents as RayEntity[]) ?? []) map.set(e.id, e);
  return relRows
    .map<RelatedEntity | null>((r) => {
      const outgoing = r.source_entity_id === entityId;
      const otherId = outgoing ? r.target_entity_id : r.source_entity_id;
      const entity = map.get(otherId);
      if (!entity) return null;
      return { entity, relationship_type: r.relationship_type, direction: outgoing ? "outgoing" : "incoming" };
    })
    .filter((x): x is RelatedEntity => Boolean(x));
}

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  user: "User",
  device: "Device",
  account: "Account",
  mailbox: "Mailbox",
  organization: "Organization",
  breach: "Breach",
  recommendation: "Recommendation",
  incident: "Incident",
  memory: "Memory",
  password: "Password",
  extension: "Extension",
  policy: "Policy",
  threat: "Threat",
};

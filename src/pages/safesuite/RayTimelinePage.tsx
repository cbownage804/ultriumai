/**
 * Wrayth · Ray's Timeline page — /app/timeline and /app/timeline/:entityType/:entityId
 *
 * v0.5: reads from the Security Graph (ray_events + ray_entities), day-groups
 * events, supports entity-scoped focus and a related-entities sidebar.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RayPageHeader } from "@/components/ray/RayPageHeader";
import { PageMotion } from "@/components/ray/PageMotion";
import { EventList } from "@/components/ray/timeline/EventList";
import { TimelineFilters, type TimelineFilterState } from "@/components/ray/timeline/TimelineFilters";
import { RelatedEntitiesPanel } from "@/components/ray/timeline/RelatedEntitiesPanel";
import {
  ENTITY_TYPE_LABELS,
  fetchEntityById,
  fetchEvents,
  type RayEntity,
  type RayEvent,
} from "@/lib/ray/graph";
import { supabase } from "@/integrations/supabase/client";

export default function RayTimelinePage() {
  const { entityType, entityId } = useParams<{ entityType?: string; entityId?: string }>();
  const [focused, setFocused] = useState<RayEntity | null>(null);
  const [events, setEvents] = useState<RayEvent[]>([]);
  const [entitiesById, setEntitiesById] = useState<Map<string, RayEntity>>(new Map());
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TimelineFilterState>({
    search: "",
    severity: [],
  });

  // Load focused entity when route param present
  useEffect(() => {
    let cancelled = false;
    if (!entityId) {
      setFocused(null);
      return;
    }
    fetchEntityById(entityId).then((e) => {
      if (!cancelled) setFocused(e);
    });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  // Load events (debounced on search)
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      fetchEvents({
        entityId: entityId,
        severity: filters.severity.length ? filters.severity : undefined,
        search: filters.search || undefined,
        limit: 200,
      })
        .then(async (rows) => {
          if (cancelled) return;
          setEvents(rows);
          // Hydrate referenced entities in one round-trip
          const ids = new Set<string>();
          for (const e of rows) {
            ids.add(e.entity_id);
            if (e.related_entity_id) ids.add(e.related_entity_id);
          }
          if (!ids.size) {
            setEntitiesById(new Map());
            return;
          }
          const { data } = await supabase
            .from("ray_entities")
            .select("*")
            .in("id", Array.from(ids));
          const map = new Map<string, RayEntity>();
          for (const e of ((data as RayEntity[]) ?? [])) map.set(e.id, e);
          if (!cancelled) setEntitiesById(map);
        })
        .catch((err) => console.error("fetchEvents", err))
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, filters.search ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [entityId, filters.search, filters.severity]);

  const title = useMemo(() => {
    if (focused) {
      const label = ENTITY_TYPE_LABELS[focused.type] ?? focused.type;
      return `${label}: ${focused.name}`;
    }
    return "Timeline";
  }, [focused]);

  const description = focused
    ? "Everything Ray has observed for this entity, and how it connects to the rest of your graph."
    : "Every protective action I've taken and every signal I've correlated — in order.";

  return (
    <PageMotion className="container max-w-6xl py-6 sm:py-8">
      <RayPageHeader
        title={title}
        subtitle={focused ? "Security Graph" : "Managed by Ray"}
        description={description}
      />

      <div className="mt-4">
        <a
          href={focused ? `/app/graph/${focused.id}` : "/app/graph"}
          className="inline-flex items-center gap-1 text-xs text-violet-300 hover:text-violet-200"
        >
          Open Security Graph →
        </a>
      </div>



      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 min-w-0 space-y-4">
          <TimelineFilters value={filters} onChange={setFilters} />
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <EventList events={events} entitiesById={entitiesById} />
          )}
        </div>
        {focused && (
          <div className="w-full lg:w-72 flex-shrink-0 space-y-3">
            <a
              href={`/app/graph/${focused.id}`}
              className="block rounded-xl border border-border/60 bg-card/40 p-3 text-xs text-violet-300 hover:border-violet-400/60"
            >
              Explore in graph →
            </a>
            <RelatedEntitiesPanel entityId={focused.id} />
          </div>
        )}

      </div>
    </PageMotion>
  );
}

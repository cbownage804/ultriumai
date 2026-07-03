/**
 * EventList — day-grouped list of Security Graph events.
 */
import { useMemo } from "react";
import { format, isToday, isYesterday } from "date-fns";
import type { RayEntity, RayEvent } from "@/lib/ray/graph";
import { EventCard } from "./EventCard";

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

interface Props {
  events: RayEvent[];
  entitiesById: Map<string, RayEntity>;
}

export function EventList({ events, entitiesById }: Props) {
  const grouped = useMemo(() => {
    const map = new Map<string, RayEvent[]>();
    for (const ev of events) {
      const key = dayLabel(ev.occurred_at);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [events]);

  if (!events.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        Nothing yet. Ray's next scan will populate the graph.
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[calc(0.5rem+3px)] top-1 h-full w-px bg-gradient-to-b from-violet-500/30 via-border to-transparent" />
      <div className="space-y-6">
        {grouped.map(([day, dayEvents]) => (
          <section key={day}>
            <h4 className="pl-8 mb-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
              {day}
            </h4>
            <div className="space-y-3">
              {dayEvents.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  subject={entitiesById.get(ev.entity_id) ?? null}
                  related={ev.related_entity_id ? entitiesById.get(ev.related_entity_id) ?? null : null}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

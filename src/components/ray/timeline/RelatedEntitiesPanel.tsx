/**
 * RelatedEntitiesPanel — shows entities connected to the focused entity via
 * ray_relationships. Clicking one refocuses the timeline.
 */
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { fetchRelated, type RelatedEntity } from "@/lib/ray/graph";
import { EntityChip } from "./EntityChip";

interface Props {
  entityId: string;
}

export function RelatedEntitiesPanel({ entityId }: Props) {
  const [items, setItems] = useState<RelatedEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRelated(entityId)
      .then((rows) => {
        if (!cancelled) setItems(rows);
      })
      .catch((e) => console.error("fetchRelated", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entityId]);

  return (
    <aside className="rounded-xl border border-border/60 bg-card/40 p-4">
      <h3 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-3">
        Related
      </h3>
      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading connections…
        </div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">No connections yet.</p>
      ) : (
        <div className="space-y-2">
          {items.map((r) => (
            <div key={`${r.entity.id}:${r.relationship_type}:${r.direction}`} className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 min-w-[70px]">
                {r.direction === "outgoing" ? r.relationship_type : `←${r.relationship_type}`}
              </span>
              <EntityChip entity={r.entity} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}

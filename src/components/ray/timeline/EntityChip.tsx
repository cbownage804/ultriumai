/**
 * EntityChip — small clickable chip that navigates to the entity-scoped
 * timeline view (/app/timeline/:type/:id).
 */
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ENTITY_TYPE_LABELS, type RayEntity } from "@/lib/ray/graph";

interface Props {
  entity: Pick<RayEntity, "id" | "type" | "name">;
  className?: string;
}

export function EntityChip({ entity, className }: Props) {
  const label = ENTITY_TYPE_LABELS[entity.type] ?? entity.type;
  return (
    <Link
      to={`/app/timeline/${entity.type}/${entity.id}`}
      className={className}
    >
      <Badge variant="outline" className="cursor-pointer hover:border-violet-400/50 hover:text-violet-200">
        <span className="mr-1 text-[10px] uppercase tracking-wider opacity-70">
          {label}
        </span>
        <span className="truncate max-w-[14ch]">{entity.name}</span>
      </Badge>
    </Link>
  );
}

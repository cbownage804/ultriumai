/**
 * TimelineFilters — search + severity + entity-type filter bar for the
 * Security Graph timeline.
 */
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { EntitySeverity } from "@/lib/ray/graph";

const SEVERITIES: { id: EntitySeverity; label: string; dot: string }[] = [
  { id: "danger", label: "Danger", dot: "bg-red-500" },
  { id: "warn", label: "Warn", dot: "bg-amber-500" },
  { id: "success", label: "Success", dot: "bg-emerald-500" },
  { id: "info", label: "Info", dot: "bg-violet-500" },
];

export interface TimelineFilterState {
  search: string;
  severity: EntitySeverity[];
}

interface Props {
  value: TimelineFilterState;
  onChange: (next: TimelineFilterState) => void;
}

export function TimelineFilters({ value, onChange }: Props) {
  function toggleSeverity(s: EntitySeverity) {
    const next = value.severity.includes(s)
      ? value.severity.filter((x) => x !== s)
      : [...value.severity, s];
    onChange({ ...value, severity: next });
  }
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search events…"
          className="pl-9"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {SEVERITIES.map((s) => {
          const active = value.severity.includes(s.id);
          return (
            <Button
              key={s.id}
              type="button"
              variant={active ? "secondary" : "outline"}
              size="sm"
              onClick={() => toggleSeverity(s.id)}
              className="h-8"
            >
              <span className={cn("mr-2 h-2 w-2 rounded-full", s.dot)} />
              {s.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

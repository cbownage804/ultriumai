/**
 * EventCard — one event on the Security Graph timeline.
 * Shows subject entity chip, evidence expand, and "Ask Ray" seeding the
 * floating chat via the existing ray:panel-send event bus.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, MessageSquare, ShieldAlert, ShieldCheck, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import type { RayEntity, RayEvent } from "@/lib/ray/graph";
import { EntityChip } from "./EntityChip";

const SEVERITY_STYLE = {
  danger: { dot: "bg-red-500", ring: "ring-red-500/30", text: "text-red-300", Icon: ShieldAlert },
  warn: { dot: "bg-amber-500", ring: "ring-amber-500/30", text: "text-amber-300", Icon: AlertTriangle },
  success: { dot: "bg-emerald-500", ring: "ring-emerald-500/30", text: "text-emerald-300", Icon: ShieldCheck },
  info: { dot: "bg-violet-500", ring: "ring-violet-500/25", text: "text-violet-300", Icon: Info },
} as const;

interface Props {
  event: RayEvent;
  subject?: RayEntity | null;
  related?: RayEntity | null;
}

export function EventCard({ event, subject, related }: Props) {
  const [expanded, setExpanded] = useState(false);
  const style = SEVERITY_STYLE[event.severity] ?? SEVERITY_STYLE.info;
  const Icon = style.Icon;
  const hasEvidence =
    event.body || (event.payload && Object.keys(event.payload).length > 0);

  function askRay() {
    const subjectName = subject?.name ? ` on ${subject.name}` : "";
    const prompt = `Explain this event${subjectName} and what I should do: "${event.title}"`;
    window.dispatchEvent(new CustomEvent("ray:panel-send", { detail: { prompt } }));
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="relative pl-8"
    >
      {/* rail dot */}
      <div
        className={cn(
          "absolute left-2 top-3 h-3 w-3 rounded-full ring-4 ring-background",
          style.dot,
        )}
      />
      <div className="rounded-xl border border-border/60 bg-card/40 p-4 hover:border-border transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Icon className={cn("h-3.5 w-3.5", style.text)} />
              <span className="uppercase tracking-wider">{event.event_type.replace(/_/g, " ")}</span>
              <span>·</span>
              <span>{format(new Date(event.occurred_at), "p")}</span>
              <span>·</span>
              <span className="opacity-60">{event.source}</span>
            </div>
            <h3 className="mt-1 text-sm font-medium text-foreground">{event.title}</h3>
            {(subject || related) && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {subject && <EntityChip entity={subject} />}
                {related && related.id !== subject?.id && <EntityChip entity={related} />}
              </div>
            )}
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={askRay}>
              <MessageSquare className="h-3.5 w-3.5 mr-1" /> Ask Ray
            </Button>
            {hasEvidence && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => setExpanded((v) => !v)}
              >
                <ChevronDown
                  className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
                />
              </Button>
            )}
          </div>
        </div>
        {expanded && hasEvidence && (
          <div className="mt-3 space-y-2 border-t border-border/40 pt-3 text-xs">
            {event.body && <p className="text-muted-foreground">{event.body}</p>}
            {event.payload && Object.keys(event.payload).length > 0 && (
              <pre className="overflow-x-auto rounded bg-muted/40 p-2 text-[11px] text-muted-foreground">
                {JSON.stringify(event.payload, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

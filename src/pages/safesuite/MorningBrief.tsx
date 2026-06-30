/**
 * MorningBrief — Ray's daily security briefing archive.
 *
 * The hero matches Home (MorningBriefHero), so users see the same brief in
 * both places. Below the hero we surface stats and previous briefings so
 * users can revisit past days and compare progress.
 */
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ThumbsUp, ThumbsDown, AlertCircle } from "lucide-react";
import { RayPageHeader } from "@/components/ray/RayPageHeader";
import { MorningBriefHero } from "@/components/ray/MorningBriefHero";
import { useMorningBrief, type RayBriefRow } from "@/lib/ray/morningBrief";
import { cn } from "@/lib/utils";

function StatBlock({ label, value, hint, tone = "neutral" }: { label: string; value: string | number; hint?: string; tone?: "neutral" | "warn" | "danger" | "good" }) {
  const toneCls = {
    neutral: "text-slate-200",
    good: "text-emerald-300",
    warn: "text-amber-300",
    danger: "text-red-300",
  }[tone];
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4">
      <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{label}</div>
      <div className={cn("mt-1 text-2xl font-semibold tabular-nums", toneCls)}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400/90">{hint}</div>}
    </div>
  );
}

function feedbackBadge(feedback: string | null | undefined) {
  if (!feedback) return null;
  if (feedback === "helpful") return { Icon: ThumbsUp, tone: "text-emerald-300", label: "Helpful" };
  if (feedback === "not_helpful") return { Icon: ThumbsDown, tone: "text-amber-300", label: "Not helpful" };
  if (feedback === "wrong") return { Icon: AlertCircle, tone: "text-red-300", label: "Wrong" };
  return null;
}

export default function MorningBrief() {
  const { today, history, timezone } = useMorningBrief();

  const brief: RayBriefRow | null = today;
  const stats = brief?.stats ?? null;

  const dateLabel = useMemo(() => {
    if (!brief) return "Today";
    try {
      return new Date(brief.brief_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    } catch { return brief.brief_date; }
  }, [brief]);

  const previous = useMemo(() => history.filter((h) => h.id !== brief?.id).slice(0, 14), [history, brief]);

  return (
    <div className="space-y-6 max-w-5xl">
      <RayPageHeader
        subtitle="MORNING BRIEF"
        title={dateLabel}
        description={timezone ? `Generated in your local timezone (${timezone}).` : "Generated in your local timezone."}
      />

      <MorningBriefHero variant="page" showFullBriefLink={false} />

      {stats && (
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBlock
            label="Passwords"
            value={stats.passwords?.total ?? 0}
            hint={`${stats.passwords?.weak ?? 0} weak · ${stats.passwords?.breached ?? 0} breached`}
            tone={(stats.passwords?.breached ?? 0) > 0 ? "danger" : (stats.passwords?.weak ?? 0) > 0 ? "warn" : "good"}
          />
          <StatBlock
            label="Open threats"
            value={stats.threats?.open ?? 0}
            hint={`${stats.threats?.critical ?? 0} critical · ${stats.threats?.high ?? 0} high`}
            tone={(stats.threats?.critical ?? 0) > 0 ? "danger" : (stats.threats?.high ?? 0) > 0 ? "warn" : "good"}
          />
          <StatBlock
            label="Monitored"
            value={stats.exposure?.monitored ?? 0}
            hint={`${stats.exposure?.new_breaches ?? 0} new exposures`}
            tone={(stats.exposure?.new_breaches ?? 0) > 0 ? "warn" : "neutral"}
          />
          <StatBlock
            label="Since last brief"
            value={stats.timeline?.since_last_brief ?? 0}
            hint="timeline events"
            tone="neutral"
          />
        </section>
      )}

      {previous.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-3"
        >
          <h2 className="text-sm font-medium text-foreground/80">Previous briefings</h2>
          <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border/60">
            {previous.map((h) => {
              const label = (() => { try { return new Date(h.brief_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); } catch { return h.brief_date; } })();
              const delta = h.score_delta ?? 0;
              const fb = feedbackBadge(h.feedback as string | null);
              return (
                <Link
                  key={h.id}
                  to={`/app/brief?date=${h.brief_date}`}
                  className="flex items-center gap-3 p-3 hover:bg-white/[0.03] transition"
                >
                  <div className="w-28 text-xs text-muted-foreground">{label}</div>
                  <div className="flex-1 min-w-0 text-sm text-foreground truncate">{h.greeting ?? h.summary ?? "Briefing"}</div>
                  {fb && (
                    <span className={cn("inline-flex items-center gap-1 text-[10px] uppercase tracking-wider", fb.tone)}>
                      <fb.Icon className="h-3 w-3" /> {fb.label}
                    </span>
                  )}
                  <div className="flex items-center gap-2 text-xs">
                    {h.score != null && <span className="tabular-nums text-slate-300">{h.score}</span>}
                    {delta !== 0 && (
                      <span className={cn("tabular-nums", delta > 0 ? "text-emerald-300" : "text-red-300")}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.section>
      )}
    </div>
  );
}

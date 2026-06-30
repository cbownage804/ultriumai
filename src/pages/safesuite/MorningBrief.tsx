/**
 * MorningBrief — Ray's daily security briefing.
 *
 * Hybrid generation:
 *   - pg_cron generates the brief at 07:00 in the user's local timezone.
 *   - If no brief exists for today (or the latest is stale), we lazily call
 *     ray-brief on first app open via useMorningBrief().
 *
 * Structured stats come straight from the user's security data; only the
 * greeting/bullets/guidance are AI-written. Every brief is stored in
 * public.ray_briefs so the user can revisit previous days and compare progress.
 */
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ArrowDownRight, CheckCircle2, Loader2, Shield, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RayPageHeader } from "@/components/ray/RayPageHeader";
import { useMorningBrief, type RayBriefRow } from "@/lib/ray/morningBrief";
import { useRayBrain } from "@/lib/ray/brain";
import { cn } from "@/lib/utils";

function pageHrefFor(area?: string | null): string {
  switch (area) {
    case "passwords": return "/app/passwords";
    case "threats": return "/app/threats";
    case "exposure": return "/app/exposure";
    case "identity": return "/app/identity";
    case "devices": return "/app/devices";
    case "reports": return "/app/timeline";
    default: return "/app";
  }
}

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

function ScoreBadge({ score, delta }: { score: number | null; delta: number | null }) {
  if (score == null) return null;
  const tone = score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-300" : "text-red-300";
  return (
    <div className="flex items-center gap-3">
      <div className={cn("text-3xl font-semibold tabular-nums", tone)}>{score}</div>
      <div className="flex flex-col">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">Ray score</div>
        {delta != null && delta !== 0 ? (
          <div className={cn("text-xs flex items-center gap-1", delta > 0 ? "text-emerald-300" : "text-red-300")}>
            {delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)} vs last brief
          </div>
        ) : (
          <div className="text-xs text-slate-400">No change</div>
        )}
      </div>
    </div>
  );
}

export default function MorningBrief() {
  const navigate = useNavigate();
  const { today, history, isLoading, isGenerating, refresh, timezone } = useMorningBrief();
  const { completeRecommendation, dismissRecommendation } = useRayBrain({ pageContext: "home" });

  const brief: RayBriefRow | null = today;
  const stats = brief?.stats ?? null;

  const dateLabel = useMemo(() => {
    if (!brief) return "Today";
    try {
      return new Date(brief.brief_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
    } catch { return brief.brief_date; }
  }, [brief]);

  const previous = useMemo(() => history.filter((h) => h.id !== brief?.id).slice(0, 7), [history, brief]);

  const bullets = brief?.bullets?.length ? brief.bullets : ["I'm catching up on your environment."];
  const greeting = brief?.greeting ?? "Good morning.";

  return (
    <div className="space-y-6 max-w-5xl">
      <RayPageHeader
        subtitle="MORNING BRIEF"
        title={dateLabel}
        description={timezone ? `Generated in your local timezone (${timezone}).` : "Generated in your local timezone."}
      />

      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8"
      >
        <motion.div
          aria-hidden
          className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
          animate={{ opacity: isGenerating ? [0.3, 0.6, 0.3] : 0.25 }}
          transition={{ duration: 2.4, repeat: isGenerating ? Infinity : 0 }}
        />

        <div className="relative flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 text-violet-300/90 text-xs uppercase tracking-[0.18em]">
            <Sparkles className="h-3.5 w-3.5" />
            {isGenerating ? "Ray is thinking…" : brief?.source === "cron" ? "Delivered at 7:00 AM" : "Ray's briefing"}
            {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
          </div>
          {brief && <ScoreBadge score={brief.score} delta={brief.score_delta} />}
        </div>

        <h1 className="relative text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          {greeting}
        </h1>

        <ul className="relative mt-4 space-y-1.5">
          {bullets.map((b, i) => (
            <li key={i} className="text-[15px] text-slate-200/90 leading-relaxed">• {b}</li>
          ))}
        </ul>

        {brief?.guidance && (
          <p className="relative mt-4 text-[15px] text-violet-200/90 border-l-2 border-violet-400/40 pl-3">
            {brief.guidance}
          </p>
        )}

        <div className="relative mt-6 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
            onClick={() => refresh({ force: true })}
            disabled={isGenerating}
          >
            {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
            Re-run the brief
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-white"
            onClick={() => navigate("/app/timeline")}
          >
            Open timeline <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      </motion.section>

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

      {brief && brief.recommendations.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground/80">What Ray recommends</h2>
          <div className="space-y-2">
            {brief.recommendations.map((rec, idx) => {
              const tone = rec.priority >= 70 ? "border-red-500/30 bg-red-500/[0.04]" : rec.priority >= 40 ? "border-amber-500/25 bg-amber-500/[0.03]" : "border-emerald-500/20 bg-emerald-500/[0.03]";
              return (
                <div key={rec.id ?? idx} className={cn("flex items-start gap-3 p-4 rounded-2xl border", tone)}>
                  <Shield className="h-4 w-4 mt-0.5 text-slate-300 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">{rec.title}</div>
                    {rec.body && <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{rec.body}</p>}
                    <div className="mt-2 flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-300 hover:text-white" onClick={() => navigate(pageHrefFor(rec.page_context))}>
                        Open {rec.page_context ?? "area"} <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      {rec.id && (
                        <>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-300 hover:text-emerald-200" onClick={() => completeRecommendation(rec.id!)}>
                            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark done
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => dismissRecommendation(rec.id!)}>
                            <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {previous.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-foreground/80">Previous briefings</h2>
          <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border/60">
            {previous.map((h) => {
              const label = (() => { try { return new Date(h.brief_date + "T12:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }); } catch { return h.brief_date; } })();
              const delta = h.score_delta ?? 0;
              return (
                <div key={h.id} className="flex items-center gap-3 p-3">
                  <div className="w-28 text-xs text-muted-foreground">{label}</div>
                  <div className="flex-1 min-w-0 text-sm text-foreground truncate">{h.greeting ?? h.summary ?? "Briefing"}</div>
                  <div className="flex items-center gap-2 text-xs">
                    {h.score != null && <span className="tabular-nums text-slate-300">{h.score}</span>}
                    {delta !== 0 && (
                      <span className={cn("tabular-nums", delta > 0 ? "text-emerald-300" : "text-red-300")}>
                        {delta > 0 ? "+" : ""}{delta}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

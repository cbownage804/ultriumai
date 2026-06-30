/**
 * MorningBriefHero — Ray's daily morning brief, rendered as the Home hero.
 *
 * Uses the same `useMorningBrief` SDK as /app/brief so Home and the brief
 * archive are always in sync. Includes recommendation lifecycle controls
 * (Start / Snooze / Mark handled / Dismiss) and per-brief feedback
 * (Helpful / Not helpful / Wrong).
 */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Loader2,
  Play,
  Clock,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  X,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMorningBrief, type RayBriefRow, type RayBriefFeedback } from "@/lib/ray/morningBrief";
import { useRayBrain } from "@/lib/ray/brain";
import { cn } from "@/lib/utils";
import { ScoreCelebration } from "@/components/ray/ScoreCelebration";

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

function FeedbackBar({ brief, onSend }: { brief: RayBriefRow; onSend: (f: RayBriefFeedback) => void | Promise<void> }) {
  const current = (brief.feedback ?? null) as RayBriefFeedback | null;
  const items: { id: RayBriefFeedback; label: string; Icon: typeof ThumbsUp }[] = [
    { id: "helpful", label: "Helpful", Icon: ThumbsUp },
    { id: "not_helpful", label: "Not helpful", Icon: ThumbsDown },
    { id: "wrong", label: "Wrong", Icon: AlertCircle },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[11px] uppercase tracking-[0.18em] text-slate-400 mr-1">Brief feedback</span>
      {items.map(({ id, label, Icon }) => {
        const active = current === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSend(id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] transition",
              active
                ? "border-violet-400/60 bg-violet-500/15 text-violet-100"
                : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white",
            )}
            aria-pressed={active}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        );
      })}
      {current && <span className="text-[11px] text-emerald-300/80">Thanks — Ray will learn from this.</span>}
    </div>
  );
}

export interface MorningBriefHeroProps {
  /** Show the "Open full brief" link to /app/brief. Defaults to true. */
  showFullBriefLink?: boolean;
  /** Compact mode hides recommendations & history (used inline on Home). */
  variant?: "home" | "page";
  firstName?: string;
}

export function MorningBriefHero({ showFullBriefLink = true, variant = "home", firstName }: MorningBriefHeroProps) {
  const navigate = useNavigate();
  const { today, isLoading, isGenerating, refresh, sendFeedback, timezone } = useMorningBrief();
  const { recommendations, completeRecommendation, dismissRecommendation, snoozeRecommendation, startRecommendation } =
    useRayBrain({ pageContext: "home" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const brief = today;
  const greeting = brief?.greeting ?? (firstName ? `Good morning, ${firstName}.` : "Good morning.");

  // Ray's one-line personality flourish — rotates daily so he feels alive.
  const personalityLines = [
    "Nothing unusual happened overnight.",
    "Everything looks healthy this morning.",
    "I've already reviewed your latest activity.",
    "You're in good shape today.",
    "Quiet night. I kept watch.",
    "Caught up on everything while you slept.",
  ];
  const personality = personalityLines[new Date().getDate() % personalityLines.length];

  // Build status cards from real brief.stats — facts at a glance.
  const s = brief?.stats ?? null;
  const score = brief?.score ?? null;
  const passwordsHealthy = !s?.passwords || (s.passwords.weak === 0 && s.passwords.reused === 0 && s.passwords.breached === 0);
  const threatsCount = s?.threats?.open ?? 0;
  const exposureCount = s?.exposure?.monitored ?? 0;
  const statusCards: { label: string; value: string; ok: boolean }[] = [
    {
      label: "Security Score",
      value: score != null ? String(score) : "—",
      ok: score == null ? true : score >= 80,
    },
    {
      label: "Threats",
      value: threatsCount === 0 ? "None detected" : `${threatsCount} open`,
      ok: threatsCount === 0,
    },
    {
      label: "Exposure",
      value: exposureCount === 0 ? "Nothing new" : `${exposureCount} identit${exposureCount === 1 ? "y" : "ies"} watched`,
      ok: !s?.exposure?.new_breaches,
    },
    {
      label: "Passwords",
      value: passwordsHealthy ? "Healthy" : `${s?.passwords?.weak ?? 0} to strengthen`,
      ok: passwordsHealthy,
    },
  ];

  const top = recommendations.slice(0, variant === "home" ? 3 : 6);

  async function withBusy(id: string, fn: () => Promise<unknown>) {
    setBusyId(id);
    try { await fn(); } finally { setBusyId(null); }
  }

  return (
    <>
    <ScoreCelebration score={brief?.score ?? null} />
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

      <div className="relative flex items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-2 text-violet-300/90 text-[11px] uppercase tracking-[0.18em]">
          <Sparkles className="h-3.5 w-3.5" />
          {isGenerating ? "Ray is thinking…" : brief?.source === "cron" ? "Delivered at 7:00 AM" : "Ray's morning brief"}
          {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
        </div>
        {brief && <ScoreBadge score={brief.score} delta={brief.score_delta} />}
      </div>

      {/* Conversational greeting — Ray talks like a teammate, not a report. */}
      <h1 className="relative text-2xl sm:text-3xl font-semibold text-white tracking-tight">
        {greeting}
      </h1>
      <p className="relative mt-1 text-sm text-slate-400">
        I checked everything overnight. Here's what matters today.
      </p>
      <p className="relative mt-1 text-xs text-slate-500 italic">{personality}</p>

      {/* Status cards — scannable in one second. */}
      <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {statusCards.map((c) => (
          <div
            key={c.label}
            className={cn(
              "rounded-xl border px-3 py-2.5",
              c.ok
                ? "border-emerald-500/20 bg-emerald-500/[0.04]"
                : "border-amber-500/30 bg-amber-500/[0.05]",
            )}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-slate-400">
              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c.ok ? "bg-emerald-400" : "bg-amber-400")} />
              {c.label}
            </div>
            <div className={cn("mt-1 text-sm font-medium", c.ok ? "text-slate-100" : "text-amber-100")}>
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {brief?.guidance && (
        <p className="relative mt-4 text-[15px] text-violet-200/90 border-l-2 border-violet-400/40 pl-3">
          {brief.guidance}
        </p>
      )}

      {/* Lifecycle-aware recommendations — Start is the clear primary action. */}
      {top.length > 0 && (
        <div className="relative mt-5 space-y-2">
          {top.map((rec) => {
            const tone = rec.priority >= 70
              ? "border-red-500/30 bg-red-500/[0.04]"
              : rec.priority >= 40
                ? "border-amber-500/25 bg-amber-500/[0.03]"
                : "border-emerald-500/20 bg-emerald-500/[0.03]";
            const isBusy = busyId === rec.id;
            const inProgress = rec.status === "in_progress";
            return (
              <div key={rec.id} className={cn("flex items-start gap-3 p-3.5 rounded-2xl border", tone)}>
                <Shield className="h-4 w-4 mt-0.5 text-slate-300 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium text-white">{rec.title}</div>
                    {inProgress && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-violet-400/40 bg-violet-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-violet-200">
                        <Play className="h-2.5 w-2.5" /> In progress
                      </span>
                    )}
                  </div>
                  {rec.body && <p className="mt-1 text-xs text-slate-400 leading-relaxed">{rec.body}</p>}
                  <div className="mt-2 flex items-center flex-wrap gap-1.5">
                    {!inProgress && (
                      <Button
                        size="sm"
                        disabled={isBusy}
                        className="h-7 px-3 text-xs bg-violet-500 hover:bg-violet-400 text-white border-0"
                        onClick={() => withBusy(rec.id, () => startRecommendation(rec.id))}
                      >
                        <Play className="h-3 w-3 mr-1" /> Start
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-slate-300 hover:text-white" onClick={() => navigate(pageHrefFor(rec.page_context))}>
                      Open <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-emerald-300 hover:text-emerald-200" onClick={() => withBusy(rec.id, () => completeRecommendation(rec.id))}>
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mark handled
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-amber-300 hover:text-amber-200" onClick={() => withBusy(rec.id, () => snoozeRecommendation(rec.id, 24))}>
                      <Clock className="h-3.5 w-3.5 mr-1" /> Snooze 24h
                    </Button>
                    <Button size="sm" variant="ghost" disabled={isBusy} className="h-7 px-2 text-xs text-muted-foreground" onClick={() => withBusy(rec.id, () => dismissRecommendation(rec.id))}>
                      <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {brief && (
        <div className="relative mt-5 border-t border-white/5 pt-4">
          <FeedbackBar brief={brief} onSend={sendFeedback} />
        </div>
      )}

      <div className="relative mt-5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-white/5 border-white/10 text-slate-100 hover:bg-white/10"
          onClick={() => refresh({ force: true })}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 mr-2" />}
          Ask Ray to check again
        </Button>
        {showFullBriefLink && (
          <Button asChild variant="ghost" size="sm" className="text-slate-300 hover:text-white">
            <Link to="/app/brief">
              See full brief & history <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        )}
        {timezone && (
          <span className="ml-auto self-center text-[10px] uppercase tracking-[0.18em] text-slate-500">{timezone}</span>
        )}
      </div>
    </motion.section>
    </>
  );
}

export default MorningBriefHero;

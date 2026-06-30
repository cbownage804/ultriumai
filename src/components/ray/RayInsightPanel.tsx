/**
 * RayInsightPanel — per-page conversational insight Ray surfaces on every
 * module page (Passwords, Threats, Exposure, Identity, Devices, Reports).
 *
 * Reads from useRayBrain() filtered to the page context. Shows:
 *   • a single short "Ray says" line
 *   • the top 2 recommendations relevant to this page
 *   • inline complete / dismiss actions
 */
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, X, Loader2 } from 'lucide-react';
import { useRayBrain } from '@/lib/ray/brain';
import { useRayContext, type RayPageContext } from '@/components/ray/RayContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const FALLBACK_LINE: Record<RayPageContext, string> = {
  home: "I'll keep an eye on everything for you.",
  passwords: "I'm watching your vault. Nothing urgent right now.",
  threats: "No active threats reaching you at the moment.",
  exposure: "I'm monitoring your identity across the breach data I track.",
  identity: "I'll learn your identity surface as you connect more sources.",
  devices: "Once devices report in, I'll watch them for you.",
  reports: "I'll keep a record of everything I do on your behalf.",
  settings: 'Settings look reasonable. Tell me if you want anything tightened.',
  other: "I'm here whenever you need me.",
};

function priorityBadge(p: number) {
  if (p >= 70) return { label: 'High', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
  if (p >= 40) return { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  return { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
}

interface Props {
  /** Override page context if the page doesn't match a known route. */
  context?: RayPageContext;
  /** Optional "Ray says" line override. */
  line?: string;
  className?: string;
  /** Max recommendations shown (default 2). */
  limit?: number;
}

export function RayInsightPanel({ context, line, className, limit = 2 }: Props) {
  const { pageContext } = useRayContext();
  const ctx = context ?? pageContext;
  const { pageRecommendations, isLoading, isGenerating, completeRecommendation, dismissRecommendation } =
    useRayBrain({ pageContext: ctx });

  const top = pageRecommendations.slice(0, limit);
  const says = line ?? FALLBACK_LINE[ctx];

  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-950/90 to-black/80 p-4 sm:p-5',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-violet-500/15 blur-3xl transition-opacity',
          isGenerating ? 'opacity-100' : 'opacity-60',
        )}
      />

      <div className="relative flex items-center gap-2 text-violet-300/90 text-[10px] uppercase tracking-[0.22em]">
        <Sparkles className="h-3 w-3" />
        {isGenerating ? 'Ray is thinking…' : 'Ray says'}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      <p className="relative mt-1.5 text-[15px] text-slate-100 leading-relaxed">{says}</p>

      {top.length > 0 && (
        <div className="relative mt-4 space-y-2">
          {top.map((rec) => {
            const p = priorityBadge(rec.priority ?? 0);
            return (
              <div
                key={rec.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={cn(
                        'text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md border',
                        p.cls,
                      )}
                    >
                      {p.label}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-100">{rec.title}</div>
                  {rec.body && (
                    <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">{rec.body}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2 text-slate-400 hover:text-white"
                    onClick={() => dismissRecommendation(rec.id)}
                    aria-label="Dismiss"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 bg-violet-500 hover:bg-violet-400 text-white"
                    onClick={() => completeRecommendation(rec.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Fix
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.aside>
  );
}

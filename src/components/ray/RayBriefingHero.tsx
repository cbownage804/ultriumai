/**
 * RayBriefingHero — Ray's morning briefing. Shown as the dashboard hero.
 */
import { motion } from 'framer-motion';
import { Sparkles, Loader2, CheckCircle2, X, ArrowRight } from 'lucide-react';
import { useRayBrain } from '@/lib/ray/brain';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function priorityLabel(p: number): { label: string; cls: string } {
  if (p >= 70) return { label: 'High', cls: 'bg-red-500/15 text-red-300 border-red-500/30' };
  if (p >= 40) return { label: 'Medium', cls: 'bg-amber-500/15 text-amber-300 border-amber-500/30' };
  return { label: 'Low', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' };
}

export function RayBriefingHero({ firstName }: { firstName?: string }) {
  const { briefing, recommendations, isLoading, isGenerating, completeRecommendation, dismissRecommendation } =
    useRayBrain({ pageContext: 'home' });

  const top = recommendations.slice(0, 3);
  const greeting = briefing?.greeting
    ?? (firstName ? `Hello, ${firstName}.` : 'Hello.');
  const bullets = briefing?.bullets?.length
    ? briefing.bullets
    : ['I checked your monitored accounts overnight.', 'Nothing urgent — I will keep watching.'];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8"
    >
      {/* violet flare (Ray is thinking) */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl"
        animate={{ opacity: isGenerating ? [0.3, 0.6, 0.3] : 0.25 }}
        transition={{ duration: 2.4, repeat: isGenerating ? Infinity : 0 }}
      />

      <div className="relative flex items-center gap-2 text-violet-300/90 text-xs uppercase tracking-[0.18em] mb-3">
        <Sparkles className="h-3.5 w-3.5" />
        {isGenerating ? 'Ray is thinking…' : "Ray's briefing"}
        {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
      </div>

      <h1 className="relative text-2xl sm:text-3xl font-semibold text-white tracking-tight">
        {greeting}
      </h1>

      <ul className="relative mt-4 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-[15px] text-slate-200/90 leading-relaxed">
            • {b}
          </li>
        ))}
      </ul>

      {top.length > 0 && (
        <div className="relative mt-6 space-y-2">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">
            What I&rsquo;d do next
          </div>
          {top.map((rec) => {
            const p = priorityLabel(rec.priority ?? 0);
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
                    {rec.estimated_fix_seconds && (
                      <span className="text-[11px] text-slate-500">
                        ~{Math.max(15, Math.round(rec.estimated_fix_seconds))}s
                      </span>
                    )}
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
                    <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Fix now
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative mt-6 flex items-center gap-2 text-xs text-slate-500">
        <span>Ask Ray anything —</span>
        <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300 border border-white/10">⌘K</kbd>
        <ArrowRight className="h-3 w-3" />
      </div>
    </motion.section>
  );
}

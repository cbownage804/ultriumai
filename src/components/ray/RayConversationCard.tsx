/**
 * RayConversationCard — one conversational block that replaces all stacked
 * alerts on a page. Ray speaks once, summarizes, offers one primary action.
 */
import { motion } from 'framer-motion';
import { Eye } from 'lucide-react';
import { useRayBrain } from '@/lib/ray/brain';
import { useRayContext, type RayPageContext } from '@/components/ray/RayContext';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';


const HEALTHY_LINE: Record<RayPageContext, string> = {
  home: "Everything looks calm. I'll keep watch.",
  passwords: 'Your vault looks healthy. Nothing urgent right now.',
  threats: 'No active threats reaching you at the moment.',
  exposure: "I'm watching the breach data. You're clear.",
  identity: 'Your identity surface looks intact.',
  devices: 'All reporting devices look healthy.',
  reports: "I'll keep a record of everything I do on your behalf.",
  settings: 'Settings look reasonable.',
  other: "I'm here whenever you need you.",
};

interface Props {
  context?: RayPageContext;
  /** Override the lead line when there are no recommendations. */
  healthyLine?: string;
  className?: string;
}

export function RayConversationCard({ context, healthyLine, className }: Props) {
  const { pageContext } = useRayContext();
  const ctx = context ?? pageContext;
  const { pageRecommendations, isGenerating, completeRecommendation } = useRayBrain({ pageContext: ctx });

  const top = pageRecommendations[0];
  const others = pageRecommendations.slice(1, 3);
  const count = pageRecommendations.length;

  const lead =
    count === 0
      ? healthyLine ?? HEALTHY_LINE[ctx]
      : count === 1
      ? `${HEALTHY_LINE[ctx].replace(/\.$/, '')} I found one recommendation.`
      : `${HEALTHY_LINE[ctx].replace(/\.$/, '')} I found ${count} things worth your attention.`;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-black/80 p-5 sm:p-6',
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute -top-20 -right-16 h-48 w-48 rounded-full bg-violet-500/15 blur-3xl transition-opacity',
          isGenerating ? 'opacity-100 animate-pulse' : 'opacity-60',
        )}
      />

      <div className="relative flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
          <Eye className="h-4 w-4 text-violet-300" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            {isGenerating ? 'Ray is thinking…' : 'Ray'}
          </div>
          <p className="mt-1 text-[15px] text-slate-100 leading-relaxed">{lead}</p>

          {top && (
            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm font-medium text-slate-100">{top.title}</div>
                {top.body && (
                  <div className="text-sm text-slate-400 mt-0.5 leading-relaxed">{top.body}</div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  className="bg-violet-500 hover:bg-violet-400 text-white"
                  onClick={() => completeRecommendation(top.id)}
                >
                  Fix Now
                </Button>
                {top.estimated_fix_seconds != null && top.estimated_fix_seconds > 0 && (
                  <span className="text-xs text-slate-400">
                    Estimated time · {Math.max(1, Math.round(top.estimated_fix_seconds / 60))} min
                  </span>
                )}
              </div>

              {others.length > 0 && (
                <ul className="mt-3 pt-3 border-t border-white/5 space-y-1.5">
                  {others.map((rec) => (
                    <li key={rec.id} className="text-xs text-slate-400">
                      <span className="text-slate-500">· </span>
                      {rec.title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

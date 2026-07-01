/**
 * RayNoticesPanel — Wrayth 2.7 predictive surface.
 *
 * Ray surfaces the highest-value 1–3 notices he's prepared in advance.
 * Each notice opens to reveal a prepared answer and supports
 * snooze / dismiss / mark resolved.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  Sparkles,
  X,
} from 'lucide-react';
import { useRayNotices, type RayNotice } from '@/lib/ray/notices';
import { cn } from '@/lib/utils';

type Variant = 'hero' | 'compact';

const KIND_TONE: Record<string, string> = {
  score_drop: 'border-red-500/30 bg-red-500/[0.05]',
  score_rise: 'border-green-500/25 bg-green-500/[0.04]',
  stale_recommendation: 'border-yellow-500/25 bg-yellow-500/[0.04]',
  repeated_question: 'border-violet-400/30 bg-violet-500/[0.05]',
  new_exposure: 'border-red-500/30 bg-red-500/[0.05]',
  critical_threat: 'border-red-500/30 bg-red-500/[0.05]',
  mfa_gap: 'border-yellow-500/25 bg-yellow-500/[0.04]',
  streak: 'border-green-500/25 bg-green-500/[0.04]',
};

export function RayNoticesPanel({
  variant = 'compact',
  className,
}: {
  variant?: Variant;
  className?: string;
}) {
  const { notices, snooze, dismiss, resolve } = useRayNotices(3);
  const [openId, setOpenId] = useState<string | null>(null);

  if (notices.length === 0) return null;

  return (
    <section className={cn('space-y-2', className)}>
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        <Sparkles className="h-3 w-3 text-violet-300/70" />
        Ray is watching
        <span className="text-muted-foreground/60 normal-case tracking-normal text-[10px]">
          · {notices.length} {notices.length === 1 ? 'notice' : 'notices'} prepared
        </span>
      </div>

      <div className="grid gap-2">
        <AnimatePresence initial={false}>
          {notices.map((n) => (
            <NoticeRow
              key={n.id}
              notice={n}
              variant={variant}
              expanded={openId === n.id}
              onToggle={() => setOpenId((cur) => (cur === n.id ? null : n.id))}
              onSnooze={() => snooze(n.id, 24)}
              onDismiss={() => dismiss(n.id)}
              onResolve={() => resolve(n.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}

function NoticeRow({
  notice,
  variant,
  expanded,
  onToggle,
  onSnooze,
  onDismiss,
  onResolve,
}: {
  notice: RayNotice;
  variant: Variant;
  expanded: boolean;
  onToggle: () => void;
  onSnooze: () => void | Promise<void>;
  onDismiss: () => void | Promise<void>;
  onResolve: () => void | Promise<void>;
}) {
  const navigate = useNavigate();
  const tone = KIND_TONE[notice.kind] ?? 'border-border bg-card/40';
  const answer = notice.prepared_answer;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={cn('rounded-sm border px-4 py-3', tone)}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left flex items-start gap-3"
      >
        <Sparkles className="h-4 w-4 mt-0.5 shrink-0 text-violet-300/80" />
        <div className="min-w-0 flex-1">
          <div className="text-sm text-foreground">{notice.title}</div>
          {notice.body && (
            <div className={cn(
              'mt-1 text-xs text-muted-foreground leading-relaxed',
              variant === 'compact' && !expanded && 'line-clamp-2',
            )}>
              {notice.body}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 mt-0.5 text-muted-foreground transition-transform shrink-0',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && answer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-3 rounded-sm border border-violet-400/20 bg-black/20 px-3 py-2.5">
              <div className="text-xs text-foreground/90">{answer.headline}</div>
              {answer.bullets.length > 0 && (
                <ul className="mt-2 space-y-1.5">
                  {answer.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-violet-300/70 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              )}
              {answer.actions && answer.actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {answer.actions.map((a) => (
                    <button
                      key={a.href + a.label}
                      onClick={() => navigate(a.href)}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                        a.tone === 'primary'
                          ? 'border-violet-400/50 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25'
                          : 'border-border bg-card/60 text-foreground/80 hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {a.label} <ArrowRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-2 flex items-center gap-1 flex-wrap">
        <button
          onClick={onResolve}
          className="inline-flex items-center gap-1 text-[11px] text-green-300/90 hover:text-green-200 px-2 py-1 rounded"
        >
          <CheckCircle2 className="h-3 w-3" /> Mark resolved
        </button>
        <button
          onClick={onSnooze}
          className="inline-flex items-center gap-1 text-[11px] text-yellow-300/90 hover:text-yellow-200 px-2 py-1 rounded"
        >
          <Clock className="h-3 w-3" /> Snooze 24h
        </button>
        <button
          onClick={onDismiss}
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground px-2 py-1 rounded"
        >
          <X className="h-3 w-3" /> Dismiss
        </button>
      </div>
    </motion.article>
  );
}

export default RayNoticesPanel;

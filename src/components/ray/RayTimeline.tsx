/**
 * RayTimeline — Ray's security timeline. Shows every protective action Ray
 * has taken on the user's behalf, plus events the user can replay.
 */
import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert, ShieldCheck, KeyRound, Eye, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useRayBrain, type RayTimelineEvent } from '@/lib/ray/brain';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

const SEVERITY: Record<RayTimelineEvent['severity'], { ring: string; text: string; dot: string }> = {
  critical: { ring: 'ring-red-500/30', text: 'text-red-300', dot: 'bg-red-500' },
  high:     { ring: 'ring-red-500/30', text: 'text-red-300', dot: 'bg-red-500' },
  medium:   { ring: 'ring-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-500' },
  low:      { ring: 'ring-green-500/30', text: 'text-green-300', dot: 'bg-green-500' },
  info:     { ring: 'ring-violet-500/25', text: 'text-violet-300', dot: 'bg-violet-500' },
};

function eventIcon(type: string) {
  if (type.includes('breach') || type.includes('exposure')) return ShieldAlert;
  if (type.includes('password') || type.includes('vault')) return KeyRound;
  if (type.includes('threat') || type.includes('scan')) return Eye;
  if (type.includes('alert') || type.includes('warn')) return AlertTriangle;
  if (type.includes('protect') || type.includes('fix') || type.includes('resolve')) return ShieldCheck;
  return Info;
}

interface Props {
  limit?: number;
  className?: string;
  /** When true, hides the heading row so it can be embedded under another header. */
  embedded?: boolean;
}

export function RayTimeline({ limit = 25, className, embedded = false }: Props) {
  const { timeline, isLoading } = useRayBrain();
  const events = timeline.slice(0, limit);

  return (
    <div className={cn('relative', className)}>
      {!embedded && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Ray's timeline
            </div>
            <h2 className="mt-1 text-lg font-light text-foreground">
              Everything I've done for you
            </h2>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}

      {events.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
          I haven't logged anything yet. As I work, you'll see it here.
        </div>
      )}

      <ol className="relative space-y-3">
        {events.map((ev, i) => {
          const Icon = eventIcon(ev.event_type);
          const sev = SEVERITY[ev.severity] ?? SEVERITY.info;
          return (
            <motion.li
              key={ev.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.02 }}
              className={cn(
                'relative flex gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:p-4 ring-1',
                sev.ring,
              )}
            >
              <div
                className={cn(
                  'mt-0.5 h-8 w-8 shrink-0 rounded-lg bg-white/[0.03] grid place-items-center',
                  sev.text,
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span className={cn('inline-block h-1.5 w-1.5 rounded-full', sev.dot)} />
                  {ev.event_type.replace(/[._-]/g, ' ')}
                  <span className="text-muted-foreground/60">·</span>
                  <span>
                    {ev.occurred_at
                      ? formatDistanceToNow(new Date(ev.occurred_at), { addSuffix: true })
                      : 'just now'}
                  </span>
                </div>
                <div className="mt-1 text-sm text-slate-100 leading-relaxed">{ev.summary}</div>
              </div>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/**
 * RayTimeline — Ray's security timeline.
 *
 * Expanded surface: day-grouped feed with category + severity filters and
 * humanized event labels. Silent chrome when embedded under another header.
 */
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldAlert, ShieldCheck, KeyRound, Eye, AlertTriangle, Info, Loader2 } from 'lucide-react';
import { useRayBrain, type RayTimelineEvent } from '@/lib/ray/brain';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';

const SEVERITY: Record<RayTimelineEvent['severity'], { ring: string; text: string; dot: string }> = {
  critical: { ring: 'ring-red-500/30', text: 'text-red-300', dot: 'bg-red-500' },
  high:     { ring: 'ring-red-500/30', text: 'text-red-300', dot: 'bg-red-500' },
  medium:   { ring: 'ring-yellow-500/30', text: 'text-yellow-300', dot: 'bg-yellow-500' },
  low:      { ring: 'ring-green-500/30', text: 'text-green-300', dot: 'bg-green-500' },
  info:     { ring: 'ring-violet-500/25', text: 'text-violet-300', dot: 'bg-violet-500' },
};

type Category = 'all' | 'passwords' | 'threats' | 'exposure' | 'ray';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'passwords', label: 'Passwords' },
  { id: 'threats', label: 'Threats' },
  { id: 'exposure', label: 'Identity Monitoring' },
  { id: 'ray', label: "Ray's actions" },
];

function categoryOf(type: string): Exclude<Category, 'all'> {
  if (type.includes('password') || type.includes('vault')) return 'passwords';
  if (type.includes('threat') || type.includes('scan') || type.includes('malware')) return 'threats';
  if (type.includes('breach') || type.includes('exposure') || type.includes('leak')) return 'exposure';
  return 'ray';
}

function eventIcon(type: string) {
  if (type.includes('breach') || type.includes('exposure')) return ShieldAlert;
  if (type.includes('password') || type.includes('vault')) return KeyRound;
  if (type.includes('threat') || type.includes('scan')) return Eye;
  if (type.includes('alert') || type.includes('warn')) return AlertTriangle;
  if (type.includes('protect') || type.includes('fix') || type.includes('resolve')) return ShieldCheck;
  return Info;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMM d');
}

interface Props {
  limit?: number;
  className?: string;
  /** When true, hides the heading row so it can be embedded under another header. */
  embedded?: boolean;
}

export function RayTimeline({ limit = 50, className, embedded = false }: Props) {
  const { timeline, isLoading } = useRayBrain();
  const [category, setCategory] = useState<Category>('all');
  const [onlySignal, setOnlySignal] = useState(false);

  const events = useMemo(() => {
    const filtered = timeline.filter((ev) => {
      if (category !== 'all' && categoryOf(ev.event_type) !== category) return false;
      if (onlySignal && (ev.severity === 'info' || ev.severity === 'low')) return false;
      return true;
    });
    return filtered.slice(0, limit);
  }, [timeline, category, onlySignal, limit]);

  const grouped = useMemo(() => {
    const map = new Map<string, RayTimelineEvent[]>();
    for (const ev of events) {
      const key = ev.occurred_at ? dayLabel(ev.occurred_at) : 'Just now';
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [events]);

  // Narrative summary — Ray reads the last 7 days and describes what he did.
  const narrative = useMemo(() => buildWeekNarrative(timeline), [timeline]);

  return (
    <div className={cn('relative', className)}>
      {!embedded && (
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80 flex items-center gap-2">
              <Sparkles className="h-3 w-3" /> Ray's timeline
            </div>
            <h2 className="mt-1 text-lg font-light text-foreground">Everything I've done for you</h2>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      )}

      {/* Narrative summary — the week, as Ray would tell it. */}
      {narrative && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 rounded-xl border border-violet-500/25 bg-violet-500/[0.04] p-4 sm:p-5"
        >
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/90">
            <Sparkles className="h-3 w-3" /> This week, from Ray
          </div>
          <p className="mt-2 text-sm sm:text-base text-foreground leading-relaxed">{narrative}</p>
        </motion.div>
      )}


      {/* Filter strip */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {CATEGORIES.map((c) => {
          const active = c.id === category;
          return (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={cn(
                'rounded-full px-3 py-1 text-xs transition-colors border',
                active
                  ? 'border-primary/50 bg-primary/15 text-primary'
                  : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          );
        })}
        <span className="mx-1 h-4 w-px bg-border/60" />
        <button
          onClick={() => setOnlySignal((v) => !v)}
          className={cn(
            'rounded-full px-3 py-1 text-xs transition-colors border',
            onlySignal
              ? 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200'
              : 'border-border/60 bg-background/40 text-muted-foreground hover:text-foreground',
          )}
        >
          Only what matters
        </button>
      </div>

      {events.length === 0 && !isLoading && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-center text-sm text-muted-foreground">
          Nothing to show for this filter. Ray will surface it here as it happens.
        </div>
      )}

      <div className="space-y-6">
        {grouped.map(([day, dayEvents]) => (
          <div key={day}>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
              <span>{day}</span>
              <span className="text-muted-foreground/60">·</span>
              <span>
                {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
              </span>
              <span className="ml-2 h-px flex-1 bg-border/40" />
            </div>
            <ol className="relative space-y-3">
              {dayEvents.map((ev, i) => {
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
        ))}
      </div>
    </div>
  );
}

/**
 * Distill the last 7 days of Ray's timeline into a single conversational
 * paragraph. Deterministic, no invented data — if nothing meaningful
 * happened, returns null so the callsite can hide the block.
 */
function buildWeekNarrative(all: RayTimelineEvent[]): string | null {
  const now = Date.now();
  const weekAgo = now - 7 * 86_400_000;
  const week = all.filter((e) => {
    if (!e.occurred_at) return true;
    return new Date(e.occurred_at).getTime() >= weekAgo;
  });
  if (week.length === 0) return null;

  let watched = 0, rotated = 0, flagged = 0, scanned = 0, breaches = 0, actions = 0;
  for (const ev of week) {
    const t = ev.event_type;
    if (t.includes('rotate') || t.includes('password_rotated')) rotated++;
    else if (t.includes('breach') || t.includes('leak')) breaches++;
    else if (t.includes('exposure') || t.includes('asset') || t.includes('watch')) watched++;
    else if (t.includes('scan') || t.includes('threat') || t.includes('malware')) scanned++;
    else if (t.includes('alert') || t.includes('warn') || ev.severity === 'high' || ev.severity === 'critical') flagged++;
    else actions++;
  }

  const parts: string[] = [];
  if (rotated) parts.push(`helped you rotate ${rotated} password${rotated === 1 ? '' : 's'}`);
  if (breaches) parts.push(`spotted ${breaches} breach signal${breaches === 1 ? '' : 's'}`);
  if (flagged) parts.push(`flagged ${flagged} thing${flagged === 1 ? '' : 's'} that needed your eyes`);
  if (scanned) parts.push(`analyzed ${scanned} threat${scanned === 1 ? '' : 's'}`);
  if (watched) parts.push(`kept watch on ${watched} identity update${watched === 1 ? '' : 's'}`);
  if (actions && parts.length === 0) parts.push(`ran ${actions} background check${actions === 1 ? '' : 's'}`);
  if (parts.length === 0) return null;

  const joined =
    parts.length === 1
      ? parts[0]
      : parts.slice(0, -1).join(', ') + ', and ' + parts[parts.length - 1];

  const closer =
    breaches > 0 || flagged > 0
      ? "Nothing that couldn't wait, but a couple things I want you to see."
      : "Quiet week — that's the good kind.";

  return `Here's what I did while you were away: ${joined}. ${closer}`;
}


/**
 * SinceLastVisitCard — "What changed since you were away?"
 *
 * Compact strip that goes right under a Ray Brief and answers the third
 * of Ray's three-question hierarchy: what did I do, what changed, what
 * should you do next. Every line is a small check/warn state so the user
 * can scan it in a second.
 */

import { Check, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export interface SinceLine {
  label: string;
  ok?: boolean;
}

interface Props {
  since?: Date | null;
  lines: SinceLine[];
  className?: string;
}

export function SinceLastVisitCard({ since, lines, className }: Props) {
  if (lines.length === 0) return null;
  const suffix = since
    ? `Since ${formatDistanceToNow(since, { addSuffix: false })} ago`
    : 'Since your last visit';

  return (
    <section
      className={cn(
        'wrayth-chamfer border border-border bg-card/40 p-4 sm:p-5',
        className,
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
        {suffix}
      </div>
      <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
        {lines.map((l, i) => {
          const ok = l.ok !== false;
          const Icon = ok ? Check : AlertTriangle;
          return (
            <li
              key={i}
              className={cn(
                'flex items-center gap-2 text-sm',
                ok ? 'text-foreground/85' : 'text-amber-200',
              )}
            >
              <Icon
                className={cn('h-3.5 w-3.5 shrink-0', ok ? 'text-green-400' : 'text-amber-300')}
              />
              <span className="min-w-0 truncate">{l.label}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default SinceLastVisitCard;

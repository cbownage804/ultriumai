/**
 * HowIProtectYouCard — Ray, in a paragraph, explains the moving parts he's
 * running on the user's behalf for this page. Static content so it stays
 * fast and doesn't hit the DB, but written in Ray's first-person voice so
 * it reads like an analyst not a marketing block.
 */

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title?: string;
  lines: string[];
  className?: string;
}

export function HowIProtectYouCard({
  title = 'How I protect you',
  lines,
  className,
}: Props) {
  if (lines.length === 0) return null;
  return (
    <section
      className={cn(
        'wrayth-chamfer border border-border bg-card/40 p-5 sm:p-6',
        className,
      )}
    >
      <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
        {title}
      </div>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {lines.map((l, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-foreground/85">
            <Check className="h-3.5 w-3.5 text-green-400 shrink-0 mt-1" />
            <span className="leading-relaxed">{l}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default HowIProtectYouCard;

/**
 * ExplainThis — a tiny "Explain this" chip Ray drops next to any card,
 * score, or finding. Opens a popover with a short, plain-English
 * explanation in Ray's voice.
 *
 * Callers pass a `title` and either static `body` text or a `bullets`
 * array. Kept intentionally lightweight so it can sit inside any card
 * header without stealing focus.
 */
import { motion } from 'framer-motion';
import { HelpCircle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Props {
  title: string;
  body?: string;
  bullets?: string[];
  className?: string;
}

export function ExplainThis({ title, body, bullets, className = '' }: Props) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={
            'inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/[0.06] px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-violet-200 hover:bg-violet-500/10 transition-colors ' +
            className
          }
          aria-label="Explain this"
        >
          <HelpCircle className="h-3 w-3" />
          Explain
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
            Ray explains
          </div>
          <div className="mt-1.5 text-sm font-medium text-foreground">{title}</div>
          {body && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
          )}
          {bullets && bullets.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              {bullets.map((b, idx) => (
                <li key={idx} className="flex gap-2">
                  <span className="text-violet-300/70">•</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </PopoverContent>
    </Popover>
  );
}

export default ExplainThis;

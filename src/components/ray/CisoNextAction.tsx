/**
 * CisoNextAction — Ray answers the one question that matters:
 * "If I were your CISO, what would I tell you to do next?"
 *
 * Synthesizes vault, exposure, and MFA signals into a single directive.
 * Lives at the top of the dashboard, above product tiles, so the user
 * never has to guess what's most important.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ArrowRight, Sparkles } from 'lucide-react';
import type { CisoDirective, CisoTone } from '@/lib/ray/ciso';
import { cn } from '@/lib/utils';

const TONE: Record<CisoTone, { ring: string; chip: string; icon: JSX.Element; label: string }> = {
  critical: {
    ring: 'border-red-500/40 bg-red-500/[0.04]',
    chip: 'text-red-300 border-red-400/40 bg-red-500/10',
    icon: <ShieldAlert className="h-4 w-4" />,
    label: 'Do this first',
  },
  warn: {
    ring: 'border-yellow-500/30 bg-yellow-500/[0.03]',
    chip: 'text-yellow-200 border-yellow-400/40 bg-yellow-500/10',
    icon: <ShieldAlert className="h-4 w-4" />,
    label: "Ray's next move",
  },
  good: {
    ring: 'border-violet-400/30 bg-violet-500/[0.04]',
    chip: 'text-violet-200 border-violet-400/40 bg-violet-500/10',
    icon: <ShieldCheck className="h-4 w-4" />,
    label: "Ray's read",
  },
};

interface Props {
  directive: CisoDirective;
}

export function CisoNextAction({ directive }: Props) {
  const t = TONE[directive.tone];
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn('wrayth-chamfer border p-5 sm:p-6', t.ring)}
    >
      <div className="flex items-start gap-3">
        <div className={cn('mt-0.5 flex h-8 w-8 items-center justify-center rounded-full', t.chip)}>
          {t.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
            <Sparkles className="h-3 w-3" />
            If I were your CISO
          </div>
          <h2 className="mt-1 text-lg sm:text-xl font-light text-foreground leading-snug">
            {directive.headline}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {directive.rationale}
          </p>
          {directive.cta && (
            <div className="mt-4">
              <Link
                to={directive.cta.to}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors',
                  t.chip,
                  'hover:bg-white/5',
                )}
              >
                {directive.cta.label} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
        <span className={cn('hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] tracking-wider', t.chip)}>
          {t.label}
        </span>
      </div>
    </motion.section>
  );
}

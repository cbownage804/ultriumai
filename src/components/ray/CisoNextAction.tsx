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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className={cn('wrayth-chamfer border p-6 sm:p-8 relative overflow-hidden', t.ring)}
    >
      {/* Ambient pulse to reinforce Ray as a living presence. */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative flex items-start gap-4">
        <div className={cn('mt-1 flex h-10 w-10 items-center justify-center rounded-full', t.chip)}>
          {t.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-violet-300/90">
            <Sparkles className="h-3 w-3" />
            If I were your CISO, here's what I'd do next
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-light text-foreground leading-tight tracking-tight">
            {directive.headline}
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
            {directive.rationale}
          </p>
          {directive.cta && (
            <div className="mt-5">
              <Link
                to={directive.cta.to}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                  t.chip,
                  'hover:bg-white/5',
                )}
              >
                {directive.cta.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
        <span className={cn('hidden sm:inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] tracking-wider whitespace-nowrap', t.chip)}>
          {t.label}
        </span>
      </div>
    </motion.section>
  );
}

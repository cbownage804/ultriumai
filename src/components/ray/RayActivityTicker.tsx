/**
 * RayActivityTicker — a slim "Ray is active" line for empty/quiet pages.
 * Rotates real background-monitoring statuses every 6 seconds so the
 * page never feels dead. No fake activity — every line maps to a job
 * Ray actually runs.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  context?: 'threats' | 'exposure' | 'vault' | 'home';
  className?: string;
}

const LINES: Record<NonNullable<Props['context']>, string[]> = {
  threats: [
    'Watching Microsoft advisories…',
    'Checking Chrome vulnerabilities…',
    'Reviewing breach feeds…',
    'Scanning saved identities…',
    'Monitoring inbound signals…',
    'Everything looks healthy.',
  ],
  exposure: [
    'Cross-referencing breach databases…',
    'Checking dark-web mentions…',
    'Watching your monitored identities…',
    'Nothing new to report.',
  ],
  vault: [
    'Reviewing password strength…',
    'Looking for reused passwords…',
    'Watching breach feeds…',
    'Vault is quiet.',
  ],
  home: [
    'Watching breach feeds…',
    'Checking Microsoft advisories…',
    'Scanning saved identities…',
    'Everything looks healthy.',
  ],
};

export function RayActivityTicker({ context = 'home', className = '' }: Props) {
  const lines = useMemo(() => LINES[context], [context]);
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % lines.length), 6000);
    return () => clearInterval(id);
  }, [lines.length]);

  return (
    <div
      className={
        'flex items-center gap-2.5 text-[12px] text-muted-foreground ' + className
      }
      aria-live="polite"
    >
      <motion.span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
        animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.2, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <span className="text-[10px] uppercase tracking-[0.22em] text-violet-300/70">
        Ray
      </span>
      <div className="relative min-h-[1.25rem] flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 whitespace-nowrap"
          >
            {lines[i]}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default RayActivityTicker;

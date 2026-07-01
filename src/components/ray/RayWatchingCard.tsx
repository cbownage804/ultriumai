/**
 * RayWatchingCard — the "Ray is alive" reassurance surface.
 *
 * Shows a live count of what Ray is currently guarding (passwords,
 * identities, threats seen) plus a last-checked timestamp with a
 * gently pulsing status dot. No new features — just visible
 * heartbeat so Home doesn't feel dead.
 */
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';

interface Props {
  passwordCount: number;
  identityCount: number;
  threatCount: number;
}

export function RayWatchingCard({ passwordCount, identityCount, threatCount }: Props) {
  const [lastChecked] = useState(() => new Date());
  const [, force] = useState(0);

  // Refresh the "x seconds ago" label without changing the timestamp.
  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  const stats = [
    { label: 'Identities', value: identityCount },
    { label: 'Passwords', value: passwordCount },
    { label: 'Threats', value: threatCount },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="wrayth-chamfer relative overflow-hidden border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-violet-300/80">
          <motion.span
            aria-hidden
            className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400"
            animate={{ opacity: [0.35, 1, 0.35], scale: [1, 1.15, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          />
          Ray is watching
        </div>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-violet-300/70"
        >
          <Eye className="h-4 w-4" />
        </motion.div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5">
            <motion.div
              key={s.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-semibold tabular-nums text-foreground"
            >
              {s.value}
            </motion.div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
      </div>
    </motion.section>
  );
}

export default RayWatchingCard;

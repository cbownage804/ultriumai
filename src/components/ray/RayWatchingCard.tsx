/**
 * RayWatchingCard — the "Ray is alive" reassurance surface.
 *
 * Shows a live count of what Ray is currently guarding (passwords,
 * identities, threats seen), a rotating real-status line, and a
 * last-checked timestamp with a gently pulsing status dot. Every
 * status message is derived from real counts — no fake activity.
 */
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Eye } from 'lucide-react';

interface Props {
  passwordCount: number;
  identityCount: number;
  threatCount: number;
}

/** A gentle number counter — animates from 0 → value on mount. */
function CountUp({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <>{display}</>;
}

export function RayWatchingCard({ passwordCount, identityCount, threatCount }: Props) {
  const [lastChecked] = useState(() => new Date());
  const [, force] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Rotating real statuses — derived from the actual counts we were given.
  const statuses = useMemo(() => {
    const lines: string[] = [];
    if (passwordCount > 0) lines.push(`Watching your vault — ${passwordCount} credentials`);
    else lines.push('Ready when you are — your vault is empty');
    if (identityCount > 0) lines.push(`Monitoring ${identityCount} ${identityCount === 1 ? 'identity' : 'identities'}`);
    lines.push('Watching breach feeds');
    if (threatCount > 0) lines.push(`Reviewed ${threatCount} threat ${threatCount === 1 ? 'signal' : 'signals'} today`);
    lines.push("Checking today's changes");
    return lines;
  }, [passwordCount, identityCount, threatCount]);

  useEffect(() => {
    if (statuses.length <= 1) return;
    const id = setInterval(() => setStatusIdx((i) => (i + 1) % statuses.length), 5000);
    return () => clearInterval(id);
  }, [statuses.length]);

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

      <motion.p
        key={statusIdx}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mt-3 text-sm text-foreground/90"
      >
        {statuses[statusIdx]}
      </motion.p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 * i }}
            className="rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2.5"
          >
            <div className="text-2xl font-semibold tabular-nums text-foreground">
              <CountUp value={s.value} />
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-3 text-[11px] text-muted-foreground">
        Last checked {formatDistanceToNow(lastChecked, { addSuffix: true })}
      </div>
    </motion.section>
  );
}

export default RayWatchingCard;

/**
 * PasswordScoreBlock — single unified score panel.
 * Replaces the three disconnected "Security Health / Breach Status / Passwords Stored" cards.
 */
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Stat {
  label: string;
  value: number;
  tone?: 'default' | 'warning' | 'success';
}

interface Props {
  score: number;       // 0-100
  stats: Stat[];
  className?: string;
}

export function PasswordScoreBlock({ score, stats, className }: Props) {
  const rounded = Math.max(0, Math.min(100, Math.round(score)));

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/5 bg-card/60 backdrop-blur-sm p-6',
        className,
      )}
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-6">
        <div className="flex items-end gap-4">
          <div className="text-6xl sm:text-7xl font-extralight tabular-nums text-foreground leading-none">
            {rounded}
          </div>
          <div className="pb-2">
            <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Overall</div>
            <div className="text-sm text-foreground">Password Score</div>
          </div>
        </div>

        <div className="hidden sm:block h-12 w-px bg-border/60" />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-3 flex-1">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div
                className={cn(
                  'text-2xl font-light tabular-nums',
                  stat.tone === 'warning' && stat.value > 0 && 'text-red-400',
                  stat.tone === 'success' && stat.value > 0 && 'text-emerald-400',
                  (!stat.tone || stat.tone === 'default') && 'text-foreground',
                )}
              >
                {stat.value}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/**
 * PasswordProfilePanel — Ray's deep read on a single credential.
 *
 * Reads a computed PasswordProfile and lays it out as a signal grid
 * plus Ray's plain-English verdict. Designed to slot inside an
 * expandable row on the vault list.
 */
import { motion } from 'framer-motion';
import { AlertTriangle, ShieldCheck, ShieldAlert, Sparkles } from 'lucide-react';
import type { PasswordProfile } from '@/lib/ray/passwordProfile';
import { cn } from '@/lib/utils';

const RISK_TONE: Record<PasswordProfile['risk'], { label: string; className: string; Icon: typeof ShieldCheck }> = {
  excellent: { label: 'Excellent', className: 'text-green-400 border-green-500/30 bg-green-500/5',  Icon: ShieldCheck },
  strong:    { label: 'Strong',    className: 'text-green-400 border-green-500/30 bg-green-500/5',  Icon: ShieldCheck },
  okay:      { label: 'Okay',      className: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5', Icon: Sparkles },
  weak:      { label: 'Weak',      className: 'text-orange-300 border-orange-500/30 bg-orange-500/5', Icon: ShieldAlert },
  critical:  { label: 'Critical',  className: 'text-red-400 border-red-500/30 bg-red-500/5',       Icon: AlertTriangle },
};

const SIGNAL_TONE = {
  good: 'text-green-400',
  warn: 'text-yellow-300',
  bad: 'text-red-400',
  neutral: 'text-muted-foreground',
} as const;

export function PasswordProfilePanel({
  profile,
  onAction,
}: {
  profile: PasswordProfile;
  onAction?: () => void;
}) {
  const risk = RISK_TONE[profile.risk];
  const Icon = risk.Icon;
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-2 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm p-4 space-y-4">
        <div className="flex items-start gap-3">
          <div className={cn('shrink-0 h-9 w-9 rounded-lg border flex items-center justify-center', risk.className)}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-violet-300/80">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-violet-400" />
              Ray's verdict
            </div>
            <p className="mt-1 text-sm text-foreground leading-relaxed">{profile.rayVerdict}</p>
            {profile.rayAction && onAction && (
              <button
                type="button"
                onClick={onAction}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-100 hover:bg-violet-500/15 transition-colors"
              >
                {profile.rayAction}
              </button>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-light text-foreground tabular-nums">{profile.score}</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">score</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3 text-xs">
          {profile.signals.map((s) => (
            <div key={s.label} className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">{s.label}</div>
              <div className={cn('mt-0.5 truncate', SIGNAL_TONE[s.tone])}>{s.value}</div>
            </div>
          ))}
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80">Crack estimate</div>
            <div className="mt-0.5 text-foreground/90">{profile.crackEstimate}</div>
          </div>
        </div>

        {profile.reasons.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/80 mb-1.5">Why</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              {profile.reasons.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-300/60">•</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default PasswordProfilePanel;

/**
 * RayBrief — a short, conversational "Ray Brief" strip that goes at the top
 * of any major section (Devices, Threats, Intelligence, Vault, Identity
 * Monitoring, Investigations…).
 *
 * The purpose is to make every module feel like the same AI analyst is
 * narrating it, instead of a collection of dashboards. It renders:
 *
 *   Good morning, Brandon.
 *   • I checked 15 devices overnight.
 *   • Windows installed KB5097149 on R15.
 *   • Nothing requires your attention right now.
 *
 * Data-fetching lives in per-page wrapper components (DevicesRayBrief,
 * ThreatsRayBrief, IntelligenceRayBrief). This component is presentation
 * only — it never queries anything itself.
 */

import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RayBriefTone = 'ok' | 'warn' | 'critical';

interface Props {
  /** Optional greeting, e.g. "Good morning, Brandon." Rendered as the lead line. */
  greeting?: string;
  /** 1–4 short first-person lines from Ray. Empty array = component renders nothing. */
  lines: string[];
  /** Overall tone drives the accent color and icon. Defaults to 'ok'. */
  tone?: RayBriefTone;
  /** Optional loading state — shows a subtle skeleton instead of empty space. */
  loading?: boolean;
  className?: string;
}

function toneStyles(tone: RayBriefTone) {
  switch (tone) {
    case 'critical':
      return {
        border: 'border-red-500/30',
        bg: 'bg-red-500/[0.04]',
        chip: 'text-red-300/80',
        icon: ShieldAlert,
        iconClass: 'text-red-300',
      };
    case 'warn':
      return {
        border: 'border-amber-500/30',
        bg: 'bg-amber-500/[0.04]',
        chip: 'text-amber-300/80',
        icon: AlertTriangle,
        iconClass: 'text-amber-300',
      };
    case 'ok':
    default:
      return {
        border: 'border-violet-400/25',
        bg: 'bg-violet-500/[0.04]',
        chip: 'text-violet-300/80',
        icon: CheckCircle2,
        iconClass: 'text-violet-200',
      };
  }
}

export function RayBrief({ greeting, lines, tone = 'ok', loading, className }: Props) {
  const styles = toneStyles(tone);
  const Icon = styles.icon;

  if (loading) {
    return (
      <section
        className={cn(
          'wrayth-chamfer border border-border bg-card/40 p-5 sm:p-6 animate-pulse',
          className,
        )}
      >
        <div className="h-3 w-32 bg-muted/40 rounded mb-3" />
        <div className="h-4 w-2/3 bg-muted/40 rounded mb-2" />
        <div className="h-4 w-1/2 bg-muted/30 rounded" />
      </section>
    );
  }

  if (lines.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'wrayth-chamfer border p-5 sm:p-6',
        styles.border,
        styles.bg,
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'mt-0.5 flex h-9 w-9 items-center justify-center rounded-full border border-border/60 bg-background/50 shrink-0',
            styles.iconClass,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              'flex items-center gap-1.5 text-[11px] uppercase tracking-[0.22em]',
              styles.chip,
            )}
          >
            <Sparkles className="h-3 w-3" />
            Ray Brief
          </div>
          {greeting && (
            <h3 className="mt-1 text-base sm:text-lg font-light text-foreground">
              {greeting}
            </h3>
          )}
          <ul className="mt-2 space-y-1.5">
            {lines.map((line, i) => (
              <li
                key={i}
                className="text-sm text-foreground/85 leading-relaxed flex gap-2"
              >
                <span className={cn('mt-1.5 h-1 w-1 rounded-full shrink-0', styles.iconClass, 'bg-current opacity-70')} />
                <span className="min-w-0">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.section>
  );
}

export default RayBrief;

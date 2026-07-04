/**
 * ModuleBriefingCard — Ray's executive briefing card for a single module.
 *
 * Every card answers the four questions in a fixed order:
 *   1. What happened?     → headline
 *   2. What changed?      → delta line (grey, small)
 *   3. What matters?      → Ray's take (1 line, conversational)
 *   4. What should I do?  → BriefingAction (Fix or Investigate) into the module
 *
 * The card is a briefing, not a widget. If Ray has nothing to say, it says
 * so calmly and offers a way in — it does not go blank.
 */
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { BriefingAction, type BriefingActionKind } from '@/components/ray/BriefingAction';
import { cn } from '@/lib/utils';

export type BriefingStatus = 'calm' | 'attention' | 'urgent' | 'unknown';

const STATUS_META: Record<BriefingStatus, { label: string; dot: string; ring: string; text: string }> = {
  calm:      { label: 'Calm',        dot: 'bg-emerald-400', ring: 'ring-emerald-400/30',  text: 'text-emerald-300' },
  attention: { label: 'Attention',   dot: 'bg-amber-400',   ring: 'ring-amber-400/30',    text: 'text-amber-200' },
  urgent:    { label: 'Urgent',      dot: 'bg-red-400',     ring: 'ring-red-400/30',      text: 'text-red-300' },
  unknown:   { label: 'Not scored',  dot: 'bg-muted-foreground/60', ring: 'ring-border', text: 'text-muted-foreground' },
};

export interface ModuleBriefingCardProps {
  /** Module display name (e.g. "Devices"). */
  module: string;
  /** Lucide icon representing the module. */
  icon: LucideIcon;
  /** Route the module name itself links to. */
  moduleHref: string;
  status: BriefingStatus;
  /** What happened — the headline sentence Ray leads with. */
  happened: string;
  /** What changed — since-last-look delta, grey. Optional. */
  changed?: string;
  /** What matters — Ray's take. One line, conversational. */
  matters: string;
  /** Primary action. Both variants route into an existing workflow today. */
  action?: {
    kind: BriefingActionKind;
    href: string;
    label?: string;
    remediationSlug?: string;
  };
  loading?: boolean;
  className?: string;
}

export function ModuleBriefingCard({
  module,
  icon: Icon,
  moduleHref,
  status,
  happened,
  changed,
  matters,
  action,
  loading,
  className,
}: ModuleBriefingCardProps) {
  const meta = STATUS_META[status];

  return (
    <article
      className={cn(
        'wrayth-chamfer border border-border bg-card/40 p-5 flex flex-col gap-3',
        'transition-colors hover:border-violet-400/30',
        className,
      )}
    >
      <header className="flex items-center gap-2">
        <Link
          to={moduleHref}
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground hover:text-violet-200"
        >
          <Icon className="h-3.5 w-3.5" />
          {module}
        </Link>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ring-1',
            meta.ring,
            meta.text,
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
          {meta.label}
        </span>
      </header>

      {loading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 w-3/4 rounded bg-muted/40" />
          <div className="h-3 w-1/2 rounded bg-muted/30" />
          <div className="h-3 w-2/3 rounded bg-muted/30" />
        </div>
      ) : (
        <>
          <p className="text-[15px] leading-snug text-foreground/95 font-light">
            {happened}
          </p>
          {changed && (
            <p className="text-[11px] text-muted-foreground -mt-1">{changed}</p>
          )}
          <p className="text-[13px] leading-relaxed text-violet-100/80 italic">
            {matters}
          </p>
        </>
      )}

      {action && !loading && (
        <footer className="mt-1">
          <BriefingAction
            kind={action.kind}
            href={action.href}
            label={action.label}
            remediationSlug={action.remediationSlug}
          />
        </footer>
      )}
    </article>
  );
}

export default ModuleBriefingCard;

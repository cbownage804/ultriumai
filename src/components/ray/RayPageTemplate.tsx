/**
 * RayPageTemplate — the canonical shell every major Ray module uses.
 *
 * Structure (top → bottom):
 *   1. Header slot (usually <RayPageHeader />)
 *   2. Ray Brief slot ("Good morning, Brandon. I reviewed…")
 *   3. Since Your Last Visit
 *   4. Today's Priority (one obvious action)
 *   5. Primary content (children — the actual module dashboard)
 *   6. How I Protect You (background work Ray is doing)
 *
 * Any slot can be omitted; the shell just skips it. This is what makes
 * Devices, Threats, Investigations, Compliance, etc. read like the same
 * analyst instead of a collection of dashboards.
 */
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { SinceLastVisitCard, type SinceLine } from './SinceLastVisitCard';
import { HowIProtectYouCard } from './HowIProtectYouCard';
import { TodayPriorityCard, type TodayPriority } from './TodayPriorityCard';

interface Props {
  /** Page header — typically <RayPageHeader /> */
  header?: ReactNode;
  /** Ray Brief — typically a module-specific brief component */
  brief?: ReactNode;
  /** "Since your last visit" bullets */
  sinceLines?: SinceLine[];
  /** Timestamp for the "since" strip (defaults to omitted) */
  sinceDate?: Date | null;
  /** Today's single priority action */
  priority?: TodayPriority | null;
  /** Primary content — the module's dashboard */
  children?: ReactNode;
  /** "While you work…" lines that Ray runs in the background */
  protectLines?: string[];
  /** Optional slot between children and protect (e.g. Ask Ray) */
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
}

export function RayPageTemplate({
  header,
  brief,
  sinceLines,
  sinceDate,
  priority,
  children,
  protectLines,
  footer,
  className,
  contentClassName,
}: Props) {
  return (
    <div className={cn('space-y-6', className)}>
      {header}
      {brief}
      {sinceLines && sinceLines.length > 0 && (
        <SinceLastVisitCard since={sinceDate ?? null} lines={sinceLines} />
      )}
      {priority && <TodayPriorityCard priority={priority} />}
      {children && <div className={cn('space-y-6', contentClassName)}>{children}</div>}
      {footer}
      {protectLines && protectLines.length > 0 && (
        <HowIProtectYouCard title="While you work…" lines={protectLines} />
      )}
    </div>
  );
}

export default RayPageTemplate;

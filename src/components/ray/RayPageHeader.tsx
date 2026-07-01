/**
 * RayPageHeader — the single page-header used across every Wrayth area.
 * Every module reads "<Title> · Managed by Ray" instead of bespoke titles.
 */
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  subtitle?: string;       // defaults to "Managed by Ray"
  description?: string;    // optional second-line context
  /**
   * A single, focal question that frames this page — Ray's "one question"
   * for the user in this area. Rendered above the title in the accent
   * violet, so every module opens with one intent rather than a menu.
   */
  question?: string;
  right?: React.ReactNode;
  className?: string;
}

export function RayPageHeader({
  title,
  subtitle = 'Managed by Ray',
  description,
  question,
  right,
  className,
}: Props) {
  return (
    <header className={cn('mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{subtitle}</div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-light tracking-tight text-foreground">{title}</h1>
        {question && (
          <p className="mt-3 text-base sm:text-lg font-light text-foreground/90 max-w-xl">
            <span className="text-primary">Ray:</span> {question}
          </p>
        )}
        {description && (
          <p className="mt-2 text-sm text-muted-foreground max-w-xl">{description}</p>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </header>
  );
}

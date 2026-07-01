/**
 * RayPageHeader — the single page-header used across every Wrayth area.
 * Every module reads "<Title> · Managed by Ray" instead of bespoke titles.
 */
import { cn } from '@/lib/utils';
import { ExplainThis } from '@/components/ray/ExplainThis';

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
  /**
   * Optional "Explain this" pill Ray renders next to the subtitle so any
   * page can offer a plain-English breakdown of what it's showing.
   */
  explain?: { title: string; body?: string; bullets?: string[] };
  right?: React.ReactNode;
  className?: string;
}

export function RayPageHeader({
  title,
  subtitle = 'Managed by Ray',
  description,
  question,
  explain,
  right,
  className,
}: Props) {
  return (
    <header className={cn('mb-6 sm:mb-8 flex flex-wrap items-end justify-between gap-4', className)}>
      <div>
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
          <span>{subtitle}</span>
          {explain && <ExplainThis {...explain} />}
        </div>
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

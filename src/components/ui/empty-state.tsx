import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  /** One short sentence — ideally sourced from src/lib/ray/voice.ts. */
  body?: string;
  action?: {
    label: string;
    onClick?: () => void;
    href?: string;
  };
  className?: string;
}

/**
 * Shared empty state primitive. Every list / dashboard route with a possible
 * "no data yet" moment should render this — never a bare "Nothing here" div.
 */
export function EmptyState({ icon: Icon, title, body, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/40 px-6 py-16 text-center',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-muted/60 text-muted-foreground">
          <Icon className="size-6" aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {body ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{body}</p> : null}
      {action ? (
        <div className="mt-6">
          {action.href ? (
            <Button asChild size="sm">
              <a href={action.href}>{action.label}</a>
            </Button>
          ) : (
            <Button size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}

import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button, type buttonVariants } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';

type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];

interface EmptyStateAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: ButtonVariant;
}

interface EmptyStateProps {
  /** Any icon component that renders an SVG (lucide, custom, mock). */
  icon?: ComponentType<{ className?: string }>;
  title: string;
  /** One short sentence — ideally sourced from src/lib/ray/voice.ts. */
  body?: ReactNode;
  /** Alias for `body`, kept for compatibility with earlier call sites. */
  description?: ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  /** Visual density. `sm` shrinks padding for use inside cards / tables. */
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Shared empty state primitive. Every list / dashboard route with a possible
 * "no data yet" moment should render this — never a bare "Nothing here" div.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  description,
  action,
  secondaryAction,
  size = 'md',
  className,
}: EmptyStateProps) {
  const copy = body ?? description;
  const pad = size === 'sm' ? 'px-4 py-8' : 'px-6 py-16';

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/40 text-center',
        pad,
        className,
      )}
      role="status"
      aria-live="polite"
    >
      {Icon ? (
        <div className={cn(
          'mb-5 flex items-center justify-center rounded-xl bg-muted/60 text-muted-foreground',
          size === 'sm' ? 'size-10' : 'size-12',
        )}>
          <Icon className={size === 'sm' ? 'size-5' : 'size-6'} aria-hidden="true" />
        </div>
      ) : null}
      <h3 className="text-base font-medium text-foreground">{title}</h3>
      {copy ? <p className="mt-2 max-w-sm text-sm text-muted-foreground">{copy}</p> : null}
      {(action || secondaryAction) ? (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {action ? renderAction(action, 'default') : null}
          {secondaryAction ? renderAction(secondaryAction, 'outline') : null}
        </div>
      ) : null}
    </div>
  );
}

function renderAction(action: EmptyStateAction, fallbackVariant: ButtonVariant) {
  const variant = action.variant ?? fallbackVariant;
  if (action.href) {
    return (
      <Button asChild size="sm" variant={variant}>
        <a href={action.href}>{action.label}</a>
      </Button>
    );
  }
  return (
    <Button size="sm" variant={variant} onClick={action.onClick}>
      {action.label}
    </Button>
  );
}

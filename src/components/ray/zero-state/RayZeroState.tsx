/**
 * Wrayth zero-state primitives.
 *
 * Every product surface renders EXACTLY ONE of three states:
 *   • Loading  — query in flight or Ray actively working
 *   • Empty    — resolved with zero rows AND nothing in progress
 *   • Active   — resolved with real data
 *
 * There is NEVER a fourth state that uses fake / sample / placeholder content.
 * When a screen has no data yet, render <RayZeroState/> — it teaches the
 * customer what will appear once configured, in Ray's voice, with a concrete
 * next action. See mem://preferences/wrayth-three-state-ui.
 */
import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ZeroStateAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface RayZeroStateProps {
  /** Ray-voice title. Short, in first person. "I'm waiting for your first device to check in." */
  title: string;
  /** One or two sentences explaining what will appear here once configured. */
  body?: ReactNode;
  /** Optional bullet list — "What appears here once set up". */
  expectations?: string[];
  /** Primary next action for the customer. */
  action?: ZeroStateAction;
  /** Optional secondary action. */
  secondaryAction?: ZeroStateAction;
  /** Optional icon; defaults to the Ray eye. */
  icon?: ComponentType<{ className?: string }>;
  /** Compact variant for use inside cards/tables. */
  size?: 'sm' | 'md';
  /** Extra content rendered below the CTA row (e.g. <RaySetupChecklist/>). */
  children?: ReactNode;
  className?: string;
}

/**
 * The canonical Wrayth empty state. Teaches; never simulates.
 */
export function RayZeroState({
  title,
  body,
  expectations,
  action,
  secondaryAction,
  icon: Icon = Eye,
  size = 'md',
  children,
  className,
}: RayZeroStateProps) {
  const isSm = size === 'sm';
  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-border/70 bg-card/40',
        isSm ? 'p-5' : 'p-6 sm:p-8',
        className,
      )}
    >
      <div className={cn('flex items-start gap-4', isSm && 'gap-3')}>
        <div
          className={cn(
            'flex items-center justify-center rounded-full border border-border bg-background shrink-0',
            isSm ? 'h-9 w-9' : 'h-11 w-11',
          )}
        >
          <Icon className={cn('text-foreground/80', isSm ? 'h-4 w-4' : 'h-5 w-5')} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            Ray&rsquo;s note
          </div>
          <p className={cn('mt-1 text-foreground', isSm ? 'text-sm' : 'text-lg')}>{title}</p>
          {body && (
            <p className={cn('mt-2 text-muted-foreground max-w-prose', isSm ? 'text-xs' : 'text-sm')}>
              {body}
            </p>
          )}

          {expectations && expectations.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {expectations.map((line) => (
                <li key={line} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          )}

          {(action || secondaryAction) && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {action && <ActionButton action={action} primary />}
              {secondaryAction && <ActionButton action={secondaryAction} />}
            </div>
          )}

          {children && <div className="mt-6">{children}</div>}
        </div>
      </div>
    </section>
  );
}

function ActionButton({ action, primary }: { action: ZeroStateAction; primary?: boolean }) {
  const variant = action.variant ?? (primary ? 'default' : 'outline');
  const inner = (
    <Button
      variant={variant}
      size="sm"
      onClick={action.onClick}
      className={cn(
        'rounded-sm',
        primary && variant === 'default' && 'bg-violet-500 text-white hover:bg-violet-400',
      )}
    >
      {action.label}
      {primary && <ArrowRight className="ml-2 h-3.5 w-3.5" />}
    </Button>
  );
  if (action.href) {
    return action.href.startsWith('http') ? (
      <a href={action.href} target="_blank" rel="noreferrer">
        {inner}
      </a>
    ) : (
      <Link to={action.href}>{inner}</Link>
    );
  }
  return inner;
}

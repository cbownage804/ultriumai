/**
 * RaySetupChecklist — reads REAL signals from the customer's own tables to
 * show which setup steps are complete. Never fabricated.
 *
 * Each step probes a live table with a `count: 'exact', head: true` query.
 * A step is "complete" when at least one real row exists.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Circle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

export interface SetupStep {
  id: string;
  label: string;
  /** Supabase table to probe. */
  table: string;
  /** Column name for the user filter — defaults to `user_id`. */
  userColumn?: string;
  /** Route to complete this step. */
  href: string;
  /** CTA label when this step is incomplete. */
  cta: string;
}

/** The canonical Wrayth setup steps. */
export const WRAYTH_SETUP_STEPS: SetupStep[] = [
  {
    id: 'agent',
    label: 'Install the Wrayth agent on a device',
    table: 'wrayth_devices',
    href: '/app/devices',
    cta: 'Download agent',
  },
  {
    id: 'identity',
    label: 'Add an identity for Ray to monitor',
    table: 'safeweb_assets',
    href: '/app/exposure',
    cta: 'Add identity',
  },
  {
    id: 'vault',
    label: 'Import passwords into the vault',
    table: 'safepass_entries',
    href: '/app/passwords/import',
    cta: 'Open vault',
  },
];

interface Props {
  steps?: SetupStep[];
  className?: string;
}

export function RaySetupChecklist({ steps = WRAYTH_SETUP_STEPS, className }: Props) {
  const { user } = useAuth();
  const [state, setState] = useState<Record<string, boolean | null>>(
    Object.fromEntries(steps.map((s) => [s.id, null])),
  );

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        steps.map(async (step) => {
          const column = step.userColumn ?? 'user_id';
          const { count } = await supabase
            .from(step.table as any)
            .select('*', { count: 'exact', head: true })
            .eq(column, user.id);
          return [step.id, (count ?? 0) > 0] as const;
        }),
      );
      if (cancelled) return;
      setState(Object.fromEntries(results));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, steps]);

  return (
    <ul className={cn('space-y-2', className)}>
      {steps.map((step) => {
        const done = state[step.id];
        return (
          <li
            key={step.id}
            className={cn(
              'flex items-center gap-3 rounded-md border border-border/60 bg-background/40 px-3 py-2 text-sm',
              done && 'opacity-60',
            )}
          >
            <span className="flex h-5 w-5 items-center justify-center">
              {done === null ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              ) : done ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/60" />
              )}
            </span>
            <span className={cn('flex-1', done && 'line-through')}>{step.label}</span>
            {!done && done !== null && (
              <Link
                to={step.href}
                className="text-xs font-medium text-violet-300 hover:text-violet-200"
              >
                {step.cta} →
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * RayNextAction — computes the single highest-value next step the customer
 * should take, from real setup signals. Never fabricated.
 *
 * Order of priority matches the setup arc: agent → identity → vault. First
 * incomplete step wins. When everything is done, renders nothing (silent —
 * we never fake activity to fill space).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { WRAYTH_SETUP_STEPS, type SetupStep } from './RaySetupChecklist';

interface Props {
  steps?: SetupStep[];
  className?: string;
}

interface Suggestion {
  step: SetupStep;
  headline: string;
}

const HEADLINES: Record<string, string> = {
  agent: "Install the Wrayth agent so I can start reporting on a real machine.",
  identity: "Give me an identity to watch and I\u2019ll start monitoring breach data for you.",
  vault: "Import your passwords and I\u2019ll grade every one and flag reuse.",
};

export function RayNextAction({ steps = WRAYTH_SETUP_STEPS, className }: Props) {
  const { user } = useAuth();
  const [suggestion, setSuggestion] = useState<Suggestion | null | undefined>(undefined);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      for (const step of steps) {
        const column = step.userColumn ?? 'user_id';
        const { count } = await supabase
          .from(step.table as any)
          .select('*', { count: 'exact', head: true })
          .eq(column, user.id);
        if ((count ?? 0) === 0) {
          if (!cancelled) {
            setSuggestion({
              step,
              headline: HEADLINES[step.id] ?? `Complete: ${step.label}`,
            });
          }
          return;
        }
      }
      if (!cancelled) setSuggestion(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, steps]);

  if (suggestion === undefined || suggestion === null) return null;

  return (
    <section
      className={
        className ??
        'rounded-2xl border border-violet-500/30 bg-violet-500/5 p-5 sm:p-6'
      }
    >
      <div className="text-[11px] uppercase tracking-[0.22em] text-violet-300">
        Ray suggests
      </div>
      <p className="mt-2 text-base text-foreground">{suggestion.headline}</p>
      <div className="mt-4">
        <Link to={suggestion.step.href}>
          <Button size="sm" className="rounded-sm bg-violet-500 hover:bg-violet-400 text-white">
            {suggestion.step.cta}
            <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    </section>
  );
}

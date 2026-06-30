/**
 * FixWithRayButton — universal action launcher. Given a recommendation,
 * resolves the right playbook, starts a run, and navigates Ray to it.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import {
  playbookForRecommendation,
  startPlaybook,
} from '@/lib/ray/playbooks';
import type { RayRecommendation } from '@/lib/ray/brain';

type Props = {
  /** Recommendation OR an explicit playbook slug. */
  recommendation?: Pick<RayRecommendation, 'id' | 'title' | 'body' | 'page_context'>;
  slug?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'ghost' | 'outline' | 'secondary';
  className?: string;
  label?: string;
};

export function FixWithRayButton({ recommendation, slug, size = 'sm', variant = 'ghost', className, label }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function launch() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const resolved = slug ?? (recommendation ? playbookForRecommendation(recommendation) : null);
      if (!resolved) return;
      const run = await startPlaybook(user.id, resolved, {
        sourceRecommendationId: recommendation?.id ?? null,
      });
      if (run) navigate(`/app/ray/playbook/${run.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button
      onClick={launch}
      disabled={busy}
      size={size}
      variant={variant}
      className={className}
    >
      <Sparkles className="h-3.5 w-3.5 mr-1 text-violet-300" />
      {label ?? 'Fix with Ray'}
      <ArrowRight className="h-3 w-3 ml-1" />
    </Button>
  );
}

/**
 * Password lifecycle — the user's journey with Wrayth as a password
 * manager. Every surface (Home, Passwords page, Morning Brief,
 * recommendations engine) derives its wording and calls-to-action from
 * this single source of truth so we never contradict ourselves.
 *
 *   not_started → the vault is empty. The primary goal is
 *                 "Protect your passwords with Wrayth" — import or save one.
 *   imported    → credentials exist but Ray hasn't analyzed them yet.
 *   analyzed    → Ray analyzed the vault and found actionable issues.
 *   healthy     → analyzed with nothing meaningful to fix — maintenance mode.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useVault } from '@/hooks/useSafePass';

export type PasswordLifecycleStage =
  | 'not_started'
  | 'imported'
  | 'analyzed'
  | 'healthy';

export interface PasswordLifecycle {
  stage: PasswordLifecycleStage;
  passwordCount: number;
  activeIssues: number;
  loading: boolean;
}

interface AnalysisSignals {
  hasScore: boolean;
  activeFindings: number;
}

export function deriveStage(
  passwordCount: number,
  signals: AnalysisSignals,
): PasswordLifecycleStage {
  if (passwordCount === 0) return 'not_started';
  if (!signals.hasScore) return 'imported';
  return signals.activeFindings > 0 ? 'analyzed' : 'healthy';
}

/**
 * Live lifecycle stage for the signed-in user. Reads vault entries via
 * `useVault` (already cached) and queries `ray_security_scores` +
 * `ray_findings` to decide whether the vault has been analyzed.
 */
export function usePasswordLifecycle(): PasswordLifecycle {
  const { user } = useAuth();
  const { entries, loading: vaultLoading } = useVault();
  const [signals, setSignals] = useState<AnalysisSignals>({
    hasScore: false,
    activeFindings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      const [scoreRes, findingsRes] = await Promise.all([
        supabase
          .from('ray_security_scores')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase
          .from('ray_findings')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .is('resolved_at', null),
      ]);
      if (!alive) return;
      setSignals({
        hasScore: (scoreRes.count ?? 0) > 0,
        activeFindings: findingsRes.count ?? 0,
      });
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user, entries.length]);

  const stage = deriveStage(entries.length, signals);
  return {
    stage,
    passwordCount: entries.length,
    activeIssues: signals.activeFindings,
    loading: loading || vaultLoading,
  };
}

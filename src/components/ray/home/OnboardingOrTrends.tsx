/**
 * OnboardingOrTrends — shows the Getting Started checklist while there is
 * still work to do, and swaps in Security Trends once the user has completed
 * every onboarding item. Reads from onboarding_progress directly so it
 * doesn't have to reach inside the checklist component.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist';
import { SecurityTrendsCard } from './SecurityTrendsCard';

const REQUIRED = ['profile', 'mfa', 'first_password', 'first_scan'];

export function OnboardingOrTrends() {
  const { user } = useAuth();
  const [done, setDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from('onboarding_progress')
        .select('item_id, completed')
        .eq('user_id', user.id)
        .eq('progress_type', 'checklist');
      if (!active) return;
      const completed = new Set((data ?? []).filter((r) => r.completed).map((r) => r.item_id));
      setDone(REQUIRED.every((id) => completed.has(id)));
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  if (done === null) return null;
  return done ? <SecurityTrendsCard /> : <OnboardingChecklist product="safesuite" />;
}

export default OnboardingOrTrends;

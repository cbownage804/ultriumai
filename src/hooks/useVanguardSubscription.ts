import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { resilientEdgeFn } from '@/lib/supabaseResilience';

export interface VanguardSubscriptionData {
  subscribed: boolean;
  tier: string;
  seatCount: number;
  addons: string[];
  subscriptionEnd: string | null;
  stripeSubscriptionId: string | null;
  adminOverride: boolean;
  loading: boolean;
  isTrial: boolean;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  trialEnded: boolean;
}

const DEFAULT_STATE: VanguardSubscriptionData = {
  subscribed: false,
  tier: 'free',
  seatCount: 0,
  addons: [],
  subscriptionEnd: null,
  stripeSubscriptionId: null,
  adminOverride: false,
  loading: true,
  isTrial: false,
  trialEndsAt: null,
  trialDaysRemaining: null,
  trialEnded: false,
};

export const useVanguardSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<VanguardSubscriptionData>(DEFAULT_STATE);

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({ ...DEFAULT_STATE, loading: false });
      return;
    }

    try {
      const data = await resilientEdgeFn(
        () => supabase.functions.invoke('vanguard-check-subscription'),
        null,
        'vanguard-check-subscription',
        12000
      );

      if (data) {
        setSubscription({
          subscribed: data.subscribed ?? false,
          tier: data.tier ?? 'free',
          seatCount: data.seat_count ?? 0,
          addons: data.addons ?? [],
          subscriptionEnd: data.subscription_end ?? null,
          stripeSubscriptionId: data.stripe_subscription_id ?? null,
          adminOverride: data.admin_override ?? false,
          loading: false,
          isTrial: data.is_trial ?? false,
          trialEndsAt: data.trial_ends_at ?? null,
          trialDaysRemaining: data.trial_days_remaining ?? null,
          trialEnded: data.trial_ended ?? false,
        });
      } else {
        // Edge function failed — default to free, don't block UI
        setSubscription(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error checking Vanguard subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every 60s
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const hasAddon = useCallback(
    (addonId: string) => subscription.addons.includes(addonId),
    [subscription.addons]
  );

  const isMspTier = subscription.tier.startsWith('msp-');
  const isItTier = subscription.tier.startsWith('it-');

  return {
    ...subscription,
    hasAddon,
    isMspTier,
    isItTier,
    refreshSubscription: checkSubscription,
  };
};

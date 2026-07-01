/**
 * Wrayth Subscription and Feature Access Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  WraythTier, 
  SAFESUITE_TIERS, 
  getFeatureLimit, 
  isFeatureEnabled,
  TierFeatures 
} from '@/config/safeSuiteTiers';

export interface WraythSubscription {
  tier: WraythTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}

export interface WraythUsage {
  vault: number;
  scan: number;
  watch: number;
}

export function useWraythSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<WraythSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First try to get subscription from database directly (faster)
      const { data: dbSub, error: dbError } = await supabase
        .from('safesuite_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dbSub && dbSub.status === 'active' && dbSub.tier !== 'free') {
        // We have an active paid subscription in the database
        setSubscription({
          tier: dbSub.tier as WraythTier,
          status: dbSub.status as 'active' | 'canceled' | 'past_due' | 'trialing',
          currentPeriodEnd: dbSub.current_period_end,
          stripeSubscriptionId: dbSub.stripe_subscription_id,
          stripeCustomerId: dbSub.stripe_customer_id
        });
        setLoading(false);
        return;
      }

      // If no active paid sub in DB, verify with Stripe via edge function
      const { data, error: fnError } = await supabase.functions.invoke('safesuite-check-subscription');

      if (fnError) throw fnError;

      if (data?.subscribed && data?.tier) {
        setSubscription({
          tier: data.tier || 'free',
          status: 'active',
          currentPeriodEnd: data.subscription_end,
          stripeSubscriptionId: null,
          stripeCustomerId: null
        });
      } else {
        // Default to free tier
        setSubscription({
          tier: 'free',
          status: 'active',
          currentPeriodEnd: null,
          stripeSubscriptionId: null,
          stripeCustomerId: null
        });
      }
    } catch (err) {
      console.error('Error fetching Wrayth subscription:', err);
      // Default to free tier on error
      setSubscription({
        tier: 'free',
        status: 'active',
        currentPeriodEnd: null,
        stripeSubscriptionId: null,
        stripeCustomerId: null
      });
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Refresh subscription periodically
  useEffect(() => {
    const interval = setInterval(fetchSubscription, 60000); // Every minute
    return () => clearInterval(interval);
  }, [fetchSubscription]);

  const refreshSubscription = useCallback(() => {
    return fetchSubscription();
  }, [fetchSubscription]);

  return {
    subscription,
    tier: subscription?.tier || 'free',
    tierConfig: SAFESUITE_TIERS[subscription?.tier || 'free'],
    loading,
    error,
    refreshSubscription,
    isSubscribed: subscription?.tier !== 'free',
    isPro: subscription?.tier === 'pro' || subscription?.tier === 'business',
    isBusiness: subscription?.tier === 'business'
  };
}

export function useWraythUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<WraythUsage>({
    vault: 0,
    scan: 0,
    watch: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch usage from edge function (no body needed for get all)
      const { data, error } = await supabase.functions.invoke('safesuite-usage');

      if (error) throw error;

      if (data?.usage) {
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Error fetching Wrayth usage:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, refreshUsage: fetchUsage };
}

export function useFeatureAccess() {
  const { tier } = useWraythSubscription();
  const { usage } = useWraythUsage();

  const checkFeatureAccess = useCallback((
    feature: keyof TierFeatures,
    action: 'view' | 'use' = 'use'
  ): { allowed: boolean; reason?: string; limit?: number; used?: number } => {
    const featureLimit = getFeatureLimit(tier, feature);

    // Feature not enabled for tier
    if (!featureLimit.enabled) {
      return {
        allowed: false,
        reason: `${feature} is not available on the ${SAFESUITE_TIERS[tier].name} plan`
      };
    }

    // View access is always allowed if feature is enabled
    if (action === 'view') {
      return { allowed: true };
    }

    // Unlimited access
    if (featureLimit.limit === -1) {
      return { allowed: true };
    }

    // Check usage against limit
    const currentUsage = usage[feature];
    if (currentUsage >= featureLimit.limit) {
      return {
        allowed: false,
        reason: `You've reached your ${feature} limit for this month`,
        limit: featureLimit.limit,
        used: currentUsage
      };
    }

    return {
      allowed: true,
      limit: featureLimit.limit,
      used: currentUsage
    };
  }, [tier, usage]);

  const canUseFeature = useCallback((feature: keyof TierFeatures): boolean => {
    return checkFeatureAccess(feature).allowed;
  }, [checkFeatureAccess]);

  const getUpgradeReason = useCallback((feature: keyof TierFeatures): string | null => {
    if (!isFeatureEnabled(tier, feature)) {
      if (tier === 'free') {
        return `Upgrade to Pro to unlock ${feature}`;
      }
      return `Upgrade to Business to unlock ${feature}`;
    }
    return null;
  }, [tier]);

  const getRequiredTier = useCallback((feature: keyof TierFeatures): WraythTier => {
    // Find the lowest tier that enables this feature
    if (SAFESUITE_TIERS.free.features[feature].enabled) return 'free';
    if (SAFESUITE_TIERS.pro.features[feature].enabled) return 'pro';
    return 'business';
  }, []);

  return {
    checkFeatureAccess,
    canUseFeature,
    getUpgradeReason,
    getRequiredTier,
    tier
  };
}

export function useWraythCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useCallback(async (
    tier: WraythTier,
    interval: 'monthly' | 'yearly' = 'monthly',
    seats?: number
  ): Promise<{ url?: string; upgraded?: boolean; redirectUrl?: string; message?: string } | null> => {
    setLoading(true);
    setError(null);

    try {
      // Business tier uses dedicated team checkout function with seats
      if (tier === 'business') {
        const { data, error: fnError } = await supabase.functions.invoke('safesuite-team-checkout', {
          body: { seats: seats || 5, yearly: interval === 'yearly' }
        });

        if (fnError) throw fnError;

        if (data?.url) {
          return { url: data.url };
        }

        throw new Error('No checkout URL returned');
      }

      // Pro tier uses standard checkout (also handles upgrades)
      const { data, error: fnError } = await supabase.functions.invoke('safesuite-checkout', {
        body: { tier, billing: interval }
      });

      if (fnError) throw fnError;

      // Handle direct upgrade (no checkout needed)
      if (data?.upgraded) {
        return { 
          upgraded: true, 
          redirectUrl: data.redirectUrl,
          message: data.message 
        };
      }

      if (data?.url) {
        return { url: data.url };
      }

      throw new Error('No checkout URL returned');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create checkout';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const openCustomerPortal = useCallback(async (): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('safesuite-portal');

      if (fnError) throw fnError;

      if (data?.url) {
        return data.url;
      }

      throw new Error('No portal URL returned');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open customer portal';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createCheckout,
    openCustomerPortal,
    loading,
    error
  };
}

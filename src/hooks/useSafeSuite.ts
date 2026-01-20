/**
 * SafeSuite Subscription and Feature Access Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { 
  SafeSuiteTier, 
  SAFESUITE_TIERS, 
  getFeatureLimit, 
  isFeatureEnabled,
  TierFeatures 
} from '@/config/safeSuiteTiers';

export interface SafeSuiteSubscription {
  tier: SafeSuiteTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
}

export interface SafeSuiteUsage {
  safepass: number;
  safescan: number;
  safeweb: number;
  safetrack: number;
}

export function useSafeSuiteSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SafeSuiteSubscription | null>(null);
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
      
      // Call edge function to check subscription status
      const { data, error: fnError } = await supabase.functions.invoke('safesuite-check-access', {
        body: { userId: user.id }
      });

      if (fnError) throw fnError;

      if (data?.subscription) {
        setSubscription({
          tier: data.subscription.tier || 'free',
          status: data.subscription.status || 'active',
          currentPeriodEnd: data.subscription.current_period_end,
          stripeSubscriptionId: data.subscription.stripe_subscription_id,
          stripeCustomerId: data.subscription.stripe_customer_id
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
      console.error('Error fetching SafeSuite subscription:', err);
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

export function useSafeSuiteUsage() {
  const { user } = useAuth();
  const [usage, setUsage] = useState<SafeSuiteUsage>({
    safepass: 0,
    safescan: 0,
    safeweb: 0,
    safetrack: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch usage from edge function
      const { data, error } = await supabase.functions.invoke('safesuite-check-access', {
        body: { userId: user.id, includeUsage: true }
      });

      if (error) throw error;

      if (data?.usage) {
        setUsage(data.usage);
      }
    } catch (err) {
      console.error('Error fetching SafeSuite usage:', err);
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
  const { tier } = useSafeSuiteSubscription();
  const { usage } = useSafeSuiteUsage();

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

  const getRequiredTier = useCallback((feature: keyof TierFeatures): SafeSuiteTier => {
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

export function useSafeSuiteCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckout = useCallback(async (
    tier: SafeSuiteTier,
    interval: 'monthly' | 'yearly' = 'monthly'
  ): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('safesuite-checkout', {
        body: { tier, interval }
      });

      if (fnError) throw fnError;

      if (data?.url) {
        return data.url;
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

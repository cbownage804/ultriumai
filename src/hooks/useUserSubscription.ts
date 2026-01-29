import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionData {
  subscribed: boolean;
  productId: string | null;
  tier: string | null;
  subscriptionEnd: string | null;
  loading: boolean;
}

export interface ProductAccess {
  safesuite: { tier: string; expires_at: string | null } | null;
  ai_studio: { tier: string; expires_at: string | null } | null;
  vanguard: { tier: string; expires_at: string | null } | null;
}

export const useUserSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData>({
    subscribed: false,
    productId: null,
    tier: null,
    subscriptionEnd: null,
    loading: true,
  });
  const [productAccess, setProductAccess] = useState<ProductAccess>({
    safesuite: null,
    ai_studio: null,
    vanguard: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        subscribed: false,
        productId: null,
        tier: null,
        subscriptionEnd: null,
        loading: false,
      });
      setProductAccess({
        safesuite: null,
        ai_studio: null,
        vanguard: null,
      });
      return;
    }

    try {
      // Check Stripe subscription via edge function
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');

      if (stripeError) {
        console.error('Error checking subscription:', stripeError);
      }

      // Also check local product access table
      const { data: accessData } = await supabase
        .from('user_product_access')
        .select('product, access_level, expires_at')
        .eq('user_id', user.id);

      const access: ProductAccess = {
        safesuite: null,
        ai_studio: null,
        vanguard: null,
      };

      if (accessData) {
        accessData.forEach((item) => {
          if (item.product === 'safesuite') {
            access.safesuite = { tier: item.access_level, expires_at: item.expires_at };
          } else if (item.product === 'ai_studio') {
            access.ai_studio = { tier: item.access_level, expires_at: item.expires_at };
          } else if (item.product === 'vanguard') {
            access.vanguard = { tier: item.access_level, expires_at: item.expires_at };
          }
        });
      }

      setProductAccess(access);

      setSubscription({
        subscribed: stripeData?.subscribed || false,
        productId: stripeData?.product_id || null,
        tier: stripeData?.tier || access.safesuite?.tier || null,
        subscriptionEnd: stripeData?.subscription_end || null,
        loading: false,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh subscription status periodically (every 60 seconds)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  return {
    ...subscription,
    productAccess,
    refreshSubscription: checkSubscription,
  };
};

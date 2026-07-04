import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Wrayth pricing configuration - matches Stripe prices
export const SAFESUITE_PRICES = {
  pro: {
    monthly: {
      priceId: 'price_1TpZiYH1u6E0bsJTt1q6wSMT',
      amount: 1500, // $15/mo
    },
    yearly: {
      priceId: 'price_1SrTeiH1u6E0bsJTarTH7ajs',
      amount: 15000, // $150/yr (~$12.50/mo)
    }
  },
  business: {
    monthly: {
      priceId: 'price_1SrTejH1u6E0bsJTwd4K8st5',
      amount: 3900, // $39/user/mo
    },
    yearly: {
      priceId: 'price_1SrTelH1u6E0bsJTmep4lSIP',
      amount: 39000, // $390/yr per user
    }
  },
  enterprise: {
    monthly: {
      priceId: 'price_1SuesEH1u6E0bsJT6o2Hxp0T',
      amount: 4500, // $45/user/mo
    },
    yearly: {
      priceId: 'price_enterprise_yearly', // Contact sales — no live yearly price
      amount: 43200, // $432/year per user (placeholder until live price exists)
    }
  }
};

export type WraythTier = 'pro' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

interface CheckoutOptions {
  product: 'safesuite' | 'ai_studio' | 'vanguard';
  tier?: string;
  billing?: BillingCycle;
  priceId?: string;
  quantity?: number;
  successUrl?: string;
  cancelUrl?: string;
}

export const useStripeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const startCheckout = async (options: CheckoutOptions) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your purchase.",
        variant: "destructive",
      });
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
      return null;
    }

    setLoading(true);

    try {
      let functionName = 'create-checkout';
      let body: Record<string, unknown> = {};

      // Route to appropriate checkout function
      if (options.product === 'safesuite') {
        functionName = 'safesuite-checkout';
        body = {
          tier: options.tier,
          billing: options.billing || 'monthly',
        };
      } else {
        body = {
          priceId: options.priceId,
          planType: options.tier,
          successUrl: options.successUrl,
          cancelUrl: options.cancelUrl,
        };
      }

      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
      });

      if (error) throw error;

      // Handle upgrade response (no redirect needed)
      if (data?.upgraded) {
        toast({
          title: "Subscription Upgraded!",
          description: data.message,
        });
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
        return data;
      }

      // Redirect to Stripe checkout
      if (data?.url) {
        window.open(data.url, '_blank');
        return data;
      }

      throw new Error('No checkout URL returned');
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const openCustomerPortal = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to manage your subscription.",
        variant: "destructive",
      });
      return null;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        return data;
      }

      throw new Error('No portal URL returned');
    } catch (error: any) {
      console.error('Portal error:', error);
      toast({
        title: "Portal Error",
        description: error.message || "Failed to open billing portal. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    startCheckout,
    openCustomerPortal,
    SAFESUITE_PRICES,
  };
};

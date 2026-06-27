import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// SafeSuite pricing configuration - matches Stripe prices
export const SAFESUITE_PRICES = {
  pro: {
    monthly: {
      priceId: 'price_1SrTegH1u6E0bsJTKpGm5qxr',
      amount: 999, // $9.99
    },
    yearly: {
      priceId: 'price_1SrTeiH1u6E0bsJTarTH7ajs',
      amount: 9588, // $95.88/year ($7.99/mo)
    }
  },
  business: {
    monthly: {
      priceId: 'price_1SrTejH1u6E0bsJTwd4K8st5',
      amount: 2999, // $29.99/user/mo (matches live Stripe)
    },
    yearly: {
      priceId: 'price_1SrTelH1u6E0bsJTmep4lSIP',
      amount: 28790, // $287.90/year per user (matches live Stripe)
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

export type SafeSuiteTier = 'pro' | 'business' | 'enterprise';
export type BillingCycle = 'monthly' | 'yearly';

interface CheckoutOptions {
  product: 'safesuite' | 'ai_studio' | 'vanguard' | 'product';
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
      } else if (options.product === 'product' && options.priceId) {
        functionName = 'product-checkout';
        body = {
          productId: options.tier,
          quantity: options.quantity || 1,
          billingInterval: options.billing || 'monthly',
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

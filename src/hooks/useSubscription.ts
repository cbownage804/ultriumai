import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { safeWindowOpen } from "@/utils/security";
import { devLog } from "@/lib/logger";

export interface SubscriptionInfo {
  subscribed: boolean;
  subscription_tier: string;
  subscription_end: string | null;
}

export const useSubscription = () => {
  const [subscription, setSubscription] = useState<SubscriptionInfo>({
    subscribed: false,
    subscription_tier: "free",
    subscription_end: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const checkSubscription = async () => {
    if (!user || !session) {
      setSubscription({
        subscribed: false,
        subscription_tier: "free",
        subscription_end: null
      });
      setIsLoading(false);
      return;
    }

    // Check if subscription has expired and user is past trial period
    const userCreatedAt = new Date(user.created_at);
    const now = new Date();
    const daysSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const isTrialExpired = daysSinceSignup > 14; // 14 days max trial

    try {
      setIsLoading(true);
      devLog.log('Checking subscription for user:', user.email);
      
      const { data, error } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      
      devLog.log('Subscription data received:', data);
      
      // If subscription expired and trial period over, force to free tier
      if (data.subscription_end && new Date(data.subscription_end) < now && isTrialExpired && !data.subscribed) {
        setSubscription({
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null
        });
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      
      // Fallback: try to get subscription data directly from database
      try {
        const { data: dbData, error: dbError } = await supabase
          .from('subscribers')
          .select('subscribed, subscription_tier, subscription_end')
          .eq('email', user.email)
          .single();
          
        if (!dbError && dbData) {
          devLog.log('Using database fallback:', dbData);
          setSubscription({
            subscribed: dbData.subscribed,
            subscription_tier: dbData.subscription_tier || 'free',
            subscription_end: dbData.subscription_end
          });
        } else {
        throw error;
        }
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // Don't block the UI — default to free tier so the page still loads
        setSubscription({
          subscribed: false,
          subscription_tier: "free",
          subscription_end: null,
        });
        toast({
          title: "Error",
          description: "Failed to check subscription status. Some features may be limited.",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckout = async (planType: string, interval: string = "monthly") => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planType: planType.toLowerCase(), 
          interval,
          successUrl: `${window.location.origin}/dashboard?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open Stripe checkout in a new tab
      safeWindowOpen(data.url, '_blank');
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: "Failed to create checkout session.",
        variant: "destructive",
      });
    }
  };

  const openCustomerPortal = async (product: 'safesuite' | 'ai-studio' | 'vanguard' = 'safesuite') => {
    if (!user || !session) {
      toast({
        title: "Authentication required",
        description: "Please log in to manage your subscription.",
        variant: "destructive",
      });
      return;
    }

    // Map product to the appropriate edge function
    const portalFunctions = {
      'safesuite': 'safesuite-customer-portal',
      'ai-studio': 'ai-studio-customer-portal',
      'vanguard': 'vanguard-customer-portal',
    };

    const functionName = portalFunctions[product];

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      // Open customer portal in a new tab
      safeWindowOpen(data.url, '_blank');
    } catch (error) {
      console.error(`Error opening ${product} customer portal:`, error);
      toast({
        title: "Error",
        description: "Failed to open customer portal.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user, session]);

  return {
    subscription,
    isLoading,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
    canCreateCustomGPT: subscription.subscription_tier === "premium" || subscription.subscription_tier === "enterprise"
  };
};
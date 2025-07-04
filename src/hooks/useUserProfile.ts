import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UserProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

interface UserCredits {
  credits_used: number;
  credits_limit: number;
}

interface UserSubscription {
  subscription_tier: string;
  subscribed: boolean;
  subscription_end: string | null;
}

export const useUserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [credits, setCredits] = useState<UserCredits | null>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      try {
        // Fetch profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, email, avatar_url')
          .eq('user_id', user.id)
          .single();

        // Fetch credits
        const { data: creditsData } = await supabase
          .from('user_credits')
          .select('credits_used, credits_limit')
          .eq('user_id', user.id)
          .single();

        // Fetch subscription
        const { data: subscriptionData } = await supabase
          .from('subscribers')
          .select('subscription_tier, subscribed, subscription_end')
          .eq('user_id', user.id)
          .single();

        setProfile(profileData || { full_name: null, email: user.email || '', avatar_url: null });
        setCredits(creditsData || { credits_used: 0, credits_limit: 100 });
        setSubscription(subscriptionData || { subscription_tier: 'free', subscribed: false, subscription_end: null });
      } catch (error) {
        console.error('Error fetching user data:', error);
        // Set fallback data
        setProfile({ full_name: null, email: user.email || '', avatar_url: null });
        setCredits({ credits_used: 0, credits_limit: 100 });
        setSubscription({ subscription_tier: 'free', subscribed: false, subscription_end: null });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  return {
    profile,
    credits,
    subscription,
    loading
  };
};
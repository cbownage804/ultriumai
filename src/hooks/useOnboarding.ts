import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export const useOnboarding = () => {
  const { user } = useAuth();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user has completed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, company_name, created_at, product_interests, primary_product')
        .eq('user_id', user.id)
        .single();

      // Onboarding needed if:
      // 1. No profile exists
      // 2. Profile exists but is incomplete (no full_name)
      // 3. Account is very new (created in last 24 hours) and lacks company info
      // 4. No product interests selected yet (new unified flow)
      const isNewAccount = profile && new Date(profile.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
      const isIncomplete = !profile?.full_name;
      const lacksCompanyInfo = isNewAccount && !profile?.company_name;
      const noProductInterests = !profile?.product_interests?.length && !profile?.primary_product;

      setNeedsOnboarding(!profile || isIncomplete || lacksCompanyInfo || (isNewAccount && noProductInterests));
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // If there's an error, assume onboarding is needed
      setNeedsOnboarding(true);
    } finally {
      setLoading(false);
    }
  };

  const completeOnboarding = () => {
    setNeedsOnboarding(false);
  };

  return {
    needsOnboarding,
    loading,
    completeOnboarding,
    checkOnboardingStatus
  };
};
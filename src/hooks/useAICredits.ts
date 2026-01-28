import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OrgCredits {
  id: string;
  user_id: string;
  plan_type: string;
  monthly_credit_limit: number;
  credits_remaining: number;
  credits_used_this_period: number;
  credit_reset_date: string | null;
  overage_enabled: boolean;
  overage_credits_used: number;
  created_at: string;
  updated_at: string;
}

interface UseAICreditsResult {
  credits: OrgCredits | null;
  loading: boolean;
  error: string | null;
  hasCredits: boolean;
  creditsRemaining: number;
  usagePercentage: number;
  refresh: () => Promise<void>;
  checkCredits: (tokensNeeded: number, multiplier?: number) => boolean;
}

export const useAICredits = (): UseAICreditsResult => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<OrgCredits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCredits = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('org_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no record exists, create one with defaults
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('org_credits')
            .insert({
              user_id: user.id,
              plan_type: 'free',
              monthly_credit_limit: 1000,
              credits_remaining: 1000,
              credits_used_this_period: 0
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setCredits(newData);
        } else {
          throw fetchError;
        }
      } else {
        setCredits(data);
      }
    } catch (err: any) {
      console.error('Error fetching AI credits:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('org_credits_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'org_credits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new) {
            setCredits(payload.new as OrgCredits);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const hasCredits = (credits?.credits_remaining ?? 0) > 0;
  const creditsRemaining = credits?.credits_remaining ?? 0;
  const usagePercentage = credits?.monthly_credit_limit 
    ? ((credits.credits_used_this_period / credits.monthly_credit_limit) * 100)
    : 0;

  const checkCredits = useCallback((tokensNeeded: number, multiplier: number = 1.0): boolean => {
    const creditsNeeded = (tokensNeeded / 1000) * multiplier;
    return creditsRemaining >= creditsNeeded;
  }, [creditsRemaining]);

  return {
    credits,
    loading,
    error,
    hasCredits,
    creditsRemaining,
    usagePercentage,
    refresh: fetchCredits,
    checkCredits,
  };
};

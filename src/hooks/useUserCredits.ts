import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { devLog } from "@/lib/logger";

/**
 * Lovable-style credit system:
 * - Daily credits: 10 credits, reset daily at midnight UTC, don't roll over
 * - Monthly credits: Based on subscription tier, tied to billing period
 * - Bonus credits: Purchased credits that never expire
 */

export interface UserCredits {
  // Daily credits (10/day, reset daily, don't roll over)
  daily_credits_used: number;
  daily_credits_limit: number;
  daily_reset_at: string;
  // Monthly credits (based on tier, tied to billing period)
  monthly_credits_used: number;
  monthly_credits_limit: number;
  monthly_reset_at: string;
  billing_period_start: string;
  // Bonus credits (purchased, never expire)
  bonus_credits: number;
  // Legacy fields for backwards compatibility
  credits_used: number;
  credits_limit: number;
  reset_date: string;
  last_reset: string;
}

export interface CreditHistory {
  id: string;
  credits_amount: number;
  action_type: 'usage' | 'purchase' | 'reset' | 'bonus' | 'daily_reset' | 'monthly_reset';
  description: string;
  created_at: string;
}

// Get next midnight UTC
const getNextMidnightUTC = () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow.toISOString();
};

// Get today at midnight UTC
const getTodayMidnightUTC = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.toISOString();
};

// Get next month from now
const getNextMonth = () => {
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
  return now.toISOString();
};

export const useUserCredits = () => {
  const [credits, setCredits] = useState<UserCredits>({
    daily_credits_used: 0,
    daily_credits_limit: 10,
    daily_reset_at: getNextMidnightUTC(),
    monthly_credits_used: 0,
    monthly_credits_limit: 0,
    monthly_reset_at: getNextMonth(),
    billing_period_start: getTodayMidnightUTC(),
    bonus_credits: 0,
    // Legacy
    credits_used: 0,
    credits_limit: 10,
    reset_date: getNextMidnightUTC(),
    last_reset: getTodayMidnightUTC()
  });
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check and reset daily credits if needed
  const checkAndResetDailyCredits = useCallback(async (currentCredits: Record<string, unknown>) => {
    if (!user) return currentCredits;
    
    const now = new Date();
    const dailyResetAt = new Date(currentCredits.daily_reset_at as string || getNextMidnightUTC());
    
    if (now >= dailyResetAt) {
      const newDailyResetAt = getNextMidnightUTC();
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          daily_credits_used: 0,
          daily_reset_at: newDailyResetAt
        } as Record<string, unknown>)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (!error && data) {
        return data as Record<string, unknown>;
      }
    }
    
    return currentCredits;
  }, [user]);

  // Check and reset monthly credits if needed
  const checkAndResetMonthlyCredits = useCallback(async (currentCredits: Record<string, unknown>) => {
    if (!user) return currentCredits;
    
    const now = new Date();
    const monthlyResetAt = new Date(currentCredits.monthly_reset_at as string || getNextMonth());
    
    if (now >= monthlyResetAt) {
      const newMonthlyResetAt = getNextMonth();
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          monthly_credits_used: 0,
          monthly_reset_at: newMonthlyResetAt,
          billing_period_start: getTodayMidnightUTC()
        } as Record<string, unknown>)
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (!error && data) {
        return data as Record<string, unknown>;
      }
    }
    
    return currentCredits;
  }, [user]);

  const loadCredits = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, create one with Lovable-style defaults
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            daily_credits_used: 0,
            daily_credits_limit: 10,
            daily_reset_at: getNextMidnightUTC(),
            monthly_credits_used: 0,
            monthly_credits_limit: 0,
            monthly_reset_at: getNextMonth(),
            billing_period_start: getTodayMidnightUTC(),
            bonus_credits: 0,
            // Legacy fields
            credits_used: 0,
            credits_limit: 10,
            reset_date: getNextMidnightUTC()
          } as Record<string, unknown>)
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newData) {
          const rawData = newData as Record<string, unknown>;
          setCredits({
            daily_credits_used: rawData.daily_credits_used as number || 0,
            daily_credits_limit: rawData.daily_credits_limit as number || 10,
            daily_reset_at: rawData.daily_reset_at as string || getNextMidnightUTC(),
            monthly_credits_used: rawData.monthly_credits_used as number || 0,
            monthly_credits_limit: rawData.monthly_credits_limit as number || 0,
            monthly_reset_at: rawData.monthly_reset_at as string || getNextMonth(),
            billing_period_start: rawData.billing_period_start as string || getTodayMidnightUTC(),
            bonus_credits: rawData.bonus_credits as number || 0,
            credits_used: (newData as { credits_used?: number }).credits_used || 0,
            credits_limit: (newData as { credits_limit?: number }).credits_limit || 10,
            reset_date: (newData as { reset_date?: string }).reset_date || getNextMidnightUTC(),
            last_reset: rawData.last_reset as string || getTodayMidnightUTC()
          });
        }
      } else if (error) {
        throw error;
      } else if (data) {
        // Check if we need to reset (daily and monthly)
        let rawData = data as Record<string, unknown>;
        rawData = await checkAndResetDailyCredits(rawData);
        rawData = await checkAndResetMonthlyCredits(rawData);
        
        setCredits({
          daily_credits_used: rawData.daily_credits_used as number || 0,
          daily_credits_limit: rawData.daily_credits_limit as number || 10,
          daily_reset_at: rawData.daily_reset_at as string || getNextMidnightUTC(),
          monthly_credits_used: rawData.monthly_credits_used as number || 0,
          monthly_credits_limit: rawData.monthly_credits_limit as number || 0,
          monthly_reset_at: rawData.monthly_reset_at as string || getNextMonth(),
          billing_period_start: rawData.billing_period_start as string || getTodayMidnightUTC(),
          bonus_credits: rawData.bonus_credits as number || 0,
          credits_used: (data as { credits_used?: number }).credits_used || 0,
          credits_limit: (data as { credits_limit?: number }).credits_limit || 10,
          reset_date: (data as { reset_date?: string }).reset_date || getNextMidnightUTC(),
          last_reset: rawData.last_reset as string || getTodayMidnightUTC()
        });
      }
    } catch (error) {
      console.error('Error loading credits:', error);
      toast({
        title: "Error",
        description: "Failed to load credit information.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, checkAndResetDailyCredits, checkAndResetMonthlyCredits, toast]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credit_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) {
        devLog.log('Credit history not available:', error.message);
        return;
      }
      
      if (data) {
        setHistory(data as CreditHistory[]);
      }
    } catch (error) {
      console.error('Error loading credit history:', error);
    }
  }, [user]);

  /**
   * Use credits with priority:
   * 1. Daily credits (free, reset daily)
   * 2. Monthly credits (subscription-based)
   * 3. Bonus credits (purchased, never expire)
   */
  const deductCredits = useCallback(async (amount: number, description: string = 'AI interaction') => {
    if (!user) return false;
    
    const dailyRemaining = credits.daily_credits_limit - credits.daily_credits_used;
    const monthlyRemaining = credits.monthly_credits_limit - credits.monthly_credits_used;
    const totalAvailable = dailyRemaining + monthlyRemaining + credits.bonus_credits;
    
    if (amount > totalAvailable) {
      toast({
        title: "Insufficient Credits",
        description: `You need ${amount} credits but only have ${totalAvailable} remaining. Purchase more to continue.`,
        variant: "destructive",
      });
      return false;
    }

    try {
      // Calculate how to distribute the deduction
      let dailyToUse = Math.min(dailyRemaining, amount);
      let remainingAfterDaily = amount - dailyToUse;
      
      let monthlyToUse = Math.min(monthlyRemaining, remainingAfterDaily);
      let remainingAfterMonthly = remainingAfterDaily - monthlyToUse;
      
      let bonusToUse = remainingAfterMonthly; // Whatever's left comes from bonus

      // Update credits in database
      const updatePayload: Record<string, unknown> = {};
      
      if (dailyToUse > 0) {
        updatePayload.daily_credits_used = credits.daily_credits_used + dailyToUse;
      }
      if (monthlyToUse > 0) {
        updatePayload.monthly_credits_used = credits.monthly_credits_used + monthlyToUse;
      }
      if (bonusToUse > 0) {
        updatePayload.bonus_credits = credits.bonus_credits - bonusToUse;
      }

      if (Object.keys(updatePayload).length > 0) {
        const { error } = await supabase
          .from('user_credits')
          .update(updatePayload)
          .eq('user_id', user.id);

        if (error) throw error;
      }

      // Log the usage
      try {
        await supabase
          .from('credit_history')
          .insert([{
            user_id: user.id,
            credits_amount: -amount,
            action_type: 'usage',
            description
          }]);
      } catch (e) {
        devLog.log('Credit history logging skipped');
      }

      // Update local state
      setCredits(prev => ({
        ...prev,
        daily_credits_used: prev.daily_credits_used + dailyToUse,
        monthly_credits_used: prev.monthly_credits_used + monthlyToUse,
        bonus_credits: prev.bonus_credits - bonusToUse
      }));

      return true;
    } catch (error) {
      console.error('Error using credits:', error);
      return false;
    }
  }, [user, credits, toast]);

  const addBonusCredits = useCallback(async (amount: number, description: string = 'Credit purchase') => {
    if (!user) return false;

    try {
      const newBonusCredits = credits.bonus_credits + amount;
      await supabase
        .from('user_credits')
        .update({ bonus_credits: newBonusCredits } as Record<string, unknown>)
        .eq('user_id', user.id);

      try {
        await supabase
          .from('credit_history')
          .insert([{
            user_id: user.id,
            credits_amount: amount,
            action_type: 'purchase',
            description
          }]);
      } catch (e) {
        devLog.log('Credit history logging skipped');
      }

      setCredits(prev => ({
        ...prev,
        bonus_credits: prev.bonus_credits + amount
      }));

      return true;
    } catch (error) {
      console.error('Error adding bonus credits:', error);
      return false;
    }
  }, [user, credits]);

  const refreshCredits = useCallback(() => {
    loadCredits();
    loadHistory();
  }, [loadCredits, loadHistory]);

  // Calculate time until daily reset
  const getTimeUntilDailyReset = useCallback(() => {
    const now = new Date();
    const resetDate = new Date(credits.daily_reset_at);
    const diff = resetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }, [credits.daily_reset_at]);

  // Calculate time until monthly reset
  const getTimeUntilMonthlyReset = useCallback(() => {
    const now = new Date();
    const resetDate = new Date(credits.monthly_reset_at);
    const diff = resetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting...';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    return `${days} days`;
  }, [credits.monthly_reset_at]);

  // Legacy function for backwards compatibility
  const getTimeUntilReset = getTimeUntilDailyReset;

  useEffect(() => {
    loadCredits();
    loadHistory();
  }, [user, loadCredits, loadHistory]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('credit-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadCredits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, loadCredits]);

  // Calculate remaining credits
  const dailyRemaining = credits.daily_credits_limit - credits.daily_credits_used;
  const monthlyRemaining = credits.monthly_credits_limit - credits.monthly_credits_used;
  const totalRemaining = dailyRemaining + monthlyRemaining + credits.bonus_credits;
  
  // Legacy calculations for backwards compatibility
  const remainingCredits = totalRemaining;
  const usagePercentage = credits.daily_credits_limit > 0 
    ? (credits.daily_credits_used / credits.daily_credits_limit) * 100 
    : 0;

  return {
    credits,
    history,
    isLoading,
    refreshCredits,
    deductCredits,
    addBonusCredits,
    // New Lovable-style values
    dailyRemaining,
    monthlyRemaining,
    totalRemaining,
    getTimeUntilDailyReset,
    getTimeUntilMonthlyReset,
    // Legacy values for backwards compatibility
    remainingCredits,
    usagePercentage,
    getTimeUntilReset
  };
};

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface UserCredits {
  credits_used: number;
  credits_limit: number;
  bonus_credits: number;
  reset_date: string;
  last_reset: string;
}

export interface CreditHistory {
  id: string;
  credits_amount: number;
  action_type: 'usage' | 'purchase' | 'reset' | 'bonus';
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

export const useUserCredits = () => {
  const [credits, setCredits] = useState<UserCredits>({
    credits_used: 0,
    credits_limit: 100,
    bonus_credits: 0,
    reset_date: getNextMidnightUTC(),
    last_reset: getTodayMidnightUTC()
  });
  const [history, setHistory] = useState<CreditHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const checkAndResetCredits = useCallback(async (currentCredits: UserCredits & { user_id?: string }) => {
    if (!user) return currentCredits;
    
    const now = new Date();
    const resetDate = new Date(currentCredits.reset_date);
    
    // Check if we've passed the reset date (daily reset at midnight UTC)
    if (now >= resetDate) {
      // Reset credits
      const newResetDate = getNextMidnightUTC();
      const { data, error } = await supabase
        .from('user_credits')
        .update({
          credits_used: 0,
          reset_date: newResetDate,
          last_reset: getTodayMidnightUTC()
        })
        .eq('user_id', user.id)
        .select()
        .single();
      
      if (!error && data) {
        return {
          ...data,
          bonus_credits: (data as Record<string, unknown>).bonus_credits as number || 0,
          last_reset: (data as Record<string, unknown>).last_reset as string || getTodayMidnightUTC()
        };
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
      
      // Try to get existing credits record
      const { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, create one with daily reset
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            credits_used: 0,
            credits_limit: 100,
            reset_date: getNextMidnightUTC()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        if (newData) {
          setCredits({
            credits_used: newData.credits_used || 0,
            credits_limit: newData.credits_limit || 100,
            bonus_credits: (newData as Record<string, unknown>).bonus_credits as number || 0,
            reset_date: newData.reset_date || getNextMidnightUTC(),
            last_reset: (newData as Record<string, unknown>).last_reset as string || getTodayMidnightUTC()
          });
        }
      } else if (error) {
        throw error;
      } else if (data) {
        // Check if we need to reset (daily reset logic)
        const rawData = data as Record<string, unknown>;
        const currentCredits = {
          credits_used: data.credits_used || 0,
          credits_limit: data.credits_limit || 100,
          bonus_credits: rawData.bonus_credits as number || 0,
          reset_date: data.reset_date || getNextMidnightUTC(),
          last_reset: rawData.last_reset as string || getTodayMidnightUTC()
        };
        
        const updatedData = await checkAndResetCredits(currentCredits);
        
        setCredits({
          credits_used: updatedData.credits_used || 0,
          credits_limit: updatedData.credits_limit || 100,
          bonus_credits: updatedData.bonus_credits || 0,
          reset_date: updatedData.reset_date || getNextMidnightUTC(),
          last_reset: updatedData.last_reset || getTodayMidnightUTC()
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
  }, [user, checkAndResetCredits, toast]);

  const loadHistory = useCallback(async () => {
    if (!user) return;
    
    try {
      // Fetch credit history using raw SQL via RPC or direct fetch
      const response = await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/rest/v1/credit_history?user_id=eq.${user.id}&order=created_at.desc&limit=50`,
        {
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setHistory(data as CreditHistory[]);
      }
    } catch (error) {
      console.error('Error loading credit history:', error);
    }
  }, [user]);

  const useCredits = useCallback(async (amount: number, description: string = 'AI interaction') => {
    if (!user) return false;
    
    const totalAvailable = credits.credits_limit - credits.credits_used + credits.bonus_credits;
    if (amount > totalAvailable) {
      toast({
        title: "Insufficient Credits",
        description: "You don't have enough credits. Purchase more to continue.",
        variant: "destructive",
      });
      return false;
    }

    try {
      // First use bonus credits, then daily credits
      let bonusToUse = 0;
      let dailyToUse = amount;
      
      if (credits.bonus_credits > 0) {
        bonusToUse = Math.min(credits.bonus_credits, amount);
        dailyToUse = amount - bonusToUse;
      }

      const { error } = await supabase
        .from('user_credits')
        .update({
          credits_used: credits.credits_used + dailyToUse
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update bonus credits separately if needed
      if (bonusToUse > 0) {
        await fetch(
          `https://nsyobmjpdpvesjwdphlh.supabase.co/rest/v1/user_credits?user_id=eq.${user.id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({ bonus_credits: credits.bonus_credits - bonusToUse })
          }
        );
      }

      // Log the usage
      try {
        await fetch(
          `https://nsyobmjpdpvesjwdphlh.supabase.co/rest/v1/credit_history`,
          {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: user.id,
              credits_amount: -amount,
              action_type: 'usage',
              description
            })
          }
        );
      } catch (e) {
        console.log('Credit history logging skipped');
      }

      setCredits(prev => ({
        ...prev,
        credits_used: prev.credits_used + dailyToUse,
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
      // Update bonus credits via REST API
      const session = await supabase.auth.getSession();
      await fetch(
        `https://nsyobmjpdpvesjwdphlh.supabase.co/rest/v1/user_credits?user_id=eq.${user.id}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ bonus_credits: credits.bonus_credits + amount })
        }
      );

      // Log the purchase
      try {
        await fetch(
          `https://nsyobmjpdpvesjwdphlh.supabase.co/rest/v1/credit_history`,
          {
            method: 'POST',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zeW9ibWpwZHB2ZXNqd2RwaGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1NjM3MjksImV4cCI6MjA2NzEzOTcyOX0.vkV_Xr2T28WA6kiOzcZ3LhzmbkozWNy8Lvx0b7GTgWI',
              'Authorization': `Bearer ${session.data.session?.access_token}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
              user_id: user.id,
              credits_amount: amount,
              action_type: 'purchase',
              description
            })
          }
        );
      } catch (e) {
        console.log('Credit history logging skipped');
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

  // Calculate time until reset
  const getTimeUntilReset = useCallback(() => {
    const now = new Date();
    const resetDate = new Date(credits.reset_date);
    const diff = resetDate.getTime() - now.getTime();
    
    if (diff <= 0) return 'Resetting...';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }, [credits.reset_date]);

  useEffect(() => {
    loadCredits();
    loadHistory();
  }, [user, loadCredits, loadHistory]);

  // Set up real-time subscription for credit changes
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

  const remainingCredits = credits.credits_limit - credits.credits_used + credits.bonus_credits;
  const dailyRemaining = credits.credits_limit - credits.credits_used;
  const usagePercentage = (credits.credits_used / credits.credits_limit) * 100;

  return {
    credits,
    history,
    isLoading,
    refreshCredits,
    useCredits,
    addBonusCredits,
    remainingCredits,
    dailyRemaining,
    usagePercentage,
    getTimeUntilReset
  };
};
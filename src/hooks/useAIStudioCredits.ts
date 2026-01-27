import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  OrgCredits, 
  CreditLedgerEntry, 
  CreditDeductionResult,
  UsageType,
  estimateCreditBurn 
} from '@/types/aiStudioCredits';

interface UseAIStudioCreditsReturn {
  credits: OrgCredits | null;
  isLoading: boolean;
  error: string | null;
  ledger: CreditLedgerEntry[];
  
  // Credit operations
  deductCredits: (
    gptId: string | null,
    tokensUsed: number,
    usageType: UsageType,
    conversationId?: string,
    description?: string
  ) => Promise<CreditDeductionResult>;
  
  checkCredits: (estimatedTokens: number, multiplier?: number) => boolean;
  refreshCredits: () => Promise<void>;
  
  // Computed values
  usagePercentage: number;
  daysUntilReset: number;
  burnRate: number; // credits per day
  estimatedDaysRemaining: number;
}

export function useAIStudioCredits(): UseAIStudioCreditsReturn {
  const { user } = useAuth();
  const [credits, setCredits] = useState<OrgCredits | null>(null);
  const [ledger, setLedger] = useState<CreditLedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch credits
  const fetchCredits = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('org_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        // If no record exists, initialize one
        if (fetchError.code === 'PGRST116') {
          const { data: newData, error: insertError } = await supabase
            .from('org_credits')
            .insert({
              user_id: user.id,
              plan_type: 'free',
              monthly_credit_limit: 1000,
              credits_remaining: 1000,
            })
            .select()
            .single();

          if (insertError) throw insertError;
          setCredits(newData as OrgCredits);
        } else {
          throw fetchError;
        }
      } else {
        setCredits(data as OrgCredits);
      }
    } catch (err) {
      console.error('Error fetching AI Studio credits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credits');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Fetch recent ledger entries
  const fetchLedger = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_credit_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;
      setLedger((data || []) as CreditLedgerEntry[]);
    } catch (err) {
      console.error('Error fetching credit ledger:', err);
    }
  }, [user?.id]);

  // Initial fetch
  useEffect(() => {
    fetchCredits();
    fetchLedger();
  }, [fetchCredits, fetchLedger]);

  // Check if user has enough credits
  const checkCredits = useCallback((estimatedTokens: number, multiplier: number = 1.0): boolean => {
    if (!credits) return false;
    const creditsNeeded = estimateCreditBurn(estimatedTokens, multiplier);
    return credits.credits_remaining >= creditsNeeded || credits.overage_enabled;
  }, [credits]);

  // Deduct credits using the database function
  const deductCredits = useCallback(async (
    gptId: string | null,
    tokensUsed: number,
    usageType: UsageType,
    conversationId?: string,
    description?: string
  ): Promise<CreditDeductionResult> => {
    if (!user?.id) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // Call the database function
      const { data, error: rpcError } = await supabase.rpc('deduct_ai_credits', {
        p_user_id: user.id,
        p_gpt_id: gptId,
        p_tokens: tokensUsed,
        p_usage_type: usageType,
        p_conversation_id: conversationId || null,
        p_description: description || null,
      });

      if (rpcError) throw rpcError;

      // Parse the JSON result from the RPC call
      const result = (typeof data === 'object' && data !== null ? data : {}) as Record<string, unknown>;
      const creditResult: CreditDeductionResult = {
        success: Boolean(result.success),
        credits_used: typeof result.credits_used === 'number' ? result.credits_used : undefined,
        credits_remaining: typeof result.credits_remaining === 'number' ? result.credits_remaining : undefined,
        multiplier: typeof result.multiplier === 'number' ? result.multiplier : undefined,
        error: typeof result.error === 'string' ? result.error : undefined,
      };
      
      if (creditResult.success) {
        // Refresh credits after successful deduction
        await fetchCredits();
        await fetchLedger();
      }

      return creditResult;
    } catch (err) {
      console.error('Error deducting AI Studio credits:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to deduct credits' 
      };
    }
  }, [user?.id, fetchCredits, fetchLedger]);

  // Refresh credits
  const refreshCredits = useCallback(async () => {
    setIsLoading(true);
    await fetchCredits();
    await fetchLedger();
  }, [fetchCredits, fetchLedger]);

  // Computed values
  const usagePercentage = credits 
    ? (credits.credits_used_this_period / credits.monthly_credit_limit) * 100 
    : 0;

  const daysUntilReset = credits 
    ? Math.max(0, Math.ceil((new Date(credits.credit_reset_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Calculate burn rate (credits per day based on last 7 days)
  const burnRate = (() => {
    if (ledger.length === 0) return 0;
    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsage = ledger
      .filter(entry => new Date(entry.created_at) >= sevenDaysAgo)
      .reduce((sum, entry) => sum + entry.credits_used, 0);
    
    return recentUsage / 7;
  })();

  const estimatedDaysRemaining = credits && burnRate > 0
    ? Math.floor(credits.credits_remaining / burnRate)
    : Infinity;

  return {
    credits,
    isLoading,
    error,
    ledger,
    deductCredits,
    checkCredits,
    refreshCredits,
    usagePercentage: Math.min(usagePercentage, 100),
    daysUntilReset,
    burnRate,
    estimatedDaysRemaining,
  };
}

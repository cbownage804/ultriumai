import { supabase } from "@/integrations/supabase/client";
import { CREDIT_COSTS } from "@/types/credits";

export type CreditAction = keyof typeof CREDIT_COSTS;

/**
 * Deduct credits from user account for a specific action
 */
export const deductCredits = async (
  userId: string, 
  action: CreditAction, 
  customAmount?: number
): Promise<{ success: boolean; remainingCredits?: number; error?: string }> => {
  try {
    const creditsToDeduct = customAmount || CREDIT_COSTS[action];
    
    // Get current credits
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('credits_used, credits_limit')
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return { success: false, error: "Failed to fetch current credits" };
    }

    const currentUsed = currentCredits?.credits_used || 0;
    const currentLimit = currentCredits?.credits_limit || 0;
    const newUsed = currentUsed + creditsToDeduct;

    // Check if user has enough credits
    if (newUsed > currentLimit) {
      return { 
        success: false, 
        error: `Insufficient credits. You need ${creditsToDeduct} credits but only have ${currentLimit - currentUsed} remaining.` 
      };
    }

    // Update credits
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({ 
        credits_used: newUsed,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (updateError) {
      return { success: false, error: "Failed to update credits" };
    }

    return { 
      success: true, 
      remainingCredits: currentLimit - newUsed 
    };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error occurred" 
    };
  }
};

/**
 * Check if user has enough credits for an action
 */
export const checkCredits = async (
  userId: string, 
  action: CreditAction, 
  customAmount?: number
): Promise<{ hasEnough: boolean; remaining: number; needed: number }> => {
  try {
    const creditsNeeded = customAmount || CREDIT_COSTS[action];
    
    const { data: currentCredits } = await supabase
      .from('user_credits')
      .select('credits_used, credits_limit')
      .eq('user_id', userId)
      .single();

    const currentUsed = currentCredits?.credits_used || 0;
    const currentLimit = currentCredits?.credits_limit || 0;
    const remaining = currentLimit - currentUsed;

    return {
      hasEnough: remaining >= creditsNeeded,
      remaining: remaining,
      needed: creditsNeeded
    };
  } catch (error) {
    return {
      hasEnough: false,
      remaining: 0,
      needed: customAmount || CREDIT_COSTS[action]
    };
  }
};

/**
 * Get user's current credit status
 */
export const getUserCredits = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_credits')
      .select('credits_used, credits_limit, reset_date')
      .eq('user_id', userId)
      .single();

    if (error) throw error;

    return {
      used: data?.credits_used || 0,
      limit: data?.credits_limit || 0,
      remaining: (data?.credits_limit || 0) - (data?.credits_used || 0),
      resetDate: data?.reset_date
    };
  } catch (error) {
    return {
      used: 0,
      limit: 0,
      remaining: 0,
      resetDate: null
    };
  }
};
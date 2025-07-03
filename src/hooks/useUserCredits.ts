import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

export interface UserCredits {
  credits_used: number;
  credits_limit: number;
  reset_date: string;
}

export const useUserCredits = () => {
  const [credits, setCredits] = useState<UserCredits>({
    credits_used: 0,
    credits_limit: 100,
    reset_date: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, session } = useAuth();

  const loadCredits = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Try to get existing credits record
      let { data, error } = await supabase
        .from('user_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // No record found, create one
        const { data: newData, error: insertError } = await supabase
          .from('user_credits')
          .insert({
            user_id: user.id,
            credits_used: 0,
            credits_limit: 100,
            reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        data = newData;
      } else if (error) {
        throw error;
      }

      if (data) {
        setCredits({
          credits_used: data.credits_used,
          credits_limit: data.credits_limit,
          reset_date: data.reset_date
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
  };

  const refreshCredits = () => {
    loadCredits();
  };

  useEffect(() => {
    loadCredits();
  }, [user]);

  return {
    credits,
    isLoading,
    refreshCredits,
    remainingCredits: credits.credits_limit - credits.credits_used,
    usagePercentage: (credits.credits_used / credits.credits_limit) * 100
  };
};
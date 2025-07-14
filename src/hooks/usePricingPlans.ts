import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PricingPlan {
  id: string;
  name: string;
  category: string;
  monthly_price: number;
  onboarding_fee: number | null;
  features: any;
  limits: any;
  created_at: string;
}

export const usePricingPlans = (category?: string) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        let query = supabase
          .from('pricing_plans')
          .select('*')
          .order('monthly_price', { ascending: true });

        if (category) {
          query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;
        setPlans((data || []) as PricingPlan[]);
      } catch (error) {
        console.error('Error fetching pricing plans:', error);
        toast({
          title: "Error",
          description: "Failed to load pricing plans",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, [category, toast]);

  const createOneTimePayment = async (planId: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('create-one-time-payment', {
        body: { 
          planId,
          metadata,
          successUrl: `${window.location.origin}/payment/success?type=onetime`,
          cancelUrl: `${window.location.origin}/payment/cancel?type=onetime`,
        },
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating one-time payment:', error);
      throw error;
    }
  };

  return {
    plans,
    loading,
    createOneTimePayment,
  };
};
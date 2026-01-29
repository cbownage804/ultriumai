import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SubscriptionItem {
  id: string;
  product: string;
  productName: string;
  tier: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  number: string | null;
  status: 'paid' | 'open' | 'draft' | 'uncollectible' | 'void';
  amount: number;
  currency: string;
  date: string;
  pdfUrl: string | null;
  description: string | null;
}

export interface UsageMetric {
  name: string;
  used: number;
  limit: number | null;
  unit: string;
  product: string;
}

export interface BillingData {
  subscriptions: SubscriptionItem[];
  invoices: Invoice[];
  usage: UsageMetric[];
  totalMRR: number;
  loading: boolean;
  error: string | null;
}

export const useBillingData = () => {
  const { user } = useAuth();
  const [data, setData] = useState<BillingData>({
    subscriptions: [],
    invoices: [],
    usage: [],
    totalMRR: 0,
    loading: true,
    error: null,
  });

  const fetchBillingData = useCallback(async () => {
    if (!user) {
      setData({
        subscriptions: [],
        invoices: [],
        usage: [],
        totalMRR: 0,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setData(prev => ({ ...prev, loading: true, error: null }));

      // Fetch billing data from edge function
      const { data: billingData, error: billingError } = await supabase.functions.invoke('get-billing-data');

      if (billingError) {
        throw new Error(billingError.message);
      }

      // Calculate total MRR
      const totalMRR = (billingData?.subscriptions || []).reduce((sum: number, sub: SubscriptionItem) => {
        if (sub.status === 'active' || sub.status === 'trialing') {
          const monthlyAmount = sub.interval === 'year' ? sub.amount / 12 : sub.amount;
          return sum + monthlyAmount;
        }
        return sum;
      }, 0);

      setData({
        subscriptions: billingData?.subscriptions || [],
        invoices: billingData?.invoices || [],
        usage: billingData?.usage || [],
        totalMRR,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Error fetching billing data:', error);
      setData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to load billing data',
      }));
    }
  }, [user]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  return {
    ...data,
    refreshBillingData: fetchBillingData,
  };
};

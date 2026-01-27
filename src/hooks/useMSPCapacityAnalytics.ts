/**
 * MSP Client-Level Capacity Analytics Hook
 * Admin-only: Fetches AI capacity consumption per client for MSP reporting
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface ClientCapacityUsage {
  client_id: string;
  client_name: string;
  total_credits: number;
  total_requests: number;
  avg_credits_per_request: number;
  last_usage: string | null;
  capacity_allocation: number;
  usage_percentage: number;
}

export interface MSPCapacitySummary {
  total_clients: number;
  total_capacity_used: number;
  total_capacity_allocated: number;
  usage_percentage: number;
  most_active_client: string | null;
  least_active_client: string | null;
}

export interface UseMSPCapacityAnalyticsReturn {
  isLoading: boolean;
  error: string | null;
  clientUsage: ClientCapacityUsage[];
  summary: MSPCapacitySummary;
  refreshAnalytics: () => Promise<void>;
  dateRange: number;
  setDateRange: (days: number) => void;
}

export function useMSPCapacityAnalytics(): UseMSPCapacityAnalyticsReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30);
  
  const [clientUsage, setClientUsage] = useState<ClientCapacityUsage[]>([]);
  const [summary, setSummary] = useState<MSPCapacitySummary>({
    total_clients: 0,
    total_capacity_used: 0,
    total_capacity_allocated: 0,
    usage_percentage: 0,
    most_active_client: null,
    least_active_client: null,
  });

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString();

      // Fetch MSP clients
      const { data: clients, error: clientsError } = await supabase
        .from('msp_clients')
        .select('id, company_name, is_active, monthly_rate')
        .eq('msp_id', user.id);

      if (clientsError) throw clientsError;

      // Fetch all ledger entries for this MSP's usage
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ai_credit_ledger')
        .select('id, credits_used, gpt_id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', startDateStr);

      if (ledgerError) throw ledgerError;

      // Build a mapping of GPTs to clients via integration_settings metadata
      // GPTs may store client assignment in integration_settings
      const { data: gpts } = await supabase
        .from('custom_gpts')
        .select('id, name, integration_settings')
        .eq('user_id', user.id);

      const gptClientMap = new Map<string, string>();
      (gpts || []).forEach(gpt => {
        // Check if GPT has client_id in integration_settings
        const settings = gpt.integration_settings as { msp_client_id?: string } | null;
        if (settings?.msp_client_id) {
          gptClientMap.set(gpt.id, settings.msp_client_id);
        }
      });

      // Aggregate usage by client
      const clientUsageMap = new Map<string, { credits: number; requests: number; lastUsage: string | null }>();
      
      // Initialize all clients
      (clients || []).forEach(client => {
        clientUsageMap.set(client.id, { credits: 0, requests: 0, lastUsage: null });
      });

      // Sum up usage from ledger
      (ledgerData || []).forEach(entry => {
        const clientId = entry.gpt_id ? gptClientMap.get(entry.gpt_id) : null;
        
        // If we can map to a client, add to their usage
        if (clientId && clientUsageMap.has(clientId)) {
          const current = clientUsageMap.get(clientId)!;
          current.credits += Number(entry.credits_used) || 0;
          current.requests += 1;
          if (!current.lastUsage || new Date(entry.created_at) > new Date(current.lastUsage)) {
            current.lastUsage = entry.created_at;
          }
        }
      });

      // Calculate total capacity based on subscription
      // Using MSP plans from the directive: MSP Starter 40k, Pro 150k, Elite 350k, Platform Pro 600k
      const { data: subscriber } = await supabase
        .from('subscribers')
        .select('subscription_tier')
        .eq('user_id', user.id)
        .single();

      const tierCapacity: Record<string, number> = {
        'msp_starter': 40000,
        'msp_pro': 150000,
        'msp_elite': 350000,
        'platform_pro': 600000,
        'free': 1000,
        'starter': 15000,
        'professional': 75000,
        'enterprise': 350000,
      };

      const totalCapacity = tierCapacity[subscriber?.subscription_tier || 'free'] || 40000;
      const capacityPerClient = (clients?.length || 1) > 0 
        ? Math.floor(totalCapacity / (clients?.length || 1)) 
        : totalCapacity;

      // Build client usage array
      const usageArray: ClientCapacityUsage[] = (clients || []).map(client => {
        const usage = clientUsageMap.get(client.id) || { credits: 0, requests: 0, lastUsage: null };
        return {
          client_id: client.id,
          client_name: client.company_name,
          total_credits: usage.credits,
          total_requests: usage.requests,
          avg_credits_per_request: usage.requests > 0 ? usage.credits / usage.requests : 0,
          last_usage: usage.lastUsage,
          capacity_allocation: capacityPerClient,
          usage_percentage: capacityPerClient > 0 ? (usage.credits / capacityPerClient) * 100 : 0,
        };
      }).sort((a, b) => b.total_credits - a.total_credits);

      // Calculate summary
      const totalUsed = usageArray.reduce((sum, c) => sum + c.total_credits, 0);
      const mostActive = usageArray.length > 0 ? usageArray[0] : null;
      const leastActive = usageArray.length > 0 ? usageArray[usageArray.length - 1] : null;

      setClientUsage(usageArray);
      setSummary({
        total_clients: clients?.length || 0,
        total_capacity_used: totalUsed,
        total_capacity_allocated: totalCapacity,
        usage_percentage: totalCapacity > 0 ? (totalUsed / totalCapacity) * 100 : 0,
        most_active_client: mostActive?.client_name || null,
        least_active_client: leastActive?.client_name || null,
      });

    } catch (err) {
      console.error('Error fetching MSP capacity analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    isLoading,
    error,
    clientUsage,
    summary,
    refreshAnalytics: fetchAnalytics,
    dateRange,
    setDateRange,
  };
}

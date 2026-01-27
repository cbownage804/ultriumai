import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UsageType } from '@/types/aiStudioCredits';

// Analytics data structures - admin only
export interface DailyUsage {
  date: string;
  credits: number;
  tokens: number;
  requests: number;
}

export interface GPTUsageBreakdown {
  gpt_id: string;
  gpt_name: string;
  total_credits: number;
  total_tokens: number;
  request_count: number;
  percentage: number;
}

export interface UsageByType {
  usage_type: UsageType;
  total_credits: number;
  request_count: number;
  percentage: number;
}

export interface CapacityAnalyticsSummary {
  totalCreditsUsed: number;
  totalTokensProcessed: number;
  totalRequests: number;
  avgCreditsPerRequest: number;
  avgTokensPerRequest: number;
  peakUsageDay: string | null;
  peakUsageCredits: number;
}

export interface UseAICapacityAnalyticsReturn {
  isLoading: boolean;
  error: string | null;
  
  // Time-series data
  dailyUsage: DailyUsage[];
  
  // Breakdowns
  usageByGPT: GPTUsageBreakdown[];
  usageByType: UsageByType[];
  
  // Summary stats
  summary: CapacityAnalyticsSummary;
  
  // Actions
  refreshAnalytics: () => Promise<void>;
  setDateRange: (days: number) => void;
  dateRange: number;
}

export function useAICapacityAnalytics(): UseAICapacityAnalyticsReturn {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState(30); // Default 30 days
  
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [usageByGPT, setUsageByGPT] = useState<GPTUsageBreakdown[]>([]);
  const [usageByType, setUsageByType] = useState<UsageByType[]>([]);
  const [summary, setSummary] = useState<CapacityAnalyticsSummary>({
    totalCreditsUsed: 0,
    totalTokensProcessed: 0,
    totalRequests: 0,
    avgCreditsPerRequest: 0,
    avgTokensPerRequest: 0,
    peakUsageDay: null,
    peakUsageCredits: 0,
  });

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);
      const startDateStr = startDate.toISOString();

      // Fetch ledger entries for the date range
      const { data: ledgerData, error: ledgerError } = await supabase
        .from('ai_credit_ledger')
        .select(`
          id,
          credits_used,
          tokens_used,
          usage_type,
          gpt_id,
          created_at
        `)
        .eq('user_id', user.id)
        .gte('created_at', startDateStr)
        .order('created_at', { ascending: true });

      if (ledgerError) throw ledgerError;

      // Fetch GPT names for the breakdown
      const gptIds = [...new Set((ledgerData || []).map(l => l.gpt_id).filter(Boolean))];
      let gptNames: Record<string, string> = {};
      
      if (gptIds.length > 0) {
        const { data: gptData } = await supabase
          .from('custom_gpts')
          .select('id, name')
          .in('id', gptIds);
        
        gptNames = (gptData || []).reduce((acc, gpt) => {
          acc[gpt.id] = gpt.name;
          return acc;
        }, {} as Record<string, string>);
      }

      // Process daily usage
      const dailyMap = new Map<string, DailyUsage>();
      let totalCredits = 0;
      let totalTokens = 0;
      let totalRequests = 0;
      let peakDay: string | null = null;
      let peakCredits = 0;

      (ledgerData || []).forEach(entry => {
        const date = new Date(entry.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(date) || { date, credits: 0, tokens: 0, requests: 0 };
        
        const credits = Number(entry.credits_used) || 0;
        const tokens = entry.tokens_used || 0;
        
        existing.credits += credits;
        existing.tokens += tokens;
        existing.requests += 1;
        
        dailyMap.set(date, existing);
        
        totalCredits += credits;
        totalTokens += tokens;
        totalRequests += 1;
      });

      // Find peak day
      dailyMap.forEach((data, date) => {
        if (data.credits > peakCredits) {
          peakCredits = data.credits;
          peakDay = date;
        }
      });

      // Process usage by GPT
      const gptMap = new Map<string, { credits: number; tokens: number; requests: number }>();
      (ledgerData || []).forEach(entry => {
        const gptId = entry.gpt_id || 'unknown';
        const existing = gptMap.get(gptId) || { credits: 0, tokens: 0, requests: 0 };
        
        existing.credits += Number(entry.credits_used) || 0;
        existing.tokens += entry.tokens_used || 0;
        existing.requests += 1;
        
        gptMap.set(gptId, existing);
      });

      const gptBreakdown: GPTUsageBreakdown[] = Array.from(gptMap.entries())
        .map(([gptId, data]) => ({
          gpt_id: gptId,
          gpt_name: gptNames[gptId] || 'Unknown Assistant',
          total_credits: data.credits,
          total_tokens: data.tokens,
          request_count: data.requests,
          percentage: totalCredits > 0 ? (data.credits / totalCredits) * 100 : 0,
        }))
        .sort((a, b) => b.total_credits - a.total_credits);

      // Process usage by type
      const typeMap = new Map<string, { credits: number; requests: number }>();
      (ledgerData || []).forEach(entry => {
        const type = entry.usage_type || 'chat';
        const existing = typeMap.get(type) || { credits: 0, requests: 0 };
        
        existing.credits += Number(entry.credits_used) || 0;
        existing.requests += 1;
        
        typeMap.set(type, existing);
      });

      const typeBreakdown: UsageByType[] = Array.from(typeMap.entries())
        .map(([type, data]) => ({
          usage_type: type as UsageType,
          total_credits: data.credits,
          request_count: data.requests,
          percentage: totalCredits > 0 ? (data.credits / totalCredits) * 100 : 0,
        }))
        .sort((a, b) => b.total_credits - a.total_credits);

      // Set all state
      setDailyUsage(Array.from(dailyMap.values()));
      setUsageByGPT(gptBreakdown);
      setUsageByType(typeBreakdown);
      setSummary({
        totalCreditsUsed: totalCredits,
        totalTokensProcessed: totalTokens,
        totalRequests,
        avgCreditsPerRequest: totalRequests > 0 ? totalCredits / totalRequests : 0,
        avgTokensPerRequest: totalRequests > 0 ? totalTokens / totalRequests : 0,
        peakUsageDay: peakDay,
        peakUsageCredits: peakCredits,
      });

    } catch (err) {
      console.error('Error fetching AI capacity analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, dateRange]);

  // Initial fetch
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return {
    isLoading,
    error,
    dailyUsage,
    usageByGPT,
    usageByType,
    summary,
    refreshAnalytics: fetchAnalytics,
    setDateRange,
    dateRange,
  };
}

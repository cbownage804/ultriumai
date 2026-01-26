import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface AnalyticsData {
  day: string;
  messages: number;
  tokens: number;
  responseTime: number;
  sessions: number;
}

export interface AnalyticsStats {
  totalMessages: number;
  avgResponseTime: number;
  totalTokens: number;
  totalSessions: number;
  messageGrowth: number;
  responseTimeChange: number;
}

interface GPTAnalyticsInsert {
  gpt_id: string;
  user_id: string;
  interaction_type: string;
  tokens_used?: number | null;
  response_time_ms?: number | null;
  session_id?: string | null;
  metadata?: Record<string, unknown> | null;
}

export const useGPTAnalytics = (gptId?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Track a message event
  const trackMessage = useCallback(async (
    tokensUsed: number,
    responseTimeMs: number,
    sessionId?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!user || !gptId) return;

    try {
      const insertData: GPTAnalyticsInsert = {
        gpt_id: gptId,
        user_id: user.id,
        interaction_type: 'message',
        tokens_used: tokensUsed,
        response_time_ms: responseTimeMs,
        session_id: sessionId || null,
        metadata: metadata || {}
      };

      await (supabase
        .from('gpt_analytics') as any)
        .insert(insertData);
    } catch (error) {
      console.error('Error tracking message analytics:', error);
    }
  }, [user, gptId]);

  // Track session start
  const trackSessionStart = useCallback(async (sessionId?: string) => {
    if (!user || !gptId) return;

    try {
      const insertData: GPTAnalyticsInsert = {
        gpt_id: gptId,
        user_id: user.id,
        interaction_type: 'session_start',
        session_id: sessionId || null,
        metadata: { started_at: new Date().toISOString() }
      };

      await (supabase
        .from('gpt_analytics') as any)
        .insert(insertData);
    } catch (error) {
      console.error('Error tracking session start:', error);
    }
  }, [user, gptId]);

  // Track session end
  const trackSessionEnd = useCallback(async (sessionId?: string) => {
    if (!user || !gptId) return;

    try {
      const insertData: GPTAnalyticsInsert = {
        gpt_id: gptId,
        user_id: user.id,
        interaction_type: 'session_end',
        session_id: sessionId || null,
        metadata: { ended_at: new Date().toISOString() }
      };

      await (supabase
        .from('gpt_analytics') as any)
        .insert(insertData);
    } catch (error) {
      console.error('Error tracking session end:', error);
    }
  }, [user, gptId]);

  // Fetch analytics data for a time range
  const fetchAnalytics = useCallback(async (days: number = 7): Promise<{
    data: AnalyticsData[];
    stats: AnalyticsStats;
  }> => {
    if (!user || !gptId) {
      return {
        data: [],
        stats: {
          totalMessages: 0,
          avgResponseTime: 0,
          totalTokens: 0,
          totalSessions: 0,
          messageGrowth: 0,
          responseTimeChange: 0
        }
      };
    }

    setIsLoading(true);

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: analyticsData, error } = await supabase
        .from('gpt_analytics')
        .select('*')
        .eq('gpt_id', gptId)
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dayMap = new Map<string, AnalyticsData>();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Initialize empty days
      for (let i = 0; i < Math.min(days, 7); i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = dayNames[date.getDay()];
        dayMap.set(dayName, {
          day: dayName,
          messages: 0,
          tokens: 0,
          responseTime: 0,
          sessions: 0
        });
      }

      // Aggregate analytics
      let totalMessages = 0;
      let totalTokens = 0;
      let totalResponseTime = 0;
      let totalSessions = 0;
      let messageCount = 0;

      analyticsData?.forEach(event => {
        const date = new Date(event.created_at);
        const dayName = dayNames[date.getDay()];
        const existing = dayMap.get(dayName) || {
          day: dayName,
          messages: 0,
          tokens: 0,
          responseTime: 0,
          sessions: 0
        };

        if (event.interaction_type === 'message') {
          existing.messages++;
          existing.tokens += event.tokens_used || 0;
          existing.responseTime += event.response_time_ms || 0;
          totalMessages++;
          totalTokens += event.tokens_used || 0;
          totalResponseTime += event.response_time_ms || 0;
          messageCount++;
        } else if (event.interaction_type === 'session_start') {
          existing.sessions++;
          totalSessions++;
        }

        dayMap.set(dayName, existing);
      });

      // Calculate averages
      dayMap.forEach((value, key) => {
        if (value.messages > 0) {
          value.responseTime = Math.round(value.responseTime / value.messages);
        }
        dayMap.set(key, value);
      });

      const data = Array.from(dayMap.values()).reverse();
      const avgResponseTime = messageCount > 0 ? Math.round(totalResponseTime / messageCount) : 0;

      return {
        data,
        stats: {
          totalMessages,
          avgResponseTime,
          totalTokens,
          totalSessions,
          messageGrowth: 0,
          responseTimeChange: 0
        }
      };
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return {
        data: [],
        stats: {
          totalMessages: 0,
          avgResponseTime: 0,
          totalTokens: 0,
          totalSessions: 0,
          messageGrowth: 0,
          responseTimeChange: 0
        }
      };
    } finally {
      setIsLoading(false);
    }
  }, [user, gptId]);

  return {
    isLoading,
    trackMessage,
    trackSessionStart,
    trackSessionEnd,
    fetchAnalytics
  };
};

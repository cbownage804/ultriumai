import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface AnalyticsEvent {
  gptId: string;
  interactionType: 'message' | 'file_upload' | 'export' | 'share' | 'rating';
  responseTimeMs?: number;
  tokensUsed?: number;
  satisfactionRating?: number;
  metadata?: Record<string, any>;
  sessionId?: string;
}

export const useAnalyticsTracking = () => {
  const { user } = useAuth();

  const trackEvent = useCallback(async (event: AnalyticsEvent) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('gpt_analytics')
        .insert({
          gpt_id: event.gptId,
          user_id: user.id,
          session_id: event.sessionId,
          interaction_type: event.interactionType,
          response_time_ms: event.responseTimeMs,
          tokens_used: event.tokensUsed,
          satisfaction_rating: event.satisfactionRating,
          metadata: event.metadata || {}
        });

      if (error) {
        console.error('Analytics tracking error:', error);
      }
    } catch (error) {
      console.error('Failed to track analytics:', error);
    }
  }, [user]);

  const startSession = useCallback(async (gptId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          gpt_id: gptId,
          user_agent: navigator.userAgent
        })
        .select('id')
        .single();

      if (error) {
        console.error('Session start error:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Failed to start session:', error);
      return null;
    }
  }, [user]);

  const endSession = useCallback(async (sessionId: string, totalMessages: number, totalTokens?: number) => {
    try {
      const { error } = await supabase
        .from('user_sessions')
        .update({
          session_end: new Date().toISOString(),
          total_messages: totalMessages,
          total_tokens: totalTokens || 0
        })
        .eq('id', sessionId);

      if (error) {
        console.error('Session end error:', error);
      }
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }, []);

  const trackMessageExchange = useCallback(async (
    gptId: string, 
    responseTimeMs: number, 
    tokensUsed?: number,
    sessionId?: string
  ) => {
    await trackEvent({
      gptId,
      interactionType: 'message',
      responseTimeMs,
      tokensUsed,
      sessionId
    });
  }, [trackEvent]);

  const trackFileUpload = useCallback(async (
    gptId: string, 
    fileName: string, 
    fileSize: number,
    sessionId?: string
  ) => {
    await trackEvent({
      gptId,
      interactionType: 'file_upload',
      metadata: { fileName, fileSize },
      sessionId
    });
  }, [trackEvent]);

  const trackSatisfactionRating = useCallback(async (
    gptId: string, 
    rating: number,
    sessionId?: string
  ) => {
    await trackEvent({
      gptId,
      interactionType: 'rating',
      satisfactionRating: rating,
      sessionId
    });
  }, [trackEvent]);

  const trackExport = useCallback(async (
    gptId: string, 
    exportType: string,
    sessionId?: string
  ) => {
    await trackEvent({
      gptId,
      interactionType: 'export',
      metadata: { exportType },
      sessionId
    });
  }, [trackEvent]);

  const trackShare = useCallback(async (
    gptId: string, 
    shareMethod: string,
    sessionId?: string
  ) => {
    await trackEvent({
      gptId,
      interactionType: 'share',
      metadata: { shareMethod },
      sessionId
    });
  }, [trackEvent]);

  return {
    trackEvent,
    startSession,
    endSession,
    trackMessageExchange,
    trackFileUpload,
    trackSatisfactionRating,
    trackExport,
    trackShare
  };
};
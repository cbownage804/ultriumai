/**
 * Hook for AI-powered ticket analysis
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface TicketAIAnalysis {
  id: string;
  ticket_id: string;
  suggested_category: string;
  category_confidence: number;
  suggested_priority: string;
  priority_confidence: number;
  priority_factors: {
    urgency_keywords: string[];
    impact_indicators: string[];
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'frustrated' | 'urgent';
  sentiment_score: number;
  escalation_recommended: boolean;
  estimated_resolution_hours: number;
  suggested_responses: Array<{
    response: string;
    confidence: number;
    source: 'canned' | 'kb' | 'ai';
  }>;
  similar_ticket_ids: string[];
  suggested_kb_articles: string[];
  processed_at: string;
}

export function useTicketAI() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<TicketAIAnalysis | null>(null);

  const analyzeTicket = useCallback(async (ticketId: string, title: string, description: string) => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-ticket-analyzer', {
        body: { ticket_id: ticketId, title, description }
      });

      if (error) throw error;

      if (data.analysis) {
        setAnalysis({
          id: data.id || ticketId,
          ticket_id: ticketId,
          ...data.analysis,
          processed_at: new Date().toISOString()
        });
        return data.analysis;
      }
    } catch (err: any) {
      console.error('AI analysis failed:', err);
      if (err.message?.includes('429')) {
        toast.error('AI rate limit exceeded. Please try again in a moment.');
      } else if (err.message?.includes('402')) {
        toast.error('AI credits depleted. Please add funds to continue.');
      } else {
        toast.error('AI analysis failed');
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const fetchExistingAnalysis = useCallback(async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_ai_analysis')
        .select('*')
        .eq('ticket_id', ticketId)
        .single();

      if (!error && data) {
        setAnalysis(data as unknown as TicketAIAnalysis);
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch existing analysis:', err);
    }
    return null;
  }, []);

  const applySuggestion = useCallback(async (
    ticketId: string, 
    field: 'category' | 'priority',
    value: string
  ) => {
    try {
      const updateData: Record<string, string> = {};
      if (field === 'category') {
        updateData.category = value;
      } else if (field === 'priority') {
        updateData.priority = value;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;
      toast.success(`Applied AI-suggested ${field}`);
      return true;
    } catch (err) {
      console.error('Failed to apply suggestion:', err);
      toast.error('Failed to apply suggestion');
      return false;
    }
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-500';
      case 'neutral': return 'text-gray-500';
      case 'negative': return 'text-orange-500';
      case 'frustrated': return 'text-red-500';
      case 'urgent': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'neutral': return '😐';
      case 'negative': return '😟';
      case 'frustrated': return '😤';
      case 'urgent': return '🚨';
      default: return '❓';
    }
  };

  return {
    isAnalyzing,
    analysis,
    analyzeTicket,
    fetchExistingAnalysis,
    applySuggestion,
    getSentimentColor,
    getSentimentIcon
  };
}

/**
 * Hook for Canned Responses
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface CannedResponse {
  id: string;
  name: string;
  content: string;
  category?: string;
  tags?: string[];
  shortcut?: string;
  use_count: number;
  is_active: boolean;
  created_at: string;
}

export function useCannedResponses() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<CannedResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchResponses = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('canned_responses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('use_count', { ascending: false });

      if (error) throw error;
      setResponses((data || []) as CannedResponse[]);
    } catch (err) {
      console.error('Failed to fetch canned responses:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createResponse = useCallback(async (response: Omit<CannedResponse, 'id' | 'use_count' | 'is_active' | 'created_at'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('canned_responses')
        .insert({
          user_id: user.id,
          name: response.name,
          content: response.content,
          category: response.category,
          tags: response.tags || [],
          shortcut: response.shortcut,
          is_active: true,
          use_count: 0
        })
        .select()
        .single();

      if (error) throw error;
      toast.success('Canned response created');
      await fetchResponses();
      return data;
    } catch (err: any) {
      if (err.message?.includes('duplicate')) {
        toast.error('Shortcut already exists');
      } else {
        toast.error('Failed to create response');
      }
      return null;
    }
  }, [user, fetchResponses]);

  const useResponse = useCallback(async (id: string): Promise<string | null> => {
    try {
      const response = responses.find(r => r.id === id);
      if (!response) return null;

      // Increment use count
      await supabase
        .from('canned_responses')
        .update({ use_count: response.use_count + 1 })
        .eq('id', id);

      return response.content;
    } catch (err) {
      console.error('Failed to use response:', err);
      return null;
    }
  }, [responses]);

  const findByShortcut = useCallback((shortcut: string): CannedResponse | undefined => {
    return responses.find(r => r.shortcut === shortcut);
  }, [responses]);

  const searchResponses = useCallback((query: string): CannedResponse[] => {
    if (!query.trim()) return responses;
    const lower = query.toLowerCase();
    return responses.filter(r => 
      r.name.toLowerCase().includes(lower) ||
      r.content.toLowerCase().includes(lower) ||
      r.category?.toLowerCase().includes(lower) ||
      r.tags?.some(t => t.toLowerCase().includes(lower))
    );
  }, [responses]);

  const deleteResponse = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('canned_responses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setResponses(prev => prev.filter(r => r.id !== id));
      toast.success('Response deleted');
      return true;
    } catch (err) {
      toast.error('Failed to delete response');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchResponses();
  }, [fetchResponses]);

  return {
    responses,
    isLoading,
    fetchResponses,
    createResponse,
    useResponse,
    findByShortcut,
    searchResponses,
    deleteResponse
  };
}

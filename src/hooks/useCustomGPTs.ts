import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { Tables } from "@/integrations/supabase/types";

export type CustomGPT = Tables<'custom_gpts'>;

export const useCustomGPTs = () => {
  const [gpts, setGPTs] = useState<CustomGPT[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const getGPTLimits = () => {
    return { maxGPTs: -1, maxPromptLength: 50000, exportFormats: ['copy', 'pdf', 'docx', 'email'] as const }; // unlimited - credits are the only gate
  };

  const loadGPTs = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('custom_gpts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGPTs(data || []);
    } catch (error) {
      console.error('Error loading GPTs:', error);
      toast({
        title: "Error",
        description: "Failed to load your custom GPTs.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createGPT = async (gptData: {
    name: string;
    description: string;
    system_prompt: string;
    avatar_url?: string;
    starter_questions?: string[];
    preferred_model?: string;
    enable_web_search?: boolean;
    theme_color?: string;
    placeholder_prompt?: string;
    category?: string;
    template_id?: string;
    features?: string[];
  }) => {
    if (!user) return null;

    const limits = getGPTLimits();
    
    // Check limits
    if (limits.maxGPTs !== -1 && gpts.length >= limits.maxGPTs) {
      toast({
        title: "Limit reached",
        description: `You can only create ${limits.maxGPTs} GPT${limits.maxGPTs > 1 ? 's' : ''} on your current plan.`,
        variant: "destructive",
      });
      return null;
    }

    if (gptData.system_prompt.length > limits.maxPromptLength) {
      toast({
        title: "Prompt too long",
        description: `System prompt must be under ${limits.maxPromptLength} characters for your plan.`,
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('custom_gpts')
        .insert({
          user_id: user.id,
          name: gptData.name,
          description: gptData.description,
          system_prompt: gptData.system_prompt,
          avatar_url: gptData.avatar_url,
          starter_questions: gptData.starter_questions,
          preferred_model: gptData.preferred_model,
          enable_web_search: gptData.enable_web_search,
          theme_color: gptData.theme_color,
          placeholder_prompt: gptData.placeholder_prompt,
          category: gptData.category,
          template_id: gptData.template_id,
          features: gptData.features
        })
        .select()
        .single();

      if (error) throw error;

      setGPTs(prev => [data, ...prev]);
      toast({
        title: "GPT created",
        description: `${gptData.name} has been created successfully.`,
      });

      return data;
    } catch (error) {
      console.error('Error creating GPT:', error);
      toast({
        title: "Error",
        description: "Failed to create GPT. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateGPT = async (id: string, updates: Partial<CustomGPT>) => {
    try {
      const { data, error } = await supabase
        .from('custom_gpts')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user?.id)
        .select()
        .single();

      if (error) throw error;

      setGPTs(prev => prev.map(gpt => gpt.id === id ? data : gpt));
      toast({
        title: "GPT updated",
        description: "Your GPT has been updated successfully.",
      });

      return data;
    } catch (error) {
      console.error('Error updating GPT:', error);
      toast({
        title: "Error",
        description: "Failed to update GPT. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteGPT = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_gpts')
        .delete()
        .eq('id', id)
        .eq('user_id', user?.id);

      if (error) throw error;

      setGPTs(prev => prev.filter(gpt => gpt.id !== id));
      toast({
        title: "GPT deleted",
        description: "Your GPT has been deleted successfully.",
      });

      return true;
    } catch (error) {
      console.error('Error deleting GPT:', error);
      toast({
        title: "Error",
        description: "Failed to delete GPT. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    loadGPTs();
  }, [user]);

  const limits = getGPTLimits();

  return {
    gpts,
    isLoading,
    loadGPTs,
    createGPT,
    updateGPT,
    deleteGPT,
    canCreateMore: limits.maxGPTs === -1 || gpts.length < limits.maxGPTs,
    limits
  };
};
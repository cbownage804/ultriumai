import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AIProvider, AIProviderKey, AI_PROVIDERS, getModelsByProvider } from "@/types/aiProviders";

export const useUserAIProviders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [providerKeys, setProviderKeys] = useState<AIProviderKey[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProviderKeys = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_ai_provider_keys' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProviderKeys((data as unknown as AIProviderKey[]) || []);
    } catch (error) {
      console.error('Error loading provider keys:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProviderKeys();
    }
  }, [user, loadProviderKeys]);

  const addProviderKey = async (provider: AIProvider, apiKey: string): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      
      // Create a simple hash (in production, use proper hashing)
      const encoder = new TextEncoder();
      const data = encoder.encode(apiKey);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      // Extract prefix and suffix for display
      const keyPrefix = apiKey.substring(0, Math.min(8, apiKey.length));
      const keySuffix = apiKey.substring(Math.max(0, apiKey.length - 4));

      const { error } = await supabase
        .from('user_ai_provider_keys' as any)
        .upsert({
          user_id: user.id,
          provider,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          key_suffix: keySuffix,
          is_active: true,
          is_valid: true,
          last_validated_at: new Date().toISOString()
        }, { onConflict: 'user_id,provider' });

      if (error) throw error;

      // Store the actual key in localStorage (encrypted in production)
      const storedKeys = JSON.parse(localStorage.getItem('user_ai_keys') || '{}');
      storedKeys[provider] = apiKey;
      localStorage.setItem('user_ai_keys', JSON.stringify(storedKeys));

      toast({
        title: "API Key Added",
        description: `Your ${AI_PROVIDERS.find(p => p.id === provider)?.name} API key has been saved.`,
      });

      await loadProviderKeys();
      return true;
    } catch (error) {
      console.error('Error adding provider key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removeProviderKey = async (provider: AIProvider): Promise<boolean> => {
    if (!user) return false;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('user_ai_provider_keys' as any)
        .delete()
        .eq('user_id', user.id)
        .eq('provider', provider);

      if (error) throw error;

      // Remove from localStorage
      const storedKeys = JSON.parse(localStorage.getItem('user_ai_keys') || '{}');
      delete storedKeys[provider];
      localStorage.setItem('user_ai_keys', JSON.stringify(storedKeys));

      toast({
        title: "API Key Removed",
        description: `Your ${AI_PROVIDERS.find(p => p.id === provider)?.name} API key has been removed.`,
      });

      await loadProviderKeys();
      return true;
    } catch (error) {
      console.error('Error removing provider key:', error);
      toast({
        title: "Error",
        description: "Failed to remove API key.",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const hasProviderKey = (provider: AIProvider): boolean => {
    return providerKeys.some(k => k.provider === provider && k.is_active);
  };

  const getAvailableModels = () => {
    // Always include OpenAI models (system default)
    const models = [...(AI_PROVIDERS.find(p => p.id === 'openai')?.models || [])];
    
    // Add models from providers the user has keys for
    providerKeys
      .filter(k => k.is_active && k.provider !== 'openai')
      .forEach(key => {
        models.push(...getModelsByProvider(key.provider));
      });

    return models;
  };

  const getProviderApiKey = (provider: AIProvider): string | null => {
    const storedKeys = JSON.parse(localStorage.getItem('user_ai_keys') || '{}');
    return storedKeys[provider] || null;
  };

  return {
    providerKeys,
    loading,
    addProviderKey,
    removeProviderKey,
    hasProviderKey,
    getAvailableModels,
    getProviderApiKey,
    refreshKeys: loadProviderKeys
  };
};

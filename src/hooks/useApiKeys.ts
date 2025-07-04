import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ApiKey, CreateApiKeyRequest } from "@/types/apiKeys";

export const useApiKeys = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadApiKeys();
    }
  }, [user]);

  const loadApiKeys = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('api_keys' as any)
        .select(`
          *,
          custom_gpts!api_keys_gpt_id_fkey (
            id,
            name
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys((data as unknown as ApiKey[]) || []);
    } catch (error) {
      console.error('Error loading API keys:', error);
      toast({
        title: "Error",
        description: "Failed to load API keys.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async (request: CreateApiKeyRequest): Promise<{ success: boolean; key?: string }> => {
    if (!user) return { success: false };

    try {
      setLoading(true);
      
      // Call edge function to generate API key
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        body: {
          action: 'create',
          ...request,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "API Key Created",
        description: "Your new API key has been generated successfully.",
      });

      await loadApiKeys();
      return { success: true, key: data.key };
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: "Error",
        description: "Failed to create API key.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateApiKey = async (id: string, updates: Partial<ApiKey>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('api_keys' as any)
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Updated",
        description: "Your API key has been updated successfully.",
      });

      await loadApiKeys();
    } catch (error) {
      console.error('Error updating API key:', error);
      toast({
        title: "Error",
        description: "Failed to update API key.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: string) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('api_keys' as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "API Key Deleted",
        description: "Your API key has been deleted successfully.",
      });

      await loadApiKeys();
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Error",
        description: "Failed to delete API key.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateApiKey = async (id: string): Promise<{ success: boolean; key?: string }> => {
    if (!user) return { success: false };

    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('api-key-manager', {
        body: {
          action: 'regenerate',
          id,
          user_id: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "API Key Regenerated",
        description: "Your API key has been regenerated successfully.",
      });

      await loadApiKeys();
      return { success: true, key: data.key };
    } catch (error) {
      console.error('Error regenerating API key:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate API key.",
        variant: "destructive",
      });
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    apiKeys,
    loading,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    regenerateApiKey,
    refreshApiKeys: loadApiKeys
  };
};
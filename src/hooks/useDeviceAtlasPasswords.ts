/**
 * Hook for managing device passwords via Atlas
 * Passwords are stored in atlas_passwords with an agent_id link
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface DevicePassword {
  id: string;
  name: string;
  username?: string;
  password_encrypted?: string;
  url?: string;
  notes?: string;
  category?: string;
  agent_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

interface UseDeviceAtlasPasswordsResult {
  passwords: DevicePassword[];
  isLoading: boolean;
  error: Error | null;
  addPassword: (password: {
    name: string;
    username?: string;
    password: string;
    notes?: string;
  }) => Promise<DevicePassword | null>;
  deletePassword: (id: string) => Promise<boolean>;
  refetch: () => void;
}

export function useDeviceAtlasPasswords(
  agentId: string | undefined,
  clientId?: string | null
): UseDeviceAtlasPasswordsResult {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState<DevicePassword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchPasswords = useCallback(async () => {
    if (!user || !agentId) {
      setIsLoading(false);
      setPasswords([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch passwords linked to this specific device
      const { data, error: fetchError } = await (supabase as any)
        .from('atlas_passwords')
        .select('*')
        .eq('user_id', user.id)
        .eq('agent_id', agentId)
        .order('name');

      if (fetchError) throw fetchError;

      setPasswords(data || []);
    } catch (err) {
      console.error('Error fetching device passwords:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, agentId]);

  useEffect(() => {
    fetchPasswords();
  }, [fetchPasswords, refetchTrigger]);

  const addPassword = useCallback(async (passwordData: {
    name: string;
    username?: string;
    password: string;
    notes?: string;
  }): Promise<DevicePassword | null> => {
    if (!user || !agentId) {
      toast.error('Not authenticated');
      return null;
    }

    try {
      const { data, error: insertError } = await (supabase as any)
        .from('atlas_passwords')
        .insert({
          user_id: user.id,
          agent_id: agentId,
          organization_id: clientId || null, // Link to client/org if available
          name: passwordData.name,
          username: passwordData.username || null,
          password_encrypted: passwordData.password, // In production, encrypt this
          notes: passwordData.notes || null,
          category: 'Device Credential',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Password saved to Atlas');
      setRefetchTrigger(prev => prev + 1);
      return data;
    } catch (err) {
      console.error('Error adding password:', err);
      toast.error('Failed to save password');
      return null;
    }
  }, [user, agentId, clientId]);

  const deletePassword = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast.error('Not authenticated');
      return false;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from('atlas_passwords')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      toast.success('Password deleted');
      setRefetchTrigger(prev => prev + 1);
      return true;
    } catch (err) {
      console.error('Error deleting password:', err);
      toast.error('Failed to delete password');
      return false;
    }
  }, [user]);

  const refetch = useCallback(() => {
    setRefetchTrigger(prev => prev + 1);
  }, []);

  return {
    passwords,
    isLoading,
    error,
    addPassword,
    deletePassword,
    refetch,
  };
}

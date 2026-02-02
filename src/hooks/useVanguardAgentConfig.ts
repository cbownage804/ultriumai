/**
 * Hook to fetch the current Vanguard agent configuration from the server.
 * This ensures agents always get the correct secret key regardless of which client downloads them.
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface AgentConfig {
  secretKey: string;
  apiEndpoint: string;
  userId: string;
}

interface UseVanguardAgentConfigReturn {
  config: AgentConfig | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<AgentConfig | null>;
}

export function useVanguardAgentConfig(): UseVanguardAgentConfigReturn {
  const { user, session } = useAuth();
  const [config, setConfig] = useState<AgentConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async (): Promise<AgentConfig | null> => {
    if (!session?.access_token) {
      setError('Not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('vanguard-agent-config', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (fnError) {
        throw new Error(fnError.message || 'Failed to fetch agent config');
      }

      const agentConfig: AgentConfig = {
        secretKey: data.secret_key,
        apiEndpoint: data.api_endpoint,
        userId: data.user_id,
      };

      setConfig(agentConfig);
      return agentConfig;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch agent configuration';
      setError(errorMessage);
      console.error('[useVanguardAgentConfig] Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    if (user && session?.access_token) {
      fetchConfig();
    }
  }, [user, session?.access_token, fetchConfig]);

  return { config, loading, error, refetch: fetchConfig };
}

/**
 * Standalone function to fetch agent config (for use in download handlers)
 */
export async function getAgentConfig(): Promise<AgentConfig | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    console.error('[getAgentConfig] No active session');
    return null;
  }

  try {
    const { data, error } = await supabase.functions.invoke('vanguard-agent-config', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to fetch agent config');
    }

    return {
      secretKey: data.secret_key,
      apiEndpoint: data.api_endpoint,
      userId: data.user_id,
    };
  } catch (err: any) {
    console.error('[getAgentConfig] Error:', err);
    return null;
  }
}

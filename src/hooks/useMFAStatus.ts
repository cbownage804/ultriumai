/**
 * Hook to check MFA (2FA) status for the current user
 * Used for enforcing MFA on sensitive features
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface MFAStatus {
  loading: boolean;
  hasMFA: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMFAStatus(): MFAStatus {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasMFA, setHasMFA] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMFAStatus = async () => {
    if (!user) {
      setLoading(false);
      setHasMFA(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: securitySettings, error: fetchError } = await supabase
        .from('security_settings')
        .select('two_factor_enabled')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching MFA status:', fetchError);
        setError(fetchError.message);
        setHasMFA(false);
      } else {
        setHasMFA(securitySettings?.two_factor_enabled ?? false);
      }
    } catch (err) {
      console.error('Error checking MFA status:', err);
      setError('Failed to check MFA status');
      setHasMFA(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMFAStatus();
  }, [user?.id]);

  return {
    loading,
    hasMFA,
    error,
    refetch: fetchMFAStatus
  };
}

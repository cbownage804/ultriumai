import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useSafeShieldData = () => {
  const [initialized, setInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkInitialization = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      setInitialized(true);
    } catch (error) {
      console.error('Error checking SafeShield initialization:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkInitialization();
  }, []);

  return {
    initialized,
    loading,
    reinitialize: checkInitialization
  };
};
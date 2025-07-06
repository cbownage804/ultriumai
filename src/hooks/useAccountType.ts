import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';

export type AccountType = 'business' | 'msp' | 'mssp';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  company_name?: string;
  account_type: AccountType;
  phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export const useAccountType = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = async () => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        throw error;
      }

      setProfile(data);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Update account type
  const updateAccountType = async (accountType: AccountType, companyName?: string) => {
    if (!user?.id) return { success: false, error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          account_type: accountType,
          company_name: companyName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      // Refresh profile data
      await fetchProfile();
      return { success: true };
    } catch (err: any) {
      console.error('Error updating account type:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  // Helper functions
  const isMSP = profile?.account_type === 'msp';
  const isMSSP = profile?.account_type === 'mssp';
  const isMSPOrMSSP = isMSP || isMSSP;
  const isBusiness = profile?.account_type === 'business';
  const isUltriumEmployee = profile?.email?.endsWith('@ultriumai.com') || false;

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateAccountType,
    // Helper booleans
    isMSP,
    isMSSP,
    isMSPOrMSSP,
    isBusiness,
    isUltriumEmployee,
    accountType: profile?.account_type
  };
};
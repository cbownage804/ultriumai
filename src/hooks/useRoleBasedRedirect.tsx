import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  account_type: 'business' | 'msp' | 'mssp';
  email: string;
  full_name?: string;
  company_name?: string;
}

export interface UserRole {
  role: 'user' | 'msp_admin' | 'mssp_admin' | 'ultrium_admin' | 'admin' | 'moderator';
}

export const useRoleBasedRedirect = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setProfile(null);
        setRoles([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id, account_type, email, full_name, company_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else {
          setProfile(profileData);
        }

        // Fetch user roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (rolesError) {
          console.error('Error fetching roles:', rolesError);
        } else {
          setRoles(rolesData || []);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const getRedirectPath = () => {
    if (!profile || !user) return '/hub';

    // Check for MSP admin role
    const isMSPAdmin = roles.some(role => role.role === 'msp_admin');
    const isMSSPAdmin = roles.some(role => role.role === 'mssp_admin');
    const isUltriumAdmin = roles.some(role => role.role === 'ultrium_admin');

    // Admin users go to admin dashboard
    if (isUltriumAdmin) {
      return '/admin';
    }

    // MSP/MSSP users go to their respective dashboards
    if (isMSPAdmin || profile.account_type === 'msp') {
      return '/msp-control-center';
    }

    if (isMSSPAdmin || profile.account_type === 'mssp') {
      return '/msp-control-center'; // For now, use same as MSP
    }

    // Regular users go to Product Hub to choose their product
    return '/hub';
  };

  const shouldRedirectToRole = () => {
    return user && !loading && profile;
  };

  return {
    profile,
    roles,
    loading,
    getRedirectPath,
    shouldRedirectToRole,
    isMSP: profile?.account_type === 'msp' || roles.some(role => role.role === 'msp_admin'),
    isMSSP: profile?.account_type === 'mssp' || roles.some(role => role.role === 'mssp_admin'),
    isAdmin: roles.some(role => role.role === 'ultrium_admin')
  };
};
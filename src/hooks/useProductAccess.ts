import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type Product = 'ai_studio' | 'safesuite' | 'vanguard';
export type AccessLevel = 'free' | 'pro' | 'business' | 'enterprise';

export interface ProductAccess {
  product: Product;
  access_level: AccessLevel;
  granted_at: string;
  expires_at: string | null;
}

interface OrgLicenseAccess {
  product: Product;
  access_level: AccessLevel;
  expires_at: string | null;
}

export interface UseProductAccessReturn {
  access: ProductAccess[];
  loading: boolean;
  hasAccess: (product: Product, requiredLevel?: AccessLevel) => boolean;
  getAccessLevel: (product: Product) => AccessLevel | null;
  refetch: () => Promise<void>;
}

const ACCESS_HIERARCHY: Record<AccessLevel, number> = {
  free: 0,
  pro: 1,
  business: 2,
  enterprise: 3,
};

export const useProductAccess = (): UseProductAccessReturn => {
  const { user } = useAuth();
  const [access, setAccess] = useState<ProductAccess[]>([]);
  const [orgAccess, setOrgAccess] = useState<OrgLicenseAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccess = async () => {
    if (!user) {
      setAccess([]);
      setOrgAccess([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch individual access and org license access in parallel
      const [individualRes, orgRes] = await Promise.all([
        supabase
          .from('user_product_access')
          .select('product, access_level, granted_at, expires_at')
          .eq('user_id', user.id),
        // Get org licenses assigned to this user
        supabase
          .from('org_team_members')
          .select('id, organization_id, status')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .limit(1),
      ]);

      if (individualRes.error) {
        console.error('Error fetching product access:', individualRes.error);
        setAccess([]);
      } else {
        setAccess((individualRes.data || []) as ProductAccess[]);
      }

      // If user is in an org, fetch their license assignments
      if (orgRes.data && orgRes.data.length > 0) {
        const memberId = orgRes.data[0].id;
        const { data: assignmentData } = await supabase
          .from('org_team_license_assignments')
          .select('license_id')
          .eq('member_id', memberId);

        if (assignmentData && assignmentData.length > 0) {
          const licenseIds = assignmentData.map((a: any) => a.license_id);
          const { data: licenseData } = await supabase
            .from('org_team_licenses')
            .select('product, access_level, expires_at')
            .in('id', licenseIds);

          setOrgAccess((licenseData || []) as OrgLicenseAccess[]);
        } else {
          setOrgAccess([]);
        }
      } else {
        setOrgAccess([]);
      }
    } catch (error) {
      console.error('Error fetching product access:', error);
      setAccess([]);
      setOrgAccess([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [user]);

  // Get the effective access level considering both individual and org licenses
  const getEffectiveLevel = (product: Product): AccessLevel | null => {
    // Check individual access
    let bestLevel: AccessLevel | null = null;
    const individual = access.find(a => a.product === product);
    if (individual) {
      if (!individual.expires_at || new Date(individual.expires_at) >= new Date()) {
        bestLevel = individual.access_level;
      }
    }

    // Check org license access (may be higher)
    const orgLicense = orgAccess.find(a => a.product === product);
    if (orgLicense) {
      if (!orgLicense.expires_at || new Date(orgLicense.expires_at) >= new Date()) {
        if (!bestLevel || ACCESS_HIERARCHY[orgLicense.access_level] > ACCESS_HIERARCHY[bestLevel]) {
          bestLevel = orgLicense.access_level;
        }
      }
    }

    // SafeSuite always has free tier for authenticated users
    if (product === 'safesuite' && !bestLevel) {
      return 'free';
    }

    return bestLevel;
  };

  const hasAccess = (product: Product, requiredLevel: AccessLevel = 'free'): boolean => {
    // SafeSuite free tier for all authenticated users
    if (product === 'safesuite' && requiredLevel === 'free') {
      return true;
    }

    const effectiveLevel = getEffectiveLevel(product);
    if (!effectiveLevel) return false;

    return ACCESS_HIERARCHY[effectiveLevel] >= ACCESS_HIERARCHY[requiredLevel];
  };

  const getAccessLevel = (product: Product): AccessLevel | null => {
    return getEffectiveLevel(product);
  };

  return {
    access,
    loading,
    hasAccess,
    getAccessLevel,
    refetch: fetchAccess,
  };
};

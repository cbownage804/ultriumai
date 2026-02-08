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
  const [orgAccess, setOrgAccess] = useState<ProductAccess[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccess = async () => {
    if (!user) {
      setAccess([]);
      setOrgAccess([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch individual access
      const { data: individualData, error: individualErr } = await supabase
        .from('user_product_access')
        .select('product, access_level, granted_at, expires_at')
        .eq('user_id', user.id);

      if (individualErr) {
        console.error('Error fetching product access:', individualErr);
        setAccess([]);
      } else {
        setAccess((individualData || []) as ProductAccess[]);
      }

      // Single optimized query: get org license access via a join-style approach
      // Step 1: Get active membership
      const { data: memberRow } = await supabase
        .from('org_team_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .single();

      if (memberRow) {
        // Step 2: Get assigned licenses with license details in one query
        const { data: assignmentData } = await supabase
          .from('org_team_license_assignments')
          .select('license_id')
          .eq('member_id', memberRow.id);

        if (assignmentData?.length) {
          const licenseIds = assignmentData.map(a => a.license_id);
          const { data: licenseData } = await supabase
            .from('org_team_licenses')
            .select('product, access_level, expires_at, started_at')
            .in('id', licenseIds);

          setOrgAccess(
            (licenseData || []).map((l: any) => ({
              product: l.product as Product,
              access_level: l.access_level as AccessLevel,
              granted_at: l.started_at,
              expires_at: l.expires_at,
            }))
          );
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

  const getEffectiveLevel = (product: Product): AccessLevel | null => {
    const now = new Date();
    let bestLevel: AccessLevel | null = null;

    // Check individual + org access combined
    const allAccess = [...access, ...orgAccess];
    for (const entry of allAccess) {
      if (entry.product !== product) continue;
      if (entry.expires_at && new Date(entry.expires_at) < now) continue;
      if (!bestLevel || ACCESS_HIERARCHY[entry.access_level] > ACCESS_HIERARCHY[bestLevel]) {
        bestLevel = entry.access_level;
      }
    }

    // SafeSuite always has free tier for authenticated users
    if (product === 'safesuite' && !bestLevel) return 'free';
    return bestLevel;
  };

  const hasAccess = (product: Product, requiredLevel: AccessLevel = 'free'): boolean => {
    if (product === 'safesuite' && requiredLevel === 'free') return true;
    const effectiveLevel = getEffectiveLevel(product);
    if (!effectiveLevel) return false;
    return ACCESS_HIERARCHY[effectiveLevel] >= ACCESS_HIERARCHY[requiredLevel];
  };

  const getAccessLevel = (product: Product): AccessLevel | null => {
    return getEffectiveLevel(product);
  };

  return { access, loading, hasAccess, getAccessLevel, refetch: fetchAccess };
};

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
      // Fetch individual access from user_product_access
      const { data: individualData, error: individualErr } = await supabase
        .from('user_product_access')
        .select('product, access_level, granted_at, expires_at')
        .eq('user_id', user.id);

      if (individualErr) {
        console.error('Error fetching product access:', individualErr);
      }

      const combinedAccess: ProductAccess[] = (individualData || []) as ProductAccess[];

      // Also check vanguard_subscriptions for active Vanguard access
      const { data: vanguardSub } = await supabase
        .from('vanguard_subscriptions')
        .select('tier, status, created_at, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (vanguardSub) {
        // Only add if not already present with equal or higher tier
        const existingVanguard = combinedAccess.find(a => a.product === 'vanguard');
        const vanguardLevel = (vanguardSub.tier as AccessLevel) || 'pro';
        if (!existingVanguard || ACCESS_HIERARCHY[vanguardLevel] > ACCESS_HIERARCHY[existingVanguard.access_level]) {
          // Remove existing lower entry if present
          const filtered = combinedAccess.filter(a => a.product !== 'vanguard');
          filtered.push({
            product: 'vanguard',
            access_level: vanguardLevel,
            granted_at: vanguardSub.created_at,
            expires_at: vanguardSub.current_period_end,
          });
          combinedAccess.length = 0;
          combinedAccess.push(...filtered);
        }
      }

      // Also check safesuite_subscriptions for active SafeSuite access
      const { data: safesuiteSub } = await supabase
        .from('safesuite_subscriptions')
        .select('tier, status, created_at, current_period_end')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (safesuiteSub) {
        const existingSS = combinedAccess.find(a => a.product === 'safesuite');
        const ssLevel = (safesuiteSub.tier as AccessLevel) || 'free';
        if (!existingSS || ACCESS_HIERARCHY[ssLevel] > ACCESS_HIERARCHY[existingSS.access_level]) {
          const filtered = combinedAccess.filter(a => a.product !== 'safesuite');
          filtered.push({
            product: 'safesuite',
            access_level: ssLevel,
            granted_at: safesuiteSub.created_at,
            expires_at: safesuiteSub.current_period_end,
          });
          combinedAccess.length = 0;
          combinedAccess.push(...filtered);
        }
      }

      setAccess(combinedAccess);

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

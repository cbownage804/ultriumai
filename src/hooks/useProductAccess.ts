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
  const [loading, setLoading] = useState(true);

  const fetchAccess = async () => {
    if (!user) {
      setAccess([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_product_access')
        .select('product, access_level, granted_at, expires_at')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching product access:', error);
        setAccess([]);
      } else {
        setAccess((data || []) as ProductAccess[]);
      }
    } catch (error) {
      console.error('Error fetching product access:', error);
      setAccess([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccess();
  }, [user]);

  const hasAccess = (product: Product, requiredLevel: AccessLevel = 'free'): boolean => {
    // SafeSuite has a free tier - all authenticated users have at least free access
    if (product === 'safesuite' && requiredLevel === 'free') {
      return true;
    }
    
    const productAccess = access.find(a => a.product === product);
    
    if (!productAccess) return false;
    
    // Check if expired
    if (productAccess.expires_at && new Date(productAccess.expires_at) < new Date()) {
      return false;
    }
    
    // Check access level hierarchy
    return ACCESS_HIERARCHY[productAccess.access_level] >= ACCESS_HIERARCHY[requiredLevel];
  };

  const getAccessLevel = (product: Product): AccessLevel | null => {
    // SafeSuite has a free tier - all authenticated users have at least free access
    if (product === 'safesuite') {
      const productAccess = access.find(a => a.product === product);
      if (!productAccess) return 'free'; // Default free tier for SafeSuite
      if (productAccess.expires_at && new Date(productAccess.expires_at) < new Date()) {
        return 'free'; // Expired subscription falls back to free
      }
      return productAccess.access_level;
    }
    
    const productAccess = access.find(a => a.product === product);
    
    if (!productAccess) return null;
    
    // Check if expired
    if (productAccess.expires_at && new Date(productAccess.expires_at) < new Date()) {
      return null;
    }
    
    return productAccess.access_level;
  };

  return {
    access,
    loading,
    hasAccess,
    getAccessLevel,
    refetch: fetchAccess,
  };
};

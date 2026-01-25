/**
 * SafeTrack Asset Management Hook
 * Comprehensive asset inventory management with warranty integration
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

export interface OfficeLocation {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  is_primary: boolean;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

export interface Asset {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  serial_number: string | null;
  model: string | null;
  manufacturer: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  warranty_expiry: string | null;
  current_value: number | null;
  location: string | null;
  assigned_to: string | null;
  status: 'active' | 'maintenance' | 'retired' | 'lost' | 'disposed';
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  asset_tag: string | null;
  specifications: Record<string, any>;
  notes: string | null;
  category_id: string | null;
  office_location_id: string | null;
  warranty_id: string | null;
  last_warranty_check: string | null;
  created_at: string;
  updated_at: string;
  // Joined data (partial types for query results)
  category?: {
    id: string;
    name: string;
    description: string | null;
    icon: string | null;
  } | null;
  office_location?: {
    id: string;
    name: string;
    city: string | null;
    state: string | null;
    is_primary: boolean;
  } | null;
  warranty?: {
    id: string;
    warranty_status: string;
    warranty_end_date: string | null;
    coverage_type: string | null;
  } | null;
}

export interface AssetFormData {
  name: string;
  description?: string;
  serial_number?: string;
  model?: string;
  manufacturer?: string;
  purchase_date?: string;
  purchase_price?: number;
  warranty_expiry?: string;
  current_value?: number;
  location?: string;
  assigned_to?: string;
  status?: string;
  condition?: string;
  asset_tag?: string;
  specifications?: Record<string, any>;
  notes?: string;
  category_id?: string;
  office_location_id?: string;
}

export interface OfficeLocationFormData {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  is_primary?: boolean;
  notes?: string;
}

export function useSafeTrackAssets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all assets with related data
  const { data: assets = [], isLoading: assetsLoading, refetch: refetchAssets } = useQuery({
    queryKey: ['safetrack-assets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(id, name, description, icon),
          office_location:office_locations(id, name, city, state, is_primary),
          warranty:safetrack_warranties(id, warranty_status, warranty_end_date, coverage_type)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch assets:', error);
        throw error;
      }

      return (data || []) as Asset[];
    },
    enabled: !!user?.id
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['asset-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('asset_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []) as AssetCategory[];
    }
  });

  // Fetch office locations
  const { data: officeLocations = [], refetch: refetchLocations } = useQuery({
    queryKey: ['office-locations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('office_locations')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      return (data || []) as OfficeLocation[];
    },
    enabled: !!user?.id
  });

  // Create asset
  const createAsset = useMutation({
    mutationFn: async (formData: AssetFormData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assets')
        .insert({
          ...formData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetrack-assets'] });
      toast.success('Asset created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create asset: ' + error.message);
    }
  });

  // Update asset
  const updateAsset = useMutation({
    mutationFn: async ({ id, ...formData }: AssetFormData & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('assets')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetrack-assets'] });
      toast.success('Asset updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update asset: ' + error.message);
    }
  });

  // Delete asset
  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('assets')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetrack-assets'] });
      toast.success('Asset deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete asset: ' + error.message);
    }
  });

  // Create office location
  const createLocation = useMutation({
    mutationFn: async (formData: OfficeLocationFormData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('office_locations')
        .insert({
          ...formData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-locations'] });
      toast.success('Location added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add location: ' + error.message);
    }
  });

  // Delete location
  const deleteLocation = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('office_locations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['office-locations'] });
      toast.success('Location deleted');
    }
  });

  // Refresh warranty for an asset
  const refreshWarranty = useCallback(async (asset: Asset) => {
    if (!asset.serial_number) {
      toast.error('Asset has no serial number');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('safetrack-warranty-lookup', {
        body: {
          serialNumber: asset.serial_number,
          deviceName: asset.name,
          userId: user?.id
        }
      });

      if (error) throw error;

      if (data?.success && data?.data?.id) {
        // Link warranty to asset
        await supabase
          .from('assets')
          .update({
            warranty_id: data.data.id,
            warranty_expiry: data.data.warranty_end_date,
            last_warranty_check: new Date().toISOString()
          })
          .eq('id', asset.id)
          .eq('user_id', user?.id);

        queryClient.invalidateQueries({ queryKey: ['safetrack-assets'] });
        toast.success('Warranty status updated');
        return data.data;
      } else {
        toast.error(data?.error || 'Could not retrieve warranty');
        return null;
      }
    } catch (err) {
      console.error('Warranty refresh error:', err);
      toast.error('Failed to refresh warranty');
      return null;
    }
  }, [user?.id, queryClient]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalValue = assets.reduce((sum, a) => sum + (a.current_value || a.purchase_price || 0), 0);
    const activeCount = assets.filter(a => a.status === 'active').length;
    const maintenanceCount = assets.filter(a => a.status === 'maintenance').length;
    const retiredCount = assets.filter(a => a.status === 'retired').length;

    // Count expiring warranties (within 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringCount = assets.filter(a => {
      if (!a.warranty_expiry) return false;
      const expiry = new Date(a.warranty_expiry);
      return expiry <= thirtyDaysFromNow && expiry >= new Date();
    }).length;

    // Count by category
    const byCategory = categories.map(cat => ({
      ...cat,
      count: assets.filter(a => a.category_id === cat.id).length
    }));

    // Count by location
    const byLocation = officeLocations.map(loc => ({
      ...loc,
      count: assets.filter(a => a.office_location_id === loc.id).length
    }));

    return {
      total: assets.length,
      active: activeCount,
      maintenance: maintenanceCount,
      retired: retiredCount,
      totalValue,
      expiringSoon: expiringCount,
      byCategory,
      byLocation
    };
  }, [assets, categories, officeLocations]);

  return {
    assets,
    categories,
    officeLocations,
    stats,
    isLoading: assetsLoading,
    refetchAssets,
    refetchLocations,
    createAsset: createAsset.mutate,
    updateAsset: updateAsset.mutate,
    deleteAsset: deleteAsset.mutate,
    createLocation: createLocation.mutate,
    deleteLocation: deleteLocation.mutate,
    refreshWarranty,
    isCreating: createAsset.isPending,
    isUpdating: updateAsset.isPending,
    isDeleting: deleteAsset.isPending
  };
}
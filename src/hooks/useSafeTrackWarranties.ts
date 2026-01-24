/**
 * SafeTrack Warranty Management Hook
 * Handles warranty lookups and history management
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface WarrantyData {
  id: string;
  serial_number: string;
  device_name: string | null;
  manufacturer: string | null;
  model: string | null;
  purchase_date: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_status: 'active' | 'expired' | 'unknown';
  coverage_type: string | null;
  repair_options: string[];
  support_contacts: {
    phone?: string;
    website?: string;
    chat?: string;
  };
  ai_analysis: string | null;
  source_url: string | null;
  last_checked_at: string | null;
  created_at: string;
}

export interface WarrantyLookupResult {
  success: boolean;
  data?: WarrantyData;
  error?: string;
}

export function useSafeTrackWarranties() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Fetch warranty history
  const { data: warranties, isLoading, refetch } = useQuery({
    queryKey: ['safetrack-warranties', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('safetrack_warranties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch warranties:', error);
        throw error;
      }

      return (data || []) as WarrantyData[];
    },
    enabled: !!user?.id
  });

  // Lookup warranty by serial number
  const lookupWarranty = useCallback(async (
    serialNumber: string, 
    deviceName?: string
  ): Promise<WarrantyLookupResult> => {
    if (!user?.id) {
      return { success: false, error: 'Please sign in to lookup warranties' };
    }

    setIsLookingUp(true);

    try {
      const { data, error } = await supabase.functions.invoke('safetrack-warranty-lookup', {
        body: { 
          serialNumber: serialNumber.trim(),
          deviceName: deviceName?.trim(),
          userId: user.id
        }
      });

      if (error) {
        console.error('Warranty lookup error:', error);
        return { success: false, error: error.message };
      }

      if (!data.success) {
        return { success: false, error: data.error || 'Lookup failed' };
      }

      // Refresh the warranty list
      queryClient.invalidateQueries({ queryKey: ['safetrack-warranties'] });

      return { success: true, data: data.data };
    } catch (err) {
      console.error('Warranty lookup failed:', err);
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to lookup warranty' 
      };
    } finally {
      setIsLookingUp(false);
    }
  }, [user?.id, queryClient]);

  // Delete warranty record
  const deleteWarranty = useMutation({
    mutationFn: async (warrantyId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const { error } = await supabase
        .from('safetrack_warranties')
        .delete()
        .eq('id', warrantyId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['safetrack-warranties'] });
      toast.success('Warranty record deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete warranty: ' + error.message);
    }
  });

  // Refresh warranty (re-check)
  const refreshWarranty = useCallback(async (warranty: WarrantyData) => {
    const result = await lookupWarranty(warranty.serial_number, warranty.device_name || undefined);
    if (result.success) {
      toast.success('Warranty information updated');
    } else {
      toast.error(result.error || 'Failed to refresh warranty');
    }
    return result;
  }, [lookupWarranty]);

  // Calculate warranty stats
  const stats = {
    total: warranties?.length || 0,
    active: warranties?.filter(w => w.warranty_status === 'active').length || 0,
    expired: warranties?.filter(w => w.warranty_status === 'expired').length || 0,
    expiringSoon: warranties?.filter(w => {
      if (w.warranty_status !== 'active' || !w.warranty_end_date) return false;
      const endDate = new Date(w.warranty_end_date);
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      return endDate <= thirtyDaysFromNow;
    }).length || 0
  };

  return {
    warranties,
    isLoading,
    isLookingUp,
    stats,
    lookupWarranty,
    deleteWarranty: deleteWarranty.mutate,
    refreshWarranty,
    refetch
  };
}

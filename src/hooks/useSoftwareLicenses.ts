/**
 * Software License Management Hook for SafeTrack Business
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface SoftwareLicense {
  id: string;
  user_id: string;
  name: string;
  vendor: string | null;
  version: string | null;
  license_type: 'perpetual' | 'subscription' | 'volume' | 'trial' | 'freeware' | 'open_source';
  license_key: string | null;
  seats_total: number;
  seats_used: number;
  cost_per_seat: number | null;
  billing_cycle: 'monthly' | 'annual' | 'one_time' | 'other' | null;
  purchase_date: string | null;
  expiry_date: string | null;
  renewal_date: string | null;
  auto_renew: boolean;
  category: string | null;
  notes: string | null;
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface SoftwareLicenseFormData {
  name: string;
  vendor?: string;
  version?: string;
  license_type?: string;
  license_key?: string;
  seats_total?: number;
  seats_used?: number;
  cost_per_seat?: number;
  billing_cycle?: string;
  purchase_date?: string;
  expiry_date?: string;
  renewal_date?: string;
  auto_renew?: boolean;
  category?: string;
  notes?: string;
  status?: string;
}

export function useSoftwareLicenses() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all software licenses
  const { data: licenses = [], isLoading, refetch } = useQuery({
    queryKey: ['software-licenses', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('software_licenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch software licenses:', error);
        throw error;
      }

      return (data || []) as SoftwareLicense[];
    },
    enabled: !!user?.id
  });

  // Create license
  const createLicense = useMutation({
    mutationFn: async (formData: SoftwareLicenseFormData) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('software_licenses')
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
      queryClient.invalidateQueries({ queryKey: ['software-licenses'] });
      toast.success('License added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add license: ' + error.message);
    }
  });

  // Update license
  const updateLicense = useMutation({
    mutationFn: async ({ id, ...formData }: SoftwareLicenseFormData & { id: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('software_licenses')
        .update(formData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software-licenses'] });
      toast.success('License updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update license: ' + error.message);
    }
  });

  // Delete license
  const deleteLicense = useMutation({
    mutationFn: async (id: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('software_licenses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['software-licenses'] });
      toast.success('License deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete license: ' + error.message);
    }
  });

  // Calculate stats
  const stats = {
    total: licenses.length,
    active: licenses.filter(l => l.status === 'active').length,
    expiring: licenses.filter(l => {
      if (!l.expiry_date) return false;
      const exp = new Date(l.expiry_date);
      const thirtyDays = new Date();
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return exp <= thirtyDays && exp >= new Date();
    }).length,
    expired: licenses.filter(l => l.status === 'expired').length,
    totalCost: licenses.reduce((sum, l) => {
      if (!l.cost_per_seat) return sum;
      return sum + (l.cost_per_seat * l.seats_total);
    }, 0),
    totalSeats: licenses.reduce((sum, l) => sum + l.seats_total, 0),
    usedSeats: licenses.reduce((sum, l) => sum + l.seats_used, 0)
  };

  return {
    licenses,
    stats,
    isLoading,
    refetch,
    createLicense: createLicense.mutate,
    updateLicense: updateLicense.mutate,
    deleteLicense: deleteLicense.mutate,
    isCreating: createLicense.isPending,
    isUpdating: updateLicense.isPending,
    isDeleting: deleteLicense.isPending
  };
}

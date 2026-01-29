import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReconInventoryItem {
  id: string;
  serial_number: string;
  mac_address: string | null;
  hardware_tier: string;
  status: string;
  assigned_order_id: string | null;
  activation_key: string | null;
  agent_id: string | null;
  firmware_version: string | null;
  notes: string | null;
  provisioned_at: string | null;
  provisioned_by: string | null;
  shipped_at: string | null;
  activated_at: string | null;
  created_at: string;
  updated_at: string;
}

const generateActivationKey = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = 4;
  const segmentLength = 4;
  const parts: string[] = [];
  
  for (let s = 0; s < segments; s++) {
    let segment = '';
    for (let i = 0; i < segmentLength; i++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    parts.push(segment);
  }
  
  return `VGD-${parts.join('-')}`;
};

export const useReconInventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ['recon-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recon_inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReconInventoryItem[];
    },
  });

  const addUnit = useMutation({
    mutationFn: async ({
      serialNumber,
      macAddress,
      hardwareTier,
      firmwareVersion,
      notes,
    }: {
      serialNumber: string;
      macAddress?: string;
      hardwareTier: string;
      firmwareVersion?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('recon_inventory')
        .insert({
          serial_number: serialNumber,
          mac_address: macAddress || null,
          hardware_tier: hardwareTier,
          firmware_version: firmwareVersion || null,
          notes: notes || null,
          status: 'available',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-inventory'] });
      toast({ title: 'Unit added to inventory' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const assignToOrder = useMutation({
    mutationFn: async ({
      inventoryId,
      orderId,
    }: {
      inventoryId: string;
      orderId: string;
    }) => {
      const activationKey = generateActivationKey();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('recon_inventory')
        .update({
          status: 'assigned',
          assigned_order_id: orderId,
          activation_key: activationKey,
          provisioned_at: new Date().toISOString(),
          provisioned_by: user?.id,
        })
        .eq('id', inventoryId)
        .select()
        .single();

      if (error) throw error;

      // Update order status to provisioning
      await supabase
        .from('recon_orders')
        .update({ order_status: 'provisioning' })
        .eq('id', orderId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-inventory'] });
      queryClient.invalidateQueries({ queryKey: ['recon-orders'] });
      toast({ title: 'Unit assigned to order' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      inventoryId,
      status,
      additionalFields,
    }: {
      inventoryId: string;
      status: string;
      additionalFields?: Partial<ReconInventoryItem>;
    }) => {
      const updateData: Record<string, unknown> = {
        status,
        ...additionalFields,
      };

      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'active') updateData.activated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('recon_inventory')
        .update(updateData)
        .eq('id', inventoryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-inventory'] });
      toast({ title: 'Unit updated' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update unit',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getAvailableUnits = (hardwareTier?: string) => {
    return inventory?.filter(
      (item) =>
        item.status === 'available' &&
        (!hardwareTier || item.hardware_tier === hardwareTier)
    ) || [];
  };

  return {
    inventory,
    isLoading,
    error,
    addUnit,
    assignToOrder,
    updateStatus,
    getAvailableUnits,
  };
};

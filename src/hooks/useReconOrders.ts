import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ReconOrder {
  id: string;
  user_id: string;
  msp_client_id: string | null;
  order_status: string;
  hardware_tier: string;
  subscription_tier: string;
  quantity: number;
  unit_price_cents: number;
  subscription_price_cents: number;
  shipping_address: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  billing_address?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  customer_email: string;
  customer_name: string;
  customer_phone: string | null;
  stripe_payment_intent: string | null;
  stripe_checkout_session: string | null;
  stripe_subscription_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  tracking_number: string | null;
  shipping_carrier: string | null;
}

export const useReconOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['recon-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recon_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReconOrder[];
    },
  });

  const updateOrderStatus = useMutation({
    mutationFn: async ({ 
      orderId, 
      status, 
      additionalFields 
    }: { 
      orderId: string; 
      status: string; 
      additionalFields?: Partial<ReconOrder>;
    }) => {
      const updateData: Record<string, unknown> = { 
        order_status: status,
        ...additionalFields,
      };

      // Auto-set timestamps based on status
      if (status === 'paid') updateData.paid_at = new Date().toISOString();
      if (status === 'shipped') updateData.shipped_at = new Date().toISOString();
      if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('recon_orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-orders'] });
      toast({ title: 'Order updated successfully' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update order',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const addShippingInfo = useMutation({
    mutationFn: async ({
      orderId,
      trackingNumber,
      carrier,
    }: {
      orderId: string;
      trackingNumber: string;
      carrier: string;
    }) => {
      const { data, error } = await supabase
        .from('recon_orders')
        .update({
          order_status: 'shipped',
          shipped_at: new Date().toISOString(),
          tracking_number: trackingNumber,
          shipping_carrier: carrier,
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recon-orders'] });
      toast({ title: 'Shipping info added' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add shipping info',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    orders,
    isLoading,
    error,
    updateOrderStatus,
    addShippingInfo,
  };
};

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface RMMDevice {
  id: string;
  hostname: string;
  ip_address: string;
  os_info?: string | null;
  device_type?: string | null;
  status?: string | null;
  last_seen?: string | null;
  cpu_usage?: number | null;
  memory_usage?: number | null;
  disk_usage?: number | null;
  
  last_logged_user?: string | null;
  agent_version?: string | null;
  customer_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface RMMMetric {
  id: string;
  client_id: string;
  hostname: string;
  cpu_usage?: number | null;
  memory_usage?: number | null;
  disk_usage?: number | null;
  network_io?: number | null;
  processes_count?: number | null;
  services_count?: number | null;
  antivirus_status?: any | null;
  collected_at: string;
}

export const useRMMDevices = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all devices
  const {
    data: devices = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['rmm-devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rmm_devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      return data as RMMDevice[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch metrics for a specific device by hostname
  const useDeviceMetrics = (hostname: string, timeRange: string = '24h') => {
    return useQuery({
      queryKey: ['rmm-metrics', hostname, timeRange],
      queryFn: async () => {
        const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 1;
        const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

        const { data, error } = await supabase
          .from('rmm_metrics')
          .select('*')
          .eq('hostname', hostname)
          .gte('collected_at', since)
          .order('collected_at', { ascending: true });

        if (error) throw error;
        return data as RMMMetric[];
      },
      enabled: !!hostname,
      refetchInterval: 60000, // Refresh every minute
    });
  };

  // Add new device mutation
  const addDeviceMutation = useMutation({
    mutationFn: async (deviceData: {
      hostname: string;
      ip_address: string;
      os_info?: string;
      device_type?: string;
    }) => {
      const { data, error } = await supabase
        .from('rmm_devices')
        .insert({
          ...deviceData,
          status: 'offline',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmm-devices'] });
      toast({
        title: "Device Added",
        description: "Device has been successfully added to monitoring.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Adding Device",
        description: error.message || "Failed to add device.",
        variant: "destructive",
      });
    },
  });

  // Update device mutation
  const updateDeviceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<RMMDevice> }) => {
      const { data, error } = await supabase
        .from('rmm_devices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmm-devices'] });
      toast({
        title: "Device Updated",
        description: "Device has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Updating Device",
        description: error.message || "Failed to update device.",
        variant: "destructive",
      });
    },
  });

  // Delete device mutation
  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const { error } = await supabase
        .from('rmm_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rmm-devices'] });
      toast({
        title: "Device Removed",
        description: "Device has been successfully removed from monitoring.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error Removing Device",
        description: error.message || "Failed to remove device.",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const getOnlineDevices = () => devices.filter(device => {
    if (!device.last_seen) return false;
    const lastSeen = new Date(device.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen > fiveMinutesAgo;
  });

  const getOfflineDevices = () => devices.filter(device => {
    if (!device.last_seen) return true;
    const lastSeen = new Date(device.last_seen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen <= fiveMinutesAgo;
  });

  const getCriticalDevices = () => devices.filter(device => 
    (device.cpu_usage && device.cpu_usage > 90) ||
    (device.memory_usage && device.memory_usage > 90) ||
    (device.disk_usage && device.disk_usage > 90)
  );

  const getDevicesByType = (type: string) => devices.filter(device => 
    device.device_type === type
  );

  const getDeviceStats = () => ({
    total: devices.length,
    online: getOnlineDevices().length,
    offline: getOfflineDevices().length,
    critical: getCriticalDevices().length,
    servers: getDevicesByType('server').length,
    workstations: getDevicesByType('workstation').length,
    laptops: getDevicesByType('laptop').length,
  });

  return {
    devices,
    isLoading,
    error,
    useDeviceMetrics,
    addDevice: addDeviceMutation.mutate,
    updateDevice: updateDeviceMutation.mutate,
    deleteDevice: deleteDeviceMutation.mutate,
    isAddingDevice: addDeviceMutation.isPending,
    isUpdatingDevice: updateDeviceMutation.isPending,
    isDeletingDevice: deleteDeviceMutation.isPending,
    getOnlineDevices,
    getOfflineDevices,
    getCriticalDevices,
    getDevicesByType,
    getDeviceStats,
  };
};
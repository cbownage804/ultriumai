import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SafeNetDevice {
  id: string;
  user_id: string;
  network_id?: string | null;
  device_name?: string | null;
  device_type: string;
  ip_address: string;
  mac_address?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  os_version?: string | null;
  os_family?: string | null;
  hostname?: string | null;
  is_managed: boolean;
  is_critical?: boolean;
  status: string;
  last_seen_at?: string | null;
  vulnerability_count?: number;
  security_patches_needed?: number;
  connector_key?: string;
  device_role?: string | null;
  network_segment?: string | null;
  discovery_method?: string[];
  device_metadata?: any;
  uptime_hours?: number | null;
  cpu_usage?: number | null;
  memory_usage?: number | null;
  created_at: string;
  updated_at: string;
}

export interface SafeNetVulnerability {
  id: string;
  user_id: string;
  device_id?: string;
  network_id?: string;
  cve_id?: string;
  vulnerability_id: string;
  severity: string;
  cvss_score?: number;
  title: string;
  description?: string;
  solution?: string;
  status?: string;
  discovered_at: string;
  affected_service?: string;
  port?: number;
  patched_at?: string;
  created_at: string;
  updated_at: string;
}

// Note: These tables don't exist in current schema
export interface SafeNetTopology {
  id: string;
  user_id: string;
  source_device_id: string;
  target_device_id: string;
  connection_type: string;
  interface_source?: string;
  interface_target?: string;
  protocol?: string;
  link_speed?: number;
  connection_status: string;
  created_at: string;
  updated_at: string;
}

export interface SafeNetService {
  id: string;
  user_id: string;
  device_id: string;
  port: number;
  protocol: string;
  service_name?: string;
  service_version?: string;
  service_state: string;
  service_type?: string;
  security_level?: string;
  created_at: string;
  updated_at: string;
}

export const useSafeNetData = () => {
  const [devices, setDevices] = useState<SafeNetDevice[]>([]);
  const [vulnerabilities, setVulnerabilities] = useState<SafeNetVulnerability[]>([]);
  const [topology, setTopology] = useState<SafeNetTopology[]>([]);
  const [services, setServices] = useState<SafeNetService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safenet_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface
      const transformedDevices = data?.map(device => ({
        ...device,
        ip_address: device.ip_address as string,
        status: device.last_seen_at && new Date(device.last_seen_at) > new Date(Date.now() - 5 * 60 * 1000) 
          ? 'online' : device.status || 'offline'
      })) || [];
      
      console.log('Loaded devices:', transformedDevices);
      setDevices(transformedDevices);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive",
      });
    }
  };

  const loadVulnerabilities = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('safenet_vulnerabilities')
        .select('*')
        .eq('user_id', user.id)
        .order('discovered_at', { ascending: false });

      if (error) throw error;
      setVulnerabilities(data || []);
    } catch (error) {
      console.error('Error loading vulnerabilities:', error);
      toast({
        title: "Error",
        description: "Failed to load vulnerabilities",
        variant: "destructive",
      });
    }
  };

  const loadTopology = async () => {
    if (!user) return;

    try {
      // Note: topology and services tables don't exist yet in the database
      // For now, return empty arrays
      setTopology([]);
    } catch (error) {
      console.error('Error loading topology:', error);
      toast({
        title: "Error",
        description: "Failed to load network topology",
        variant: "destructive",
      });
    }
  };

  const loadServices = async () => {
    if (!user) return;

    try {
      // Note: services table doesn't exist yet in the database
      // For now, return empty array
      setServices([]);
    } catch (error) {
      console.error('Error loading services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([
      loadDevices(),
      loadVulnerabilities(),
      loadTopology(),
      loadServices()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Set up real-time subscription for device updates
      const deviceSubscription = supabase
        .channel('safenet-devices-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'safenet_devices',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Device change detected:', payload);
            // Refresh devices when there's a change
            loadDevices();
          }
        )
        .subscribe();

      return () => {
        deviceSubscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, [user]);


  return {
    devices,
    vulnerabilities,
    topology,
    services,
    isLoading,
    refreshData
  };
};
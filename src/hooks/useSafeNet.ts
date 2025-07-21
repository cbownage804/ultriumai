
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export interface SafeNetConnector {
  id: string;
  user_id: string;
  connector_key: string;
  connector_name: string;
  client_name?: string;
  status: string;
  last_heartbeat?: string;
  version?: string;
  system_info?: any;
  network_info?: any;
  created_at: string;
  updated_at: string;
}

export interface NetworkScan {
  id: string;
  user_id: string;
  connector_id?: string;
  scan_type: string;
  network_ranges: string[];
  devices_found: number;
  scan_duration?: number;
  scanned_at: string;
  hostname?: string;
  results?: any;
  created_at: string;
  updated_at: string;
}

export interface NetworkDevice {
  id: string;
  user_id?: string;
  scan_id?: string;
  ip_address: string;
  hostname: string;
  device_type: string;
  mac_address?: string;
  os_info?: string;
  open_ports?: number[];
  services?: any;
  vulnerabilities?: string[];
  risk_level: string;
  last_seen: string;
  status: string;
  network_range: string;
  connector_id?: string;
  created_at: string;
  updated_at: string;
}

export const useSafeNet = () => {
  const [connectors, setConnectors] = useState<SafeNetConnector[]>([]);
  const [scans, setScans] = useState<NetworkScan[]>([]);
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadConnectors = async () => {
    if (!user) return;

    try {
      // Use any type temporarily until Supabase types are regenerated
      const { data, error } = await (supabase as any)
        .from('safenet_connectors')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConnectors(data || []);
    } catch (error) {
      console.error('Error loading connectors:', error);
      toast({
        title: "Error",
        description: "Failed to load SafeNet connectors",
        variant: "destructive",
      });
    }
  };

  const loadScans = async () => {
    if (!user) return;

    try {
      // Use any type temporarily until Supabase types are regenerated
      const { data, error } = await (supabase as any)
        .from('network_scans')
        .select('*')
        .eq('user_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setScans(data || []);
    } catch (error) {
      console.error('Error loading scans:', error);
      toast({
        title: "Error",
        description: "Failed to load network scans",
        variant: "destructive",
      });
    }
  };

  const loadDevices = async () => {
    if (!user) return;

    try {
      // Use any type temporarily until Supabase types are regenerated
      const { data, error } = await (supabase as any)
        .from('network_devices')
        .select('*')
        .eq('user_id', user.id)
        .order('last_seen', { ascending: false });

      if (error) throw error;
      setDevices(data || []);
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load network devices",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await Promise.all([loadConnectors(), loadScans(), loadDevices()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      refreshData();
      
      // Set up real-time subscriptions
      const connectorSubscription = supabase
        .channel('safenet-connectors-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'safenet_connectors',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadConnectors();
          }
        )
        .subscribe();

      const scanSubscription = supabase
        .channel('network-scans-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'network_scans',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadScans();
          }
        )
        .subscribe();

      return () => {
        connectorSubscription.unsubscribe();
        scanSubscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Calculate statistics
  const activeConnectors = connectors.filter(c => c.status === 'active').length;
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const vulnerableDevices = devices.filter(d => (d.vulnerabilities?.length || 0) > 0).length;
  const recentScans = scans.filter(s => 
    new Date(s.scanned_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  ).length;

  return {
    connectors,
    scans,
    devices,
    isLoading,
    refreshData,
    // Statistics
    activeConnectors,
    totalConnectors: connectors.length,
    totalDevices,
    onlineDevices,
    offlineDevices: totalDevices - onlineDevices,
    vulnerableDevices,
    recentScans,
    totalScans: scans.length
  };
};

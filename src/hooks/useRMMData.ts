import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Use the actual database types from Supabase
type RMMDevice = {
  id: string;
  customer_id: string | null;
  hostname: string;
  ip_address: string;
  device_type: string | null;
  status: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_usage: number | null;
  agent_version: string | null;
  last_logged_user: string | null;
  last_seen: string | null;
  os_info: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RMMCustomer = {
  id: string;
  company_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  is_active: boolean | null;
  last_activity: string | null;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TicketInsert = {
  title: string;
  customer_id?: string | null;
  description?: string | null;
  priority?: string | null;
  status?: string | null;
  category?: string | null;
  assigned_to?: string | null;
  device_context?: any;
  resolution_notes?: string | null;
};

type HelpdeskTicket = {
  id: string;
  customer_id: string | null;
  title: string;
  description: string | null;
  priority: string | null;
  status: string | null;
  category: string | null;
  assigned_to: string | null;
  device_context: any;
  resolution_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
  resolved_at: string | null;
};

export const useRMMData = () => {
  const [devices, setDevices] = useState<RMMDevice[]>([]);
  const [customers, setCustomers] = useState<RMMCustomer[]>([]);
  const [tickets, setTickets] = useState<HelpdeskTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    alertsCount: 0,
    serversCount: 0,
    workstationsCount: 0,
    networkDevicesCount: 0,
    criticalAlerts: 0,
    pendingPatches: 0,
    scriptsRunning: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Load RMM devices
  const loadDevices = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;

      const devicesData = (data || []) as RMMDevice[];
      setDevices(devicesData);

      // Calculate stats from real data
      const totalDevices = devicesData.length;
      const onlineDevices = devicesData.filter(d => d.status === 'online').length;
      const offlineDevices = devicesData.filter(d => d.status === 'offline').length;
      const serversCount = devicesData.filter(d => d.device_type === 'server').length;
      const workstationsCount = devicesData.filter(d => d.device_type === 'workstation').length;
      const networkDevicesCount = devicesData.filter(d => d.device_type === 'network_device').length;

      // Calculate critical alerts (high CPU/memory usage)
      const criticalAlerts = devicesData.filter(d => 
        (d.cpu_usage && d.cpu_usage > 85) || 
        (d.memory_usage && d.memory_usage > 90)
      ).length;

      // Real stats from device data - no mock estimates
      setStats({
        totalDevices,
        onlineDevices,
        offlineDevices,
        alertsCount: criticalAlerts, // Real alerts from device health only
        serversCount,
        workstationsCount,
        networkDevicesCount,
        criticalAlerts,
        pendingPatches: 0, // Will be populated from real patch management data
        scriptsRunning: 0 // Will be populated from real automation data
      });

    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load RMM devices",
        variant: "destructive",
      });
    }
  };

  // Load customers
  const loadCustomers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('rmm_customers')
        .select('*')
        .eq('is_active', true)
        .order('company_name');

      if (error) throw error;
      setCustomers((data || []) as RMMCustomer[]);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  // Load helpdesk tickets
  const loadTickets = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setTickets((data || []) as HelpdeskTicket[]);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: "Error",
        description: "Failed to load helpdesk tickets",
        variant: "destructive",
      });
    }
  };

  // Add new device
  const addDevice = async (deviceData: {
    hostname: string;
    ip_address: string;
    customer_id?: string | null;
    device_type?: string | null;
    status?: string | null;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .insert(deviceData)
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => [data as RMMDevice, ...prev]);
      toast({
        title: "Success",
        description: `Device ${deviceData.hostname} added successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive",
      });
      return null;
    }
  };

  // Update device
  const updateDevice = async (deviceId: string, updates: Partial<RMMDevice>) => {
    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .update(updates)
        .eq('id', deviceId)
        .select()
        .single();

      if (error) throw error;

      setDevices(prev => prev.map(device => 
        device.id === deviceId ? data as RMMDevice : device
      ));

      return data;
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create helpdesk ticket
  const createTicket = async (ticketData: TicketInsert) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('helpdesk_tickets')
        .insert(ticketData)
        .select()
        .single();

      if (error) throw error;

      setTickets(prev => [data as HelpdeskTicket, ...prev]);
      toast({
        title: "Success",
        description: "Support ticket created successfully",
      });

      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create ticket",
        variant: "destructive",
      });
      return null;
    }
  };

  // Get devices by type
  const getDevicesByType = (type: string) => {
    return devices.filter(device => device.device_type === type);
  };

  // Get devices by status
  const getDevicesByStatus = (status: string) => {
    return devices.filter(device => device.status === status);
  };

  // Get critical devices (high resource usage)
  const getCriticalDevices = () => {
    return devices.filter(device => 
      (device.cpu_usage && device.cpu_usage > 85) ||
      (device.memory_usage && device.memory_usage > 90) ||
      (device.disk_usage && device.disk_usage > 90)
    );
  };

  // Initialize data loading
  useEffect(() => {
    if (user) {
      setIsLoading(true);
      Promise.all([
        loadDevices(),
        loadCustomers(),
        loadTickets()
      ]).finally(() => {
        setIsLoading(false);
      });
    }
  }, [user]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    const devicesChannel = supabase
      .channel('rmm_devices_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rmm_devices' },
        () => loadDevices()
      )
      .subscribe();

    const ticketsChannel = supabase
      .channel('helpdesk_tickets_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'helpdesk_tickets' },
        () => loadTickets()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(ticketsChannel);
    };
  }, [user]);

  return {
    devices,
    customers,
    tickets,
    stats,
    isLoading,
    addDevice,
    updateDevice,
    createTicket,
    getDevicesByType,
    getDevicesByStatus,
    getCriticalDevices,
    loadDevices,
    loadCustomers,
    loadTickets
  };
};
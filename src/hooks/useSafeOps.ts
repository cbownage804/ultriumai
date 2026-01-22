import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Json } from '@/integrations/supabase/types';

// Device types matching database schema
export interface RMMDevice {
  id: string;
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
  customer_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RMMAlert {
  id: string;
  title: string;
  message: string | null;
  severity: string;
  status: string;
  alert_type: string;
  source: string;
  client_id: string;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  created_at: string;
  metadata: Json | null;
}

// Match actual rmm_scripts schema
export interface RMMScript {
  id: string;
  name: string;
  description: string | null;
  script_type: string;
  script_content: string;
  category: string | null;
  is_template: boolean | null;
  requires_elevation: boolean | null;
  execution_timeout: number | null;
  tags: string[] | null;
  parameters: Json | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Match actual rmm_script_executions schema
export interface ScriptExecution {
  id: string;
  script_id: string;
  agent_id: string;
  user_id: string;
  status: string;
  exit_code: number | null;
  output: string | null;
  error_message: string | null;
  execution_time_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  command_id: string | null;
  parameters: Json | null;
}

export interface SafeOpsStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  criticalAlerts: number;
  openAlerts: number;
  serversCount: number;
  workstationsCount: number;
  scriptsRunning: number;
}

export const useSafeOps = () => {
  const [devices, setDevices] = useState<RMMDevice[]>([]);
  const [alerts, setAlerts] = useState<RMMAlert[]>([]);
  const [scripts, setScripts] = useState<RMMScript[]>([]);
  const [executions, setExecutions] = useState<ScriptExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<SafeOpsStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    criticalAlerts: 0,
    openAlerts: 0,
    serversCount: 0,
    workstationsCount: 0,
    scriptsRunning: 0
  });

  const { user } = useAuth();
  const { toast } = useToast();

  // Load all devices
  const loadDevices = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .select('*')
        .order('last_seen', { ascending: false });

      if (error) throw error;
      
      const devicesData = data || [];
      setDevices(devicesData as unknown as RMMDevice[]);
      
      // Calculate stats
      const onlineDevices = devicesData.filter(d => d.status === 'online').length;
      const offlineDevices = devicesData.filter(d => d.status === 'offline').length;
      const serversCount = devicesData.filter(d => d.device_type === 'server').length;
      const workstationsCount = devicesData.filter(d => d.device_type === 'workstation').length;
      
      setStats(prev => ({
        ...prev,
        totalDevices: devicesData.length,
        onlineDevices,
        offlineDevices,
        serversCount,
        workstationsCount
      }));
      
      return devicesData;
    } catch (error) {
      console.error('Error loading devices:', error);
      toast({
        title: "Error",
        description: "Failed to load devices",
        variant: "destructive"
      });
      return [];
    }
  }, [user, toast]);

  // Load all alerts
  const loadAlerts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rmm_alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const alertsData = data || [];
      setAlerts(alertsData as unknown as RMMAlert[]);
      
      const criticalAlerts = alertsData.filter(a => a.severity === 'critical' && a.status === 'open').length;
      const openAlerts = alertsData.filter(a => a.status === 'open').length;
      
      setStats(prev => ({
        ...prev,
        criticalAlerts,
        openAlerts
      }));
      
      return alertsData;
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        title: "Error",
        description: "Failed to load alerts",
        variant: "destructive"
      });
      return [];
    }
  }, [user, toast]);

  // Load scripts
  const loadScripts = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rmm_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data as unknown as RMMScript[] || []);
      return data || [];
    } catch (error) {
      console.error('Error loading scripts:', error);
      return [];
    }
  }, [user]);

  // Load script executions
  const loadExecutions = useCallback(async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('rmm_script_executions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const executionsData = data || [];
      setExecutions(executionsData as unknown as ScriptExecution[]);
      
      const scriptsRunning = executionsData.filter(e => e.status === 'running').length;
      setStats(prev => ({ ...prev, scriptsRunning }));
      
      return executionsData;
    } catch (error) {
      console.error('Error loading executions:', error);
      return [];
    }
  }, [user]);

  // Add new device
  const addDevice = async (deviceData: Partial<RMMDevice>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .insert({
          hostname: deviceData.hostname || 'Unknown',
          ip_address: deviceData.ip_address || '0.0.0.0',
          device_type: deviceData.device_type || 'workstation',
          status: deviceData.status || 'offline'
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Device Added",
        description: `${deviceData.hostname} has been added successfully`
      });
      
      await loadDevices();
      return data;
    } catch (error) {
      console.error('Error adding device:', error);
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive"
      });
      return null;
    }
  };

  // Update device
  const updateDevice = async (deviceId: string, updates: Partial<RMMDevice>) => {
    try {
      const { data, error } = await supabase
        .from('rmm_devices')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', deviceId)
        .select()
        .single();

      if (error) throw error;
      
      await loadDevices();
      return data;
    } catch (error) {
      console.error('Error updating device:', error);
      toast({
        title: "Error",
        description: "Failed to update device",
        variant: "destructive"
      });
      return null;
    }
  };

  // Delete device
  const deleteDevice = async (deviceId: string) => {
    try {
      const { error } = await supabase
        .from('rmm_devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;
      
      setDevices(prev => prev.filter(d => d.id !== deviceId));
      toast({
        title: "Device Removed",
        description: "Device has been removed successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting device:', error);
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive"
      });
      return false;
    }
  };

  // Create alert
  const createAlert = async (alertData: Partial<RMMAlert>) => {
    try {
      const { data, error } = await supabase
        .from('rmm_alerts')
        .insert({
          title: alertData.title || 'New Alert',
          severity: alertData.severity || 'medium',
          status: 'open',
          alert_type: alertData.alert_type || 'system',
          source: alertData.source || 'manual',
          client_id: alertData.client_id || user?.id || '',
          message: alertData.message,
          metadata: alertData.metadata
        })
        .select()
        .single();

      if (error) throw error;
      
      await loadAlerts();
      return data;
    } catch (error) {
      console.error('Error creating alert:', error);
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive"
      });
      return null;
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('rmm_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_by: user?.id,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged"
      });
      
      await loadAlerts();
      return true;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive"
      });
      return false;
    }
  };

  // Resolve alert
  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('rmm_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', alertId);

      if (error) throw error;
      
      toast({
        title: "Alert Resolved",
        description: "Alert has been resolved"
      });
      
      await loadAlerts();
      return true;
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        title: "Error", 
        description: "Failed to resolve alert",
        variant: "destructive"
      });
      return false;
    }
  };

  // Execute script on agent
  const executeScript = async (scriptId: string, agentId: string) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('rmm_script_executions')
        .insert({
          script_id: scriptId,
          agent_id: agentId,
          user_id: user.id,
          status: 'pending',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Script Queued",
        description: "Script execution has been queued"
      });
      
      await loadExecutions();
      return data;
    } catch (error) {
      console.error('Error executing script:', error);
      toast({
        title: "Error",
        description: "Failed to queue script execution",
        variant: "destructive"
      });
      return null;
    }
  };

  // Create script
  const createScript = async (scriptData: Partial<RMMScript>) => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('rmm_scripts')
        .insert({
          name: scriptData.name || 'New Script',
          description: scriptData.description,
          script_type: scriptData.script_type || 'powershell',
          script_content: scriptData.script_content || '',
          category: scriptData.category,
          is_template: scriptData.is_template ?? false,
          requires_elevation: scriptData.requires_elevation ?? false,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Script Created",
        description: "New script has been created"
      });
      
      await loadScripts();
      return data;
    } catch (error) {
      console.error('Error creating script:', error);
      toast({
        title: "Error",
        description: "Failed to create script",
        variant: "destructive"
      });
      return null;
    }
  };

  // Refresh all data
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadDevices(),
      loadAlerts(),
      loadScripts(),
      loadExecutions()
    ]);
    setIsLoading(false);
  }, [loadDevices, loadAlerts, loadScripts, loadExecutions]);

  // Initialize data and set up real-time subscriptions
  useEffect(() => {
    if (!user) return;

    refreshAll();

    // Real-time subscriptions
    const devicesChannel = supabase
      .channel('safeops-devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rmm_devices' }, () => {
        loadDevices();
      })
      .subscribe();

    const alertsChannel = supabase
      .channel('safeops-alerts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rmm_alerts' }, (payload) => {
        loadAlerts();
        // Show toast for new critical alerts
        if (payload.eventType === 'INSERT') {
          const newAlert = payload.new as { severity?: string; title?: string };
          if (newAlert.severity === 'critical') {
            toast({
              title: "🚨 Critical Alert",
              description: newAlert.title || 'New critical alert',
              variant: "destructive"
            });
          }
        }
      })
      .subscribe();

    const executionsChannel = supabase
      .channel('safeops-executions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rmm_script_executions' }, () => {
        loadExecutions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(devicesChannel);
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(executionsChannel);
    };
  }, [user, refreshAll, loadDevices, loadAlerts, loadExecutions, toast]);

  // Helper functions
  const getDevicesByType = (type: string) => devices.filter(d => d.device_type === type);
  const getDevicesByStatus = (status: string) => devices.filter(d => d.status === status);
  const getCriticalDevices = () => devices.filter(d => 
    (d.cpu_usage && d.cpu_usage > 85) || 
    (d.memory_usage && d.memory_usage > 90) ||
    (d.disk_usage && d.disk_usage > 90)
  );
  const getOpenAlerts = () => alerts.filter(a => a.status === 'open');
  const getCriticalAlerts = () => alerts.filter(a => a.severity === 'critical' && a.status === 'open');

  return {
    // Data
    devices,
    alerts,
    scripts,
    executions,
    stats,
    isLoading,
    
    // Device operations
    addDevice,
    updateDevice,
    deleteDevice,
    loadDevices,
    
    // Alert operations
    createAlert,
    acknowledgeAlert,
    resolveAlert,
    loadAlerts,
    
    // Script operations
    createScript,
    executeScript,
    loadScripts,
    loadExecutions,
    
    // Helpers
    getDevicesByType,
    getDevicesByStatus,
    getCriticalDevices,
    getOpenAlerts,
    getCriticalAlerts,
    refreshAll
  };
};

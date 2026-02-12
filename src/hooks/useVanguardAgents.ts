import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface VanguardAgent {
  id: string;
  device_id: string;
  name: string;
  location: string | null;
  ip_address: string | null;
  vpn_ip: string | null;
  api_endpoint: string | null;
  agent_version: string | null;
  firmware_version: string | null;
  hailo_board_name: string | null;
  hailo_status: Record<string, any>;
  status: 'online' | 'offline' | 'warning' | 'critical';
  last_heartbeat: string | null;
  config: Record<string, any>;
  // Populated by vanguard-agent-api security_telemetry
  security_status?: Record<string, any> | null;
  client_id: string | null;
  os_info?: string;
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  created_at: string;
  updated_at: string;
  // Agent type differentiation
  agent_type: 'windows' | 'pi_appliance';
  // Availability monitoring
  availability_monitoring_enabled?: boolean;
  // Remote access (legacy field, kept for DB compat)
  rustdesk_id?: string | null;
  // Pi appliance specific fields
  is_network_scanner?: boolean;
  scanner_subnets?: string[];
  last_scan_at?: string | null;
  scan_interval_seconds?: number;
  firewall_rules?: Record<string, any>[];
  traffic_stats?: Record<string, any>;
  threat_detections?: Record<string, any>[];
  ml_model_version?: string | null;
  inference_stats?: Record<string, any>;
  office_location_id?: string | null;
}

export interface VanguardMetric {
  id: string;
  agent_id: string;
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
  network_rx_bytes: number;
  network_tx_bytes: number;
  temperature: number | null;
  hailo_status: Record<string, any>;
  custom_metrics: Record<string, any>;
  recorded_at: string;
}

export interface VanguardCommand {
  id: string;
  agent_id: string;
  command_type: string;
  payload: Record<string, any>;
  status: 'pending' | 'sent' | 'completed' | 'failed';
  response: Record<string, any> | null;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

// Calculate device status based on last heartbeat
// Threshold: 5 minutes = online, 5-15 min = warning, >15 min = offline
const calculateStatus = (lastHeartbeat: string | null, dbStatus: string): 'online' | 'offline' | 'warning' | 'critical' => {
  if (!lastHeartbeat) return 'offline';
  
  const now = Date.now();
  const heartbeatTime = new Date(lastHeartbeat).getTime();
  const ageMinutes = (now - heartbeatTime) / (1000 * 60);
  
  // If database says critical (resource threshold exceeded), keep it
  if (dbStatus === 'critical' && ageMinutes < 5) return 'critical';
  
  if (ageMinutes < 5) return 'online';
  if (ageMinutes < 15) return 'warning';
  return 'offline';
};

export function useVanguardAgents() {
  const { user } = useAuth();
  const [agents, setAgents] = useState<VanguardAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('vanguard_agents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      // Calculate accurate status based on heartbeat age
      const agentsWithStatus = (data || []).map((agent: any) => ({
        ...agent,
        status: calculateStatus(agent.last_heartbeat, agent.status)
      })) as VanguardAgent[];
      
      setAgents(agentsWithStatus);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching vanguard agents:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAgents();

    // Set up real-time subscription
    const channel = supabase
      .channel('vanguard_agents_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vanguard_agents' },
        () => {
          fetchAgents();
        }
      )
      .subscribe();

    // Poll every 60 seconds as a fallback for missed real-time events
    const pollInterval = setInterval(() => {
      fetchAgents();
    }, 60000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [fetchAgents]);

  const deleteAgent = useCallback(async (agentId: string) => {
    if (!user) throw new Error('Not authenticated');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const resp = await supabase.functions.invoke('vanguard-agent-api?action=delete_agent', {
        body: { agent_id: agentId },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (resp.error) throw resp.error;

      toast.success('Device deleted');
      await fetchAgents();
    } catch (err: any) {
      console.error('Error deleting vanguard agent:', err);
      toast.error('Failed to delete device', { description: err.message });
      throw err;
    }
  }, [user, fetchAgents]);

  return { agents, isLoading, error, refetch: fetchAgents, deleteAgent };
}

export function useVanguardAgent(agentId: string | undefined) {
  const { user } = useAuth();
  const [agent, setAgent] = useState<VanguardAgent | null>(null);
  const [metrics, setMetrics] = useState<VanguardMetric[]>([]);
  const [commands, setCommands] = useState<VanguardCommand[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const normalizeAgentForUI = useCallback((raw: VanguardAgent, metricsList: VanguardMetric[]) => {
    const normalized: VanguardAgent = {
      ...raw,
      config: { ...(raw.config || {}) },
    };

    // Find the most recent telemetry record with useful data
    const telemetryRecords = [...(metricsList || [])].reverse();
    const lastTelemetry = telemetryRecords.find(m => 
      (m.custom_metrics as any)?.last_telemetry_at || 
      (m.custom_metrics as any)?.disks ||
      (m.custom_metrics as any)?.network_adapters
    );
    const telemetryData = (lastTelemetry?.custom_metrics as any) || {};

    // OS badge + OS & Security tab currently rely on agent.os_info and config.os
    const hw = (normalized.config as any)?.hardware || {};
    if (!normalized.os_info && hw?.os_name) {
      normalized.os_info = hw.os_name;
    }

    if (!(normalized.config as any).os) {
      (normalized.config as any).os = {};
    }
    const os = (normalized.config as any).os;
    if (!os.version && hw?.os_version) os.version = hw.os_version;

    // Extract private IP from network_adapters in telemetry
    // Look for the first active adapter with a non-link-local IP (not 169.254.x.x)
    if (!normalized.vpn_ip && Array.isArray(telemetryData.network_adapters)) {
      const activeAdapter = telemetryData.network_adapters.find((adapter: any) => {
        const ip = adapter.ip_address || adapter.ipAddress;
        return adapter.status === 'Up' && ip && !ip.startsWith('169.254.');
      });
      if (activeAdapter) {
        normalized.vpn_ip = activeAdapter.ip_address || activeAdapter.ipAddress;
      }
    }

    // Store network adapters in config for hardware tab
    if (Array.isArray(telemetryData.network_adapters) && telemetryData.network_adapters.length > 0) {
      (normalized.config as any).network_adapters = telemetryData.network_adapters;
      
      // Build mac_addresses array for hardware tab
      const macAddresses = telemetryData.network_adapters
        .filter((a: any) => a.mac_address || a.macAddress)
        .map((a: any, idx: number) => ({
          address: a.mac_address || a.macAddress,
          name: a.name || `Adapter ${idx + 1}`,
          primary: a.status === 'Up' && !(a.ip_address || '').startsWith('169.254.')
        }));
      if (macAddresses.length > 0) {
        (normalized.config as any).hardware = {
          ...(normalized.config as any).hardware,
          mac_addresses: macAddresses
        };
      }
    }

    // Security tab relies on config.security, but Defender telemetry is stored in security_status
    const ss: any = (normalized as any).security_status;
    if (ss && !(normalized.config as any).security) {
      (normalized.config as any).security = {};
    }
    if (ss) {
      const security = (normalized.config as any).security;
      // If Defender is enabled, treat AV + antispyware as enabled.
      const defenderEnabled = Boolean(ss.defender_enabled);
      const rtProtection = Boolean(ss.real_time_protection);

      security.antivirus_name ??= 'Windows Defender';
      security.antispyware_name ??= 'Windows Defender';
      security.firewall_name ??= 'Windows Firewall';
      security.antivirus_status = defenderEnabled ? 'enabled' : 'disabled';
      security.antispyware_status = defenderEnabled ? 'enabled' : 'disabled';

      // We don't currently collect firewall state in security_telemetry; show unknown rather than wrong.
      security.firewall_status ??= 'unknown';

      // Useful extra fields for future UI (non-breaking)
      security.defender_real_time_protection = rtProtection;
      security.signature_version = ss.signature_version ?? null;
      security.signature_last_updated = ss.signature_last_updated ?? null;
      security.last_quick_scan = ss.last_quick_scan ?? null;
      security.last_full_scan = ss.last_full_scan ?? null;
      security.recent_threats_count = ss.recent_threats_count ?? 0;
      security.quarantined_count = ss.quarantined_count ?? 0;
      security.updated_at = ss.updated_at ?? null;
    }

    // Disks tab expects config.disks - prefer data stored directly in config, fall back to metrics
    if (!(normalized.config as any).disks || (normalized.config as any).disks.length === 0) {
      const telemetryDisks = telemetryData.disks;
      if (Array.isArray(telemetryDisks) && telemetryDisks.length > 0) {
        (normalized.config as any).disks = telemetryDisks;
      }
    }

    // Software tab expects config.installed_software - prefer data stored directly in config
    if (!(normalized.config as any).installed_software || (normalized.config as any).installed_software.length === 0) {
      const telemetrySoftware = telemetryData.installed_software;
      if (Array.isArray(telemetrySoftware) && telemetrySoftware.length > 0) {
        (normalized.config as any).installed_software = telemetrySoftware;
      }
    }

    // Store last_telemetry timestamp for debugging
    const configLastTelemetry = (normalized.config as any).last_telemetry_at || telemetryData.last_telemetry_at;
    if (configLastTelemetry) {
      (normalized.config as any).last_telemetry_at = configLastTelemetry;
    }

    return normalized;
  }, []);

  const fetchAgent = useCallback(async () => {
    if (!user || !agentId) return;

    try {
      setIsLoading(true);
      
       // Fetch agent details
       const { data: agentData, error: agentError } = await supabase
         .from('vanguard_agents')
         .select('*')
         .eq('id', agentId)
         .eq('user_id', user.id)
         .single();

      if (agentError) throw agentError;

      // Fetch recent metrics (last 24 hours)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: metricsData } = await supabase
        .from('vanguard_agent_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });

       const metricsList = (metricsData as VanguardMetric[]) || [];
       setMetrics(metricsList);

       // Calculate accurate status based on heartbeat age
       const agentWithStatus = {
         ...agentData,
         status: calculateStatus(agentData.last_heartbeat, agentData.status)
       } as VanguardAgent;
       
       const normalized = normalizeAgentForUI(agentWithStatus, metricsList);
       setAgent(normalized);

      // Fetch recent commands
      const { data: commandsData } = await supabase
        .from('vanguard_agent_commands')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(20);

      setCommands((commandsData as VanguardCommand[]) || []);
    } catch (err: any) {
      console.error('Error fetching vanguard agent:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, agentId, normalizeAgentForUI]);

  useEffect(() => {
    fetchAgent();

    // Real-time subscription for agent row updates (security status, config updates, etc.)
    const agentChannel = supabase
      .channel(`vanguard_agent_${agentId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vanguard_agents', filter: `id=eq.${agentId}` },
        () => {
          // Re-fetch so we can normalize + keep tabs in sync with telemetry writes.
          fetchAgent();
        }
      )
      .subscribe();

    // Real-time subscription for metrics
    const metricsChannel = supabase
      .channel(`vanguard_metrics_${agentId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'vanguard_agent_metrics', filter: `agent_id=eq.${agentId}` },
        (payload) => {
          setMetrics(prev => [...prev.slice(-100), payload.new as VanguardMetric]);
        }
      )
      .subscribe();

    // Real-time subscription for commands
    const commandsChannel = supabase
      .channel(`vanguard_commands_${agentId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vanguard_agent_commands', filter: `agent_id=eq.${agentId}` },
        () => {
          fetchAgent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(agentChannel);
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(commandsChannel);
    };
  }, [agentId, fetchAgent]);

  // Update agent config helper
  const updateAgentConfig = useCallback(async (configUpdates: Partial<Record<string, any>>) => {
    if (!agentId || !user || !agent) throw new Error('Not authenticated or no agent');

    const newConfig = { ...agent.config, ...configUpdates };
    
    const { error } = await supabase
      .from('vanguard_agents')
      .update({ 
        config: newConfig, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', agentId)
      .eq('user_id', user.id);

    if (error) throw error;
    
    // Update local state
    setAgent(prev => prev ? { ...prev, config: newConfig } : null);
    
    return newConfig;
  }, [agentId, user, agent]);

  // Password management
  const addPassword = useCallback(async (password: {
    name: string;
    username?: string;
    password: string;
    notes?: string;
  }) => {
    const passwords = agent?.config?.passwords || [];
    const newPassword = {
      id: crypto.randomUUID(),
      ...password,
      created_at: new Date().toISOString(),
    };
    
    await updateAgentConfig({ passwords: [...passwords, newPassword] });
    toast.success('Password saved securely');
    return newPassword;
  }, [agent, updateAgentConfig]);

  const deletePassword = useCallback(async (passwordId: string) => {
    const passwords = agent?.config?.passwords || [];
    const filtered = passwords.filter((p: any) => p.id !== passwordId);
    await updateAgentConfig({ passwords: filtered });
    toast.success('Password deleted');
  }, [agent, updateAgentConfig]);

  // Custom fields management
  const addCustomField = useCallback(async (field: {
    name: string;
    type: string;
    value: any;
    options?: string[];
  }) => {
    const fields = agent?.config?.custom_fields || [];
    const newField = {
      id: crypto.randomUUID(),
      ...field,
    };
    
    await updateAgentConfig({ custom_fields: [...fields, newField] });
    toast.success('Custom field added');
    return newField;
  }, [agent, updateAgentConfig]);

  const updateCustomField = useCallback(async (fieldId: string, updates: Partial<{
    name: string;
    type: string;
    value: any;
    options?: string[];
  }>) => {
    const fields = agent?.config?.custom_fields || [];
    const updated = fields.map((f: any) => 
      f.id === fieldId ? { ...f, ...updates } : f
    );
    await updateAgentConfig({ custom_fields: updated });
    toast.success('Custom field updated');
  }, [agent, updateAgentConfig]);

  const deleteCustomField = useCallback(async (fieldId: string) => {
    const fields = agent?.config?.custom_fields || [];
    const filtered = fields.filter((f: any) => f.id !== fieldId);
    await updateAgentConfig({ custom_fields: filtered });
    toast.success('Custom field deleted');
  }, [agent, updateAgentConfig]);

  // Attachments management
  const addAttachment = useCallback(async (attachment: {
    name: string;
    size: number;
    type: string;
    file: File;
  }) => {
    // In a real implementation, you would upload the file to storage first
    // For now, we'll store metadata only
    const attachments = agent?.config?.attachments || [];
    const newAttachment = {
      id: crypto.randomUUID(),
      name: attachment.name,
      size: attachment.size,
      type: attachment.type,
      uploaded_at: new Date().toISOString(),
      // In production: store the storage URL here after upload
    };
    
    await updateAgentConfig({ attachments: [...attachments, newAttachment] });
    toast.success('Attachment added');
    return newAttachment;
  }, [agent, updateAgentConfig]);

  const deleteAttachment = useCallback(async (attachmentId: string) => {
    const attachments = agent?.config?.attachments || [];
    const filtered = attachments.filter((a: any) => a.id !== attachmentId);
    await updateAgentConfig({ attachments: filtered });
    toast.success('Attachment deleted');
  }, [agent, updateAgentConfig]);

  // Monitored devices management
  const addMonitoredDevice = useCallback(async (device: {
    name: string;
    type: string;
    ip_address: string;
    port?: number;
  }) => {
    const devices = agent?.config?.monitored_devices || [];
    const newDevice = {
      id: crypto.randomUUID(),
      ...device,
      status: 'offline' as const,
      last_checked: new Date().toISOString(),
    };
    
    await updateAgentConfig({ monitored_devices: [...devices, newDevice] });
    toast.success('Monitored device added');
    return newDevice;
  }, [agent, updateAgentConfig]);

  const deleteMonitoredDevice = useCallback(async (deviceId: string) => {
    const devices = agent?.config?.monitored_devices || [];
    const filtered = devices.filter((d: any) => d.id !== deviceId);
    await updateAgentConfig({ monitored_devices: filtered });
    toast.success('Monitored device removed');
  }, [agent, updateAgentConfig]);

  const askVanguard = async (question: string): Promise<string> => {
    if (!agentId || !user) throw new Error('Not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('vanguard-agent-api?action=ask', {
      body: { agent_id: agentId, question },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) throw response.error;
    
    if (response.data.status === 'queued') {
      return 'Question queued - waiting for agent response...';
    }
    
    return response.data.answer || 'No response';
  };

  const sendCommand = async (commandType: string, payload?: Record<string, any>) => {
    if (!agentId || !user) throw new Error('Not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('vanguard-agent-api?action=send_command', {
      body: { agent_id: agentId, command_type: commandType, payload },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) throw response.error;
    toast.success(`Command "${commandType}" queued`);
    fetchAgent();
    return response.data;
  };

  const toggleAvailabilityMonitoring = useCallback(async (enabled: boolean) => {
    if (!agentId || !user) throw new Error('Not authenticated');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session');

    const response = await supabase.functions.invoke('availability-monitor', {
      body: { action: 'toggle', device_id: agentId, enabled },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (response.error) throw response.error;
    
    // Update local state
    setAgent(prev => prev ? { ...prev, availability_monitoring_enabled: enabled } : null);
    toast.success(enabled ? 'Availability monitoring enabled' : 'Availability monitoring disabled');
    
    return response.data;
  }, [agentId, user]);

  return { 
    agent, 
    metrics, 
    commands, 
    isLoading, 
    askVanguard, 
    sendCommand, 
    refetch: fetchAgent,
    // Config management
    updateAgentConfig,
    // Password CRUD
    addPassword,
    deletePassword,
    // Custom field CRUD
    addCustomField,
    updateCustomField,
    deleteCustomField,
    // Attachment CRUD
    addAttachment,
    deleteAttachment,
    // Monitored device CRUD
    addMonitoredDevice,
    deleteMonitoredDevice,
    // Availability monitoring
    toggleAvailabilityMonitoring,
  };
}

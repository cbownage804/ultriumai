import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface HorizonStats {
  // Device stats
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  criticalDevices: number;
  
  // Client stats (MSP mode)
  totalClients: number;
  activeClients: number;
  
  // Patch stats
  pendingPatches: number;
  criticalPatches: number;
  patchCompliance: number;
  
  // Alert stats
  activeAlerts: number;
  criticalAlerts: number;
  
  // Ticket stats
  openTickets: number;
  urgentTickets: number;
  
  // Performance averages
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
  
  // Security
  devicesWithAV: number;
  devicesWithMDR: number;
  highRiskDevices: number;
}

export interface DeviceWithMetrics {
  id: string;
  name: string;
  device_id: string;
  status: string;
  ip_address: string | null;
  location: string | null;
  agent_version: string | null;
  os_info: string | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  disk_usage: number | null;
  last_heartbeat: string | null;
  client_id: string | null;
  agent_type: string;
  hailo_board_name: string | null;
  config: Record<string, unknown>;
}

export function useHorizonStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<HorizonStats>({
    totalDevices: 0,
    onlineDevices: 0,
    offlineDevices: 0,
    warningDevices: 0,
    criticalDevices: 0,
    totalClients: 0,
    activeClients: 0,
    pendingPatches: 0,
    criticalPatches: 0,
    patchCompliance: 100,
    activeAlerts: 0,
    criticalAlerts: 0,
    openTickets: 0,
    urgentTickets: 0,
    avgCpuUsage: 0,
    avgMemoryUsage: 0,
    avgDiskUsage: 0,
    devicesWithAV: 0,
    devicesWithMDR: 0,
    highRiskDevices: 0,
  });
  const [devices, setDevices] = useState<DeviceWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch all devices for this user
      const { data: agentsData, error: agentsError } = await supabase
        .from('vanguard_agents')
        .select('id, name, device_id, status, ip_address, location, agent_version, firmware_version, last_heartbeat, client_id, agent_type, hailo_board_name, config')
        .eq('user_id', user.id);

      if (agentsError) throw agentsError;

      const agents = (agentsData || []) as Array<{
        id: string;
        name: string;
        device_id: string;
        status: string;
        ip_address: unknown;
        location: string | null;
        agent_version: string | null;
        firmware_version: string | null;
        last_heartbeat: string | null;
        client_id: string | null;
        agent_type: string | null;
        hailo_board_name: string | null;
        config: unknown;
      }>;
      
      // Calculate device status counts
      const onlineDevices = agents.filter(a => a.status === 'online').length;
      const offlineDevices = agents.filter(a => a.status === 'offline').length;
      const warningDevices = agents.filter(a => a.status === 'warning').length;
      const criticalDevices = agents.filter(a => a.status === 'critical').length;

      // Calculate average metrics from latest metrics
      let totalCpu = 0, totalMemory = 0, totalDisk = 0, metricsCount = 0;
      const agentMetricsMap = new Map<string, { cpu: number; memory: number; disk: number }>();
      
      // Fetch latest metrics for each agent (batch query)
      if (agents.length > 0) {
        const agentIds = agents.map(a => a.id);
        const { data: allMetrics } = await supabase
          .from('vanguard_agent_metrics')
          .select('agent_id, cpu_percent, memory_percent, disk_percent, recorded_at')
          .in('agent_id', agentIds)
          .order('recorded_at', { ascending: false });

        // Get latest metric per agent
        if (allMetrics) {
          const seenAgents = new Set<string>();
          for (const m of allMetrics) {
            if (!seenAgents.has(m.agent_id)) {
              seenAgents.add(m.agent_id);
              agentMetricsMap.set(m.agent_id, {
                cpu: m.cpu_percent || 0,
                memory: m.memory_percent || 0,
                disk: m.disk_percent || 0,
              });
              totalCpu += m.cpu_percent || 0;
              totalMemory += m.memory_percent || 0;
              totalDisk += m.disk_percent || 0;
              metricsCount++;
            }
          }
        }
      }

      // Fetch clients - simplified query
      let clients: Array<{ id: string; is_active: boolean }> = [];
      try {
        const { data } = await (supabase as any)
          .from('msp_clients')
          .select('id, is_active')
          .eq('user_id', user.id);
        clients = data || [];
      } catch { /* ignore */ }

      // Fetch patches
      const { data: patchesData } = await supabase
        .from('patch_management')
        .select('severity, status')
        .eq('user_id', user.id) as { data: Array<{ severity: string; status: string }> | null };

      const patches = patchesData || [];
      const pendingPatches = patches.filter(p => p.status === 'pending').length;
      const criticalPatches = patches.filter(p => p.severity === 'critical' && p.status !== 'completed').length;
      const completedPatches = patches.filter(p => p.status === 'completed').length;
      const patchCompliance = patches.length > 0 
        ? Math.round((completedPatches / patches.length) * 100) 
        : 100;

      // Fetch alerts
      const { data: alertsData } = await supabase
        .from('vanguard_alert_history')
        .select('severity, status')
        .eq('user_id', user.id)
        .eq('status', 'open') as { data: Array<{ severity: string; status: string }> | null };

      const alerts = alertsData || [];

      // Fetch tickets - simplified query
      let tickets: Array<{ priority: string; status: string }> = [];
      try {
        const { data } = await (supabase as any)
          .from('helpdesk_tickets')
          .select('priority, status')
          .eq('user_id', user.id)
          .in('status', ['open', 'in_progress']);
        tickets = data || [];
      } catch { /* ignore */ }

      // Calculate security metrics based on config
      const devicesWithAV = agents.filter(a => {
        const config = a.config as Record<string, unknown> | null;
        const security = config?.security as Record<string, unknown> | undefined;
        return security?.av_enabled !== false;
      }).length;
      
      const devicesWithMDR = agents.filter(a => {
        const config = a.config as Record<string, unknown> | null;
        const security = config?.security as Record<string, unknown> | undefined;
        return security?.mdr_enabled === true;
      }).length;
      
      const highRiskDevices = criticalDevices + agents.filter(a => {
        const metrics = agentMetricsMap.get(a.id);
        return metrics && (metrics.cpu > 90 || metrics.memory > 90 || metrics.disk > 95);
      }).length;

      setStats({
        totalDevices: agents.length,
        onlineDevices,
        offlineDevices,
        warningDevices,
        criticalDevices,
        totalClients: clients.length,
        activeClients: clients.filter(c => c.is_active).length,
        pendingPatches,
        criticalPatches,
        patchCompliance,
        activeAlerts: alerts.length,
        criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
        openTickets: tickets.length,
        urgentTickets: tickets.filter(t => t.priority === 'urgent' || t.priority === 'high').length,
        avgCpuUsage: metricsCount > 0 ? Math.round(totalCpu / metricsCount) : 0,
        avgMemoryUsage: metricsCount > 0 ? Math.round(totalMemory / metricsCount) : 0,
        avgDiskUsage: metricsCount > 0 ? Math.round(totalDisk / metricsCount) : 0,
        devicesWithAV,
        devicesWithMDR,
        highRiskDevices,
      });

      // Map devices with their latest metrics
      setDevices(agents.map(a => {
        const metrics = agentMetricsMap.get(a.id);
        return {
          id: a.id,
          name: a.name,
          device_id: a.device_id,
          status: a.status,
          ip_address: typeof a.ip_address === 'string' ? a.ip_address : null,
          location: a.location,
          agent_version: a.agent_version,
          os_info: a.firmware_version,
          cpu_usage: metrics?.cpu ?? null,
          memory_usage: metrics?.memory ?? null,
          disk_usage: metrics?.disk ?? null,
          last_heartbeat: a.last_heartbeat,
          client_id: a.client_id,
          agent_type: a.agent_type || 'windows',
          hailo_board_name: a.hailo_board_name,
          config: (a.config as Record<string, unknown>) || {},
        };
      }));

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error fetching Horizon stats:', err);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription
    const channel = supabase
      .channel('horizon_stats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vanguard_agents' }, () => {
        fetchStats();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vanguard_agent_metrics' }, () => {
        fetchStats();
      })
      .subscribe();

    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [fetchStats]);

  return { stats, devices, isLoading, error, refetch: fetchStats };
}

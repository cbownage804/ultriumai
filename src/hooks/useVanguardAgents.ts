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
  created_at: string;
  updated_at: string;
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
      setAgents((data as VanguardAgent[]) || []);
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

    return () => {
      supabase.removeChannel(channel);
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
      setAgent(agentData as VanguardAgent);

      // Fetch recent metrics (last 24 hours)
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: metricsData } = await supabase
        .from('vanguard_agent_metrics')
        .select('*')
        .eq('agent_id', agentId)
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });

      setMetrics((metricsData as VanguardMetric[]) || []);

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
  }, [user, agentId]);

  useEffect(() => {
    fetchAgent();

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
      supabase.removeChannel(metricsChannel);
      supabase.removeChannel(commandsChannel);
    };
  }, [agentId, fetchAgent]);

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

  return { agent, metrics, commands, isLoading, askVanguard, sendCommand, refetch: fetchAgent };
}

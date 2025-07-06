import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AgentRegistration {
  hostname: string;
  ip_address: string;
  os_info: string;
  device_type: string;
  agent_version: string;
  client_id?: string;
  msp_id?: string;
}

interface RemoteSession {
  device_id: string;
  session_type: 'rdp' | 'vnc' | 'ssh' | 'web_terminal';
  initiator_user_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    const { action, ...payload } = await req.json();

    switch (action) {
      case 'register_agent':
        return await registerAgent(supabase, payload as AgentRegistration, user.id);
      
      case 'heartbeat':
        return await updateHeartbeat(supabase, payload.device_id, payload.metrics);
      
      case 'start_session':
        return await startRemoteSession(supabase, payload as RemoteSession);
      
      case 'end_session':
        return await endRemoteSession(supabase, payload.session_id);
      
      case 'get_agent_config':
        return await getAgentConfig(supabase, payload.device_id, user.id);
      
      case 'execute_command':
        return await executeRemoteCommand(supabase, payload.device_id, payload.command, user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('RMM Agent Manager Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function registerAgent(supabase: any, registration: AgentRegistration, userId: string) {
  // Register new RMM agent
  const { data: agent, error } = await supabase
    .from('rmm_endpoints')
    .upsert({
      hostname: registration.hostname,
      ip_address: registration.ip_address,
      os_info: registration.os_info,
      device_type: registration.device_type,
      agent_version: registration.agent_version,
      status: 'online',
      last_seen: new Date().toISOString(),
      client_id: registration.client_id,
      msp_id: registration.msp_id,
      user_id: userId,
      capabilities: {
        remote_desktop: true,
        file_transfer: true,
        command_execution: true,
        clipboard_sync: true,
        safedoc_integration: true,
        safepass_integration: true
      }
    }, {
      onConflict: 'hostname,ip_address',
      returning: 'minimal'
    });

  if (error) throw error;

  // Generate agent configuration
  const config = {
    agent_id: agent?.id || crypto.randomUUID(),
    websocket_url: `wss://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/rmm-realtime`,
    heartbeat_interval: 30000, // 30 seconds
    command_timeout: 300000, // 5 minutes
    features: {
      clipboard_sync: true,
      file_transfer: true,
      screen_recording: true,
      ai_assistant: true
    },
    integrations: {
      safedoc_enabled: true,
      safepass_enabled: true,
      ai_sidebar_enabled: true
    }
  };

  return new Response(
    JSON.stringify({ success: true, config }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateHeartbeat(supabase: any, deviceId: string, metrics: any) {
  const { error } = await supabase
    .from('rmm_endpoints')
    .update({
      last_seen: new Date().toISOString(),
      status: 'online',
      cpu_usage: metrics.cpu_usage,
      memory_usage: metrics.memory_usage,
      disk_usage: metrics.disk_usage,
      network_stats: metrics.network_stats
    })
    .eq('id', deviceId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function startRemoteSession(supabase: any, session: RemoteSession) {
  // Create remote session record
  const sessionId = crypto.randomUUID();
  
  const { error } = await supabase
    .from('rmm_sessions')
    .insert({
      id: sessionId,
      device_id: session.device_id,
      session_type: session.session_type,
      user_id: session.initiator_user_id,
      status: 'active',
      started_at: new Date().toISOString(),
      connection_info: {
        protocol: session.session_type,
        encryption: 'TLS_1_3',
        compression: true
      }
    });

  if (error) throw error;

  // Generate session token for secure connection
  const sessionToken = await generateSessionToken(sessionId, session.device_id);

  return new Response(
    JSON.stringify({ 
      success: true, 
      session_id: sessionId,
      session_token: sessionToken,
      connection_url: `wss://${Deno.env.get('SUPABASE_URL')?.replace('https://', '')}/functions/v1/rmm-remote-session?token=${sessionToken}`
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function endRemoteSession(supabase: any, sessionId: string) {
  const { error } = await supabase
    .from('rmm_sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString()
    })
    .eq('id', sessionId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAgentConfig(supabase: any, deviceId: string, userId: string) {
  // Get device-specific configuration
  const { data: device } = await supabase
    .from('rmm_endpoints')
    .select('*')
    .eq('id', deviceId)
    .eq('user_id', userId)
    .single();

  if (!device) throw new Error('Device not found');

  // Get SafeDoc and SafePass integration settings
  const config = {
    device_id: deviceId,
    safedoc_integration: {
      enabled: true,
      api_endpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/safedoc-agent-integration`,
      scan_on_access: true,
      quarantine_threats: true
    },
    safepass_integration: {
      enabled: true,
      api_endpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/safepass-agent-integration`,
      auto_fill: true,
      biometric_unlock: true
    },
    ai_assistant: {
      enabled: true,
      sidebar_position: 'right',
      context_awareness: true,
      document_analysis: true,
      password_suggestions: true
    }
  };

  return new Response(
    JSON.stringify({ success: true, config }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function executeRemoteCommand(supabase: any, deviceId: string, command: any, userId: string) {
  // Log command execution
  const executionId = crypto.randomUUID();
  
  const { error } = await supabase
    .from('rmm_command_executions')
    .insert({
      id: executionId,
      device_id: deviceId,
      user_id: userId,
      command_type: command.type,
      command_data: command.data,
      status: 'pending',
      created_at: new Date().toISOString()
    });

  if (error) throw error;

  // In a real implementation, this would send the command to the agent
  // For now, we'll simulate command execution
  setTimeout(async () => {
    await supabase
      .from('rmm_command_executions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: { success: true, output: 'Command executed successfully' }
      })
      .eq('id', executionId);
  }, 2000);

  return new Response(
    JSON.stringify({ 
      success: true, 
      execution_id: executionId,
      message: 'Command queued for execution'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateSessionToken(sessionId: string, deviceId: string): Promise<string> {
  // Generate secure session token (in production, use proper JWT)
  const payload = {
    session_id: sessionId,
    device_id: deviceId,
    issued_at: Date.now(),
    expires_at: Date.now() + (4 * 60 * 60 * 1000) // 4 hours
  };
  
  return btoa(JSON.stringify(payload));
}
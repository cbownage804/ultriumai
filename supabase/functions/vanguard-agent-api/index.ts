import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vanguard-key',
};

// Hardcoded secret - in production, use Deno.env.get('VANGUARD_AGENT_SECRET')
const VANGUARD_SECRET = "vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA";

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'heartbeat';
    
    // Check for agent key (for Pi/device requests)
    const agentKey = req.headers.get('x-vanguard-key');
    // Check for user JWT (for dashboard requests)
    const authHeader = req.headers.get('authorization');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const body = await req.json().catch(() => ({}));
    
    console.log(`[vanguard-agent-api] Action: ${action}, Device: ${body.device_id || 'N/A'}`);

    // Agent-side actions (require X-VANGUARD-KEY)
    if (['register', 'heartbeat', 'scan_results', 'get_commands', 'command_response'].includes(action)) {
      if (agentKey !== VANGUARD_SECRET) {
        console.error('[vanguard-agent-api] Invalid agent key');
        return new Response(
          JSON.stringify({ error: 'Invalid agent key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      switch (action) {
        case 'register':
          return await handleRegister(supabase, body);
        case 'heartbeat':
          return await handleHeartbeat(supabase, body);
        case 'scan_results':
          return await handleScanResults(supabase, body);
        case 'get_commands':
          return await getCommands(supabase, body);
        case 'command_response':
          return await handleCommandResponse(supabase, body);
      }
    }
    
    // Dashboard-side actions (require JWT auth)
    if (['ask', 'send_command', 'list_agents', 'get_metrics', 'delete_agent'].includes(action)) {
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify JWT and get user
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      switch (action) {
        case 'ask':
          return await handleAsk(supabase, user.id, body);
        case 'send_command':
          return await sendCommand(supabase, user.id, body);
        case 'list_agents':
          return await listAgents(supabase, user.id);
        case 'get_metrics':
          return await getMetrics(supabase, user.id, body);
        case 'delete_agent':
          return await deleteAgent(supabase, user.id, body);
      }
    }
    
    // Public action - download agent script
    if (action === 'download_agent') {
      return await downloadAgent();
    }
    
    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('[vanguard-agent-api] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============ AGENT-SIDE HANDLERS ============

async function handleRegister(supabase: any, body: any) {
  const { device_id, user_id } = body;
  
  if (!device_id || !user_id) {
    return new Response(
      JSON.stringify({ error: 'device_id and user_id are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[vanguard-agent-api] Register payload:`, JSON.stringify(body));
  
  // Parse registration data - handle both flat and nested formats
  const systemInfo = body.system_info || body.metrics?.system || {};
  
  // Extract IP address from various sources
  let ip_address = body.ip_address || systemInfo.ip_address;
  if (!ip_address && systemInfo.net_io) {
    // Try to extract from network interfaces
    const interfaces = Object.keys(systemInfo.net_io);
    if (interfaces.length > 0) {
      ip_address = systemInfo.net_io[interfaces[0]]?.ip_address;
    }
  }
  
  // Build the agent record with all available fields
  const agentData: Record<string, any> = {
    device_id,
    user_id,
    name: body.name || body.hostname || systemInfo.hostname || `Vanguard-${device_id.slice(0, 8)}`,
    location: body.location,
    vpn_ip: body.vpn_ip,
    api_endpoint: body.api_endpoint,
    agent_version: body.agent_version || body.version,
    firmware_version: body.firmware_version || systemInfo.os_version,
    hailo_board_name: body.hailo_board_name || body.hailo?.board_name,
    status: 'online',
    last_heartbeat: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Only include ip_address if valid
  if (ip_address) {
    agentData.ip_address = ip_address;
  }

  // Upsert the agent
  const { data, error } = await supabase
    .from('vanguard_agents')
    .upsert(agentData, { onConflict: 'device_id' })
    .select()
    .single();
  
  if (error) {
    console.error('[vanguard-agent-api] Register error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[vanguard-agent-api] Agent registered: ${device_id}, IP: ${ip_address}, Version: ${agentData.agent_version}`);
  return new Response(
    JSON.stringify({ status: 'ok', agent_id: data.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleHeartbeat(supabase: any, body: any) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Log raw body to debug what the agent is actually sending
  console.log(`[vanguard-agent-api] Heartbeat raw body:`, JSON.stringify(body));
  
  // Parse metrics - handle both nested format (from real agent) and flat format
  const metrics = body.metrics || body;
  const system = metrics.system || {};
  
  // Try nested format first (real agent), then flat format (simple agent)
  const cpu_percent = parseFloat(system.cpu_percent ?? metrics.cpu_percent ?? body.cpu_percent) || 0;
  const memory_percent = parseFloat(system.memory?.percent ?? metrics.memory_percent ?? body.memory_percent) || 0;
  const disk_percent = parseFloat(system.disk_root?.percent ?? metrics.disk_percent ?? body.disk_percent) || 0;
  
  // Network I/O - sum all interfaces or use direct values
  let network_rx_bytes: number | null = null;
  let network_tx_bytes: number | null = null;
  
  if (system.net_io) {
    // Sum bytes from all network interfaces
    network_rx_bytes = 0;
    network_tx_bytes = 0;
    for (const iface of Object.values(system.net_io) as any[]) {
      network_rx_bytes += (iface.bytes_recv || 0);
      network_tx_bytes += (iface.bytes_sent || 0);
    }
  } else {
    network_rx_bytes = parseInt(metrics.network_rx_bytes ?? body.network_rx_bytes) || null;
    network_tx_bytes = parseInt(metrics.network_tx_bytes ?? body.network_tx_bytes) || null;
  }
  
  // Temperature - try various sources
  const temperature = parseFloat(system.temperature ?? metrics.temperature ?? body.temperature) || null;
  
  // Hailo status from nested metrics or body
  const hailo_status = metrics.hailo || body.hailo_status || {};
  const custom_metrics = {
    ...(body.custom_metrics || {}),
    load_avg: system.load_avg,
    boot_time: system.boot_time,
    memory_total: system.memory?.total,
    memory_available: system.memory?.available,
    disk_total: system.disk_root?.total,
    disk_free: system.disk_root?.free,
  };
  
  // Get agent by device_id
  const { data: agent, error: agentError } = await supabase
    .from('vanguard_agents')
    .select('id, config')
    .eq('device_id', device_id)
    .single();
  
  if (agentError || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found. Please register first.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Calculate status based on thresholds
  const thresholds = agent.config?.thresholds || { cpu: 90, memory: 90, disk: 90 };
  let status = 'online';
  if (cpu_percent >= thresholds.cpu || memory_percent >= thresholds.memory || disk_percent >= thresholds.disk) {
    status = 'critical';
  } else if (cpu_percent >= thresholds.cpu * 0.8 || memory_percent >= thresholds.memory * 0.8 || disk_percent >= thresholds.disk * 0.8) {
    status = 'warning';
  }
  
  // Build update object - include device info fields if provided in heartbeat
  const updateData: Record<string, any> = {
    status,
    last_heartbeat: new Date().toISOString(),
    hailo_status: hailo_status,
    updated_at: new Date().toISOString()
  };
  
  // Update agent version if provided
  const agentVersion = body.agent_version || metrics.agent_version;
  if (agentVersion) updateData.agent_version = agentVersion;
  
  // Update firmware version (OS version) if provided
  const firmwareVersion = system.os_version || body.firmware_version;
  if (firmwareVersion) updateData.firmware_version = firmwareVersion;
  
  // Update Hailo board name if provided
  const hailoBoardName = metrics.hailo?.board_name || body.hailo_board_name;
  if (hailoBoardName) updateData.hailo_board_name = hailoBoardName;
  
  // Extract and update IP address from network info
  let ipToUpdate: string | null = null;
  if (system.net_io) {
    // Find the primary interface IP
    const primaryInterfaces = ['eth0', 'en0', 'wlan0', 'ens3'];
    for (const iface of primaryInterfaces) {
      if (system.net_io[iface]?.ip_address) {
        ipToUpdate = system.net_io[iface].ip_address;
        break;
      }
    }
    // Fallback to first interface
    if (!ipToUpdate) {
      const interfaces = Object.keys(system.net_io);
      if (interfaces.length > 0 && system.net_io[interfaces[0]]?.ip_address) {
        ipToUpdate = system.net_io[interfaces[0]].ip_address;
      }
    }
  } else if (body.ip_address) {
    ipToUpdate = body.ip_address;
  }
  
  if (ipToUpdate) {
    updateData.ip_address = ipToUpdate;
  }
  
  // Update agent with all fields
  await supabase
    .from('vanguard_agents')
    .update(updateData)
    .eq('id', agent.id);
  
  // Insert metrics with parsed values
  await supabase
    .from('vanguard_agent_metrics')
    .insert({
      agent_id: agent.id,
      cpu_percent,
      memory_percent,
      disk_percent,
      network_rx_bytes,
      network_tx_bytes,
      temperature,
      hailo_status,
      custom_metrics
    });
  
  console.log(`[vanguard-agent-api] Heartbeat from ${device_id}: CPU=${cpu_percent}%, MEM=${memory_percent}%, DISK=${disk_percent}%`);
  
  return new Response(
    JSON.stringify({ status: 'ok', received: { cpu_percent, memory_percent, disk_percent } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleScanResults(supabase: any, body: any) {
  const { device_id, scan_type, findings, network_devices } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get agent
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Store network devices if provided
  if (network_devices && network_devices.length > 0) {
    for (const device of network_devices) {
      await supabase
        .from('network_assets')
        .upsert({
          user_id: agent.user_id,
          ip_address: device.ip_address,
          hostname: device.hostname,
          mac_address: device.mac_address,
          device_type: device.device_type,
          manufacturer: device.manufacturer,
          os_info: device.os_info,
          open_ports: device.open_ports,
          status: 'online',
          last_seen: new Date().toISOString()
        }, { onConflict: 'ip_address,user_id', ignoreDuplicates: false });
    }
  }
  
  console.log(`[vanguard-agent-api] Scan results from ${device_id}: ${findings?.length || 0} findings, ${network_devices?.length || 0} devices`);
  
  return new Response(
    JSON.stringify({ status: 'ok' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getCommands(supabase: any, body: any) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get agent
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get pending commands
  const { data: commands } = await supabase
    .from('vanguard_agent_commands')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  
  // Mark as sent
  if (commands && commands.length > 0) {
    const ids = commands.map((c: any) => c.id);
    await supabase
      .from('vanguard_agent_commands')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .in('id', ids);
  }
  
  return new Response(
    JSON.stringify({ status: 'ok', commands: commands || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleCommandResponse(supabase: any, body: any) {
  const { command_id, response, error_message, success } = body;
  
  if (!command_id) {
    return new Response(
      JSON.stringify({ error: 'command_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  await supabase
    .from('vanguard_agent_commands')
    .update({
      status: success ? 'completed' : 'failed',
      response,
      error_message,
      completed_at: new Date().toISOString()
    })
    .eq('id', command_id);
  
  return new Response(
    JSON.stringify({ status: 'ok' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============ DASHBOARD-SIDE HANDLERS ============

async function handleAsk(supabase: any, userId: string, body: any) {
  const { agent_id, question } = body;
  
  if (!agent_id || !question) {
    return new Response(
      JSON.stringify({ error: 'agent_id and question are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify agent belongs to user
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('*')
    .eq('id', agent_id)
    .eq('user_id', userId)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // If agent has an API endpoint, try to call it directly
  if (agent.api_endpoint && agent.status === 'online') {
    try {
      const askResponse = await fetch(`${agent.api_endpoint}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });
      
      if (askResponse.ok) {
        const result = await askResponse.json();
        
        // Log the command
        await supabase.from('vanguard_agent_commands').insert({
          agent_id,
          user_id: userId,
          command_type: 'ask',
          payload: { question },
          status: 'completed',
          response: result,
          completed_at: new Date().toISOString()
        });
        
        return new Response(
          JSON.stringify({ status: 'ok', answer: result.answer || result }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('[vanguard-agent-api] Direct ask failed, queueing command:', e);
    }
  }
  
  // Queue command for agent to pick up
  const { data: command } = await supabase
    .from('vanguard_agent_commands')
    .insert({
      agent_id,
      user_id: userId,
      command_type: 'ask',
      payload: { question },
      status: 'pending'
    })
    .select()
    .single();
  
  return new Response(
    JSON.stringify({ status: 'queued', command_id: command.id, message: 'Question queued for agent' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function sendCommand(supabase: any, userId: string, body: any) {
  const { agent_id, command_type, payload } = body;
  
  if (!agent_id || !command_type) {
    return new Response(
      JSON.stringify({ error: 'agent_id and command_type are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify agent belongs to user
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id')
    .eq('id', agent_id)
    .eq('user_id', userId)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: command } = await supabase
    .from('vanguard_agent_commands')
    .insert({
      agent_id,
      user_id: userId,
      command_type,
      payload: payload || {},
      status: 'pending'
    })
    .select()
    .single();
  
  return new Response(
    JSON.stringify({ status: 'ok', command_id: command.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listAgents(supabase: any, userId: string) {
  const { data: agents, error } = await supabase
    .from('vanguard_agents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ status: 'ok', agents: agents || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMetrics(supabase: any, userId: string, body: any) {
  const { agent_id, hours = 24 } = body;
  
  if (!agent_id) {
    return new Response(
      JSON.stringify({ error: 'agent_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify agent belongs to user
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id')
    .eq('id', agent_id)
    .eq('user_id', userId)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const since = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  
  const { data: metrics } = await supabase
    .from('vanguard_agent_metrics')
    .select('*')
    .eq('agent_id', agent_id)
    .gte('recorded_at', since)
    .order('recorded_at', { ascending: true });
  
  return new Response(
    JSON.stringify({ status: 'ok', metrics: metrics || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteAgent(supabase: any, userId: string, body: any) {
  const { agent_id } = body;
  
  if (!agent_id) {
    return new Response(
      JSON.stringify({ error: 'agent_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify agent belongs to user before deletion
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, name')
    .eq('id', agent_id)
    .eq('user_id', userId)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found or not authorized' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Delete related data first
  await supabase.from('vanguard_agent_metrics').delete().eq('agent_id', agent_id);
  await supabase.from('vanguard_agent_commands').delete().eq('agent_id', agent_id);
  
  // Delete the agent
  const { error } = await supabase
    .from('vanguard_agents')
    .delete()
    .eq('id', agent_id)
    .eq('user_id', userId);
  
  if (error) {
    console.error('[vanguard-agent-api] Delete error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete agent' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[vanguard-agent-api] Agent ${agent.name} (${agent_id}) deleted by user ${userId}`);
  
  return new Response(
    JSON.stringify({ status: 'ok', message: `Agent ${agent.name} deleted successfully` }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function downloadAgent() {
  // Return an installer script that downloads the Python agent
  const installerScript = `#!/bin/bash
# Vanguard Agent Installer
# Run: curl -sSL "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api?action=download_agent" | bash

echo "Downloading Vanguard Agent..."
curl -sSL -o vanguard_agent.py "https://raw.githubusercontent.com/lovable-dev/ultrium-ai/main/public/agents/vanguard_agent.py" || {
  echo "Failed to download from GitHub."
  echo "Please download the agent manually from the Vanguard dashboard."
  exit 1
}

echo "Installing dependencies..."
pip3 install psutil requests 2>/dev/null || pip install psutil requests

echo ""
echo "Vanguard Agent downloaded successfully!"
echo "Run with: python3 vanguard_agent.py --device-id YOUR_DEVICE_ID --user-id YOUR_USER_ID"
`;

  return new Response(installerScript, { 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="install_vanguard.sh"'
    } 
  });
}

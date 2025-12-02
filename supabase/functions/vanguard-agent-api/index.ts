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
    if (['ask', 'send_command', 'list_agents', 'get_metrics'].includes(action)) {
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
      }
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
  const { device_id, name, location, ip_address, vpn_ip, api_endpoint, agent_version, firmware_version, hailo_board_name, user_id } = body;
  
  if (!device_id || !user_id) {
    return new Response(
      JSON.stringify({ error: 'device_id and user_id are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Upsert the agent
  const { data, error } = await supabase
    .from('vanguard_agents')
    .upsert({
      device_id,
      user_id,
      name: name || `Vanguard-${device_id.slice(0, 8)}`,
      location,
      ip_address,
      vpn_ip,
      api_endpoint,
      agent_version,
      firmware_version,
      hailo_board_name,
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'device_id' })
    .select()
    .single();
  
  if (error) {
    console.error('[vanguard-agent-api] Register error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[vanguard-agent-api] Agent registered: ${device_id}`);
  return new Response(
    JSON.stringify({ status: 'ok', agent_id: data.id }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleHeartbeat(supabase: any, body: any) {
  const { device_id, cpu_percent, memory_percent, disk_percent, network_rx_bytes, network_tx_bytes, temperature, hailo_status, custom_metrics } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
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
  
  // Update agent status
  await supabase
    .from('vanguard_agents')
    .update({
      status,
      last_heartbeat: new Date().toISOString(),
      hailo_status: hailo_status || {},
      updated_at: new Date().toISOString()
    })
    .eq('id', agent.id);
  
  // Insert metrics
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
    JSON.stringify({ status: 'ok' }),
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

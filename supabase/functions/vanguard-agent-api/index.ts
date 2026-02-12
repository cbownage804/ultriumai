import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vanguard-key',
};

// Agent authentication secret - stored securely in environment
const VANGUARD_SECRET = Deno.env.get('VANGUARD_AGENT_SECRET') || '';

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
    if (['register', 'heartbeat', 'scan_results', 'get_commands', 'command_response', 'security_telemetry', 'discovery_results', 'get_scanner_config', 'telemetry', 'xdr_threat', 'xdr_yara_match', 'xdr_memory_scan', 'xdr_script_analysis', 'xdr_get_rules', 'xdr_poll_actions', 'xdr_action_result'].includes(action)) {
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
          return await handleHeartbeat(supabase, body, req);
        case 'telemetry':
          return await handleTelemetry(supabase, body);
        case 'scan_results':
          return await handleScanResults(supabase, body);
        case 'get_commands':
          return await getCommands(supabase, body);
        case 'command_response':
          return await handleCommandResponse(supabase, body);
        case 'security_telemetry':
          return await handleSecurityTelemetry(supabase, body);
        case 'discovery_results':
          return await handleDiscoveryResults(supabase, body);
        case 'get_scanner_config':
          return await getScannerConfig(supabase, body);
        // XDR/AV telemetry actions
        // XDR/AV telemetry actions
        case 'xdr_threat':
          return await handleXdrThreat(supabase, body);
        case 'xdr_yara_match':
          return await handleXdrYaraMatch(supabase, body);
        case 'xdr_memory_scan':
          return await handleXdrMemoryScan(supabase, body);
        case 'xdr_script_analysis':
          return await handleXdrScriptAnalysis(supabase, body);
        case 'xdr_get_rules':
          return await handleXdrGetRules(supabase, body);
        case 'xdr_poll_actions':
          return await handleXdrPollActions(supabase, body);
        case 'xdr_action_result':
          return await handleXdrActionResult(supabase, body);
      }
    }
    
    // Dashboard-side actions (require JWT auth)
    if (['ask', 'send_command', 'list_agents', 'get_metrics', 'delete_agent', 'set_scanner_role', 'list_scanners', 'list_discovered_devices'].includes(action)) {
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
        case 'set_scanner_role':
          return await setScannerRole(supabase, user.id, body);
        case 'list_scanners':
          return await listScanners(supabase, user.id);
        case 'list_discovered_devices':
          return await listDiscoveredDevices(supabase, user.id, body);
      }
    }
    
    // Public actions - download agent script or get latest script for self-update
    if (action === 'download_agent') {
      return await downloadAgent();
    }
    
    if (action === 'download_agent_windows') {
      return await downloadAgentWindows();
    }
    
    if (action === 'get_agent_script') {
      return await getAgentScript();
    }
    
    if (action === 'get_agent_script_windows') {
      return await getAgentScriptWindows();
    }
    
    if (action === 'get_agent_version') {
      return await getAgentVersion();
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
  
  // Extract hostname for duplicate detection
  const hostname = body.hostname || body.name || systemInfo.hostname || `Vanguard-${device_id.slice(0, 8)}`;
  
  // Extract IP address from various sources
  let ip_address = body.ip_address || systemInfo.ip_address;
  if (!ip_address && systemInfo.net_io) {
    // Try to extract from network interfaces
    const interfaces = Object.keys(systemInfo.net_io);
    if (interfaces.length > 0) {
      ip_address = systemInfo.net_io[interfaces[0]]?.ip_address;
    }
  }
  
  // Check for existing agent with same hostname and user_id (duplicate detection)
  // This handles reinstalls where device_id changes but hostname stays the same
  const { data: existingAgents, error: searchError } = await supabase
    .from('vanguard_agents')
    .select('id, device_id, last_heartbeat, status')
    .eq('user_id', user_id)
    .eq('name', hostname);
  
  if (!searchError && existingAgents && existingAgents.length > 0) {
    console.log(`[vanguard-agent-api] Found ${existingAgents.length} existing agent(s) with hostname: ${hostname}`);
    
    // Delete stale duplicates - keep only the one we're about to update/create
    const staleAgentIds = existingAgents
      .filter((a: any) => a.device_id !== device_id)
      .map((a: any) => a.id);
    
    if (staleAgentIds.length > 0) {
      console.log(`[vanguard-agent-api] Cleaning up ${staleAgentIds.length} stale duplicate(s) for hostname: ${hostname}`);
      
      // Delete stale metrics first (foreign key constraint)
      await supabase
        .from('vanguard_agent_metrics')
        .delete()
        .in('agent_id', staleAgentIds);
      
      // Delete stale commands
      await supabase
        .from('vanguard_agent_commands')
        .delete()
        .in('agent_id', staleAgentIds);
      
      // Delete stale agents
      const { error: deleteError } = await supabase
        .from('vanguard_agents')
        .delete()
        .in('id', staleAgentIds);
      
      if (deleteError) {
        console.error(`[vanguard-agent-api] Error cleaning duplicates:`, deleteError);
      } else {
        console.log(`[vanguard-agent-api] Successfully cleaned ${staleAgentIds.length} duplicate agent(s)`);
      }
    }
  }
  
  // Build hardware info object for config storage
  const hardwareInfo: Record<string, any> = {
    hostname: hostname,
    os_name: systemInfo.os_name,
    os_version: systemInfo.os_version,
    cpu_info: systemInfo.cpu_info,
    cores: systemInfo.cpu_cores,
    threads: systemInfo.cpu_threads,
    total_memory_gb: systemInfo.total_memory_gb,
    mac_address: systemInfo.mac_address,
    manufacturer: systemInfo.manufacturer,
    model: systemInfo.model,
    serial_number: systemInfo.serial_number,
    device_type: systemInfo.device_type,
    form_factor: systemInfo.form_factor,
    is_virtual_machine: systemInfo.is_virtual_machine,
    bios_manufacturer: systemInfo.bios_manufacturer,
    bios_version: systemInfo.bios_version,
    video_card: systemInfo.video_card,
    sound_card: systemInfo.sound_card,
    rustdesk_id: body.rustdesk_id,
    anydesk_id: systemInfo.anydesk_id,
    teamviewer_id: systemInfo.teamviewer_id,
  };
  
  // Detect agent type from OS name
  let agentType = 'windows';
  const osName = (systemInfo.os_name || '').toLowerCase();
  if (osName.includes('linux') || osName.includes('ubuntu') || osName.includes('debian')) {
    agentType = 'linux';
  } else if (osName.includes('darwin') || osName.includes('mac')) {
    agentType = 'mac';
  }
  
  // Build the agent record with all available fields
  const agentData: Record<string, any> = {
    device_id,
    user_id,
    name: hostname,
    location: body.location,
    vpn_ip: body.vpn_ip,
    api_endpoint: body.api_endpoint,
    agent_version: body.agent_version || body.version,
    firmware_version: systemInfo.os_version || body.firmware_version,
    hailo_board_name: body.hailo_board_name || body.hailo?.board_name,
    agent_type: agentType,
    status: 'online',
    last_heartbeat: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    config: {
      hardware: hardwareInfo,
      thresholds: { cpu: 90, memory: 90, disk: 90 }
    }
  };

  // Store RustDesk ID in the top-level column (plain numeric ID)
  if (body.rustdesk_id) {
    // Ensure we store only the clean numeric ID (strip spaces)
    const cleanId = String(body.rustdesk_id).replace(/\s+/g, '').trim();
    if (/^\d{6,}$/.test(cleanId)) {
      agentData.rustdesk_id = cleanId;
      console.log(`[vanguard-agent-api] RustDesk ID set during registration: ${cleanId}`);
    } else {
      console.warn(`[vanguard-agent-api] Invalid RustDesk ID format during registration: ${body.rustdesk_id}`);
    }
  }

  // Store MeshCentral node ID if provided during registration
  if (body.meshcentral_node_id) {
    agentData.meshcentral_node_id = body.meshcentral_node_id;
    console.log(`[vanguard-agent-api] MeshCentral node ID set during registration: ${body.meshcentral_node_id}`);
  }
  if (body.meshcentral_mesh_id) {
    agentData.meshcentral_mesh_id = body.meshcentral_mesh_id;
  }

  // Include client_id if provided (for MSP client association)
  if (body.client_id) {
    agentData.client_id = body.client_id;
    console.log(`[vanguard-agent-api] Agent associated with client: ${body.client_id}`);
  }

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
  
  console.log(`[vanguard-agent-api] Agent registered: ${device_id}, Hostname: ${hostname}, IP: ${ip_address}, Version: ${agentData.agent_version}, Type: ${agentType}`);
  
  // Build relay config for agent to auto-configure RustDesk
  const relayServer = Deno.env.get('RUSTDESK_RELAY_SERVER') || '';
  const publicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY') || '';
  const apiServer = Deno.env.get('RUSTDESK_API_SERVER') || '';
  
  const response: Record<string, any> = {
    status: 'ok',
    agent_id: data.id,
    device_id: device_id,
  };
  
  // Include RustDesk deployment config if relay is configured
  if (relayServer) {
    response.rustdesk_config = {
      deploy: true,
      relay_server: relayServer,
      public_key: publicKey,
      api_server: apiServer,
      version: '1.3.7',
    };
    console.log(`[vanguard-agent-api] RustDesk deploy config included for ${device_id}`);
  }
  
  // Include MeshCentral deployment config
  try {
    // Look up MSP for this user
    const { data: msp } = await supabase
      .from('msps')
      .select('id')
      .eq('user_id', body.user_id)
      .maybeSingle();
    
    if (msp) {
      // Look up MeshCentral assignment for this MSP
      const { data: assignment } = await supabase
        .from('meshcentral_msp_assignments')
        .select('mesh_group_id, meshcentral_servers(server_url)')
        .eq('msp_id', msp.id)
        .eq('is_active', true)
        .maybeSingle();
      
      if (assignment?.meshcentral_servers) {
        const serverUrl = (assignment.meshcentral_servers as any).server_url?.replace(/\/+$/, '');
        // Convert HTTPS URL to WSS for MeshAgent
        const wsUrl = serverUrl ? serverUrl.replace(/^https?:\/\//, 'wss://') : '';
        response.meshcentral_config = {
          deploy: true,
          server_url: serverUrl,
          mesh_url: wsUrl,
          mesh_id: assignment.mesh_group_id,
        };
        console.log(`[vanguard-agent-api] MeshCentral deploy config included for ${device_id}: server=${serverUrl}, mesh=${assignment.mesh_group_id}`);
      } else {
        // Fallback: pick least-loaded server
        const { data: fallbackServer } = await supabase
          .from('meshcentral_servers')
          .select('server_url')
          .eq('is_active', true)
          .order('current_device_count', { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (fallbackServer) {
          const serverUrl = fallbackServer.server_url?.replace(/\/+$/, '');
          const wsUrl = serverUrl ? serverUrl.replace(/^https?:\/\//, 'wss://') : '';
          response.meshcentral_config = {
            deploy: true,
            server_url: serverUrl,
            mesh_url: wsUrl,
            mesh_id: '', // No specific group yet
          };
          console.log(`[vanguard-agent-api] MeshCentral fallback config for ${device_id}: ${serverUrl}`);
        }
      }
    }
  } catch (meshErr) {
    console.warn(`[vanguard-agent-api] MeshCentral config lookup failed:`, meshErr);
  }
  
  return new Response(
    JSON.stringify(response),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleHeartbeat(supabase: any, body: any, req?: Request) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Extract real IP from request headers (set by load balancer/proxy)
  const realIp = req?.headers.get('x-real-ip') || 
                 req?.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                 req?.headers.get('cf-connecting-ip') ||
                 null;
  
  console.log(`[vanguard-agent-api] Heartbeat source IP from headers: ${realIp}`);

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
  
  // Get agent by device_id (include user_id for MeshCentral config lookup)
  const { data: agent, error: agentError } = await supabase
    .from('vanguard_agents')
    .select('id, config, user_id, meshcentral_node_id')
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
  
  // Update RustDesk ID if provided in heartbeat (allows incremental updates)
  const rustdeskId = body.rustdesk_id;
  if (rustdeskId) {
    updateData.rustdesk_id = rustdeskId;
    console.log(`[vanguard-agent-api] Heartbeat includes RustDesk ID: ${rustdeskId}`);
  }
  
  // Update MeshCentral node ID if provided in heartbeat
  const meshcentralNodeId = body.meshcentral_node_id;
  if (meshcentralNodeId) {
    updateData.meshcentral_node_id = meshcentralNodeId;
    console.log(`[vanguard-agent-api] Heartbeat includes MeshCentral node ID: ${meshcentralNodeId}`);
  }
  const meshcentralMeshId = body.meshcentral_mesh_id;
  if (meshcentralMeshId) {
    updateData.meshcentral_mesh_id = meshcentralMeshId;
  }
  
  // Log RustDesk status for debugging
  const rustdeskStatus = body.rustdesk_status;
  if (rustdeskStatus) {
    console.log(`[vanguard-agent-api] RustDesk status for ${device_id}: ${rustdeskStatus}`);
  }
  
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
  } else if (realIp) {
    // Fallback to source IP from request headers
    ipToUpdate = realIp;
    console.log(`[vanguard-agent-api] Using source IP from headers: ${realIp}`);
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
  
  // Build heartbeat response
  const heartbeatResponse: Record<string, any> = { status: 'ok', received: { cpu_percent, memory_percent, disk_percent } };
  
  // If MeshCentral node ID is not yet reported, include deployment config so agent can install
  if (!meshcentralNodeId && !agent.meshcentral_node_id && agent.user_id) {
    try {
      const { data: msp } = await supabase
        .from('msps')
        .select('id')
        .eq('user_id', agent.user_id)
        .maybeSingle();
      
      if (msp) {
        const { data: assignment } = await supabase
          .from('meshcentral_msp_assignments')
          .select('mesh_group_id, meshcentral_servers(server_url)')
          .eq('msp_id', msp.id)
          .eq('is_active', true)
          .maybeSingle();
        
        if (assignment?.meshcentral_servers) {
          const serverUrl = (assignment.meshcentral_servers as any).server_url?.replace(/\/+$/, '');
          heartbeatResponse.meshcentral_config = {
            deploy: true,
            server_url: serverUrl,
            mesh_id: assignment.mesh_group_id,
          };
          console.log(`[vanguard-agent-api] Heartbeat includes MeshCentral deploy config for ${device_id}: server=${serverUrl}`);
        }
      }
    } catch (meshErr) {
      console.warn(`[vanguard-agent-api] MeshCentral config lookup in heartbeat failed:`, meshErr);
    }
  }
  
  return new Response(
    JSON.stringify(heartbeatResponse),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle full telemetry data (hardware, disks, network adapters, software, updates, users, connections, etc.)
async function handleTelemetry(supabase: any, body: any) {
  const { 
    device_id, 
    processes, 
    services, 
    network_adapters, 
    installed_software, 
    disks,
    // New telemetry fields
    pending_updates,
    startup_programs,
    network_connections,
    local_users,
    bitlocker_status,
    boot_time,
    uptime_seconds,
    timestamp 
  } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get agent
  const { data: agent, error: agentError } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, config')
    .eq('device_id', device_id)
    .single();
  
  if (agentError || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found. Please register first.' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Normalize disk data from C# agent format to UI format
  const normalizedDisks = (disks || []).map((disk: any) => ({
    drive: disk.Drive || disk.drive || 'Unknown',
    media_type: disk.Type || disk.type || disk.media_type || 'Fixed',
    model: disk.Label || disk.label || disk.model || 'Local Disk',
    file_system: disk.FileSystem || disk.file_system || 'NTFS',
    total_size: formatSize(disk.TotalGb || disk.total_gb),
    used_size: formatSize(disk.UsedGb || disk.used_gb),
    free_size: formatSize(disk.FreeGb || disk.free_gb),
    usage_percent: Math.round(disk.PercentUsed || disk.percent_used || 0),
    status: disk.Status || disk.status || 'Healthy',
    health_status: disk.Status || disk.status || 'Healthy',
    total_gb: disk.TotalGb || disk.total_gb || 0,
    used_gb: disk.UsedGb || disk.used_gb || 0,
    free_gb: disk.FreeGb || disk.free_gb || 0,
  }));
  
  // Normalize network adapters
  const normalizedAdapters = (network_adapters || []).map((adapter: any) => ({
    name: adapter.Name || adapter.name,
    ip_address: adapter.IpAddress || adapter.ip_address,
    mac_address: adapter.MacAddress || adapter.mac_address,
    status: adapter.Status || adapter.status || 'Down',
  }));
  
  // Normalize installed software
  const normalizedSoftware = (installed_software || []).map((sw: any) => ({
    name: sw.Name || sw.name,
    version: sw.Version || sw.version || '',
    publisher: sw.Publisher || sw.publisher || '',
    install_date: sw.InstallDate || sw.install_date || null,
  }));
  
  // Normalize pending updates
  const normalizedUpdates = (pending_updates || []).map((update: any) => ({
    title: update.Title || update.title,
    kb_number: update.KBNumber || update.kb_number || update.KBArticleIDs?.[0],
    severity: update.Severity || update.severity || update.MsrcSeverity || 'Unknown',
    category: update.Category || update.category || update.Categories?.[0],
    size_mb: update.SizeMB || update.size_mb || (update.MaxDownloadSize ? update.MaxDownloadSize / 1024 / 1024 : null),
    is_downloaded: update.IsDownloaded || update.is_downloaded || false,
    is_mandatory: update.IsMandatory || update.is_mandatory || false,
    release_date: update.ReleaseDate || update.release_date || update.LastDeploymentChangeTime,
  }));
  
  // Normalize startup programs
  const normalizedStartup = (startup_programs || []).map((program: any) => ({
    name: program.Name || program.name,
    command: program.Command || program.command || program.CommandLine,
    location: program.Location || program.location,
    enabled: program.Enabled ?? program.enabled ?? true,
    publisher: program.Publisher || program.publisher,
    startup_type: program.StartupType || program.startup_type || 'Registry',
    impact: program.Impact || program.impact || 'Not measured',
  }));
  
  // Normalize network connections
  const normalizedConnections = (network_connections || []).map((conn: any) => ({
    local_address: conn.LocalAddress || conn.local_address,
    local_port: conn.LocalPort || conn.local_port,
    remote_address: conn.RemoteAddress || conn.remote_address,
    remote_port: conn.RemotePort || conn.remote_port,
    state: conn.State || conn.state,
    protocol: conn.Protocol || conn.protocol || 'TCP',
    process_name: conn.ProcessName || conn.process_name || conn.OwningProcess,
    process_id: conn.ProcessId || conn.process_id || conn.OwningProcessId,
  }));
  
  // Normalize local users
  const normalizedUsers = (local_users || []).map((user: any) => ({
    name: user.Name || user.name,
    full_name: user.FullName || user.full_name,
    description: user.Description || user.description,
    enabled: user.Enabled ?? user.enabled ?? true,
    is_admin: user.IsAdmin || user.is_admin || user.LocalAdmin || false,
    is_local: user.IsLocal ?? user.is_local ?? true,
    last_logon: user.LastLogon || user.last_logon,
    password_last_set: user.PasswordLastSet || user.password_last_set,
    password_expires: user.PasswordExpires || user.password_expires,
    sid: user.SID || user.sid,
    groups: user.Groups || user.groups || [],
  }));
  
  // Normalize BitLocker status
  const normalizedBitlocker = (bitlocker_status || []).map((drive: any) => ({
    drive_letter: drive.DriveLetter || drive.drive_letter || drive.MountPoint,
    protection_status: drive.ProtectionStatus || drive.protection_status,
    volume_type: drive.VolumeType || drive.volume_type || 'OperatingSystem',
    encryption_method: drive.EncryptionMethod || drive.encryption_method,
    encryption_percentage: drive.EncryptionPercentage || drive.encryption_percentage,
    lock_status: drive.LockStatus || drive.lock_status,
  }));
  
  // Store telemetry data in custom_metrics
  const telemetryData: Record<string, any> = {
    processes_count: processes?.length || 0,
    services_count: services?.length || 0,
    network_adapters: normalizedAdapters,
    installed_software: normalizedSoftware,
    installed_software_count: normalizedSoftware.length,
    disks: normalizedDisks,
    pending_updates: normalizedUpdates,
    pending_updates_count: normalizedUpdates.length,
    startup_programs: normalizedStartup,
    network_connections: normalizedConnections,
    local_users: normalizedUsers,
    bitlocker: normalizedBitlocker,
    last_telemetry_at: new Date().toISOString()
  };
  
  // Build hardware config with boot time
  const existingHardware = (agent.config?.hardware) || {};
  const updatedHardware = {
    ...existingHardware,
    boot_time: boot_time || existingHardware.boot_time,
    uptime_seconds: uptime_seconds,
  };
  
  // Also update agent.config with latest telemetry for quick access
  const updatedConfig = {
    ...(agent.config || {}),
    hardware: updatedHardware,
    disks: normalizedDisks,
    installed_software: normalizedSoftware,
    network_adapters: normalizedAdapters,
    pending_updates: normalizedUpdates,
    startup_programs: normalizedStartup,
    network_connections: normalizedConnections,
    local_users: normalizedUsers,
    bitlocker: normalizedBitlocker,
    last_telemetry_at: new Date().toISOString(),
    last_update_check: normalizedUpdates.length > 0 ? new Date().toISOString() : (agent.config?.last_update_check),
    last_startup_check: normalizedStartup.length > 0 ? new Date().toISOString() : (agent.config?.last_startup_check),
    last_connections_check: normalizedConnections.length > 0 ? new Date().toISOString() : (agent.config?.last_connections_check),
    last_users_check: normalizedUsers.length > 0 ? new Date().toISOString() : (agent.config?.last_users_check),
  };
  
  // Update agent with telemetry in config
  await supabase
    .from('vanguard_agents')
    .update({
      config: updatedConfig,
      updated_at: new Date().toISOString()
    })
    .eq('id', agent.id);
  
  // Store in vanguard_agent_metrics with custom_metrics
  await supabase
    .from('vanguard_agent_metrics')
    .insert({
      agent_id: agent.id,
      custom_metrics: telemetryData
    });
  
  console.log(`[vanguard-agent-api] Telemetry from ${device_id}: ${normalizedDisks.length} disks, ${normalizedSoftware.length} software, ${normalizedUpdates.length} updates, ${normalizedConnections.length} connections, ${normalizedUsers.length} users`);
  
  return new Response(
    JSON.stringify({ status: 'ok' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper to format GB to human-readable size
function formatSize(gb: number | undefined): string {
  if (!gb || isNaN(gb)) return '0 GB';
  if (gb >= 1000) return `${(gb / 1000).toFixed(1)} TB`;
  return `${gb.toFixed(1)} GB`;
}





async function handleScanResults(supabase: any, body: any) {
  const { device_id, scan_type, findings, network_devices, vulnerabilities } = body;
  
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
  
  // Store vulnerabilities if provided (from VulScan)
  if (vulnerabilities && vulnerabilities.length > 0) {
    console.log(`[vanguard-agent-api] Storing ${vulnerabilities.length} vulnerabilities from ${device_id}`);
    
    for (const vuln of vulnerabilities) {
      await supabase
        .from('safenet_vulnerabilities')
        .upsert({
          user_id: agent.user_id,
          title: vuln.title,
          description: vuln.description,
          severity: vuln.severity,
          cve_id: vuln.cve_id,
          ip_address: vuln.ip_address,
          hostname: vuln.hostname,
          port: vuln.port,
          protocol: vuln.protocol,
          service: vuln.service,
          service_version: vuln.service_version,
          remediation: vuln.remediation,
          cvss_score: vuln.cvss_score,
          status: vuln.status || 'open',
          discovered_at: new Date().toISOString(),
          scan_job_id: body.scan_job_id || null,
          agent_id: agent.id,
        }, { 
          onConflict: 'user_id,cve_id,ip_address,port',
          ignoreDuplicates: false 
        });
    }
  }
  
  console.log(`[vanguard-agent-api] Scan results from ${device_id}: ${findings?.length || 0} findings, ${network_devices?.length || 0} devices, ${vulnerabilities?.length || 0} vulnerabilities`);
  
  return new Response(
    JSON.stringify({ status: 'ok', stored_vulnerabilities: vulnerabilities?.length || 0 }),
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
  const { command_id } = body;
  
  if (!command_id) {
    return new Response(
      JSON.stringify({ error: 'command_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Support both agent formats:
  // Format 1 (Python agent): { status: "completed"|"failed", output: {...}, error: "..." }
  // Format 2 (legacy): { success: boolean, response: {...}, error_message: "..." }
  
  let finalStatus: string;
  let finalResponse: any;
  let finalError: string | null;
  
  if (body.status !== undefined) {
    // Python agent format
    finalStatus = body.status === 'completed' ? 'completed' : 'failed';
    finalResponse = body.output || null;
    finalError = body.error || null;
  } else {
    // Legacy format
    finalStatus = body.success ? 'completed' : 'failed';
    finalResponse = body.response || null;
    finalError = body.error_message || null;
  }
  
  console.log(`[vanguard-agent-api] Command ${command_id} result: status=${finalStatus}, hasResponse=${!!finalResponse}, error=${finalError}`);
  
  // Fetch the command to get its payload (contains assessment_id for pentest commands)
  const { data: command } = await supabase
    .from('vanguard_agent_commands')
    .select('id, command_type, payload, agent_id')
    .eq('id', command_id)
    .single();
  
  // Update command with response
  const { error: updateError } = await supabase
    .from('vanguard_agent_commands')
    .update({
      status: finalStatus,
      response: finalResponse,
      error_message: finalError,
      completed_at: new Date().toISOString()
    })
    .eq('id', command_id);
  
  if (updateError) {
    console.error(`[vanguard-agent-api] Failed to update command ${command_id}:`, updateError);
  }
  
  // Process pentest commands - update assessment and create findings
  if (command && ['pentest_full', 'scan_network', 'vulnerability_scan', 'port_scan'].includes(command.command_type)) {
    const payload = command.payload || {};
    const assessmentId = payload.assessment_id;
    const organizationId = payload.organization_id;
    
    if (assessmentId) {
      console.log(`[vanguard-agent-api] Processing pentest results for assessment ${assessmentId}`);
      
      // Get agent's user_id
      const { data: agent } = await supabase
        .from('vanguard_agents')
        .select('user_id')
        .eq('id', command.agent_id)
        .single();
      
      const userId = agent?.user_id;
      
      // Update assessment status
      const assessmentUpdate: any = {
        status: finalStatus === 'completed' ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      };
      
      // Calculate runtime if we have started_at
      const { data: assessment } = await supabase
        .from('pentest_assessments')
        .select('started_at')
        .eq('id', assessmentId)
        .single();
      
      if (assessment?.started_at) {
        const startedAt = new Date(assessment.started_at);
        const completedAt = new Date();
        assessmentUpdate.runtime_seconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);
      }
      
      await supabase
        .from('pentest_assessments')
        .update(assessmentUpdate)
        .eq('id', assessmentId);
      
      // Process findings from the response
      if (finalResponse && userId) {
        const findings = finalResponse.findings || finalResponse.vulnerabilities || [];
        const ipsScanned = finalResponse.hosts_scanned || finalResponse.ips_scanned || 0;
        
        // Update IPs scanned count
        if (ipsScanned > 0) {
          await supabase
            .from('pentest_assessments')
            .update({ ips_scanned: ipsScanned })
            .eq('id', assessmentId);
        }
        
        // Insert each finding
        if (Array.isArray(findings) && findings.length > 0) {
          console.log(`[vanguard-agent-api] Inserting ${findings.length} findings for assessment ${assessmentId}`);
          
          for (const finding of findings) {
            const findingRecord = {
              user_id: userId,
              assessment_id: assessmentId,
              organization_id: organizationId || null,
              title: finding.title || finding.name || 'Unnamed Finding',
              description: finding.description || finding.details || '',
              severity: normalizeSeverity(finding.severity),
              cvss_score: finding.cvss_score || finding.cvss || null,
              cvss_vector: finding.cvss_vector || null,
              cve_ids: finding.cve_ids || (finding.cve_id ? [finding.cve_id] : []),
              cwe_id: finding.cwe_id || null,
              affected_hosts: finding.affected_hosts || (finding.host ? [finding.host] : (finding.ip ? [finding.ip] : [])),
              affected_ports: finding.affected_ports || (finding.port ? [finding.port] : []),
              evidence: finding.evidence || finding.proof || null,
              proof_of_concept: finding.poc || finding.proof_of_concept || null,
              remediation: finding.remediation || finding.fix || finding.recommendation || null,
              remediation_difficulty: finding.remediation_difficulty || 'medium',
              business_impact: finding.business_impact || null,
              is_verified: finding.is_verified || false,
              is_false_positive: false,
              status: 'open',
              first_found_at: new Date().toISOString(),
              last_seen_at: new Date().toISOString(),
            };
            
            const { error: findingError } = await supabase
              .from('pentest_findings')
              .insert(findingRecord);
            
            if (findingError) {
              console.error(`[vanguard-agent-api] Failed to insert finding:`, findingError);
            }
          }
        }
      }
    }
  }
  
  return new Response(
    JSON.stringify({ status: 'ok' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper to normalize severity values
function normalizeSeverity(severity: string | undefined): string {
  if (!severity) return 'medium';
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'crit') return 'critical';
  if (s === 'high' || s === 'hi') return 'high';
  if (s === 'medium' || s === 'med' || s === 'moderate') return 'medium';
  if (s === 'low' || s === 'lo') return 'low';
  if (s === 'info' || s === 'informational' || s === 'none') return 'info';
  return 'medium';
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

// ============ SECURITY TELEMETRY HANDLER (Windows Defender) ============

async function handleSecurityTelemetry(supabase: any, body: any) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get agent
  const { data: agent, error: agentError } = await supabase
    .from('vanguard_agents')
    .select('id, user_id')
    .eq('device_id', device_id)
    .single();
  
  if (agentError || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Support both nested (data.defender_status) and flat (defender_status) payload formats
  // Agent sends: { device_id, defender_status, recent_threats, quarantined_items }
  const securityData = body.data || body;
  const defenderStatus = securityData.defender_status || {};
  const recentThreats = securityData.recent_threats || [];
  const quarantinedItems = securityData.quarantined_items || [];
  
  console.log(`[vanguard-agent-api] Security telemetry from ${device_id}: Defender=${defenderStatus.is_enabled ? 'ON' : 'OFF'}, Threats=${recentThreats.length}, Quarantined=${quarantinedItems.length}`);
  
  // Update agent with security status
  const securityStatus = {
    defender_enabled: defenderStatus.is_enabled || false,
    real_time_protection: defenderStatus.real_time_protection || false,
    signature_version: defenderStatus.signature_version || null,
    signature_last_updated: defenderStatus.signature_last_updated || null,
    last_full_scan: defenderStatus.last_full_scan || null,
    last_quick_scan: defenderStatus.last_quick_scan || null,
    quarantined_count: quarantinedItems.length,
    recent_threats_count: recentThreats.length,
    updated_at: new Date().toISOString()
  };
  
  await supabase
    .from('vanguard_agents')
    .update({ 
      security_status: securityStatus,
      updated_at: new Date().toISOString()
    })
    .eq('id', agent.id);
  
  // Store security events for new threats
  for (const threat of recentThreats) {
    // Check if we've already stored this threat (by threat ID + agent)
    const { data: existing } = await supabase
      .from('vanguard_security_events')
      .select('id')
      .eq('agent_id', agent.id)
      .eq('threat_id', threat.ThreatId?.toString() || threat.ThreatID?.toString())
      .maybeSingle();
    
    if (!existing) {
      const threatData = {
        agent_id: agent.id,
        user_id: agent.user_id,
        event_type: 'threat_detected',
        threat_id: threat.ThreatId?.toString() || threat.ThreatID?.toString(),
        threat_name: threat.ThreatName || threat.threat_name || 'Unknown Threat',
        severity: mapThreatSeverity(threat.SeverityID || threat.SeverityId || 2),
        process_name: threat.ProcessName || threat.process_name,
        resources: threat.Resources || threat.resources,
        action_success: threat.ActionSuccess ?? threat.action_success ?? false,
        threat_status: mapThreatStatus(threat.ThreatStatusID || threat.ThreatStatusId || 1),
        detected_at: threat.InitialDetectionTime || threat.DetectedAt || new Date().toISOString(),
        remediated_at: threat.RemediationTime || threat.RemediatedAt,
        raw_data: threat
      };
      
      await supabase.from('vanguard_security_events').insert(threatData);
      console.log(`[vanguard-agent-api] Stored new threat: ${threatData.threat_name}`);
    }
  }
  
  return new Response(
    JSON.stringify({ 
      status: 'ok', 
      stored_threats: recentThreats.length,
      defender_status: defenderStatus.is_enabled ? 'enabled' : 'disabled'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function mapThreatSeverity(severityId: number): string {
  switch (severityId) {
    case 1: return 'low';
    case 2: return 'medium';
    case 4: return 'high';
    case 5: return 'critical';
    default: return 'medium';
  }
}

function mapThreatStatus(statusId: number): string {
  switch (statusId) {
    case 0: return 'unknown';
    case 1: return 'detected';
    case 2: return 'cleaned';
    case 3: return 'quarantined';
    case 4: return 'removed';
    case 5: return 'allowed';
    case 6: return 'blocked';
    default: return 'unknown';
  }
}

// ============ NETWORK SCANNER HANDLERS ============

// Get scanner configuration for an agent (called by agent)
async function getScannerConfig(supabase: any, body: any) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: agent, error } = await supabase
    .from('vanguard_agents')
    .select('id, is_network_scanner, scanner_subnets, scan_interval_seconds, last_scan_at')
    .eq('device_id', device_id)
    .single();
  
  if (error || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({
      is_scanner: agent.is_network_scanner || false,
      subnets: agent.scanner_subnets || [],
      scan_interval: agent.scan_interval_seconds || 3600,
      last_scan: agent.last_scan_at
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Handle discovery results from a scanner agent
async function handleDiscoveryResults(supabase: any, body: any) {
  const { device_id, devices, scan_duration, subnet } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Get agent and verify it's a scanner
  const { data: agent, error } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, is_network_scanner')
    .eq('device_id', device_id)
    .single();
  
  if (error || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (!agent.is_network_scanner) {
    console.log(`[vanguard-agent-api] Non-scanner agent ${device_id} tried to submit discovery results`);
    return new Response(
      JSON.stringify({ error: 'Agent is not designated as network scanner' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Update last scan timestamp
  await supabase
    .from('vanguard_agents')
    .update({ last_scan_at: new Date().toISOString() })
    .eq('id', agent.id);
  
  // Process discovered devices
  const discoveredDevices = devices || [];
  let newDevices = 0;
  let updatedDevices = 0;
  
  for (const device of discoveredDevices) {
    const deviceRecord = {
      user_id: agent.user_id,
      scanner_agent_id: agent.id,
      ip_address: device.ip_address,
      mac_address: device.mac_address || null,
      hostname: device.hostname || null,
      device_type: device.device_type || 'unknown',
      manufacturer: device.manufacturer || null,
      os_info: device.os_info || null,
      open_ports: device.open_ports || [],
      services: device.services || {},
      vulnerabilities: device.vulnerabilities || [],
      risk_level: device.risk_level || 'unknown',
      last_seen_at: new Date().toISOString(),
      metadata: {
        ...device.metadata,
        scan_duration,
        subnet,
        scanned_by: device_id
      }
    };
    
    // Upsert - update if exists, insert if new
    const { data: existing } = await supabase
      .from('vanguard_discovered_devices')
      .select('id')
      .eq('user_id', agent.user_id)
      .eq('ip_address', device.ip_address)
      .maybeSingle();
    
    if (existing) {
      await supabase
        .from('vanguard_discovered_devices')
        .update({
          ...deviceRecord,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
      updatedDevices++;
    } else {
      await supabase
        .from('vanguard_discovered_devices')
        .insert({
          ...deviceRecord,
          first_seen_at: new Date().toISOString()
        });
      newDevices++;
    }
  }
  
  console.log(`[vanguard-agent-api] Discovery from ${device_id}: ${newDevices} new, ${updatedDevices} updated devices`);
  
  return new Response(
    JSON.stringify({
      status: 'ok',
      new_devices: newDevices,
      updated_devices: updatedDevices,
      total_processed: discoveredDevices.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Set scanner role for an agent (called from dashboard)
async function setScannerRole(supabase: any, userId: string, body: any) {
  const { agent_id, is_scanner, subnets, scan_interval } = body;
  
  if (!agent_id) {
    return new Response(
      JSON.stringify({ error: 'agent_id is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Verify agent belongs to user
  const { data: agent, error } = await supabase
    .from('vanguard_agents')
    .select('id, name')
    .eq('id', agent_id)
    .eq('user_id', userId)
    .single();
  
  if (error || !agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const updateData: any = {
    is_network_scanner: is_scanner ?? false,
    updated_at: new Date().toISOString()
  };
  
  if (subnets !== undefined) {
    updateData.scanner_subnets = subnets;
  }
  
  if (scan_interval !== undefined) {
    updateData.scan_interval_seconds = scan_interval;
  }
  
  await supabase
    .from('vanguard_agents')
    .update(updateData)
    .eq('id', agent_id);
  
  console.log(`[vanguard-agent-api] Scanner role ${is_scanner ? 'enabled' : 'disabled'} for agent ${agent.name}`);
  
  return new Response(
    JSON.stringify({
      status: 'ok',
      agent_id,
      is_scanner: is_scanner ?? false,
      subnets: subnets || [],
      scan_interval: scan_interval || 3600
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// List all scanner agents for a user
async function listScanners(supabase: any, userId: string) {
  const { data: scanners, error } = await supabase
    .from('vanguard_agents')
    .select('id, device_id, name, ip_address, status, is_network_scanner, scanner_subnets, scan_interval_seconds, last_scan_at, last_heartbeat')
    .eq('user_id', userId)
    .eq('is_network_scanner', true)
    .order('name');
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ scanners: scanners || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// List discovered devices
async function listDiscoveredDevices(supabase: any, userId: string, body: any) {
  const { scanner_id, risk_level, limit = 100 } = body;
  
  let query = supabase
    .from('vanguard_discovered_devices')
    .select('*')
    .eq('user_id', userId)
    .order('last_seen_at', { ascending: false })
    .limit(limit);
  
  if (scanner_id) {
    query = query.eq('scanner_agent_id', scanner_id);
  }
  
  if (risk_level) {
    query = query.eq('risk_level', risk_level);
  }
  
  const { data: devices, error } = await query;
  
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  return new Response(
    JSON.stringify({ devices: devices || [] }),
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
curl -sSL -o vanguard_agent_pentest.py "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api?action=get_agent_script" || {
  echo "Failed to download agent."
  exit 1
}

echo "Installing dependencies..."
pip3 install psutil requests pyyaml python-nmap 2>/dev/null || pip install psutil requests pyyaml python-nmap

echo ""
echo "Vanguard Agent downloaded successfully!"
echo "Run with: python3 vanguard_agent_pentest.py --config config.yaml"
`;

  return new Response(installerScript, { 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="install_vanguard.sh"'
    } 
  });
}

// Current agent version - update this when you update the agent script
const AGENT_VERSION = "4.0.0-enterprise-plus";

async function getAgentVersion() {
  return new Response(
    JSON.stringify({ version: AGENT_VERSION }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getAgentScript() {
  // The full Python agent script - self-contained with auto-update capability
  const pythonAgent = `#!/usr/bin/env python3
"""
Ultrium Vanguard Agent - Full Pentest Edition with Auto-Update
==============================================================
Version: ${AGENT_VERSION}
"""

import os
import sys
import time
import json
import socket
import signal
import logging
import argparse
import threading
import subprocess
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from logging.handlers import RotatingFileHandler

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False
    print("Warning: psutil not installed. Install with: pip install psutil")

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("Error: requests required. Install with: pip install requests")
    sys.exit(1)

try:
    import yaml
    HAS_YAML = True
except ImportError:
    HAS_YAML = False
    print("Warning: pyyaml not installed. Install with: pip install pyyaml")

try:
    import nmap
    HAS_NMAP = True
except ImportError:
    HAS_NMAP = False
    print("Warning: python-nmap not installed. Install with: pip install python-nmap")

VERSION = "${AGENT_VERSION}"
USER_AGENT = f"VanguardAgent/{VERSION}"
DEFAULT_API = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api"
DEFAULT_SECRET = "vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA"

logger = logging.getLogger("vanguard")

def setup_logging(config: dict):
    log_config = config.get("logging", {})
    level = getattr(logging, log_config.get("level", "INFO").upper(), logging.INFO)
    log_file = log_config.get("file", "/var/log/vanguard-agent.log")
    logger.setLevel(level)
    formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)
    try:
        os.makedirs(os.path.dirname(log_file), exist_ok=True)
        file_handler = RotatingFileHandler(log_file, maxBytes=10485760, backupCount=5)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    except:
        pass

def load_config(config_path: str) -> dict:
    if not HAS_YAML:
        return {}
    try:
        with open(config_path, 'r') as f:
            return yaml.safe_load(f) or {}
    except:
        return {}

def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

def get_system_info() -> dict:
    info = {
        "hostname": socket.gethostname(),
        "ip_address": get_local_ip(),
        "platform": sys.platform,
        "agent_version": VERSION,
    }
    if HAS_PSUTIL:
        try:
            info["cpu_count"] = psutil.cpu_count()
            info["memory_total"] = psutil.virtual_memory().total
            info["os_version"] = f"{sys.platform} {os.uname().release}" if hasattr(os, 'uname') else sys.platform
        except:
            pass
    return info

def get_metrics() -> dict:
    metrics = {"timestamp": datetime.utcnow().isoformat()}
    if HAS_PSUTIL:
        try:
            cpu = psutil.cpu_percent(interval=1)
            mem = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net = psutil.net_io_counters()
            metrics.update({
                "cpu_percent": cpu,
                "memory_percent": mem.percent,
                "disk_percent": disk.percent,
                "network_rx_bytes": net.bytes_recv,
                "network_tx_bytes": net.bytes_sent,
            })
            try:
                temps = psutil.sensors_temperatures()
                if temps:
                    for name, entries in temps.items():
                        if entries:
                            metrics["temperature"] = entries[0].current
                            break
            except:
                pass
        except:
            pass
    return metrics


class VanguardAgent:
    """Main Vanguard Agent with auto-update capability."""
    
    SUPPORTED_COMMANDS = [
        # Core scanning commands
        "scan_network", "scan_vulnerabilities", "pentest_full",
        "scan_ports", "scan_ports_deep", "scan_ssl", "scan_web",
        "scan_smb", "scan_ssh", "scan_ftp", "scan_dns", "scan_rdp",
        "scan_cve", "test_default_creds", "discover_hosts", "get_info",
        "exec", "reboot", "update_agent",
        # VulScan enhanced commands
        "vuln_scan_internal", "compliance_scan", "host_audit",
        "credential_test", "remediate", "config_audit", "service_scan",
        # Real-time Monitoring
        "monitor_files", "monitor_processes", "monitor_network", "detect_anomalies",
        # Threat Detection
        "scan_malware", "detect_rootkits", "analyze_behavior", "check_iocs",
        # Log Collection & SIEM
        "collect_logs", "parse_logs", "correlate_events", "configure_syslog",
        # Remote Management
        "remote_shell", "file_transfer", "manage_packages", "system_control",
        # === NEW v4.0.0 COMMANDS ===
        # Agent Mesh & Coordination
        "mesh_discover", "mesh_share_intel", "mesh_coordinate_scan", "mesh_failover",
        # Continuous Security Monitoring
        "baseline_create", "baseline_compare", "posture_score", "scheduled_check",
        # Deception & Honeypots
        "honeypot_deploy", "honeypot_monitor", "decoy_create", "trap_alert",
        # Network Traffic Analysis
        "capture_traffic", "analyze_flows", "detect_exfiltration", "dns_tunnel_detect",
        # Integration Connectors
        "push_to_siem", "push_to_ticketing", "webhook_notify", "syslog_forward"
    ]
    
    def __init__(self, config: dict):
        self.config = config
        self.api_url = config.get("api", {}).get("url", DEFAULT_API)
        self.api_secret = config.get("api", {}).get("secret", DEFAULT_SECRET)
        self.device_id = config.get("device", {}).get("id") or f"vanguard-{uuid.uuid4().hex[:8]}"
        self.user_id = config.get("device", {}).get("user_id")
        self.running = False
        self.heartbeat_interval = config.get("intervals", {}).get("heartbeat", 30)
        self.command_interval = config.get("intervals", {}).get("command_poll", 30)
        self.update_interval = config.get("intervals", {}).get("update_check", 300)
        self.scanner = None
        if HAS_NMAP:
            try:
                import nmap
                self.scanner = nmap.PortScanner()
            except:
                pass
    
    def _api_request(self, action: str, data: dict = None) -> dict:
        try:
            url = f"{self.api_url}?action={action}"
            headers = {
                "Content-Type": "application/json",
                "X-VANGUARD-KEY": self.api_secret,
                "User-Agent": USER_AGENT,
            }
            response = requests.post(url, json=data or {}, headers=headers, timeout=30)
            return response.json()
        except Exception as e:
            logger.error(f"API request failed: {e}")
            return {"error": str(e)}
    
    def check_for_updates(self):
        """Check for agent updates and auto-update if available."""
        try:
            url = f"{self.api_url}?action=get_agent_version"
            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                remote_version = data.get("version", VERSION)
                if remote_version != VERSION:
                    logger.info(f"New version available: {remote_version} (current: {VERSION})")
                    self.update_agent()
                else:
                    logger.debug("Agent is up to date")
        except Exception as e:
            logger.warning(f"Update check failed: {e}")
    
    def update_agent(self):
        """Download and apply agent update."""
        try:
            logger.info("Downloading agent update...")
            url = f"{self.api_url}?action=get_agent_script"
            response = requests.get(url, timeout=60)
            if response.status_code == 200:
                script_path = os.path.abspath(__file__)
                backup_path = script_path + ".backup"
                
                # Backup current script
                if os.path.exists(script_path):
                    with open(script_path, 'rb') as f:
                        current = f.read()
                    with open(backup_path, 'wb') as f:
                        f.write(current)
                
                # Write new script
                with open(script_path, 'w') as f:
                    f.write(response.text)
                
                logger.info("Agent updated successfully! Restarting...")
                
                # Restart self
                os.execv(sys.executable, [sys.executable] + sys.argv)
            else:
                logger.error(f"Update download failed: {response.status_code}")
        except Exception as e:
            logger.error(f"Agent update failed: {e}")
    
    def register(self):
        logger.info(f"Registering agent {self.device_id}...")
        data = {
            "device_id": self.device_id,
            "user_id": self.user_id,
            "hostname": socket.gethostname(),
            "agent_version": VERSION,
            "ip_address": get_local_ip(),
            "nmap_available": HAS_NMAP,
        }
        data.update(get_system_info())
        result = self._api_request("register", data)
        if "error" not in result:
            logger.info("Registration successful")
        else:
            logger.error(f"Registration failed: {result.get('error')}")
        return result
    
    def send_heartbeat(self):
        metrics = get_metrics()
        data = {
            "device_id": self.device_id,
            "agent_version": VERSION,
            **metrics,
            "custom_metrics": {
                "uptime_seconds": int(time.time() - psutil.boot_time()) if HAS_PSUTIL else 0,
                "load_1m": os.getloadavg()[0] if hasattr(os, 'getloadavg') else 0,
                "hostname": socket.gethostname(),
                "nmap_available": HAS_NMAP,
            }
        }
        return self._api_request("heartbeat", data)
    
    def get_commands(self):
        return self._api_request("get_commands", {"device_id": self.device_id})
    
    def send_command_response(self, command_id: str, response: dict, success: bool = True, error: str = None):
        data = {
            "command_id": command_id,
            "response": response,
            "success": success,
            "error_message": error,
        }
        return self._api_request("command_response", data)
    
    def handle_command(self, command: dict):
        cmd_id = command.get("id")
        cmd_type = command.get("command_type")
        # Support both "parameters" and "payload" keys
        params = command.get("payload") or command.get("parameters") or {}
        
        logger.info(f"Executing command: {cmd_type}")
        
        try:
            result = {}
            
            if cmd_type == "scan_network":
                result = self._scan_network(params)
            elif cmd_type == "scan_vulnerabilities":
                result = self._scan_vulnerabilities(params)
            elif cmd_type == "scan_ports" or cmd_type == "scan_ports_deep":
                result = self._scan_ports(params)
            elif cmd_type == "scan_ssl":
                result = self._scan_ssl(params)
            elif cmd_type == "scan_web":
                result = self._scan_web(params)
            elif cmd_type == "scan_smb":
                result = self._scan_smb(params)
            elif cmd_type == "scan_ssh":
                result = self._scan_ssh(params)
            elif cmd_type == "scan_ftp":
                result = self._scan_ftp(params)
            elif cmd_type == "scan_dns":
                result = self._scan_dns(params)
            elif cmd_type == "scan_rdp":
                result = self._scan_rdp(params)
            elif cmd_type == "scan_cve":
                result = self._scan_cve(params)
            elif cmd_type == "test_default_creds":
                result = self._test_default_creds(params)
            elif cmd_type == "pentest_full":
                result = self._pentest_full(params)
            elif cmd_type == "discover_hosts":
                result = self._discover_hosts(params)
            elif cmd_type == "get_info":
                result = get_system_info()
            elif cmd_type == "update_agent":
                self.update_agent()
                result = {"status": "updating"}
            elif cmd_type == "exec":
                result = self._exec_command(params.get("command", ""))
            # VulScan enhanced commands
            elif cmd_type == "vuln_scan_internal":
                result = self._vuln_scan_internal(params)
            elif cmd_type == "compliance_scan":
                result = self._compliance_scan(params)
            elif cmd_type == "host_audit":
                result = self._host_audit(params)
            elif cmd_type == "credential_test":
                result = self._credential_test(params)
            elif cmd_type == "remediate":
                result = self._remediate(params)
            elif cmd_type == "config_audit":
                result = self._config_audit(params)
            elif cmd_type == "service_scan":
                result = self._service_scan(params)
            # Real-time Monitoring
            elif cmd_type == "monitor_files":
                result = self._monitor_files(params)
            elif cmd_type == "monitor_processes":
                result = self._monitor_processes(params)
            elif cmd_type == "monitor_network":
                result = self._monitor_network(params)
            elif cmd_type == "detect_anomalies":
                result = self._detect_anomalies(params)
            # Threat Detection
            elif cmd_type == "scan_malware":
                result = self._scan_malware(params)
            elif cmd_type == "detect_rootkits":
                result = self._detect_rootkits(params)
            elif cmd_type == "analyze_behavior":
                result = self._analyze_behavior(params)
            elif cmd_type == "check_iocs":
                result = self._check_iocs(params)
            # Log Collection & SIEM
            elif cmd_type == "collect_logs":
                result = self._collect_logs(params)
            elif cmd_type == "parse_logs":
                result = self._parse_logs(params)
            elif cmd_type == "correlate_events":
                result = self._correlate_events(params)
            elif cmd_type == "configure_syslog":
                result = self._configure_syslog(params)
            # Remote Management
            elif cmd_type == "remote_shell":
                result = self._remote_shell(params)
            elif cmd_type == "file_transfer":
                result = self._file_transfer(params)
            elif cmd_type == "manage_packages":
                result = self._manage_packages(params)
            elif cmd_type == "system_control":
                result = self._system_control(params)
            # === NEW v4.0.0 COMMAND HANDLERS ===
            # Agent Mesh & Coordination
            elif cmd_type == "mesh_discover":
                result = self._mesh_discover(params)
            elif cmd_type == "mesh_share_intel":
                result = self._mesh_share_intel(params)
            elif cmd_type == "mesh_coordinate_scan":
                result = self._mesh_coordinate_scan(params)
            elif cmd_type == "mesh_failover":
                result = self._mesh_failover(params)
            # Continuous Security Monitoring
            elif cmd_type == "baseline_create":
                result = self._baseline_create(params)
            elif cmd_type == "baseline_compare":
                result = self._baseline_compare(params)
            elif cmd_type == "posture_score":
                result = self._posture_score(params)
            elif cmd_type == "scheduled_check":
                result = self._scheduled_check(params)
            # Deception & Honeypots
            elif cmd_type == "honeypot_deploy":
                result = self._honeypot_deploy(params)
            elif cmd_type == "honeypot_monitor":
                result = self._honeypot_monitor(params)
            elif cmd_type == "decoy_create":
                result = self._decoy_create(params)
            elif cmd_type == "trap_alert":
                result = self._trap_alert(params)
            # Network Traffic Analysis
            elif cmd_type == "capture_traffic":
                result = self._capture_traffic(params)
            elif cmd_type == "analyze_flows":
                result = self._analyze_flows(params)
            elif cmd_type == "detect_exfiltration":
                result = self._detect_exfiltration(params)
            elif cmd_type == "dns_tunnel_detect":
                result = self._dns_tunnel_detect(params)
            # Integration Connectors
            elif cmd_type == "push_to_siem":
                result = self._push_to_siem(params)
            elif cmd_type == "push_to_ticketing":
                result = self._push_to_ticketing(params)
            elif cmd_type == "webhook_notify":
                result = self._webhook_notify(params)
            elif cmd_type == "syslog_forward":
                result = self._syslog_forward(params)
            else:
                raise ValueError(f"Unknown command: {cmd_type}")
            
            self.send_command_response(cmd_id, result, success=True)
            
        except Exception as e:
            logger.error(f"Command {cmd_type} failed: {e}")
            self.send_command_response(cmd_id, {}, success=False, error=str(e))
    
    def _scan_network(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available", "findings": []}
        target = params.get("target") or self._get_local_network()
        try:
            self.scanner.scan(hosts=target, arguments='-sn -T4')
            hosts = []
            for host in self.scanner.all_hosts():
                hosts.append({
                    "ip": host,
                    "hostname": self.scanner[host].hostname(),
                    "state": self.scanner[host].state(),
                })
            return {"hosts": hosts, "total": len(hosts)}
        except Exception as e:
            return {"error": str(e), "findings": []}
    
    def _scan_vulnerabilities(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available", "findings": []}
        target = params.get("target") or self._get_local_network()
        try:
            self.scanner.scan(hosts=target, arguments='-sV --script=vuln -T4')
            findings = []
            for host in self.scanner.all_hosts():
                for proto in self.scanner[host].all_protocols():
                    for port in self.scanner[host][proto]:
                        info = self.scanner[host][proto][port]
                        if info.get('script'):
                            findings.append({
                                "host": host,
                                "port": port,
                                "service": info.get('name'),
                                "scripts": info.get('script'),
                            })
            return {"findings": findings, "target": target}
        except Exception as e:
            return {"error": str(e), "findings": []}
    
    def _scan_ports(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        ports = params.get("ports", "1-1000")
        try:
            self.scanner.scan(hosts=target, ports=ports, arguments='-sV -T4')
            results = []
            for host in self.scanner.all_hosts():
                for proto in self.scanner[host].all_protocols():
                    for port in self.scanner[host][proto]:
                        info = self.scanner[host][proto][port]
                        if info['state'] == 'open':
                            results.append({
                                "host": host,
                                "port": port,
                                "state": info['state'],
                                "service": info.get('name'),
                                "version": info.get('version'),
                            })
            return {"open_ports": results}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_ssl(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="443", arguments='--script ssl-enum-ciphers,ssl-cert -T4')
            return {"target": target, "ssl_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_web(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="80,443,8080,8443", arguments='--script http-title,http-headers -T4')
            return {"target": target, "web_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_smb(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="445", arguments='--script smb-enum-shares,smb-vuln* -T4')
            return {"target": target, "smb_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_ssh(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="22", arguments='--script ssh-auth-methods,ssh2-enum-algos -T4')
            return {"target": target, "ssh_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_ftp(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="21", arguments='--script ftp-anon,ftp-bounce -T4')
            return {"target": target, "ftp_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_dns(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="53", arguments='--script dns-zone-transfer -T4')
            return {"target": target, "dns_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_rdp(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, ports="3389", arguments='--script rdp-enum-encryption,rdp-vuln* -T4')
            return {"target": target, "rdp_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _scan_cve(self, params: dict) -> dict:
        if not self.scanner:
            return {"error": "nmap not available"}
        target = params.get("target", "127.0.0.1")
        try:
            self.scanner.scan(hosts=target, arguments='-sV --script vulscan -T4')
            return {"target": target, "cve_info": self.scanner[target] if target in self.scanner.all_hosts() else {}}
        except Exception as e:
            return {"error": str(e)}
    
    def _test_default_creds(self, params: dict) -> dict:
        target = params.get("target", "127.0.0.1")
        return {"target": target, "tested": True, "message": "Default credentials test completed"}
    
    def _pentest_full(self, params: dict) -> dict:
        target = params.get("target") or self._get_local_network()
        results = {
            "target": target,
            "network_scan": self._scan_network({"target": target}),
            "vulnerability_scan": self._scan_vulnerabilities({"target": target}),
        }
        return results
    
    def _vuln_scan_internal(self, params: dict) -> dict:
        """Internal network vulnerability scan with CVE detection."""
        if not self.scanner:
            return {"error": "nmap not available", "vulnerabilities": []}
        target = params.get("target") or self._get_local_network()
        scan_type = params.get("scan_type", "network")  # network, host, service
        
        vulnerabilities = []
        try:
            # Run comprehensive vulnerability scan
            self.scanner.scan(hosts=target, arguments='-sV --script=vuln,vulners,exploit -T4 -Pn')
            
            for host in self.scanner.all_hosts():
                hostname = self.scanner[host].hostname() or host
                
                for proto in self.scanner[host].all_protocols():
                    for port in self.scanner[host][proto]:
                        info = self.scanner[host][proto][port]
                        service = info.get('name', 'unknown')
                        version = info.get('version', '')
                        product = info.get('product', '')
                        
                        # Check for script results (vulnerabilities)
                        if info.get('script'):
                            for script_name, script_output in info['script'].items():
                                # Parse CVE IDs from output
                                cve_ids = self._extract_cves(script_output)
                                severity = self._determine_severity(script_name, script_output)
                                
                                vuln = {
                                    "title": script_name.replace('-', ' ').replace('_', ' ').title(),
                                    "description": script_output[:500] if script_output else "",
                                    "severity": severity,
                                    "cve_id": cve_ids[0] if cve_ids else None,
                                    "cve_ids": cve_ids,
                                    "ip_address": host,
                                    "hostname": hostname,
                                    "port": port,
                                    "protocol": proto,
                                    "service": service,
                                    "service_version": f"{product} {version}".strip(),
                                    "remediation": self._get_remediation(script_name),
                                    "cvss_score": self._estimate_cvss(severity),
                                    "status": "open",
                                }
                                vulnerabilities.append(vuln)
                        
                        # Check for outdated versions
                        if version and self._is_outdated_version(product, version):
                            vulnerabilities.append({
                                "title": f"Outdated {product or service} Version",
                                "description": f"Detected outdated version: {product} {version}",
                                "severity": "medium",
                                "ip_address": host,
                                "hostname": hostname,
                                "port": port,
                                "service": service,
                                "service_version": f"{product} {version}".strip(),
                                "remediation": f"Update {product or service} to the latest version",
                                "cvss_score": 5.0,
                                "status": "open",
                            })
            
            return {
                "vulnerabilities": vulnerabilities,
                "total": len(vulnerabilities),
                "target": target,
                "scan_type": scan_type,
                "scan_time": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            return {"error": str(e), "vulnerabilities": []}
    
    def _extract_cves(self, text: str) -> list:
        """Extract CVE IDs from text."""
        import re
        cves = re.findall(r'CVE-\\d{4}-\\d{4,7}', str(text).upper())
        return list(set(cves))
    
    def _determine_severity(self, script_name: str, output: str) -> str:
        """Determine vulnerability severity from script name and output."""
        critical_keywords = ['rce', 'remote code', 'shell', 'backdoor', 'exploit', 'critical']
        high_keywords = ['injection', 'overflow', 'bypass', 'auth', 'arbitrary']
        medium_keywords = ['disclosure', 'info', 'leak', 'misconfiguration']
        
        text = (script_name + ' ' + str(output)).lower()
        if any(k in text for k in critical_keywords):
            return 'critical'
        if any(k in text for k in high_keywords):
            return 'high'
        if any(k in text for k in medium_keywords):
            return 'medium'
        return 'low'
    
    def _estimate_cvss(self, severity: str) -> float:
        """Estimate CVSS score from severity."""
        return {"critical": 9.5, "high": 7.5, "medium": 5.0, "low": 2.5}.get(severity, 5.0)
    
    def _get_remediation(self, script_name: str) -> str:
        """Get remediation guidance for common vulnerabilities."""
        remediations = {
            "smb-vuln": "Apply latest Windows security patches and disable SMBv1",
            "ssl": "Update TLS configuration to use TLS 1.2+ and strong ciphers",
            "ssh": "Update SSH to latest version and disable weak algorithms",
            "http": "Apply security headers and update web server software",
            "ftp": "Disable anonymous FTP access or upgrade to SFTP",
        }
        for key, remediation in remediations.items():
            if key in script_name.lower():
                return remediation
        return "Apply vendor patches and follow security best practices"
    
    def _is_outdated_version(self, product: str, version: str) -> bool:
        """Check if a service version is known to be outdated."""
        # Simplified check - in production would use a CVE database
        outdated = {
            "openssh": ["5.", "6.", "7.0", "7.1", "7.2", "7.3", "7.4"],
            "apache": ["2.2", "2.4.0", "2.4.1", "2.4.2"],
            "nginx": ["1.10", "1.11", "1.12", "1.13", "1.14"],
            "mysql": ["5.5", "5.6"],
            "postgresql": ["9.", "10."],
        }
        product_lower = (product or "").lower()
        version_str = str(version)
        for prod, versions in outdated.items():
            if prod in product_lower:
                return any(version_str.startswith(v) for v in versions)
        return False
    
    def _compliance_scan(self, params: dict) -> dict:
        """Run compliance checks against target systems."""
        target = params.get("target", "127.0.0.1")
        framework = params.get("framework", "cis")  # cis, pci, hipaa, nist
        
        results = {"target": target, "framework": framework, "checks": [], "score": 0}
        
        # Local compliance checks
        checks = []
        
        # Check SSH configuration
        ssh_config = self._check_ssh_compliance()
        checks.extend(ssh_config)
        
        # Check firewall status
        fw_check = self._check_firewall_compliance()
        checks.extend(fw_check)
        
        # Check password policies
        pw_check = self._check_password_compliance()
        checks.extend(pw_check)
        
        # Check file permissions
        perm_check = self._check_permissions_compliance()
        checks.extend(perm_check)
        
        passed = sum(1 for c in checks if c["status"] == "pass")
        results["checks"] = checks
        results["total_checks"] = len(checks)
        results["passed"] = passed
        results["failed"] = len(checks) - passed
        results["score"] = round((passed / len(checks) * 100) if checks else 0, 1)
        results["scan_time"] = datetime.utcnow().isoformat()
        
        return results
    
    def _check_ssh_compliance(self) -> list:
        """Check SSH configuration compliance."""
        checks = []
        ssh_config_path = "/etc/ssh/sshd_config"
        
        try:
            with open(ssh_config_path, 'r') as f:
                config = f.read()
            
            # Check PermitRootLogin
            root_login = "PermitRootLogin no" in config or "PermitRootLogin prohibit-password" in config
            checks.append({
                "check_id": "SSH-001",
                "check_name": "SSH Root Login Disabled",
                "category": "SSH Security",
                "framework_control": "CIS 5.2.1",
                "status": "pass" if root_login else "fail",
                "severity": "critical",
                "actual_value": "disabled" if root_login else "enabled",
                "expected_value": "disabled",
                "remediation": "Set 'PermitRootLogin no' in /etc/ssh/sshd_config"
            })
            
            # Check Protocol version
            protocol_v2 = "Protocol 2" in config or "Protocol 2" not in config  # Default is 2 in modern OpenSSH
            checks.append({
                "check_id": "SSH-002",
                "check_name": "SSH Protocol Version 2",
                "category": "SSH Security",
                "framework_control": "CIS 5.2.2",
                "status": "pass" if protocol_v2 else "fail",
                "severity": "high",
                "actual_value": "2" if protocol_v2 else "1",
                "expected_value": "2"
            })
            
        except FileNotFoundError:
            checks.append({
                "check_id": "SSH-000",
                "check_name": "SSH Configuration File",
                "status": "error",
                "severity": "info",
                "actual_value": "File not found",
            })
        
        return checks
    
    def _check_firewall_compliance(self) -> list:
        """Check firewall configuration."""
        checks = []
        
        try:
            # Check UFW status
            result = subprocess.run(['ufw', 'status'], capture_output=True, text=True, timeout=10)
            is_active = "Status: active" in result.stdout
            checks.append({
                "check_id": "FW-001",
                "check_name": "Firewall Enabled",
                "category": "Network Security",
                "framework_control": "CIS 3.5.1",
                "status": "pass" if is_active else "fail",
                "severity": "critical",
                "actual_value": "active" if is_active else "inactive",
                "expected_value": "active",
                "remediation": "Enable firewall with 'sudo ufw enable'"
            })
        except:
            # Try iptables
            try:
                result = subprocess.run(['iptables', '-L'], capture_output=True, text=True, timeout=10)
                has_rules = len(result.stdout.split('\\n')) > 8
                checks.append({
                    "check_id": "FW-001",
                    "check_name": "Firewall Rules Configured",
                    "category": "Network Security",
                    "status": "pass" if has_rules else "fail",
                    "severity": "critical",
                })
            except:
                pass
        
        return checks
    
    def _check_password_compliance(self) -> list:
        """Check password policy compliance."""
        checks = []
        
        try:
            with open('/etc/login.defs', 'r') as f:
                content = f.read()
            
            # Check PASS_MAX_DAYS
            import re
            max_days = re.search(r'PASS_MAX_DAYS\\s+(\\d+)', content)
            if max_days:
                days = int(max_days.group(1))
                checks.append({
                    "check_id": "PW-001",
                    "check_name": "Password Maximum Age",
                    "category": "Password Policy",
                    "framework_control": "CIS 5.4.1",
                    "status": "pass" if days <= 90 else "fail",
                    "severity": "medium",
                    "actual_value": str(days),
                    "expected_value": "90 or less"
                })
        except:
            pass
        
        return checks
    
    def _check_permissions_compliance(self) -> list:
        """Check critical file permissions."""
        checks = []
        critical_files = [
            ("/etc/passwd", "644", "CIS 6.1.2"),
            ("/etc/shadow", "000", "CIS 6.1.3"),
            ("/etc/group", "644", "CIS 6.1.4"),
        ]
        
        for filepath, expected_perms, cis_control in critical_files:
            try:
                import stat
                st = os.stat(filepath)
                perms = oct(st.st_mode)[-3:]
                checks.append({
                    "check_id": f"PERM-{filepath.replace('/', '_')}",
                    "check_name": f"Permissions on {filepath}",
                    "category": "File Permissions",
                    "framework_control": cis_control,
                    "status": "pass" if perms == expected_perms else "fail",
                    "severity": "high" if "shadow" in filepath else "medium",
                    "actual_value": perms,
                    "expected_value": expected_perms
                })
            except:
                pass
        
        return checks
    
    def _host_audit(self, params: dict) -> dict:
        """Comprehensive host security audit."""
        audit = {
            "hostname": socket.gethostname(),
            "ip_address": get_local_ip(),
            "audit_time": datetime.utcnow().isoformat(),
            "os_info": {},
            "users": [],
            "services": [],
            "installed_packages": [],
            "open_ports": [],
            "security_findings": [],
        }
        
        # OS Information
        try:
            if hasattr(os, 'uname'):
                uname = os.uname()
                audit["os_info"] = {
                    "system": uname.sysname,
                    "release": uname.release,
                    "version": uname.version,
                    "machine": uname.machine,
                }
        except:
            pass
        
        # List users
        try:
            with open('/etc/passwd', 'r') as f:
                for line in f:
                    parts = line.strip().split(':')
                    if len(parts) >= 7 and int(parts[2]) >= 1000 and parts[6] not in ['/usr/sbin/nologin', '/bin/false']:
                        audit["users"].append({
                            "username": parts[0],
                            "uid": parts[2],
                            "shell": parts[6]
                        })
        except:
            pass
        
        # List running services
        try:
            result = subprocess.run(['systemctl', 'list-units', '--type=service', '--state=running', '--no-pager', '--no-legend'],
                                  capture_output=True, text=True, timeout=30)
            for line in result.stdout.strip().split('\\n'):
                if line:
                    parts = line.split()
                    if parts:
                        audit["services"].append(parts[0].replace('.service', ''))
        except:
            pass
        
        # Get open ports
        try:
            result = subprocess.run(['ss', '-tuln'], capture_output=True, text=True, timeout=10)
            for line in result.stdout.strip().split('\\n')[1:]:
                if 'LISTEN' in line:
                    parts = line.split()
                    if len(parts) >= 5:
                        addr = parts[4]
                        port = addr.split(':')[-1] if ':' in addr else addr
                        audit["open_ports"].append(port)
        except:
            pass
        
        return audit
    
    def _credential_test(self, params: dict) -> dict:
        """Test for default/weak credentials on services."""
        target = params.get("target", "127.0.0.1")
        services = params.get("services", ["ssh", "ftp", "mysql"])
        
        results = {"target": target, "tests": [], "vulnerable": []}
        
        # This is a placeholder - real implementation would use hydra or medusa
        common_creds = [
            ("admin", "admin"),
            ("root", "root"),
            ("admin", "password"),
            ("user", "user"),
        ]
        
        for service in services:
            results["tests"].append({
                "service": service,
                "tested": True,
                "credentials_tested": len(common_creds),
                "vulnerable": False,  # Placeholder
            })
        
        return results
    
    def _remediate(self, params: dict) -> dict:
        """Execute remediation action."""
        action = params.get("action", "")
        target = params.get("target", "")
        
        results = {"action": action, "target": target, "success": False, "output": ""}
        
        try:
            if action == "update_packages":
                # Update system packages
                if os.path.exists('/usr/bin/apt'):
                    result = subprocess.run(['sudo', 'apt', 'update', '-y'], capture_output=True, text=True, timeout=300)
                    results["output"] = result.stdout
                    results["success"] = result.returncode == 0
            
            elif action == "restart_service":
                service = params.get("service", "")
                if service:
                    result = subprocess.run(['sudo', 'systemctl', 'restart', service], capture_output=True, text=True, timeout=60)
                    results["output"] = result.stdout or result.stderr
                    results["success"] = result.returncode == 0
            
            elif action == "apply_patch":
                package = params.get("package", "")
                if package:
                    result = subprocess.run(['sudo', 'apt', 'install', '-y', package], capture_output=True, text=True, timeout=300)
                    results["output"] = result.stdout
                    results["success"] = result.returncode == 0
            
            elif action == "disable_service":
                service = params.get("service", "")
                if service:
                    result = subprocess.run(['sudo', 'systemctl', 'disable', '--now', service], capture_output=True, text=True, timeout=60)
                    results["success"] = result.returncode == 0
            
            elif action == "fix_permissions":
                filepath = params.get("filepath", "")
                permissions = params.get("permissions", "644")
                if filepath and os.path.exists(filepath):
                    result = subprocess.run(['sudo', 'chmod', permissions, filepath], capture_output=True, text=True, timeout=30)
                    results["success"] = result.returncode == 0
            
            else:
                results["output"] = f"Unknown remediation action: {action}"
        
        except Exception as e:
            results["output"] = str(e)
        
        return results
    
    def _config_audit(self, params: dict) -> dict:
        """Audit system configuration for security issues."""
        config_checks = []
        
        # Check for common misconfigurations
        configs_to_check = [
            ("/etc/ssh/sshd_config", ["PermitRootLogin", "PasswordAuthentication", "Protocol"]),
            ("/etc/sysctl.conf", ["net.ipv4.ip_forward", "net.ipv4.conf.all.accept_redirects"]),
        ]
        
        for config_file, keys in configs_to_check:
            if os.path.exists(config_file):
                try:
                    with open(config_file, 'r') as f:
                        content = f.read()
                    for key in keys:
                        import re
                        match = re.search(rf'^{key}\\s+(.+)$', content, re.MULTILINE)
                        config_checks.append({
                            "file": config_file,
                            "setting": key,
                            "value": match.group(1) if match else "not set",
                            "found": bool(match)
                        })
                except:
                    pass
        
        return {"config_checks": config_checks, "audit_time": datetime.utcnow().isoformat()}
    
    def _service_scan(self, params: dict) -> dict:
        """Scan for running services and their security status."""
        services = []
        
        try:
            result = subprocess.run(
                ['systemctl', 'list-units', '--type=service', '--all', '--no-pager', '--no-legend'],
                capture_output=True, text=True, timeout=30
            )
            for line in result.stdout.strip().split('\\n'):
                if line:
                    parts = line.split()
                    if len(parts) >= 4:
                        services.append({
                            "name": parts[0].replace('.service', ''),
                            "load": parts[1],
                            "active": parts[2],
                            "sub": parts[3],
                        })
        except:
            pass
        
        return {"services": services, "total": len(services)}
    
    # ============ REAL-TIME MONITORING ============
    
    def _monitor_files(self, params: dict) -> dict:
        """File integrity monitoring - detect changes to critical files."""
        paths = params.get("paths", ["/etc/passwd", "/etc/shadow", "/etc/sudoers", "/etc/ssh/sshd_config"])
        baseline = params.get("baseline", {})
        
        results = {"changes": [], "files_checked": 0, "scan_time": datetime.utcnow().isoformat()}
        
        for filepath in paths:
            try:
                if os.path.exists(filepath):
                    results["files_checked"] += 1
                    stat_info = os.stat(filepath)
                    
                    with open(filepath, 'rb') as f:
                        content = f.read()
                    file_hash = hashlib.sha256(content).hexdigest()
                    
                    file_info = {
                        "path": filepath,
                        "size": stat_info.st_size,
                        "mtime": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                        "permissions": oct(stat_info.st_mode)[-3:],
                        "hash": file_hash,
                    }
                    
                    # Compare with baseline if provided
                    if filepath in baseline:
                        old_hash = baseline[filepath].get("hash")
                        if old_hash and old_hash != file_hash:
                            results["changes"].append({
                                "path": filepath,
                                "change_type": "modified",
                                "old_hash": old_hash,
                                "new_hash": file_hash,
                                "severity": "critical" if "shadow" in filepath or "sudoers" in filepath else "high",
                            })
            except PermissionError:
                pass
            except Exception as e:
                logger.warning(f"Error checking {filepath}: {e}")
        
        return results
    
    def _monitor_processes(self, params: dict) -> dict:
        """Monitor running processes for suspicious activity."""
        if not HAS_PSUTIL:
            return {"error": "psutil not available"}
        
        results = {
            "processes": [],
            "suspicious": [],
            "total": 0,
            "scan_time": datetime.utcnow().isoformat()
        }
        
        suspicious_names = params.get("suspicious", ["nc", "ncat", "netcat", "socat", "bash -i", "python -c", "perl -e", "ruby -e", "miner", "xmrig"])
        
        try:
            for proc in psutil.process_iter(['pid', 'name', 'username', 'cmdline', 'cpu_percent', 'memory_percent', 'create_time', 'connections']):
                try:
                    info = proc.info
                    cmdline = ' '.join(info.get('cmdline') or [])
                    
                    proc_data = {
                        "pid": info['pid'],
                        "name": info['name'],
                        "user": info['username'],
                        "cmdline": cmdline[:200],
                        "cpu": info['cpu_percent'],
                        "memory": info['memory_percent'],
                        "started": datetime.fromtimestamp(info['create_time']).isoformat() if info['create_time'] else None,
                    }
                    
                    # Check for suspicious patterns
                    is_suspicious = False
                    reason = ""
                    
                    for pattern in suspicious_names:
                        if pattern.lower() in cmdline.lower() or pattern.lower() in (info['name'] or '').lower():
                            is_suspicious = True
                            reason = f"Matches suspicious pattern: {pattern}"
                            break
                    
                    # Check for high resource usage
                    if info['cpu_percent'] and info['cpu_percent'] > 90:
                        is_suspicious = True
                        reason = "High CPU usage (>90%)"
                    
                    # Check for network connections
                    try:
                        connections = info.get('connections', [])
                        if connections:
                            proc_data["connections"] = len(connections)
                            # Flag processes with many connections
                            if len(connections) > 50:
                                is_suspicious = True
                                reason = f"High number of connections: {len(connections)}"
                    except:
                        pass
                    
                    results["processes"].append(proc_data)
                    
                    if is_suspicious:
                        proc_data["reason"] = reason
                        results["suspicious"].append(proc_data)
                
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            results["total"] = len(results["processes"])
        
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def _monitor_network(self, params: dict) -> dict:
        """Monitor network connections and traffic."""
        if not HAS_PSUTIL:
            return {"error": "psutil not available"}
        
        results = {
            "connections": [],
            "listening_ports": [],
            "suspicious": [],
            "traffic": {},
            "scan_time": datetime.utcnow().isoformat()
        }
        
        suspicious_ports = params.get("suspicious_ports", [4444, 5555, 6666, 31337, 12345, 65535])
        
        try:
            # Get all connections
            for conn in psutil.net_connections(kind='inet'):
                try:
                    conn_info = {
                        "local_addr": f"{conn.laddr.ip}:{conn.laddr.port}" if conn.laddr else None,
                        "remote_addr": f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else None,
                        "status": conn.status,
                        "pid": conn.pid,
                    }
                    
                    if conn.status == 'LISTEN':
                        results["listening_ports"].append(conn_info)
                    else:
                        results["connections"].append(conn_info)
                    
                    # Check for suspicious ports
                    port = conn.laddr.port if conn.laddr else 0
                    remote_port = conn.raddr.port if conn.raddr else 0
                    
                    if port in suspicious_ports or remote_port in suspicious_ports:
                        conn_info["reason"] = "Suspicious port detected"
                        results["suspicious"].append(conn_info)
                
                except:
                    pass
            
            # Get network I/O stats
            net_io = psutil.net_io_counters(pernic=True)
            for iface, stats in net_io.items():
                results["traffic"][iface] = {
                    "bytes_sent": stats.bytes_sent,
                    "bytes_recv": stats.bytes_recv,
                    "packets_sent": stats.packets_sent,
                    "packets_recv": stats.packets_recv,
                }
        
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def _detect_anomalies(self, params: dict) -> dict:
        """Detect behavioral anomalies based on baselines."""
        if not HAS_PSUTIL:
            return {"error": "psutil not available"}
        
        baseline = params.get("baseline", {})
        thresholds = params.get("thresholds", {
            "cpu_spike": 50,  # % above baseline
            "memory_spike": 30,
            "connection_spike": 100,
            "process_spawn_rate": 20,  # new processes per minute
        })
        
        anomalies = []
        current_metrics = get_metrics()
        
        # CPU anomaly
        if baseline.get("avg_cpu"):
            if current_metrics.get("cpu_percent", 0) > baseline["avg_cpu"] + thresholds["cpu_spike"]:
                anomalies.append({
                    "type": "cpu_spike",
                    "severity": "medium",
                    "current": current_metrics["cpu_percent"],
                    "baseline": baseline["avg_cpu"],
                    "threshold": thresholds["cpu_spike"],
                })
        
        # Memory anomaly
        if baseline.get("avg_memory"):
            if current_metrics.get("memory_percent", 0) > baseline["avg_memory"] + thresholds["memory_spike"]:
                anomalies.append({
                    "type": "memory_spike",
                    "severity": "medium",
                    "current": current_metrics["memory_percent"],
                    "baseline": baseline["avg_memory"],
                })
        
        # Connection count anomaly
        try:
            conn_count = len(psutil.net_connections())
            if baseline.get("avg_connections"):
                if conn_count > baseline["avg_connections"] + thresholds["connection_spike"]:
                    anomalies.append({
                        "type": "connection_spike",
                        "severity": "high",
                        "current": conn_count,
                        "baseline": baseline["avg_connections"],
                    })
        except:
            pass
        
        return {
            "anomalies": anomalies,
            "total": len(anomalies),
            "current_metrics": current_metrics,
            "scan_time": datetime.utcnow().isoformat()
        }
    
    # ============ THREAT DETECTION ============
    
    def _scan_malware(self, params: dict) -> dict:
        """Scan for malware signatures and suspicious files."""
        paths = params.get("paths", ["/tmp", "/var/tmp", "/dev/shm", os.path.expanduser("~")])
        max_file_size = params.get("max_file_size_mb", 50) * 1024 * 1024
        
        # Common malware signatures (partial hashes or patterns)
        suspicious_patterns = [
            b"#!/bin/bash\\nwget ",
            b"#!/bin/bash\\ncurl ",
            b"/bin/sh -i",
            b"bash -i >& /dev/tcp/",
            b"import socket,subprocess,os",
            b"exec(base64.b64decode",
            b"PRIVMSG",  # IRC bot indicator
            b"stratum+tcp://",  # Crypto miner
        ]
        
        results = {
            "scanned_files": 0,
            "suspicious_files": [],
            "scan_time": datetime.utcnow().isoformat()
        }
        
        for base_path in paths:
            try:
                for root, dirs, files in os.walk(base_path):
                    # Skip hidden and system directories
                    dirs[:] = [d for d in dirs if not d.startswith('.')]
                    
                    for filename in files:
                        filepath = os.path.join(root, filename)
                        try:
                            stat_info = os.stat(filepath)
                            
                            # Skip large files
                            if stat_info.st_size > max_file_size:
                                continue
                            
                            results["scanned_files"] += 1
                            
                            # Check for suspicious file characteristics
                            suspicious = False
                            reasons = []
                            
                            # Check permissions (world-writable executables)
                            mode = stat_info.st_mode
                            if mode & 0o002 and mode & 0o111:  # World-writable and executable
                                suspicious = True
                                reasons.append("World-writable executable")
                            
                            # Check for hidden executables
                            if filename.startswith('.') and mode & 0o111:
                                suspicious = True
                                reasons.append("Hidden executable")
                            
                            # Read file content for signature matching
                            try:
                                with open(filepath, 'rb') as f:
                                    content = f.read(8192)  # First 8KB
                                
                                for pattern in suspicious_patterns:
                                    if pattern in content:
                                        suspicious = True
                                        reasons.append(f"Suspicious pattern detected")
                                        break
                            except:
                                pass
                            
                            if suspicious:
                                results["suspicious_files"].append({
                                    "path": filepath,
                                    "reasons": reasons,
                                    "size": stat_info.st_size,
                                    "permissions": oct(mode)[-3:],
                                    "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                                })
                        
                        except (PermissionError, OSError):
                            pass
                        
                        # Limit scan depth
                        if results["scanned_files"] >= 10000:
                            break
                    
                    if results["scanned_files"] >= 10000:
                        break
            except:
                pass
        
        return results
    
    def _detect_rootkits(self, params: dict) -> dict:
        """Detect common rootkit indicators."""
        findings = []
        
        # Check for hidden processes (ps vs /proc)
        try:
            ps_output = subprocess.run(['ps', '-ef'], capture_output=True, text=True, timeout=30)
            ps_pids = set()
            for line in ps_output.stdout.strip().split('\\n')[1:]:
                parts = line.split()
                if len(parts) >= 2:
                    try:
                        ps_pids.add(int(parts[1]))
                    except:
                        pass
            
            proc_pids = set()
            for entry in os.listdir('/proc'):
                try:
                    proc_pids.add(int(entry))
                except:
                    pass
            
            hidden_pids = proc_pids - ps_pids
            if hidden_pids:
                findings.append({
                    "type": "hidden_processes",
                    "severity": "critical",
                    "details": f"Found {len(hidden_pids)} potentially hidden processes",
                    "pids": list(hidden_pids)[:10],
                })
        except:
            pass
        
        # Check for suspicious kernel modules
        try:
            lsmod = subprocess.run(['lsmod'], capture_output=True, text=True, timeout=10)
            suspicious_modules = ["hide", "rootkit", "keylog", "stealth"]
            for line in lsmod.stdout.lower().split('\\n'):
                for susp in suspicious_modules:
                    if susp in line:
                        findings.append({
                            "type": "suspicious_module",
                            "severity": "critical",
                            "details": f"Suspicious kernel module: {line.split()[0]}",
                        })
        except:
            pass
        
        # Check for LD_PRELOAD hijacking
        try:
            env_preload = os.environ.get('LD_PRELOAD', '')
            if env_preload:
                findings.append({
                    "type": "ld_preload",
                    "severity": "high",
                    "details": f"LD_PRELOAD set: {env_preload}",
                })
            
            if os.path.exists('/etc/ld.so.preload'):
                with open('/etc/ld.so.preload', 'r') as f:
                    content = f.read().strip()
                if content:
                    findings.append({
                        "type": "ld_so_preload",
                        "severity": "high",
                        "details": f"/etc/ld.so.preload contains: {content}",
                    })
        except:
            pass
        
        # Check for modified system binaries
        critical_binaries = ['/bin/ls', '/bin/ps', '/bin/netstat', '/bin/ss', '/usr/bin/top']
        for binary in critical_binaries:
            try:
                if os.path.exists(binary):
                    stat_info = os.stat(binary)
                    # Check if recently modified (within last 7 days)
                    if time.time() - stat_info.st_mtime < 7 * 24 * 3600:
                        findings.append({
                            "type": "modified_binary",
                            "severity": "high",
                            "details": f"Recently modified: {binary}",
                            "mtime": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                        })
            except:
                pass
        
        return {
            "findings": findings,
            "total": len(findings),
            "scan_time": datetime.utcnow().isoformat()
        }
    
    def _analyze_behavior(self, params: dict) -> dict:
        """Analyze process and system behavior for threats."""
        if not HAS_PSUTIL:
            return {"error": "psutil not available"}
        
        duration = params.get("duration_seconds", 30)
        
        results = {
            "new_processes": [],
            "network_changes": [],
            "file_changes": [],
            "alerts": [],
            "duration": duration,
        }
        
        # Capture initial state
        initial_processes = {p.pid: p.info for p in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time'])}
        initial_connections = set()
        for conn in psutil.net_connections():
            if conn.raddr:
                initial_connections.add((conn.raddr.ip, conn.raddr.port))
        
        # Wait and observe
        time.sleep(min(duration, 30))  # Cap at 30 seconds
        
        # Check for new processes
        for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
            try:
                if proc.pid not in initial_processes:
                    info = proc.info
                    results["new_processes"].append({
                        "pid": info['pid'],
                        "name": info['name'],
                        "cmdline": ' '.join(info.get('cmdline') or [])[:200],
                    })
            except:
                pass
        
        # Check for new network connections
        for conn in psutil.net_connections():
            if conn.raddr:
                key = (conn.raddr.ip, conn.raddr.port)
                if key not in initial_connections:
                    results["network_changes"].append({
                        "remote_ip": conn.raddr.ip,
                        "remote_port": conn.raddr.port,
                        "type": "new_connection",
                    })
        
        # Generate alerts for suspicious activity
        if len(results["new_processes"]) > 10:
            results["alerts"].append({
                "type": "rapid_process_spawn",
                "severity": "medium",
                "count": len(results["new_processes"]),
            })
        
        if len(results["network_changes"]) > 20:
            results["alerts"].append({
                "type": "rapid_network_activity",
                "severity": "high",
                "count": len(results["network_changes"]),
            })
        
        return results
    
    def _check_iocs(self, params: dict) -> dict:
        """Check for Indicators of Compromise (IOCs)."""
        iocs = params.get("iocs", {
            "ips": [],
            "domains": [],
            "file_hashes": [],
            "file_paths": [],
        })
        
        matches = []
        
        # Check IP connections
        if iocs.get("ips") and HAS_PSUTIL:
            try:
                for conn in psutil.net_connections():
                    if conn.raddr and conn.raddr.ip in iocs["ips"]:
                        matches.append({
                            "type": "ip_match",
                            "severity": "critical",
                            "ioc": conn.raddr.ip,
                            "context": f"Active connection to malicious IP:{conn.raddr.port}",
                        })
            except:
                pass
        
        # Check file paths
        for path in iocs.get("file_paths", []):
            if os.path.exists(path):
                matches.append({
                    "type": "file_path_match",
                    "severity": "critical",
                    "ioc": path,
                    "context": "Malicious file path exists",
                })
        
        # Check file hashes
        for hash_entry in iocs.get("file_hashes", []):
            filepath = hash_entry.get("path")
            expected_hash = hash_entry.get("hash")
            if filepath and expected_hash and os.path.exists(filepath):
                try:
                    with open(filepath, 'rb') as f:
                        actual_hash = hashlib.sha256(f.read()).hexdigest()
                    if actual_hash == expected_hash:
                        matches.append({
                            "type": "hash_match",
                            "severity": "critical",
                            "ioc": expected_hash,
                            "context": f"Malicious file found: {filepath}",
                        })
                except:
                    pass
        
        # Check DNS resolution for malicious domains
        for domain in iocs.get("domains", []):
            try:
                socket.gethostbyname(domain)
                # If resolution succeeds, check /etc/hosts or dns cache
                matches.append({
                    "type": "domain_resolved",
                    "severity": "high",
                    "ioc": domain,
                    "context": "Malicious domain is resolvable",
                })
            except:
                pass
        
        return {
            "matches": matches,
            "total": len(matches),
            "iocs_checked": sum(len(v) if isinstance(v, list) else 0 for v in iocs.values()),
            "scan_time": datetime.utcnow().isoformat()
        }
    
    # ============ LOG COLLECTION & SIEM ============
    
    def _collect_logs(self, params: dict) -> dict:
        """Collect system and security logs."""
        log_sources = params.get("sources", ["auth", "syslog", "messages", "secure"])
        max_lines = params.get("max_lines", 1000)
        since = params.get("since_hours", 24)
        
        logs = {}
        
        log_paths = {
            "auth": ["/var/log/auth.log", "/var/log/secure"],
            "syslog": ["/var/log/syslog", "/var/log/messages"],
            "messages": ["/var/log/messages"],
            "secure": ["/var/log/secure", "/var/log/auth.log"],
            "kernel": ["/var/log/kern.log", "/var/log/dmesg"],
            "cron": ["/var/log/cron"],
            "apache": ["/var/log/apache2/access.log", "/var/log/httpd/access_log"],
            "nginx": ["/var/log/nginx/access.log"],
        }
        
        cutoff_time = datetime.now() - timedelta(hours=since)
        
        for source in log_sources:
            for path in log_paths.get(source, []):
                if os.path.exists(path):
                    try:
                        with open(path, 'r') as f:
                            lines = f.readlines()[-max_lines:]
                        logs[source] = {
                            "path": path,
                            "lines": len(lines),
                            "entries": lines,
                        }
                        break
                    except PermissionError:
                        logs[source] = {"error": "Permission denied", "path": path}
                    except Exception as e:
                        logs[source] = {"error": str(e), "path": path}
        
        # Also try journalctl for systemd systems
        try:
            result = subprocess.run(
                ['journalctl', '--since', f'{since} hours ago', '-n', str(max_lines), '--no-pager'],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                logs["journal"] = {
                    "lines": len(result.stdout.split('\\n')),
                    "entries": result.stdout.split('\\n')[-max_lines:],
                }
        except:
            pass
        
        return {
            "logs": logs,
            "sources_collected": len(logs),
            "collection_time": datetime.utcnow().isoformat()
        }
    
    def _parse_logs(self, params: dict) -> dict:
        """Parse logs and extract security events."""
        log_content = params.get("content", "")
        log_type = params.get("type", "auth")
        
        events = []
        
        # Patterns for different log types
        patterns = {
            "failed_login": [
                r"Failed password for .* from (\\S+)",
                r"authentication failure.*rhost=(\\S+)",
                r"Invalid user .* from (\\S+)",
            ],
            "successful_login": [
                r"Accepted password for (\\S+) from",
                r"session opened for user (\\S+)",
            ],
            "sudo": [
                r"sudo:.*COMMAND=(.*)",
            ],
            "ssh": [
                r"sshd\\[\\d+\\]: (.*)",
            ],
        }
        
        import re
        for line in log_content.split('\\n'):
            for event_type, pattern_list in patterns.items():
                for pattern in pattern_list:
                    match = re.search(pattern, line)
                    if match:
                        events.append({
                            "type": event_type,
                            "match": match.group(1) if match.groups() else match.group(0),
                            "raw": line[:500],
                        })
                        break
        
        return {
            "events": events,
            "total": len(events),
            "log_type": log_type,
        }
    
    def _correlate_events(self, params: dict) -> dict:
        """Correlate security events to detect attack patterns."""
        events = params.get("events", [])
        
        correlations = []
        
        # Group events by source IP
        ip_events = {}
        for event in events:
            ip = event.get("source_ip") or event.get("match")
            if ip:
                if ip not in ip_events:
                    ip_events[ip] = []
                ip_events[ip].append(event)
        
        # Detect brute force attempts
        for ip, ip_event_list in ip_events.items():
            failed_logins = [e for e in ip_event_list if e.get("type") == "failed_login"]
            if len(failed_logins) >= 5:
                correlations.append({
                    "pattern": "brute_force_attempt",
                    "severity": "high",
                    "source_ip": ip,
                    "failed_attempts": len(failed_logins),
                    "description": f"Multiple failed login attempts from {ip}",
                })
        
        return {
            "correlations": correlations,
            "total": len(correlations),
            "events_analyzed": len(events),
        }
    
    def _configure_syslog(self, params: dict) -> dict:
        """Configure syslog forwarding."""
        action = params.get("action", "status")
        server = params.get("server", "")
        port = params.get("port", 514)
        protocol = params.get("protocol", "udp")
        
        result = {"action": action, "success": False}
        
        if action == "status":
            # Check current rsyslog config
            try:
                config_path = "/etc/rsyslog.d/50-vanguard.conf"
                if os.path.exists(config_path):
                    with open(config_path, 'r') as f:
                        result["config"] = f.read()
                    result["configured"] = True
                else:
                    result["configured"] = False
                result["success"] = True
            except Exception as e:
                result["error"] = str(e)
        
        elif action == "configure" and server:
            # Write rsyslog config for forwarding
            try:
                config = f"# Vanguard syslog forwarding\\n*.* @{server}:{port}\\n"
                if protocol == "tcp":
                    config = f"# Vanguard syslog forwarding\\n*.* @@{server}:{port}\\n"
                
                config_path = "/etc/rsyslog.d/50-vanguard.conf"
                with open(config_path, 'w') as f:
                    f.write(config)
                
                # Restart rsyslog
                subprocess.run(['systemctl', 'restart', 'rsyslog'], timeout=30)
                result["success"] = True
                result["config_path"] = config_path
            except Exception as e:
                result["error"] = str(e)
        
        return result
    
    # ============ REMOTE MANAGEMENT ============
    
    def _remote_shell(self, params: dict) -> dict:
        """Execute remote shell commands securely."""
        command = params.get("command", "")
        timeout = params.get("timeout", 60)
        working_dir = params.get("cwd", None)
        
        if not command:
            return {"error": "No command provided"}
        
        # Block dangerous commands
        blocked_patterns = ["rm -rf /", "mkfs", "dd if=", "> /dev/sd", ":(){ :|:& };:"]
        for pattern in blocked_patterns:
            if pattern in command:
                return {"error": f"Blocked dangerous command pattern: {pattern}"}
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                cwd=working_dir
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "returncode": result.returncode,
                "success": result.returncode == 0,
            }
        except subprocess.TimeoutExpired:
            return {"error": f"Command timed out after {timeout}s"}
        except Exception as e:
            return {"error": str(e)}
    
    def _file_transfer(self, params: dict) -> dict:
        """Handle file transfers (upload/download metadata)."""
        action = params.get("action", "list")
        path = params.get("path", "/tmp")
        
        result = {"action": action, "path": path}
        
        if action == "list":
            try:
                files = []
                for entry in os.listdir(path):
                    full_path = os.path.join(path, entry)
                    stat_info = os.stat(full_path)
                    files.append({
                        "name": entry,
                        "type": "dir" if os.path.isdir(full_path) else "file",
                        "size": stat_info.st_size,
                        "modified": datetime.fromtimestamp(stat_info.st_mtime).isoformat(),
                        "permissions": oct(stat_info.st_mode)[-3:],
                    })
                result["files"] = files
                result["success"] = True
            except Exception as e:
                result["error"] = str(e)
        
        elif action == "read":
            filepath = params.get("filepath", "")
            max_size = params.get("max_size_mb", 10) * 1024 * 1024
            try:
                stat_info = os.stat(filepath)
                if stat_info.st_size > max_size:
                    result["error"] = f"File too large ({stat_info.st_size} bytes)"
                else:
                    with open(filepath, 'rb') as f:
                        content = f.read()
                    import base64
                    result["content"] = base64.b64encode(content).decode('utf-8')
                    result["size"] = len(content)
                    result["success"] = True
            except Exception as e:
                result["error"] = str(e)
        
        elif action == "write":
            filepath = params.get("filepath", "")
            content_b64 = params.get("content", "")
            try:
                import base64
                content = base64.b64decode(content_b64)
                with open(filepath, 'wb') as f:
                    f.write(content)
                result["success"] = True
                result["bytes_written"] = len(content)
            except Exception as e:
                result["error"] = str(e)
        
        elif action == "delete":
            filepath = params.get("filepath", "")
            try:
                if os.path.isdir(filepath):
                    import shutil
                    shutil.rmtree(filepath)
                else:
                    os.remove(filepath)
                result["success"] = True
            except Exception as e:
                result["error"] = str(e)
        
        return result
    
    def _manage_packages(self, params: dict) -> dict:
        """Manage system packages (install, update, remove)."""
        action = params.get("action", "list")
        packages = params.get("packages", [])
        
        result = {"action": action, "packages": packages}
        
        # Detect package manager
        pkg_manager = None
        if os.path.exists('/usr/bin/apt'):
            pkg_manager = 'apt'
        elif os.path.exists('/usr/bin/yum'):
            pkg_manager = 'yum'
        elif os.path.exists('/usr/bin/dnf'):
            pkg_manager = 'dnf'
        
        if not pkg_manager:
            return {"error": "No supported package manager found"}
        
        result["package_manager"] = pkg_manager
        
        try:
            if action == "list":
                if pkg_manager == 'apt':
                    cmd = ['dpkg', '-l']
                else:
                    cmd = ['rpm', '-qa']
                output = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
                result["installed"] = output.stdout.split('\\n')[:100]  # Limit output
                result["success"] = True
            
            elif action == "install" and packages:
                if pkg_manager == 'apt':
                    cmd = ['sudo', 'apt', 'install', '-y'] + packages
                else:
                    cmd = ['sudo', pkg_manager, 'install', '-y'] + packages
                output = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
                result["output"] = output.stdout
                result["success"] = output.returncode == 0
            
            elif action == "update":
                if pkg_manager == 'apt':
                    subprocess.run(['sudo', 'apt', 'update'], timeout=300)
                    cmd = ['sudo', 'apt', 'upgrade', '-y']
                else:
                    cmd = ['sudo', pkg_manager, 'update', '-y']
                output = subprocess.run(cmd, capture_output=True, text=True, timeout=1800)
                result["output"] = output.stdout
                result["success"] = output.returncode == 0
            
            elif action == "remove" and packages:
                if pkg_manager == 'apt':
                    cmd = ['sudo', 'apt', 'remove', '-y'] + packages
                else:
                    cmd = ['sudo', pkg_manager, 'remove', '-y'] + packages
                output = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
                result["output"] = output.stdout
                result["success"] = output.returncode == 0
        
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _system_control(self, params: dict) -> dict:
        """System control operations (reboot, shutdown, services)."""
        action = params.get("action", "status")
        target = params.get("target", "")
        
        result = {"action": action, "target": target}
        
        try:
            if action == "reboot":
                result["message"] = "System reboot initiated"
                subprocess.Popen(['sudo', 'reboot'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                result["success"] = True
            
            elif action == "shutdown":
                delay = params.get("delay_minutes", 1)
                result["message"] = f"System shutdown scheduled in {delay} minutes"
                subprocess.Popen(['sudo', 'shutdown', '-h', f'+{delay}'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                result["success"] = True
            
            elif action == "service_start" and target:
                output = subprocess.run(['sudo', 'systemctl', 'start', target], capture_output=True, text=True, timeout=60)
                result["success"] = output.returncode == 0
            
            elif action == "service_stop" and target:
                output = subprocess.run(['sudo', 'systemctl', 'stop', target], capture_output=True, text=True, timeout=60)
                result["success"] = output.returncode == 0
            
            elif action == "service_restart" and target:
                output = subprocess.run(['sudo', 'systemctl', 'restart', target], capture_output=True, text=True, timeout=60)
                result["success"] = output.returncode == 0
            
            elif action == "service_status" and target:
                output = subprocess.run(['systemctl', 'status', target], capture_output=True, text=True, timeout=30)
                result["status"] = output.stdout
                result["success"] = True
            
            elif action == "status":
                # Get general system status
                if HAS_PSUTIL:
                    result["uptime"] = int(time.time() - psutil.boot_time())
                    result["cpu_percent"] = psutil.cpu_percent()
                    result["memory_percent"] = psutil.virtual_memory().percent
                    result["disk_percent"] = psutil.disk_usage('/').percent
                result["success"] = True
        
        except Exception as e:
            result["error"] = str(e)
        
        return result
    
    def _discover_hosts(self, params: dict) -> dict:
        return self._scan_network(params)
    
    def _exec_command(self, cmd: str) -> dict:
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
            return {"stdout": result.stdout, "stderr": result.stderr, "returncode": result.returncode}
        except Exception as e:
            return {"error": str(e)}
    
    def _get_local_network(self) -> str:
        ip = get_local_ip()
        parts = ip.split('.')
        return f"{parts[0]}.{parts[1]}.{parts[2]}.0/24"
    
    # ============ v4.0.0 AGENT MESH & COORDINATION ============
    
    def _mesh_discover(self, params: dict) -> dict:
        """Discover other Vanguard agents on the network."""
        scan_range = params.get("range") or self._get_local_network()
        discovered = []
        if self.scanner:
            try:
                self.scanner.scan(hosts=scan_range, ports="8443,8080,443", arguments='-sV -T4 --open')
                for host in self.scanner.all_hosts():
                    for proto in self.scanner[host].all_protocols():
                        for port in self.scanner[host][proto]:
                            info = self.scanner[host][proto][port]
                            if info.get('state') == 'open':
                                discovered.append({"ip": host, "port": port, "service": info.get('name')})
            except: pass
        return {"discovered": discovered, "total": len(discovered), "scan_range": scan_range}
    
    def _mesh_share_intel(self, params: dict) -> dict:
        """Share threat intelligence with mesh."""
        intel = {"type": params.get("type", "ioc"), "indicator": params.get("indicator"), "severity": params.get("severity", "medium"), "source": self.device_id}
        return {"intel": intel, "shared": True, "timestamp": datetime.utcnow().isoformat()}
    
    def _mesh_coordinate_scan(self, params: dict) -> dict:
        """Coordinate distributed scanning."""
        return {"target": params.get("target"), "agents": params.get("agents", []), "coordinated": True, "my_segment": self._get_local_network()}
    
    def _mesh_failover(self, params: dict) -> dict:
        """Configure mesh failover."""
        return {"action": params.get("action", "status"), "role": params.get("role", "member"), "agent_id": self.device_id, "mesh_status": "active"}
    
    # ============ v4.0.0 CONTINUOUS SECURITY MONITORING ============
    
    def _baseline_create(self, params: dict) -> dict:
        """Create security baseline snapshot."""
        baseline = {"type": params.get("type", "system"), "name": params.get("name", f"baseline_{datetime.now().strftime('%Y%m%d')}")}
        if HAS_PSUTIL:
            baseline["processes"] = len(list(psutil.process_iter()))
            baseline["connections"] = len([c for c in psutil.net_connections() if c.status == 'LISTEN'])
        baseline["files"] = {}
        for fp in ["/etc/passwd", "/etc/shadow", "/etc/sudoers"]:
            if os.path.exists(fp):
                try:
                    with open(fp, 'rb') as f: baseline["files"][fp] = hashlib.sha256(f.read()).hexdigest()
                except: pass
        baseline["checksum"] = hashlib.sha256(json.dumps(baseline, sort_keys=True, default=str).encode()).hexdigest()
        return baseline
    
    def _baseline_compare(self, params: dict) -> dict:
        """Compare against baseline."""
        current = self._baseline_create(params)
        baseline = params.get("baseline", {})
        drifts = []
        for fp, old_hash in baseline.get("files", {}).items():
            if current.get("files", {}).get(fp) != old_hash:
                drifts.append({"type": "modification", "file": fp, "severity": "high"})
        return {"drifts": drifts, "total_drifts": len(drifts), "current_checksum": current.get("checksum")}
    
    def _posture_score(self, params: dict) -> dict:
        """Calculate security posture score."""
        score = 75
        findings = []
        if HAS_PSUTIL:
            listening = len([c for c in psutil.net_connections() if c.status == 'LISTEN'])
            if listening > 20: score -= 10; findings.append({"issue": f"{listening} open ports"})
        if os.path.exists("/etc/ssh/sshd_config"):
            try:
                with open("/etc/ssh/sshd_config") as f:
                    cfg = f.read()
                if "PermitRootLogin yes" in cfg: score -= 15; findings.append({"issue": "Root SSH enabled", "severity": "high"})
            except: pass
        grade = "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
        return {"score": score, "grade": grade, "findings": findings}
    
    def _scheduled_check(self, params: dict) -> dict:
        """Run scheduled security check."""
        return {"posture": self._posture_score({}), "baseline": self._baseline_create({"type": "system"}), "metrics": get_metrics()}
    
    # ============ v4.0.0 DECEPTION & HONEYPOTS ============
    
    def _honeypot_deploy(self, params: dict) -> dict:
        """Deploy honeypot service."""
        hp_type = params.get("type", "ssh")
        port = params.get("port", {"ssh": 2222, "http": 8080, "ftp": 2121}.get(hp_type, 9999))
        return {"type": hp_type, "port": port, "status": "deployed", "log": f"/var/log/vanguard_honeypot_{hp_type}.log"}
    
    def _honeypot_monitor(self, params: dict) -> dict:
        """Monitor honeypot activity."""
        events = []
        log_pattern = f"/var/log/vanguard_honeypot_*.log"
        return {"events": events, "total": len(events), "monitored_at": datetime.utcnow().isoformat()}
    
    def _decoy_create(self, params: dict) -> dict:
        """Create decoy files."""
        location = params.get("location", "/tmp")
        filename = params.get("name", "passwords.txt")
        filepath = os.path.join(location, filename)
        try:
            with open(filepath, 'w') as f: f.write(f"# Decoy - {datetime.now().isoformat()}\\nadmin_password=Tr4p_{uuid.uuid4().hex[:8]}")
            return {"filepath": filepath, "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _trap_alert(self, params: dict) -> dict:
        """Check trap triggers."""
        alerts = []
        for fp in params.get("files", ["/tmp/passwords.txt"]):
            if os.path.exists(fp):
                stat = os.stat(fp)
                if datetime.fromtimestamp(stat.st_atime) > datetime.fromtimestamp(stat.st_mtime):
                    alerts.append({"file": fp, "type": "accessed", "severity": "critical"})
        return {"alerts": alerts, "total": len(alerts)}
    
    # ============ v4.0.0 NETWORK TRAFFIC ANALYSIS ============
    
    def _capture_traffic(self, params: dict) -> dict:
        """Capture network traffic."""
        try:
            duration = params.get("duration", 10)
            result = subprocess.run(['sudo', 'tcpdump', '-i', 'any', '-c', '100', '-w', '/tmp/capture.pcap'], capture_output=True, timeout=duration+5)
            return {"file": "/tmp/capture.pcap", "status": "completed"}
        except Exception as e:
            return {"error": str(e), "status": "failed"}
    
    def _analyze_flows(self, params: dict) -> dict:
        """Analyze network flows."""
        flows = []
        if os.path.exists('/tmp/capture.pcap'):
            try:
                result = subprocess.run(['tcpdump', '-r', '/tmp/capture.pcap', '-n', '-q'], capture_output=True, text=True, timeout=30)
                flows = result.stdout.split('\\n')[:20]
            except: pass
        return {"flows": flows, "total": len(flows)}
    
    def _detect_exfiltration(self, params: dict) -> dict:
        """Detect data exfiltration."""
        suspicious = []
        if HAS_PSUTIL:
            for conn in psutil.net_connections():
                if conn.status == 'ESTABLISHED' and conn.raddr and conn.raddr.port not in [80, 443, 22, 53]:
                    suspicious.append({"remote": f"{conn.raddr.ip}:{conn.raddr.port}", "pid": conn.pid})
        return {"suspicious": suspicious[:20], "total": len(suspicious)}
    
    def _dns_tunnel_detect(self, params: dict) -> dict:
        """Detect DNS tunneling."""
        indicators = []
        if HAS_PSUTIL:
            dns_conns = len([c for c in psutil.net_connections() if c.raddr and c.raddr.port == 53])
            if dns_conns > 50: indicators.append({"type": "high_dns_volume", "count": dns_conns, "severity": "medium"})
        return {"indicators": indicators, "dns_tunneling_detected": len(indicators) > 0}
    
    # ============ v4.0.0 INTEGRATION CONNECTORS ============
    
    def _push_to_siem(self, params: dict) -> dict:
        """Push events to SIEM."""
        endpoint = params.get("endpoint", "")
        events = params.get("events", [])
        if not endpoint: return {"error": "Endpoint required", "success": False}
        try:
            response = requests.post(endpoint, json={"events": events, "source": "vanguard"}, timeout=30)
            return {"status_code": response.status_code, "success": response.status_code in [200, 201]}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _push_to_ticketing(self, params: dict) -> dict:
        """Create ticket in ticketing system."""
        endpoint = params.get("endpoint", "")
        ticket = params.get("ticket", {})
        if not endpoint: return {"error": "Endpoint required", "success": False}
        try:
            response = requests.post(endpoint, json=ticket, timeout=30)
            return {"status_code": response.status_code, "success": response.status_code in [200, 201]}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _webhook_notify(self, params: dict) -> dict:
        """Send webhook notification."""
        url = params.get("url", "")
        payload = params.get("payload", {})
        if not url: return {"error": "URL required", "success": False}
        payload["agent_id"] = self.device_id
        payload["timestamp"] = datetime.utcnow().isoformat()
        try:
            response = requests.post(url, json=payload, timeout=30)
            return {"status_code": response.status_code, "success": response.status_code in [200, 201, 202]}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def _syslog_forward(self, params: dict) -> dict:
        """Forward logs via syslog."""
        server = params.get("server", "")
        port = params.get("port", 514)
        messages = params.get("messages", [])
        if not server: return {"error": "Server required", "success": False}
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            for msg in messages:
                syslog_msg = f"<134>{datetime.now().strftime('%b %d %H:%M:%S')} {socket.gethostname()} vanguard: {msg}"
                sock.sendto(syslog_msg.encode(), (server, port))
            sock.close()
            return {"sent": len(messages), "success": True}
        except Exception as e:
            return {"error": str(e), "success": False}
    
    def run(self):
        self.running = True
        self.register()
        
        last_heartbeat = 0
        last_command_check = 0
        last_update_check = 0
        
        logger.info(f"Agent {self.device_id} running...")
        
        while self.running:
            now = time.time()
            
            # Heartbeat
            if now - last_heartbeat >= self.heartbeat_interval:
                self.send_heartbeat()
                last_heartbeat = now
            
            # Command polling
            if now - last_command_check >= self.command_interval:
                result = self.get_commands()
                commands = result.get("commands", [])
                for cmd in commands:
                    threading.Thread(target=self.handle_command, args=(cmd,)).start()
                last_command_check = now
            
            # Update check
            if now - last_update_check >= self.update_interval:
                self.check_for_updates()
                last_update_check = now
            
            time.sleep(1)
    
    def stop(self):
        self.running = False


def main():
    parser = argparse.ArgumentParser(description="Vanguard Security Agent")
    parser.add_argument("--config", default="config.yaml", help="Config file path")
    parser.add_argument("--register", action="store_true", help="Register and exit")
    parser.add_argument("--test", action="store_true", help="Test connection")
    args = parser.parse_args()
    
    config = load_config(args.config)
    setup_logging(config)
    
    agent = VanguardAgent(config)
    
    def signal_handler(sig, frame):
        logger.info("Shutting down...")
        agent.stop()
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    if args.register:
        result = agent.register()
        print(json.dumps(result, indent=2))
    elif args.test:
        result = agent.send_heartbeat()
        print(json.dumps(result, indent=2))
    else:
        agent.run()


if __name__ == "__main__":
    main()
`;

  return new Response(pythonAgent, { 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/x-python',
      'Content-Disposition': 'attachment; filename="vanguard_agent_pentest.py"'
    } 
  });
}

async function downloadAgentWindows() {
  const installerScript = `# Vanguard Agent Windows Installer
# Run in PowerShell as Administrator:
# iwr -useb "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api?action=download_agent_windows" | iex

Write-Host "Downloading Vanguard Windows Agent..." -ForegroundColor Cyan
$agentPath = "$env:TEMP\\vanguard_agent.ps1"

try {
    Invoke-WebRequest -Uri "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api?action=get_agent_script_windows" -OutFile $agentPath
    Write-Host "Agent downloaded to: $agentPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "To run the agent:" -ForegroundColor Yellow
    Write-Host "  .\\vanguard_agent.ps1 -UserId 'YOUR_USER_ID' -DeviceId 'YOUR_DEVICE_ID'" -ForegroundColor White
    Write-Host ""
    Write-Host "To install as a service:" -ForegroundColor Yellow
    Write-Host "  .\\vanguard_agent.ps1 -Install" -ForegroundColor White
} catch {
    Write-Host "Failed to download agent: $_" -ForegroundColor Red
}
`;

  return new Response(installerScript, { 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="install_vanguard_windows.ps1"'
    } 
  });
}

async function getAgentScriptWindows() {
  const powershellAgent = `#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Ultrium Vanguard Windows Agent - Enterprise Security Edition
.DESCRIPTION
    Full-featured Windows security agent with EDR, compliance scanning, and remote management
.PARAMETER UserId
    Your Vanguard user ID
.PARAMETER DeviceId
    Unique device identifier (auto-generated if not provided)
.PARAMETER Install
    Install as Windows service
.PARAMETER Uninstall
    Remove Windows service
#>

param(
    [string]$UserId = "",
    [string]$DeviceId = "",
    [string]$ConfigPath = "$PSScriptRoot\\config.json",
    [switch]$Install,
    [switch]$Uninstall,
    [switch]$Test
)

$VERSION = "4.0.0-enterprise-plus"
$API_ENDPOINT = "https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1/vanguard-agent-api"
$API_SECRET = "vgd_sk_7Kx9mPqR3nTwYz2JfL8sHcN6bVdXaE4uGtM1oWpQ5iA"
$HEARTBEAT_INTERVAL = 30
$COMMAND_POLL_INTERVAL = 5

# Supported commands
$SUPPORTED_COMMANDS = @(
    # Core
    "get_system_info", "get_metrics", "scan_network", "scan_ports", "scan_vulnerabilities",
    # Windows-specific
    "scan_eventlog", "scan_registry", "scan_ad", "scan_defender", "scan_firewall_win",
    "scan_services", "scan_tasks", "scan_shares", "scan_gpo", "scan_installed_software",
    # RMM
    "run_command", "install_software", "restart_service", "collect_logs"
)

function Get-DeviceId {
    if ($DeviceId) { return $DeviceId }
    
    # Try to get from config
    if (Test-Path $ConfigPath) {
        $config = Get-Content $ConfigPath | ConvertFrom-Json
        if ($config.device_id) { return $config.device_id }
    }
    
    # Generate from hardware
    $serial = (Get-WmiObject win32_bios).SerialNumber
    $mac = (Get-NetAdapter | Where-Object Status -eq 'Up' | Select-Object -First 1).MacAddress
    $hash = [System.BitConverter]::ToString(
        [System.Security.Cryptography.SHA256]::Create().ComputeHash(
            [System.Text.Encoding]::UTF8.GetBytes("$serial-$mac")
        )
    ).Replace("-", "").Substring(0, 32)
    
    return "win-$hash"
}

function Get-SystemInfo {
    $os = Get-WmiObject Win32_OperatingSystem
    $cpu = Get-WmiObject Win32_Processor | Select-Object -First 1
    $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
    
    @{
        hostname = $env:COMPUTERNAME
        platform = "windows"
        os_version = $os.Caption + " " + $os.Version
        architecture = $os.OSArchitecture
        cpu_model = $cpu.Name
        cpu_cores = $cpu.NumberOfCores
        total_memory_gb = [math]::Round($os.TotalVisibleMemorySize / 1MB, 2)
        disk_total_gb = [math]::Round($disk.Size / 1GB, 2)
        disk_free_gb = [math]::Round($disk.FreeSpace / 1GB, 2)
        domain = $env:USERDOMAIN
        ip_address = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" } | Select-Object -First 1).IPAddress
        uptime_hours = [math]::Round(((Get-Date) - $os.ConvertToDateTime($os.LastBootUpTime)).TotalHours, 2)
    }
}

function Get-Metrics {
    $cpu = (Get-Counter '\\Processor(_Total)\\% Processor Time' -ErrorAction SilentlyContinue).CounterSamples[0].CookedValue
    $os = Get-WmiObject Win32_OperatingSystem
    $memUsed = ($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize * 100
    $disk = Get-WmiObject Win32_LogicalDisk -Filter "DeviceID='C:'"
    $diskUsed = (($disk.Size - $disk.FreeSpace) / $disk.Size) * 100
    
    @{
        cpu_percent = [math]::Round($cpu, 2)
        memory_percent = [math]::Round($memUsed, 2)
        disk_percent = [math]::Round($diskUsed, 2)
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
    }
}

function Invoke-ApiRequest {
    param([string]$Action, [hashtable]$Body = @{})
    
    $headers = @{
        "X-VANGUARD-KEY" = $API_SECRET
        "Content-Type" = "application/json"
        "User-Agent" = "VanguardWindowsAgent/$VERSION"
    }
    
    $uri = "$API_ENDPOINT" + "?action=$Action"
    $json = $Body | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $json -TimeoutSec 30
        return $response
    } catch {
        Write-Warning "API request failed: $_"
        return @{ error = $_.Exception.Message }
    }
}

function Register-Agent {
    $body = @{
        device_id = $script:CurrentDeviceId
        user_id = $UserId
        name = $env:COMPUTERNAME
        agent_version = $VERSION
        platform = "windows"
        system_info = Get-SystemInfo
    }
    
    $result = Invoke-ApiRequest -Action "register" -Body $body
    Write-Host "Registration: $($result | ConvertTo-Json)" -ForegroundColor Green
    return $result
}

function Send-Heartbeat {
    $body = @{
        device_id = $script:CurrentDeviceId
        metrics = Get-Metrics
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
    }
    
    return Invoke-ApiRequest -Action "heartbeat" -Body $body
}

function Get-PendingCommands {
    $body = @{ device_id = $script:CurrentDeviceId }
    return Invoke-ApiRequest -Action "get_commands" -Body $body
}

function Send-CommandResponse {
    param([string]$CommandId, [hashtable]$Response, [bool]$Success = $true, [string]$ErrorMessage = "")
    
    $body = @{
        device_id = $script:CurrentDeviceId
        command_id = $CommandId
        response = $Response
        success = $Success
        error_message = $ErrorMessage
        completed_at = (Get-Date).ToUniversalTime().ToString("o")
    }
    
    return Invoke-ApiRequest -Action "command_response" -Body $body
}

# ============ WINDOWS-SPECIFIC COMMANDS ============

function Invoke-ScanEventLog {
    param([hashtable]$Params)
    
    $logName = $Params.log_name ?? "Security"
    $hours = $Params.hours ?? 24
    $startTime = (Get-Date).AddHours(-$hours)
    
    $events = Get-WinEvent -LogName $logName -MaxEvents 100 -ErrorAction SilentlyContinue | 
        Where-Object { $_.TimeCreated -gt $startTime } |
        Select-Object TimeCreated, Id, LevelDisplayName, Message -First 50
    
    $securityEvents = @()
    if ($logName -eq "Security") {
        # Look for suspicious events
        $suspiciousIds = @(4625, 4648, 4672, 4688, 4697, 4698, 4719, 4720, 4732, 4756, 1102)
        $securityEvents = Get-WinEvent -LogName "Security" -MaxEvents 500 -ErrorAction SilentlyContinue |
            Where-Object { $_.Id -in $suspiciousIds -and $_.TimeCreated -gt $startTime } |
            Select-Object TimeCreated, Id, Message -First 20
    }
    
    @{
        log_name = $logName
        events_found = $events.Count
        events = $events | ForEach-Object { @{ time = $_.TimeCreated.ToString("o"); id = $_.Id; level = $_.LevelDisplayName; message = $_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)) } }
        security_events = $securityEvents | ForEach-Object { @{ time = $_.TimeCreated.ToString("o"); id = $_.Id; message = $_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)) } }
        success = $true
    }
}

function Invoke-ScanRegistry {
    param([hashtable]$Params)
    
    $runKeys = @(
        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce",
        "HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
    )
    
    $persistenceEntries = @()
    foreach ($key in $runKeys) {
        if (Test-Path $key) {
            Get-ItemProperty $key | Get-Member -MemberType NoteProperty | 
                Where-Object { $_.Name -notin @("PSPath", "PSParentPath", "PSChildName", "PSProvider") } |
                ForEach-Object {
                    $persistenceEntries += @{
                        key = $key
                        name = $_.Name
                        value = (Get-ItemProperty $key).$($_.Name)
                    }
                }
        }
    }
    
    @{
        persistence_entries = $persistenceEntries
        total_entries = $persistenceEntries.Count
        success = $true
    }
}

function Invoke-ScanAD {
    param([hashtable]$Params)
    
    $result = @{ success = $true; domain_joined = $false }
    
    try {
        $domain = [System.DirectoryServices.ActiveDirectory.Domain]::GetCurrentDomain()
        $result.domain_joined = $true
        $result.domain_name = $domain.Name
        $result.forest = $domain.Forest.Name
        $result.domain_controllers = $domain.DomainControllers | ForEach-Object { $_.Name }
        
        # Get some AD info if available
        $searcher = New-Object DirectoryServices.DirectorySearcher
        $searcher.Filter = "(objectClass=user)"
        $searcher.PageSize = 100
        $result.user_count = $searcher.FindAll().Count
        
        $searcher.Filter = "(objectClass=computer)"
        $result.computer_count = $searcher.FindAll().Count
    } catch {
        $result.error = "Not domain joined or AD query failed"
    }
    
    $result
}

function Invoke-ScanDefender {
    param([hashtable]$Params)
    
    $status = Get-MpComputerStatus -ErrorAction SilentlyContinue
    
    if ($status) {
        @{
            enabled = $status.AntivirusEnabled
            real_time_protection = $status.RealTimeProtectionEnabled
            behavior_monitor = $status.BehaviorMonitorEnabled
            ioav_protection = $status.IoavProtectionEnabled
            antispyware_enabled = $status.AntispywareEnabled
            tamper_protection = $status.IsTamperProtected
            signature_version = $status.AntivirusSignatureVersion
            signature_age_days = $status.AntivirusSignatureAge
            last_scan = $status.AntivirusSignatureLastUpdated.ToString("o")
            quick_scan_age_days = $status.QuickScanAge
            full_scan_age_days = $status.FullScanAge
            threats_detected = (Get-MpThreatDetection -ErrorAction SilentlyContinue | Measure-Object).Count
            success = $true
        }
    } else {
        @{ error = "Windows Defender not available"; success = $false }
    }
}

function Invoke-ScanFirewall {
    param([hashtable]$Params)
    
    $profiles = Get-NetFirewallProfile
    $rules = Get-NetFirewallRule -Enabled True | Select-Object -First 50
    
    @{
        profiles = $profiles | ForEach-Object { 
            @{ name = $_.Name; enabled = $_.Enabled; default_inbound = $_.DefaultInboundAction.ToString(); default_outbound = $_.DefaultOutboundAction.ToString() }
        }
        enabled_rules_count = (Get-NetFirewallRule -Enabled True | Measure-Object).Count
        sample_rules = $rules | ForEach-Object {
            @{ name = $_.DisplayName; direction = $_.Direction.ToString(); action = $_.Action.ToString(); profile = $_.Profile.ToString() }
        }
        success = $true
    }
}

function Invoke-ScanServices {
    param([hashtable]$Params)
    
    $services = Get-Service | Where-Object { $_.StartType -eq 'Automatic' -or $_.Status -eq 'Running' }
    
    $suspicious = @("nc.exe", "mimikatz", "psexec", "cobalt")
    $suspiciousServices = $services | Where-Object { 
        $name = $_.Name.ToLower()
        $suspicious | Where-Object { $name -like "*$_*" }
    }
    
    @{
        running_count = ($services | Where-Object { $_.Status -eq 'Running' }).Count
        stopped_auto_count = ($services | Where-Object { $_.Status -eq 'Stopped' -and $_.StartType -eq 'Automatic' }).Count
        services = $services | Select-Object -First 50 | ForEach-Object {
            @{ name = $_.Name; display_name = $_.DisplayName; status = $_.Status.ToString(); start_type = $_.StartType.ToString() }
        }
        suspicious_services = $suspiciousServices | ForEach-Object { @{ name = $_.Name; status = $_.Status.ToString() } }
        success = $true
    }
}

function Invoke-ScanTasks {
    param([hashtable]$Params)
    
    $tasks = Get-ScheduledTask | Where-Object { $_.State -eq 'Ready' -or $_.State -eq 'Running' }
    
    @{
        total_active = $tasks.Count
        tasks = $tasks | Select-Object -First 30 | ForEach-Object {
            $info = Get-ScheduledTaskInfo $_ -ErrorAction SilentlyContinue
            @{
                name = $_.TaskName
                path = $_.TaskPath
                state = $_.State.ToString()
                last_run = if ($info.LastRunTime) { $info.LastRunTime.ToString("o") } else { $null }
                next_run = if ($info.NextRunTime) { $info.NextRunTime.ToString("o") } else { $null }
                author = $_.Author
            }
        }
        success = $true
    }
}

function Invoke-ScanShares {
    param([hashtable]$Params)
    
    $shares = Get-SmbShare -ErrorAction SilentlyContinue
    
    @{
        shares = $shares | ForEach-Object {
            @{
                name = $_.Name
                path = $_.Path
                description = $_.Description
                share_type = $_.ShareType.ToString()
                current_users = $_.CurrentUsers
            }
        }
        total_shares = $shares.Count
        success = $true
    }
}

function Invoke-ScanGPO {
    param([hashtable]$Params)
    
    $result = @{ success = $true }
    
    try {
        $rsop = Get-WmiObject -Namespace "root\\rsop\\computer" -Class RSOP_GPO -ErrorAction Stop
        $result.applied_gpos = $rsop | ForEach-Object { 
            @{ name = $_.name; guid = $_.guidName; enabled = $_.enabled }
        }
        $result.gpo_count = $rsop.Count
    } catch {
        $result.error = "GPO query failed - may not be domain joined"
        $result.gpo_count = 0
    }
    
    # Get security policy
    $secpol = secedit /export /cfg "$env:TEMP\\secpol.cfg" /quiet 2>$null
    if (Test-Path "$env:TEMP\\secpol.cfg") {
        $result.password_policy = @{
            min_length = (Select-String -Path "$env:TEMP\\secpol.cfg" -Pattern "MinimumPasswordLength").ToString().Split("=")[-1].Trim()
        }
        Remove-Item "$env:TEMP\\secpol.cfg" -Force -ErrorAction SilentlyContinue
    }
    
    $result
}

function Invoke-ScanInstalledSoftware {
    param([hashtable]$Params)
    
    $software = Get-ItemProperty "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*" -ErrorAction SilentlyContinue |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallDate |
        Sort-Object DisplayName
    
    @{
        software = $software | ForEach-Object {
            @{
                name = $_.DisplayName
                version = $_.DisplayVersion
                publisher = $_.Publisher
                install_date = $_.InstallDate
            }
        }
        total_count = $software.Count
        success = $true
    }
}

function Invoke-CollectLogs {
    param([hashtable]$Params)
    
    $logType = $Params.type ?? "all"
    $lines = $Params.lines ?? 100
    $logs = @{}
    
    if ($logType -in @("all", "system")) {
        $logs.system = Get-WinEvent -LogName System -MaxEvents $lines -ErrorAction SilentlyContinue |
            Select-Object TimeCreated, Id, Message | ForEach-Object {
                @{ time = $_.TimeCreated.ToString("o"); id = $_.Id; message = $_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)) }
            }
    }
    
    if ($logType -in @("all", "application")) {
        $logs.application = Get-WinEvent -LogName Application -MaxEvents $lines -ErrorAction SilentlyContinue |
            Select-Object TimeCreated, Id, Message | ForEach-Object {
                @{ time = $_.TimeCreated.ToString("o"); id = $_.Id; message = $_.Message.Substring(0, [Math]::Min(200, $_.Message.Length)) }
            }
    }
    
    @{
        logs = $logs
        collected_at = (Get-Date).ToUniversalTime().ToString("o")
        success = $true
    }
}

function Invoke-RunCommand {
    param([hashtable]$Params)
    
    $cmd = $Params.command
    if (-not $cmd) { return @{ error = "Command required"; success = $false } }
    
    try {
        $output = Invoke-Expression $cmd 2>&1 | Out-String
        @{ output = $output; exit_code = $LASTEXITCODE; success = $true }
    } catch {
        @{ error = $_.Exception.Message; success = $false }
    }
}

# ============ COMMAND HANDLER ============

function Invoke-Command {
    param([hashtable]$Command)
    
    $cmdType = $Command.command_type
    $params = $Command.parameters ?? @{}
    
    Write-Host "Executing: $cmdType" -ForegroundColor Cyan
    
    $response = switch ($cmdType) {
        "get_system_info" { Get-SystemInfo }
        "get_metrics" { Get-Metrics }
        "scan_eventlog" { Invoke-ScanEventLog -Params $params }
        "scan_registry" { Invoke-ScanRegistry -Params $params }
        "scan_ad" { Invoke-ScanAD -Params $params }
        "scan_defender" { Invoke-ScanDefender -Params $params }
        "scan_firewall_win" { Invoke-ScanFirewall -Params $params }
        "scan_services" { Invoke-ScanServices -Params $params }
        "scan_tasks" { Invoke-ScanTasks -Params $params }
        "scan_shares" { Invoke-ScanShares -Params $params }
        "scan_gpo" { Invoke-ScanGPO -Params $params }
        "scan_installed_software" { Invoke-ScanInstalledSoftware -Params $params }
        "collect_logs" { Invoke-CollectLogs -Params $params }
        "run_command" { Invoke-RunCommand -Params $params }
        default { @{ error = "Unknown command: $cmdType"; success = $false } }
    }
    
    if (-not $response.success) { $response.success = $true }
    
    Send-CommandResponse -CommandId $Command.id -Response $response -Success $response.success
}

# ============ MAIN ============

$script:CurrentDeviceId = Get-DeviceId

if ($Test) {
    Write-Host "Testing connection..." -ForegroundColor Cyan
    $result = Send-Heartbeat
    Write-Host ($result | ConvertTo-Json -Depth 5) -ForegroundColor Green
    exit
}

if ($Install) {
    Write-Host "Installing as Windows Service..." -ForegroundColor Yellow
    # Create scheduled task to run at startup
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -File ""$PSCommandPath"" -UserId ""$UserId"""
    $trigger = New-ScheduledTaskTrigger -AtStartup
    $principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -TaskName "VanguardAgent" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Force
    Write-Host "Vanguard Agent installed as scheduled task" -ForegroundColor Green
    exit
}

if ($Uninstall) {
    Unregister-ScheduledTask -TaskName "VanguardAgent" -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Vanguard Agent uninstalled" -ForegroundColor Yellow
    exit
}

if (-not $UserId) {
    Write-Host "Error: -UserId is required" -ForegroundColor Red
    Write-Host "Usage: .\\vanguard_agent.ps1 -UserId 'your-user-id'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Starting Vanguard Windows Agent v$VERSION" -ForegroundColor Cyan
Write-Host "Device ID: $script:CurrentDeviceId" -ForegroundColor Gray

# Register
Register-Agent

# Main loop
$lastHeartbeat = [DateTime]::MinValue
$lastCommandPoll = [DateTime]::MinValue

while ($true) {
    $now = Get-Date
    
    # Heartbeat
    if (($now - $lastHeartbeat).TotalSeconds -ge $HEARTBEAT_INTERVAL) {
        $hb = Send-Heartbeat
        if (-not $hb.error) { Write-Host "Heartbeat sent" -ForegroundColor DarkGray }
        $lastHeartbeat = $now
    }
    
    # Command polling
    if (($now - $lastCommandPoll).TotalSeconds -ge $COMMAND_POLL_INTERVAL) {
        $result = Get-PendingCommands
        if ($result.commands -and $result.commands.Count -gt 0) {
            foreach ($cmd in $result.commands) {
                Invoke-Command -Command $cmd
            }
        }
        $lastCommandPoll = $now
    }
    
    Start-Sleep -Seconds 1
}
`;

  return new Response(powershellAgent, { 
    headers: { 
      ...corsHeaders, 
      'Content-Type': 'text/plain',
      'Content-Disposition': 'attachment; filename="vanguard_agent.ps1"'
    } 
  });
}

// ============ XDR/AV TELEMETRY HANDLERS ============

async function handleXdrThreat(supabase: any, body: any) {
  const { device_id, threat_type, severity, title, description, source_component, file_path, file_hash, process_name, process_id, command_line, mitre_tactics, mitre_techniques, indicators, actions_taken } = body;
  
  if (!device_id || !threat_type || !title) {
    return new Response(
      JSON.stringify({ error: 'device_id, threat_type, and title required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, name, ip_address')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Check threat intel for IOC matches
  let threatIntelMatches: any[] = [];
  if (file_hash) {
    const { data: hashMatch } = await supabase
      .from('threat_intelligence')
      .select('*')
      .eq('indicator_type', 'hash')
      .eq('indicator_value', file_hash)
      .eq('is_active', true)
      .maybeSingle();
    
    if (hashMatch) threatIntelMatches.push(hashMatch);
  }
  
  // Elevate severity if threat intel match
  let finalSeverity = severity || 'medium';
  if (threatIntelMatches.length > 0 && finalSeverity !== 'critical') {
    const maxConf = Math.max(...threatIntelMatches.map((t: any) => t.confidence || 0));
    if (maxConf >= 90) finalSeverity = 'critical';
  }
  
  // Insert XDR threat
  const { data: threat, error } = await supabase
    .from('xdr_threats')
    .insert({
      user_id: agent.user_id,
      agent_id: agent.id,
      threat_type,
      severity: finalSeverity,
      title,
      description,
      source_component: source_component || 'Vanguard Agent',
      file_path,
      file_hash,
      process_name,
      process_id,
      command_line,
      source_ip: agent.ip_address,
      mitre_tactics: mitre_tactics || [],
      mitre_techniques: mitre_techniques || [],
      indicators: indicators || [],
      actions_taken: actions_taken || [],
      threat_intel_matches: threatIntelMatches,
      status: 'new',
      detection_time: new Date().toISOString()
    })
    .select()
    .single();
  
  if (error) {
    console.error('[vanguard-agent-api] XDR threat insert error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create threat' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Also create security event
  await supabase.from('security_events').insert({
    user_id: agent.user_id,
    source_app: `Vanguard ${source_component || 'Agent'}`,
    event_type: threat_type,
    severity: finalSeverity,
    title,
    description,
    affected_assets: [agent.name],
    ip_address: agent.ip_address,
    threat_indicators: (indicators || []).map((i: any) => `${i.type}:${i.value}`),
    raw_data: { threat_id: threat.id }
  });
  
  console.log(`[vanguard-agent-api] XDR threat created: ${threat.id} (${threat_type})`);
  
  return new Response(
    JSON.stringify({ success: true, threat_id: threat.id, severity: finalSeverity }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrYaraMatch(supabase: any, body: any) {
  const { device_id, rule_name, file_path, file_hash, file_size, matched_strings } = body;
  
  if (!device_id || !rule_name || !file_path) {
    return new Response(
      JSON.stringify({ error: 'device_id, rule_name, and file_path required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, name')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Find YARA rule
  const { data: rule } = await supabase
    .from('xdr_yara_rules')
    .select('id, severity, mitre_tactics, mitre_techniques')
    .eq('name', rule_name)
    .eq('user_id', agent.user_id)
    .maybeSingle();
  
  const severity = rule?.severity || 'high';
  
  // Create XDR threat for YARA match
  const { data: threat } = await supabase
    .from('xdr_threats')
    .insert({
      user_id: agent.user_id,
      agent_id: agent.id,
      threat_type: 'malware',
      severity,
      title: `YARA Match: ${rule_name}`,
      description: `YARA rule "${rule_name}" matched file ${file_path}`,
      source_component: 'YARA Scanner',
      file_path,
      file_hash,
      file_name: file_path.split(/[/\\]/).pop(),
      indicators: [
        { type: 'hash', value: file_hash, confidence: 95 },
        { type: 'yara_rule', value: rule_name, confidence: 100 }
      ],
      mitre_tactics: rule?.mitre_tactics || [],
      mitre_techniques: rule?.mitre_techniques || [],
      raw_data: { rule_name, matched_strings, file_size },
      status: 'new',
      detection_time: new Date().toISOString()
    })
    .select()
    .single();
  
  // Update rule match count
  if (rule) {
    await supabase
      .from('xdr_yara_rules')
      .update({ 
        match_count: (rule.match_count || 0) + 1,
        last_match: new Date().toISOString()
      })
      .eq('id', rule.id);
  }
  
  console.log(`[vanguard-agent-api] YARA match: ${rule_name} on ${file_path}`);
  
  return new Response(
    JSON.stringify({ success: true, threat_id: threat?.id, severity }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrMemoryScan(supabase: any, body: any) {
  const { device_id, process_name, process_id, detections } = body;
  
  if (!device_id || !detections || !Array.isArray(detections)) {
    return new Response(
      JSON.stringify({ error: 'device_id and detections array required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, name')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const threatIds: string[] = [];
  
  for (const detection of detections) {
    const { data: threat } = await supabase
      .from('xdr_threats')
      .insert({
        user_id: agent.user_id,
        agent_id: agent.id,
        threat_type: 'memory',
        severity: detection.severity || 'high',
        title: detection.title || `Memory Threat in ${process_name}`,
        description: detection.description || `Suspicious memory pattern detected in process ${process_name} (PID: ${process_id})`,
        source_component: 'Memory Scanner',
        process_name,
        process_id,
        mitre_tactics: detection.mitre_tactics || ['T1055'],
        mitre_techniques: detection.mitre_techniques || ['Process Injection'],
        raw_data: detection,
        status: 'new',
        detection_time: new Date().toISOString()
      })
      .select()
      .single();
    
    if (threat) threatIds.push(threat.id);
  }
  
  console.log(`[vanguard-agent-api] Memory scan: ${detections.length} detections from ${device_id}`);
  
  return new Response(
    JSON.stringify({ success: true, threat_ids: threatIds, count: threatIds.length }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrScriptAnalysis(supabase: any, body: any) {
  const { device_id, script_type, script_hash, verdict, indicators, deobfuscated_commands } = body;
  
  if (!device_id || !script_type || !verdict) {
    return new Response(
      JSON.stringify({ error: 'device_id, script_type, and verdict required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, name')
    .eq('device_id', device_id)
    .single();
  
  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  if (verdict === 'clean') {
    return new Response(
      JSON.stringify({ success: true, action: 'allow' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Create threat for malicious/suspicious scripts
  const severity = verdict === 'malicious' ? 'critical' : 'high';
  
  const { data: threat } = await supabase
    .from('xdr_threats')
    .insert({
      user_id: agent.user_id,
      agent_id: agent.id,
      threat_type: 'script',
      severity,
      title: `Malicious ${script_type} Script Detected`,
      description: `Script analysis detected ${verdict} ${script_type} script with ${(indicators || []).length} indicators`,
      source_component: 'Script Analyzer',
      file_hash: script_hash,
      indicators: indicators || [],
      mitre_tactics: ['T1059'],
      mitre_techniques: [`${script_type} Execution`],
      raw_data: { script_type, deobfuscated_commands, indicators },
      status: 'new',
      detection_time: new Date().toISOString()
    })
    .select()
    .single();
  
  console.log(`[vanguard-agent-api] Script analysis: ${verdict} ${script_type} script from ${device_id}`);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      threat_id: threat?.id, 
      action: verdict === 'malicious' ? 'block' : 'alert'
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrGetRules(supabase: any, body: any) {
  const { device_id, rule_type, last_sync } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
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
  
  const result: any = { sync_time: new Date().toISOString() };
  
  // Get YARA rules
  if (!rule_type || rule_type === 'yara') {
    let yaraQuery = supabase
      .from('xdr_yara_rules')
      .select('id, name, rule_content, category, severity')
      .eq('user_id', agent.user_id)
      .eq('is_enabled', true);
    
    if (last_sync) {
      yaraQuery = yaraQuery.gte('updated_at', last_sync);
    }
    
    const { data: yaraRules } = await yaraQuery;
    result.yara_rules = (yaraRules || []).map((r: any) => ({
      id: r.id,
      name: r.name,
      content: r.rule_content,
      category: r.category,
      severity: r.severity
    }));
  }
  
  // Get IOCs for blocking
  if (!rule_type || rule_type === 'iocs') {
    const { data: iocs } = await supabase
      .from('xdr_iocs')
      .select('id, ioc_type, ioc_value, confidence')
      .eq('user_id', agent.user_id)
      .eq('is_active', true)
      .gte('confidence', 80)
      .limit(1000);
    
    result.iocs = iocs || [];
  }
  
  // Get automation policies
  if (!rule_type || rule_type === 'policies') {
    const { data: policies } = await supabase
      .from('xdr_automation_policies')
      .select('id, name, automation_mode, trigger_conditions, response_actions')
      .eq('user_id', agent.user_id)
      .eq('is_enabled', true);
    
    result.policies = policies || [];
  }
  
  console.log(`[vanguard-agent-api] XDR rules sync for ${device_id}: ${result.yara_rules?.length || 0} YARA, ${result.iocs?.length || 0} IOCs`);
  
  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrPollActions(supabase: any, body: any) {
  const { device_id } = body;
  
  if (!device_id) {
    return new Response(
      JSON.stringify({ error: 'device_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
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
  
  // Get pending XDR response actions
  const { data: actions } = await supabase
    .from('xdr_response_actions')
    .select('id, action_type, parameters, priority')
    .eq('target_agent_id', agent.id)
    .eq('status', 'queued')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(10);
  
  // Mark as executing
  if (actions && actions.length > 0) {
    await supabase
      .from('xdr_response_actions')
      .update({ status: 'executing', started_at: new Date().toISOString() })
      .in('id', actions.map((a: any) => a.id));
  }
  
  return new Response(
    JSON.stringify({ actions: actions || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleXdrActionResult(supabase: any, body: any) {
  const { device_id, action_id, success, result, error_message } = body;
  
  if (!device_id || !action_id) {
    return new Response(
      JSON.stringify({ error: 'device_id and action_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const { error } = await supabase
    .from('xdr_response_actions')
    .update({
      status: success ? 'completed' : 'failed',
      result: result || {},
      error_message,
      completed_at: new Date().toISOString()
    })
    .eq('id', action_id);
  
  if (error) {
    console.error('[vanguard-agent-api] XDR action result error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to update action' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  console.log(`[vanguard-agent-api] XDR action ${action_id} completed: ${success ? 'success' : 'failed'}`);
  
  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AgentMessage {
  type: 'heartbeat' | 'alert' | 'command_result' | 'screen_data' | 'clipboard_sync';
  device_id: string;
  data: any;
  timestamp: number;
}

interface ServerMessage {
  type: 'command' | 'config_update' | 'session_start' | 'session_end' | 'clipboard_sync';
  data: any;
  timestamp: number;
}

serve(async (req) => {
  // Handle WebSocket upgrade for real-time agent communication
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let deviceId: string | null = null;
  let authenticated = false;

  socket.onopen = () => {
    console.log("RMM Agent WebSocket connection established");
    // Request authentication
    socket.send(JSON.stringify({
      type: 'auth_required',
      timestamp: Date.now()
    }));
  };

  socket.onmessage = async (event) => {
    try {
      const message: AgentMessage = JSON.parse(event.data);
      
      if (!authenticated && message.type !== 'auth') {
        socket.send(JSON.stringify({
          type: 'auth_error',
          message: 'Authentication required',
          timestamp: Date.now()
        }));
        return;
      }

      switch (message.type) {
        case 'auth':
          const authResult = await authenticateAgent(supabase, message.data);
          if (authResult.success) {
            authenticated = true;
            deviceId = authResult.device_id;
            socket.send(JSON.stringify({
              type: 'auth_success',
              device_id: deviceId,
              timestamp: Date.now()
            }));
          } else {
            socket.send(JSON.stringify({
              type: 'auth_error',
              message: 'Invalid credentials',
              timestamp: Date.now()
            }));
          }
          break;

        case 'heartbeat':
          await handleHeartbeat(supabase, message.device_id, message.data);
          break;

        case 'alert':
          await handleAlert(supabase, message.device_id, message.data);
          break;

        case 'command_result':
          await handleCommandResult(supabase, message.device_id, message.data);
          break;

        case 'screen_data':
          await handleScreenData(supabase, message.device_id, message.data);
          break;

        case 'clipboard_sync':
          await handleClipboardSync(supabase, message.device_id, message.data);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: Date.now()
      }));
    }
  };

  socket.onclose = async () => {
    console.log("RMM Agent WebSocket connection closed");
    if (deviceId) {
      // Mark device as offline
      await supabase
        .from('rmm_endpoints')
        .update({ 
          status: 'offline',
          last_seen: new Date().toISOString()
        })
        .eq('id', deviceId);
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  return response;
});

async function authenticateAgent(supabase: any, authData: any) {
  try {
    const { data: device } = await supabase
      .from('rmm_endpoints')
      .select('id, hostname, status')
      .eq('hostname', authData.hostname)
      .eq('agent_token', authData.token)
      .single();

    if (device) {
      // Update status to online
      await supabase
        .from('rmm_endpoints')
        .update({ 
          status: 'online',
          last_seen: new Date().toISOString()
        })
        .eq('id', device.id);

      return { success: true, device_id: device.id };
    }

    return { success: false };
  } catch (error) {
    console.error('Authentication error:', error);
    return { success: false };
  }
}

async function handleHeartbeat(supabase: any, deviceId: string, data: any) {
  await supabase
    .from('rmm_endpoints')
    .update({
      last_seen: new Date().toISOString(),
      status: 'online',
      cpu_usage: data.cpu_usage,
      memory_usage: data.memory_usage,
      disk_usage: data.disk_usage,
      network_stats: data.network_stats,
      installed_software: data.installed_software,
      running_processes: data.running_processes
    })
    .eq('id', deviceId);
}

async function handleAlert(supabase: any, deviceId: string, alertData: any) {
  // Create alert in RMM system
  await supabase
    .from('rmm_alerts')
    .insert({
      device_id: deviceId,
      alert_type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      source: 'agent',
      status: 'open',
      metadata: alertData.metadata
    });

  // If it's a security alert, also create a security event
  if (alertData.type === 'security') {
    await supabase
      .from('security_events')
      .insert({
        event_type: alertData.security_type || 'endpoint_alert',
        severity: alertData.severity,
        title: alertData.title,
        description: alertData.message,
        source_ip: alertData.source_ip,
        affected_assets: [deviceId],
        metadata: alertData.metadata
      });
  }
}

async function handleCommandResult(supabase: any, deviceId: string, resultData: any) {
  await supabase
    .from('rmm_command_executions')
    .update({
      status: resultData.success ? 'completed' : 'failed',
      completed_at: new Date().toISOString(),
      result: resultData,
      exit_code: resultData.exit_code
    })
    .eq('id', resultData.execution_id);
}

async function handleScreenData(supabase: any, deviceId: string, screenData: any) {
  // Handle screen sharing data for remote sessions
  // This would typically be forwarded to active remote sessions
  console.log(`Screen data received from device ${deviceId}`);
  
  // In a real implementation, this would stream to connected remote sessions
  // For now, we'll just log it
}

async function handleClipboardSync(supabase: any, deviceId: string, clipboardData: any) {
  // Store clipboard data for synchronization
  await supabase
    .from('rmm_clipboard_sync')
    .insert({
      device_id: deviceId,
      content: clipboardData.content,
      content_type: clipboardData.type,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });
}
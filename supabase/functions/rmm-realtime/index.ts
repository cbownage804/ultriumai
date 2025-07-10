import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Store active agent connections
const activeAgents = new Map<string, WebSocket>();
const activeSessions = new Map<string, WebSocket>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { 
      status: 400, 
      headers: corsHeaders 
    });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get('agent_id');
    const sessionToken = url.searchParams.get('token');
    
    console.log('WebSocket connection request:', { agentId, sessionToken });

    const { socket, response } = Deno.upgradeWebSocket(req);

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    socket.onopen = async () => {
      console.log('WebSocket connection opened');
      
      if (agentId) {
        // This is an agent connection
        activeAgents.set(agentId, socket);
        console.log(`Agent ${agentId} connected`);
        
        socket.send(JSON.stringify({
          type: 'connection_established',
          agent_id: agentId,
          timestamp: Date.now()
        }));
        
      } else if (sessionToken) {
        // This is a remote session connection
        activeSessions.set(sessionToken, socket);
        console.log(`Remote session ${sessionToken} connected`);
        
        socket.send(JSON.stringify({
          type: 'session_ready',
          session_token: sessionToken,
          timestamp: Date.now()
        }));
      }
    };

    socket.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log('Received message:', message.type);
        
        switch (message.type) {
          case 'device_registration':
            await handleDeviceRegistration(supabase, message.data, socket);
            break;
            
          case 'screen_frame':
            await handleScreenFrame(message.data, agentId, sessionToken);
            break;
            
          case 'command_result':
            await handleCommandResult(supabase, message.data, agentId);
            break;
            
          case 'system_info_response':
            await handleSystemInfoResponse(supabase, message.data, agentId);
            break;
            
          case 'heartbeat':
            await handleHeartbeat(supabase, message.data);
            break;
            
          case 'remote_command':
            await handleRemoteCommand(message.data, agentId);
            break;
            
          case 'start_screen_share':
            await requestScreenShare(message.data.device_id);
            break;
            
          case 'pong':
            console.log(`Pong received from agent ${agentId}`);
            break;
            
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process message',
          timestamp: Date.now()
        }));
      }
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      
      if (agentId) {
        activeAgents.delete(agentId);
        console.log(`Agent ${agentId} disconnected`);
      }
      
      if (sessionToken) {
        activeSessions.delete(sessionToken);
        console.log(`Session ${sessionToken} disconnected`);
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return response;

  } catch (error) {
    console.error('WebSocket upgrade error:', error);
    return new Response(
      JSON.stringify({ error: 'WebSocket upgrade failed', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Handle device registration
async function handleDeviceRegistration(supabase: any, data: any, socket: WebSocket) {
  try {
    console.log('Registering device:', data.agent_id);
    
    const deviceData = {
      agent_id: data.agent_id,
      hostname: data.system_info?.hostname || 'Web Agent',
      ip_address: '127.0.0.1', // Would need to get real IP from request
      device_type: 'web_agent',
      os_info: data.system_info?.os || 'Unknown',
      last_seen: new Date().toISOString(),
      status: 'online',
      client_id: '00000000-0000-0000-0000-000000000000', // Default client
      system_info: data.system_info
    };

    const { data: existingDevice, error: fetchError } = await supabase
      .from('rmm_devices')
      .select('id')
      .eq('agent_id', data.agent_id)
      .single();

    if (existingDevice) {
      // Update existing device
      const { error: updateError } = await supabase
        .from('rmm_devices')
        .update({
          last_seen: deviceData.last_seen,
          status: deviceData.status,
          system_info: deviceData.system_info
        })
        .eq('agent_id', data.agent_id);

      if (updateError) {
        console.error('Error updating device:', updateError);
      } else {
        console.log('Device updated successfully');
      }
    } else {
      // Insert new device
      const { error: insertError } = await supabase
        .from('rmm_devices')
        .insert([deviceData]);

      if (insertError) {
        console.error('Error inserting device:', insertError);
      } else {
        console.log('Device registered successfully');
      }
    }

    socket.send(JSON.stringify({
      type: 'registration_complete',
      status: 'success',
      timestamp: Date.now()
    }));

  } catch (error) {
    console.error('Device registration error:', error);
    socket.send(JSON.stringify({
      type: 'registration_complete',
      status: 'error',
      message: error.message,
      timestamp: Date.now()
    }));
  }
}

// Handle screen frame data
async function handleScreenFrame(frameData: string, agentId?: string, sessionToken?: string) {
  try {
    // Forward screen frame to active remote sessions
    if (agentId) {
      for (const [token, sessionSocket] of activeSessions) {
        if (sessionSocket.readyState === WebSocket.OPEN) {
          sessionSocket.send(JSON.stringify({
            type: 'screen_frame',
            data: frameData,
            agent_id: agentId,
            timestamp: Date.now()
          }));
        }
      }
    }
  } catch (error) {
    console.error('Error handling screen frame:', error);
  }
}

// Handle command execution results
async function handleCommandResult(supabase: any, data: any, agentId?: string) {
  try {
    console.log('Command result received:', data.command);
    
    // Store command result in database
    const { error } = await supabase
      .from('remote_commands')
      .insert([{
        device_id: agentId,
        command: data.command,
        command_type: 'web_command',
        status: 'completed',
        output: data.result,
        executed_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error storing command result:', error);
    }

    // Forward result to active sessions
    for (const [token, sessionSocket] of activeSessions) {
      if (sessionSocket.readyState === WebSocket.OPEN) {
        sessionSocket.send(JSON.stringify({
          type: 'command_result',
          data: data,
          agent_id: agentId,
          timestamp: Date.now()
        }));
      }
    }
  } catch (error) {
    console.error('Error handling command result:', error);
  }
}

// Handle system info response
async function handleSystemInfoResponse(supabase: any, data: any, agentId?: string) {
  try {
    console.log('System info received from agent:', agentId);
    
    // Update device with latest system info
    const { error } = await supabase
      .from('rmm_devices')
      .update({
        system_info: data,
        last_seen: new Date().toISOString()
      })
      .eq('agent_id', agentId);

    if (error) {
      console.error('Error updating system info:', error);
    }
  } catch (error) {
    console.error('Error handling system info:', error);
  }
}

// Handle heartbeat
async function handleHeartbeat(supabase: any, data: any) {
  try {
    const { error } = await supabase
      .from('rmm_devices')
      .update({
        last_seen: new Date().toISOString(),
        status: 'online'
      })
      .eq('agent_id', data.agent_id);

    if (error) {
      console.error('Error updating heartbeat:', error);
    }
  } catch (error) {
    console.error('Error handling heartbeat:', error);
  }
}

// Handle remote commands
async function handleRemoteCommand(data: any, targetAgentId?: string) {
  try {
    const agentSocket = activeAgents.get(data.device_id || targetAgentId);
    
    if (agentSocket && agentSocket.readyState === WebSocket.OPEN) {
      agentSocket.send(JSON.stringify({
        type: 'execute_command',
        data: {
          command: data.command,
          command_type: data.command_type || 'web_command'
        },
        timestamp: Date.now()
      }));
      
      console.log(`Command sent to agent ${data.device_id}: ${data.command}`);
    } else {
      console.log(`Agent ${data.device_id} not connected`);
    }
  } catch (error) {
    console.error('Error handling remote command:', error);
  }
}

// Request screen share from agent
async function requestScreenShare(deviceId: string) {
  try {
    const agentSocket = activeAgents.get(deviceId);
    
    if (agentSocket && agentSocket.readyState === WebSocket.OPEN) {
      agentSocket.send(JSON.stringify({
        type: 'start_screen_share',
        timestamp: Date.now()
      }));
      
      console.log(`Screen share requested from agent ${deviceId}`);
    } else {
      console.log(`Agent ${deviceId} not connected for screen share`);
    }
  } catch (error) {
    console.error('Error requesting screen share:', error);
  }
}
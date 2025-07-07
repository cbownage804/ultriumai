import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== RMM Remote Session function called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  console.log('Session token received:', token);

  if (!token) {
    console.log('Error: Missing session token');
    return new Response('Missing session token', { status: 400, headers: corsHeaders })
  }

  // Initialize Supabase client
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Verify session exists and is valid
  try {
    const { data: session, error } = await supabase
      .from('remote_sessions')
      .select('*, rmm_devices(*)')
      .eq('session_token', token)
      .eq('status', 'active')
      .single()

    if (error || !session) {
      console.log('Invalid session token:', error);
      return new Response('Invalid session token', { status: 401, headers: corsHeaders })
    }

    console.log('Session validated for device:', session.rmm_devices?.hostname);
  } catch (error) {
    console.error('Session validation error:', error);
    return new Response('Session validation failed', { status: 500, headers: corsHeaders })
  }

  // Check for WebSocket upgrade headers
  const upgradeHeader = req.headers.get('upgrade')
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    console.log('Error: Not a WebSocket upgrade request');
    return new Response('Expected WebSocket connection', { status: 400, headers: corsHeaders })
  }

  try {
    console.log('Attempting WebSocket upgrade...');
    
    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req)
    console.log('WebSocket upgrade successful');

    // Store connection state
    let isConnected = true;
    let heartbeatInterval: number | null = null;
    let pingTimeout: number | null = null;

    socket.onopen = () => {
      console.log('WebSocket opened for token:', token)
      
      // Send session ready message
      socket.send(JSON.stringify({
        type: 'session_ready',
        data: {
          sessionToken: token,
          timestamp: new Date().toISOString(),
          message: 'Remote desktop session established',
          capabilities: ['screen_sharing', 'mouse_control', 'keyboard_control', 'file_transfer']
        }
      }))

      // Start heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          }))
          
          // Set ping timeout
          pingTimeout = setTimeout(() => {
            console.log('Ping timeout, closing connection');
            socket.close(1000, 'Ping timeout');
          }, 10000); // 10 second timeout
        } else {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 30000) // Send heartbeat every 30 seconds
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('Received message type:', message.type);

        switch (message.type) {
          case 'pong':
            // Clear ping timeout when pong received
            if (pingTimeout) {
              clearTimeout(pingTimeout);
              pingTimeout = null;
            }
            break;

          case 'mouse_event':
            // In a real implementation, this would forward to the RMM agent
            console.log('Mouse event:', message.data);
            socket.send(JSON.stringify({
              type: 'mouse_ack',
              timestamp: new Date().toISOString()
            }));
            break;

          case 'keyboard_event':
            // In a real implementation, this would forward to the RMM agent
            console.log('Keyboard event:', message.data);
            socket.send(JSON.stringify({
              type: 'keyboard_ack',
              timestamp: new Date().toISOString()
            }));
            break;

          case 'screen_capture_request':
            // Simulate screen capture data
            socket.send(JSON.stringify({
              type: 'screen_frame',
              data: {
                width: 1920,
                height: 1080,
                format: 'jpeg',
                // In real implementation, this would be actual screen data
                frameData: 'simulated_screen_data',
                timestamp: new Date().toISOString()
              }
            }));
            break;

          case 'heartbeat':
            // Respond to heartbeat
            socket.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
            break;

          default:
            console.log('Unknown message type:', message.type);
            socket.send(JSON.stringify({
              type: 'error',
              message: 'Unknown message type: ' + message.type,
              timestamp: new Date().toISOString()
            }));
        }
      } catch (error) {
        console.error('Error processing message:', error)
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Invalid message format',
          timestamp: new Date().toISOString()
        }));
      }
    }

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason, 'for token:', token)
      isConnected = false;
      
      // Clean up intervals and timeouts
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (pingTimeout) clearTimeout(pingTimeout);
      
      // Update session status in database
      supabase
        .from('remote_sessions')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('session_token', token)
        .then(({ error }) => {
          if (error) console.error('Error updating session status:', error);
        });
    }

    socket.onerror = (error) => {
      console.error('WebSocket error for token:', token, error)
    }

    console.log('Returning WebSocket response');
    return response
  } catch (error) {
    console.error('WebSocket setup error:', error)
    return new Response('Internal server error: ' + error.message, { status: 500, headers: corsHeaders })
  }
})
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  console.log('RMM Remote Session function called:', req.method, req.url);
  
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

  // Validate WebSocket upgrade
  const upgradeHeader = req.headers.get('upgrade')
  console.log('Upgrade header:', upgradeHeader);
  
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    console.log('Error: Not a WebSocket upgrade request');
    return new Response('Expected WebSocket connection', { status: 400, headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Validate session token
    const { data: session, error } = await supabase
      .from('remote_sessions')
      .select('*')
      .eq('session_token', token)
      .eq('status', 'active')
      .single()

    if (error || !session) {
      console.error('Invalid session token:', error)
      return new Response('Invalid session token', { status: 401, headers: corsHeaders })
    }

    console.log('WebSocket connection validated for session:', session.id)

    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req)

    socket.onopen = () => {
      console.log('WebSocket connected for session:', session.id)
      
      // Send session ready message
      socket.send(JSON.stringify({
        type: 'session_ready',
        data: {
          sessionId: session.id,
          deviceId: session.device_id,
          timestamp: new Date().toISOString()
        }
      }))

      // Simulate desktop frames for demo
      const sendFrame = () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'screen_frame',
            data: {
              frame: 'base64_encoded_frame_data_would_go_here',
              timestamp: new Date().toISOString(),
              resolution: { width: 1920, height: 1080 }
            }
          }))
        }
      }

      // Send frame every 100ms for smooth experience
      const frameInterval = setInterval(sendFrame, 100)

      socket.onclose = () => {
        clearInterval(frameInterval)
      }
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('Received message:', message.type)

        switch (message.type) {
          case 'mouse_event':
            // Handle mouse events
            console.log('Mouse event:', message.data)
            break
          
          case 'keyboard_event':
            // Handle keyboard events
            console.log('Keyboard event:', message.data)
            break
          
          case 'ping':
            // Respond to ping
            socket.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }))
            break
          
          default:
            console.log('Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('Error processing message:', error)
      }
    }

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason)
    }

    socket.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    return response
  } catch (error) {
    console.error('WebSocket setup error:', error)
    return new Response('Internal server error', { status: 500, headers: corsHeaders })
  }
})
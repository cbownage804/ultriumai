import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, upgrade, connection, sec-websocket-key, sec-websocket-version, sec-websocket-protocol',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  console.log('=== RMM Remote Session function called ===');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Headers:', Object.fromEntries(req.headers.entries()));
  
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

  // Check for WebSocket upgrade headers
  const upgradeHeader = req.headers.get('upgrade')
  const connectionHeader = req.headers.get('connection')
  console.log('Upgrade header:', upgradeHeader);
  console.log('Connection header:', connectionHeader);
  
  if (upgradeHeader?.toLowerCase() !== 'websocket') {
    console.log('Error: Not a WebSocket upgrade request');
    return new Response('Expected WebSocket connection', { status: 400, headers: corsHeaders })
  }

  try {
    console.log('Attempting WebSocket upgrade...');
    
    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req)
    console.log('WebSocket upgrade successful');

    socket.onopen = () => {
      console.log('WebSocket opened for token:', token)
      
      // Send immediate welcome message
      socket.send(JSON.stringify({
        type: 'session_ready',
        data: {
          sessionToken: token,
          timestamp: new Date().toISOString(),
          message: 'WebSocket connection established'
        }
      }))

      // Send periodic ping messages
      const pingInterval = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString()
          }))
        } else {
          clearInterval(pingInterval)
        }
      }, 5000)

      socket.onclose = () => {
        console.log('WebSocket closed for token:', token)
        clearInterval(pingInterval)
      }
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        console.log('Received message:', message.type, message)

        // Echo back any message
        socket.send(JSON.stringify({
          type: 'echo',
          originalMessage: message,
          timestamp: new Date().toISOString()
        }))
      } catch (error) {
        console.error('Error processing message:', error)
      }
    }

    socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason, 'for token:', token)
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
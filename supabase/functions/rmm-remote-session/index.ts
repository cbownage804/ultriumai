import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RemoteSessionMessage {
  type: 'screen_frame' | 'mouse_event' | 'keyboard_event' | 'clipboard_sync' | 'file_transfer' | 'ai_query';
  data: any;
  timestamp: number;
}

serve(async (req) => {
  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const sessionToken = url.searchParams.get('token');
  
  if (!sessionToken) {
    return new Response("Session token required", { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let sessionInfo: any = null;
  let authenticated = false;

  socket.onopen = async () => {
    console.log("Remote session WebSocket connection established");
    
    try {
      // Validate session token
      sessionInfo = await validateSessionToken(supabase, sessionToken);
      if (sessionInfo) {
        authenticated = true;
        socket.send(JSON.stringify({
          type: 'session_ready',
          session_id: sessionInfo.id,
          device_info: sessionInfo.device,
          capabilities: {
            screen_sharing: true,
            mouse_control: true,
            keyboard_input: true,
            clipboard_sync: true,
            file_transfer: true,
            ai_assistant: true,
            safedoc_integration: true,
            safepass_integration: true
          },
          timestamp: Date.now()
        }));
      } else {
        socket.send(JSON.stringify({
          type: 'auth_error',
          message: 'Invalid session token',
          timestamp: Date.now()
        }));
        socket.close();
      }
    } catch (error) {
      console.error('Session validation error:', error);
      socket.close();
    }
  };

  socket.onmessage = async (event) => {
    if (!authenticated) return;

    try {
      const message: RemoteSessionMessage = JSON.parse(event.data);

      switch (message.type) {
        case 'screen_frame':
          // Forward screen frame to connected client
          await handleScreenFrame(message.data);
          break;

        case 'mouse_event':
          await handleMouseEvent(supabase, sessionInfo.device_id, message.data);
          break;

        case 'keyboard_event':
          await handleKeyboardEvent(supabase, sessionInfo.device_id, message.data);
          break;

        case 'clipboard_sync':
          await handleClipboardSync(supabase, sessionInfo.device_id, message.data);
          break;

        case 'file_transfer':
          await handleFileTransfer(supabase, sessionInfo.device_id, message.data);
          break;

        case 'ai_query':
          const aiResponse = await handleAIQuery(supabase, sessionInfo, message.data);
          socket.send(JSON.stringify({
            type: 'ai_response',
            data: aiResponse,
            timestamp: Date.now()
          }));
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Remote session message error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        message: error.message,
        timestamp: Date.now()
      }));
    }
  };

  socket.onclose = async () => {
    console.log("Remote session WebSocket connection closed");
    if (sessionInfo) {
      // Update session status
      await supabase
        .from('rmm_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString()
        })
        .eq('id', sessionInfo.id);
    }
  };

  return response;
});

async function validateSessionToken(supabase: any, token: string) {
  try {
    // Decode and validate session token
    const payload = JSON.parse(atob(token));
    
    if (payload.expires_at < Date.now()) {
      throw new Error('Session token expired');
    }

    // Get session info
    const { data: session } = await supabase
      .from('rmm_sessions')
      .select(`
        *,
        rmm_endpoints (*)
      `)
      .eq('id', payload.session_id)
      .eq('status', 'active')
      .single();

    if (session) {
      return {
        id: session.id,
        device_id: session.device_id,
        device: session.rmm_endpoints,
        user_id: session.user_id,
        session_type: session.session_type
      };
    }

    return null;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

async function handleScreenFrame(frameData: any) {
  // In a real implementation, this would process and forward screen frames
  // to the remote viewer. For now, we'll just log it.
  console.log('Screen frame received, size:', frameData.size);
}

async function handleMouseEvent(supabase: any, deviceId: string, eventData: any) {
  // Log mouse event for session recording
  await supabase
    .from('rmm_session_events')
    .insert({
      device_id: deviceId,
      event_type: 'mouse',
      event_data: eventData,
      timestamp: new Date().toISOString()
    });
}

async function handleKeyboardEvent(supabase: any, deviceId: string, eventData: any) {
  // Log keyboard event (without sensitive data) for session recording
  await supabase
    .from('rmm_session_events')
    .insert({
      device_id: deviceId,
      event_type: 'keyboard',
      event_data: {
        key_count: eventData.keys?.length || 0,
        modifiers: eventData.modifiers
      },
      timestamp: new Date().toISOString()
    });
}

async function handleClipboardSync(supabase: any, deviceId: string, clipboardData: any) {
  // Sync clipboard between remote session and agent
  await supabase
    .from('rmm_clipboard_sync')
    .insert({
      device_id: deviceId,
      content: clipboardData.content,
      content_type: clipboardData.type,
      direction: clipboardData.direction, // 'to_agent' or 'from_agent'
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString()
    });
}

async function handleFileTransfer(supabase: any, deviceId: string, transferData: any) {
  // Handle file transfer between remote session and agent
  await supabase
    .from('rmm_file_transfers')
    .insert({
      device_id: deviceId,
      file_name: transferData.file_name,
      file_size: transferData.file_size,
      transfer_type: transferData.type, // 'upload' or 'download'
      status: 'in_progress',
      created_at: new Date().toISOString()
    });
}

async function handleAIQuery(supabase: any, sessionInfo: any, queryData: any) {
  try {
    // Process AI query with context from current remote session
    const context = {
      device_id: sessionInfo.device_id,
      session_type: sessionInfo.session_type,
      current_screen: queryData.screen_context,
      query: queryData.query
    };

    // Call AI assistant function with SafeDoc and SafePass integration
    const { data, error } = await supabase.functions.invoke('ai-remote-assistant', {
      body: {
        context,
        query: queryData.query,
        integrations: {
          safedoc: queryData.include_safedoc || false,
          safepass: queryData.include_safepass || false
        }
      }
    });

    if (error) throw error;

    return {
      response: data.response,
      suggestions: data.suggestions,
      documents: data.related_documents,
      passwords: data.related_passwords,
      actions: data.suggested_actions
    };
  } catch (error) {
    console.error('AI query error:', error);
    return {
      response: 'Sorry, I encountered an error processing your request.',
      error: error.message
    };
  }
}
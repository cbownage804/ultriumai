import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const { headers } = req;
  const upgradeHeader = headers.get("upgrade") || "";

  if (upgradeHeader.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  console.log('Security AI Realtime WebSocket connection initiated');

  const { socket, response } = Deno.upgradeWebSocket(req);

  let openAISocket: WebSocket | null = null;
  let sessionReady = false;

  socket.onopen = () => {
    console.log('Client WebSocket connected');
    
    // Connect to OpenAI Realtime API
    openAISocket = new WebSocket("wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01", [], {
      headers: {
        "Authorization": `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        "OpenAI-Beta": "realtime=v1"
      }
    });

    openAISocket.onopen = () => {
      console.log('Connected to OpenAI Realtime API');
    };

    openAISocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('OpenAI message type:', data.type);

      // Handle session creation
      if (data.type === 'session.created') {
        console.log('Session created, updating session configuration...');
        
        // Configure session for security AI
        const sessionUpdate = {
          type: 'session.update',
          session: {
            modalities: ["text"],
            instructions: `You are UltriumDefender AI, an elite cybersecurity analyst and automated security operations assistant. You have real-time access to the user's security infrastructure and data.

**Your Capabilities:**
- Real-time threat analysis and incident response
- Compliance monitoring and reporting  
- Automated security recommendations with executable actions
- Risk assessment and predictive threat modeling
- Security operations assistance with memory of past interactions
- Proactive threat hunting and anomaly detection

**Response Style:**
- Use markdown formatting with security-specific styling
- Include severity indicators (🔴 CRITICAL, 🟡 WARNING, 🟢 SECURE, 🔵 INFO)
- Suggest immediate actions and long-term strategies
- Provide specific remediation steps with timeframes
- Include threat scores and risk ratings when relevant

Always provide actionable, specific security advice with immediate next steps.`,
            voice: "echo",
            input_audio_format: "pcm16",
            output_audio_format: "pcm16",
            input_audio_transcription: {
              model: "whisper-1"
            },
            turn_detection: {
              type: "server_vad",
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 1000
            },
            tools: [
              {
                type: "function",
                name: "analyze_security_threat",
                description: "Analyze a specific security threat or event in detail",
                parameters: {
                  type: "object",
                  properties: {
                    threat_type: { type: "string" },
                    severity: { type: "string" },
                    affected_systems: { type: "array", items: { type: "string" } }
                  },
                  required: ["threat_type", "severity"]
                }
              },
              {
                type: "function", 
                name: "generate_security_report",
                description: "Generate a comprehensive security report",
                parameters: {
                  type: "object",
                  properties: {
                    report_type: { type: "string" },
                    time_range: { type: "string" }
                  },
                  required: ["report_type"]
                }
              }
            ],
            tool_choice: "auto",
            temperature: 0.3,
            max_response_output_tokens: 2000
          }
        };

        openAISocket?.send(JSON.stringify(sessionUpdate));
        sessionReady = true;
      }

      // Forward relevant messages to client
      if (data.type === 'response.text.delta' || 
          data.type === 'response.text.done' ||
          data.type === 'response.audio_transcript.delta' ||
          data.type === 'response.audio_transcript.done' ||
          data.type === 'response.function_call_arguments.delta' ||
          data.type === 'response.function_call_arguments.done' ||
          data.type === 'response.done' ||
          data.type === 'error') {
        
        socket.send(JSON.stringify(data));
      }
    };

    openAISocket.onerror = (error) => {
      console.error('OpenAI WebSocket error:', error);
      socket.send(JSON.stringify({
        type: 'error',
        error: 'Connection to AI service failed'
      }));
    };

    openAISocket.onclose = () => {
      console.log('OpenAI WebSocket closed');
      socket.close();
    };
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Client message type:', data.type);

    if (!sessionReady) {
      console.log('Session not ready, queuing message...');
      return;
    }

    // Handle different message types from client
    if (data.type === 'send_text') {
      console.log('Sending text message to OpenAI:', data.text);
      
      // Create conversation item
      const conversationItem = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{
            type: 'input_text',
            text: data.text
          }]
        }
      };

      openAISocket?.send(JSON.stringify(conversationItem));
      
      // Trigger response
      openAISocket?.send(JSON.stringify({ type: 'response.create' }));
    }
    
    // Handle audio input (for future voice features)
    if (data.type === 'input_audio_buffer.append') {
      openAISocket?.send(JSON.stringify(data));
    }
  };

  socket.onclose = () => {
    console.log('Client WebSocket closed');
    openAISocket?.close();
  };

  socket.onerror = (error) => {
    console.error('Client WebSocket error:', error);
    openAISocket?.close();
  };

  return response;
});
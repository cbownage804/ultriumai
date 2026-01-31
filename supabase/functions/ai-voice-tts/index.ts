import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voice = 'alloy', action = 'tts' } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (action === 'process_command') {
      // Process voice command with Lovable AI
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-3-flash-preview',
          messages: [
            {
              role: 'system',
              content: `You are Vanguard Voice, an AI assistant for IT helpdesk operations. 
              Analyze voice commands and extract intent and entities.
              
              Possible intents:
              - create_ticket: User wants to create a new support ticket
              - search: User wants to search for tickets or information
              - status: User wants to check status or get an overview
              - assign: User wants to assign a ticket to someone
              - update_ticket: User wants to update an existing ticket
              - close_ticket: User wants to close a ticket
              - escalate: User wants to escalate a ticket
              - general: General question or request
              
              Respond with a helpful, conversational response that confirms the action.`
            },
            { role: 'user', content: text }
          ],
          tools: [
            {
              type: 'function',
              function: {
                name: 'process_voice_command',
                description: 'Extract intent and entities from a voice command',
                parameters: {
                  type: 'object',
                  properties: {
                    intent: {
                      type: 'string',
                      enum: ['create_ticket', 'search', 'status', 'assign', 'update_ticket', 'close_ticket', 'escalate', 'general']
                    },
                    entities: {
                      type: 'object',
                      properties: {
                        ticket_id: { type: 'string' },
                        priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                        assignee: { type: 'string' },
                        search_query: { type: 'string' },
                        title: { type: 'string' },
                        description: { type: 'string' }
                      }
                    },
                    response: {
                      type: 'string',
                      description: 'A helpful, conversational response to the user'
                    }
                  },
                  required: ['intent', 'response']
                }
              }
            }
          ],
          tool_choice: { type: 'function', function: { name: 'process_voice_command' } }
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'AI credits exhausted. Please add funds to continue.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        const result = JSON.parse(toolCall.function.arguments);
        return new Response(
          JSON.stringify({
            intent: result.intent,
            entities: result.entities || {},
            response: result.response,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fallback if no tool call
      const content = data.choices?.[0]?.message?.content || "I understood your request. How can I help further?";
      return new Response(
        JSON.stringify({
          intent: 'general',
          entities: {},
          response: content,
          success: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // TTS action - use OpenAI TTS if available, otherwise return text
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      // Return text response for browser TTS fallback
      return new Response(
        JSON.stringify({ 
          text: text,
          useBrowserTTS: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate speech from text using OpenAI TTS
    const ttsResponse = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice,
        response_format: 'mp3',
      }),
    });

    if (!ttsResponse.ok) {
      // Fallback to browser TTS
      return new Response(
        JSON.stringify({ 
          text: text,
          useBrowserTTS: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Convert audio buffer to base64
    const arrayBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-voice-tts function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatRequest {
  message: string;
  conversation_id?: string;
  gpt_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    // Use Lovable AI Gateway if available, fallback to OpenAI
    const useGateway = !!lovableApiKey;
    const apiKey = lovableApiKey || openAIApiKey;

    if (!supabaseUrl || !supabaseServiceKey || !apiKey) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { message, conversation_id, gpt_id }: ChatRequest = await req.json();

    if (!message || !gpt_id) {
      return new Response(
        JSON.stringify({ error: 'Message and gpt_id are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Fetch the Custom GPT configuration
    const { data: gpt, error: gptError } = await supabase
      .from('custom_gpts')
      .select('*')
      .eq('id', gpt_id)
      .eq('is_active', true)
      .single();

    if (gptError || !gpt) {
      return new Response(
        JSON.stringify({ error: 'GPT not found or not active' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if public access is enabled
    if (gpt.agent_visibility !== 'public') {
      return new Response(
        JSON.stringify({ error: 'This GPT is not publicly accessible' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create or get conversation for public access
    let conversationId = conversation_id;
    if (!conversationId) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert({
          title: `Public chat with ${gpt.name}`,
          user_id: '00000000-0000-0000-0000-000000000000' // Public user ID
        })
        .select()
        .single();

      if (convError) {
        throw new Error('Failed to create conversation');
      }
      conversationId = newConv.id;
    }

    // Get conversation history (last 10 messages)
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Build context from previous messages
    const messageHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // Add the new user message
    messageHistory.push({ role: 'user', content: message });

    // Save user message to database
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: message
      });

    // Prepare system prompt
    let systemPrompt = gpt.system_prompt;
    
    // Add any custom instructions for public access
    if (gpt.agent_capability) {
      systemPrompt += `\n\nAdditional capabilities: ${gpt.agent_capability}`;
    }

    // Determine API endpoint and model
    const apiUrl = useGateway 
      ? 'https://ai.gateway.lovable.dev/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions';
    
    // Map model selection - use Gemini for gateway, OpenAI for direct
    const preferredModel = gpt.preferred_model || gpt.ai_model;
    let model = 'google/gemini-3-flash-preview'; // Default for gateway
    
    if (useGateway) {
      // Map common model names to gateway models
      if (preferredModel?.includes('gpt-4')) {
        model = 'google/gemini-2.5-pro';
      } else if (preferredModel?.includes('gpt-3.5') || preferredModel?.includes('mini')) {
        model = 'google/gemini-2.5-flash';
      }
    } else {
      model = preferredModel || 'gpt-4o-mini';
    }

    // Call AI API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messageHistory
        ],
        temperature: 0.7,
        max_tokens: 1000,
        stream: false
      }),
    });

    if (!response.ok) {
      // Handle rate limiting
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { 
            status: 429, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service temporarily unavailable. Please try again later.' }),
          { 
            status: 402, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message.content;

    // Save assistant response to database
    await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantMessage
      });

    // Update GPT chat count
    await supabase
      .from('custom_gpts')
      .update({ chat_count: (gpt.chat_count || 0) + 1 })
      .eq('id', gpt_id);

    return new Response(
      JSON.stringify({
        message: assistantMessage,
        conversation_id: conversationId,
        gpt_name: gpt.name,
        usage: data.usage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in public-gpt-chat function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
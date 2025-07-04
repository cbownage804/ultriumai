import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, customGPT, sessionId } = await req.json();
    const startTime = Date.now();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Build system prompt based on custom GPT or default
    let systemPrompt = 'You are UltriumGPT, a helpful AI assistant created by UltriumAI. You help users with various tasks including answering questions, providing information, and assisting with problem-solving. When users upload files, carefully analyze their content and provide insights, summaries, or answer questions about the files. You can work with various file types including text files, code files, JSON, CSV, and more. Be concise but thorough in your responses.';
    
    if (customGPT && customGPT.system_prompt) {
      systemPrompt = customGPT.system_prompt;
    }
    
    // Always append image generation instruction regardless of custom GPT
    systemPrompt += ' CRITICAL: When users request image generation (asking to create, generate, or make images), respond ONLY with "Generating your image..." and absolutely nothing else. Do not analyze, describe, or discuss generated images.';

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt
          },
          ...messages
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API request failed');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    // Track analytics if custom GPT is being used
    if (customGPT?.id && sessionId) {
      try {
        // Get user ID from authorization header
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          
          // Create a temporary supabase client to get user info
          const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.7.1');
          const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
              global: {
                headers: {
                  Authorization: authHeader,
                },
              },
            }
          );
          
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Track the message exchange
            await supabase.from('gpt_analytics').insert({
              gpt_id: customGPT.id,
              user_id: user.id,
              session_id: sessionId,
              interaction_type: 'message',
              response_time_ms: responseTime,
              tokens_used: data.usage?.total_tokens || 0,
              metadata: {
                model: 'gpt-4.1-2025-04-14',
                prompt_tokens: data.usage?.prompt_tokens || 0,
                completion_tokens: data.usage?.completion_tokens || 0
              }
            });
            
            // Update chat count for the GPT
            await supabase
              .from('custom_gpts')
              .update({ 
                chat_count: customGPT.chat_count ? customGPT.chat_count + 1 : 1 
              })
              .eq('id', customGPT.id);
          }
        }
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
        // Continue without failing the main request
      }
    }

    return new Response(JSON.stringify({ 
      message: generatedText,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-completion function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
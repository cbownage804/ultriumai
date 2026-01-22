import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, model = 'gpt-4o-mini', context = 'general', systemPrompt, stream = false } = await req.json();
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Get system prompt based on context or use provided systemPrompt
    const defaultSystemPrompts = {
      general: "You are a helpful AI assistant. Provide accurate, helpful, and engaging responses to any questions or topics.",
      business: "You are a business intelligence AI specialist. Focus on data analysis, business strategy, market insights, and helping with business decisions. Provide actionable recommendations.",
      security: "You are a cybersecurity expert AI. Analyze security threats, provide security recommendations, help with incident response, and explain security concepts clearly.",
      developer: "You are a senior software engineer AI. Help with code review, debugging, architecture decisions, and best practices. Provide clean, efficient code solutions.",
      creative: "You are a creative AI specialist. Help with content creation, copywriting, design concepts, marketing strategies, and creative problem-solving.",
      research: "You are a research AI specialist. Conduct thorough analysis, provide detailed research insights, synthesize information from multiple perspectives, and present findings clearly.",
      helpdesk: "You are SafeDesk AI, a technical support specialist. Help users troubleshoot issues, provide step-by-step solutions, and offer clear explanations for technical problems.",
      rmm: "You are SafeOps AI, a remote monitoring and management expert. Assist with system monitoring, maintenance tasks, and infrastructure management."
    };

    const finalSystemPrompt = systemPrompt || defaultSystemPrompts[context as keyof typeof defaultSystemPrompts] || defaultSystemPrompts.general;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: finalSystemPrompt },
          { role: 'user', content: message }
        ],
        stream,
        temperature: 0.7,
      }),
    });

    if (stream) {
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    return new Response(JSON.stringify({
      response: data.choices[0].message.content,
      model,
      usage: data.usage
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
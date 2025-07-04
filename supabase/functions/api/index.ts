import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const openAIApiKey = Deno.env.get('OPENAI_API_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate API key and get user permissions
async function validateAPIKey(apiKey: string) {
  try {
    // In a real implementation, this would check against a custom_api_keys table
    // For now, we'll simulate validation
    if (!apiKey || !apiKey.startsWith('uk_')) {
      return null;
    }

    // Mock user validation - replace with actual database lookup
    return {
      user_id: 'mock-user-id',
      permissions: ['chat', 'analytics', 'manage', 'deploy']
    };
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

// Chat endpoint
async function handleChat(request: Request, userAuth: any) {
  try {
    const { gpt_id, message, stream = false, model = 'gpt-4o-mini' } = await request.json();

    if (!userAuth.permissions.includes('chat')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!gpt_id || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: gpt_id, message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get GPT configuration
    const { data: gpt, error: gptError } = await supabase
      .from('custom_gpts')
      .select('*')
      .eq('id', gpt_id)
      .eq('user_id', userAuth.user_id)
      .single();

    if (gptError || !gpt) {
      return new Response(JSON.stringify({ error: 'GPT not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Prepare messages for OpenAI
    const messages = [
      { role: 'system', content: gpt.system_prompt },
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: gpt.preferred_model || model,
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`);
    }

    if (stream) {
      // Return streaming response
      return new Response(openAIResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    const data = await openAIResponse.json();
    const assistantMessage = data.choices[0]?.message?.content;

    // Log analytics
    await supabase.from('gpt_analytics').insert({
      gpt_id,
      user_id: userAuth.user_id,
      interaction_type: 'api_chat',
      tokens_used: data.usage?.total_tokens || 0,
      response_time_ms: Date.now() - Date.now(), // Would track actual response time
      metadata: {
        model: gpt.preferred_model || model,
        api_request: true
      }
    });

    return new Response(JSON.stringify({
      response: assistantMessage,
      usage: data.usage,
      model: data.model
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// List GPTs endpoint
async function handleListGPTs(userAuth: any) {
  try {
    if (!userAuth.permissions.includes('analytics')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: gpts, error } = await supabase
      .from('custom_gpts')
      .select('id, name, description, created_at, is_active, chat_count')
      .eq('user_id', userAuth.user_id);

    if (error) throw error;

    return new Response(JSON.stringify({ gpts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('List GPTs error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Analytics endpoint
async function handleAnalytics(request: Request, userAuth: any) {
  try {
    if (!userAuth.permissions.includes('analytics')) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const gptId = url.searchParams.get('gpt_id');
    const days = parseInt(url.searchParams.get('days') || '7');

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    let query = supabase
      .from('gpt_analytics')
      .select('*')
      .eq('user_id', userAuth.user_id)
      .gte('created_at', startDate.toISOString());

    if (gptId) {
      query = query.eq('gpt_id', gptId);
    }

    const { data: analytics, error } = await query;

    if (error) throw error;

    // Process analytics data
    const summary = {
      total_interactions: analytics.length,
      total_tokens: analytics.reduce((sum, a) => sum + (a.tokens_used || 0), 0),
      average_response_time: analytics.length > 0 
        ? analytics.reduce((sum, a) => sum + (a.response_time_ms || 0), 0) / analytics.length
        : 0,
      interactions_by_day: {} as Record<string, number>
    };

    // Group by day
    analytics.forEach(item => {
      const day = item.created_at.split('T')[0];
      summary.interactions_by_day[day] = (summary.interactions_by_day[day] || 0) + 1;
    });

    return new Response(JSON.stringify({ summary, raw_data: analytics }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract API key from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = authHeader.substring(7); // Remove 'Bearer ' prefix
    const userAuth = await validateAPIKey(apiKey);

    if (!userAuth) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Route requests
    const url = new URL(req.url);
    const path = url.pathname;

    switch (true) {
      case path.endsWith('/chat') && req.method === 'POST':
        return await handleChat(req, userAuth);
      
      case path.endsWith('/gpts') && req.method === 'GET':
        return await handleListGPTs(userAuth);
      
      case path.endsWith('/analytics') && req.method === 'GET':
        return await handleAnalytics(req, userAuth);
      
      default:
        return new Response(JSON.stringify({ 
          error: 'Endpoint not found',
          available_endpoints: [
            'POST /chat - Send messages to GPTs',
            'GET /gpts - List your GPTs', 
            'GET /analytics - Get usage analytics'
          ]
        }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
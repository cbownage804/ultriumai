import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-api-key, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Validate API key
async function validateAPIKey(apiKey: string) {
  if (!apiKey || !apiKey.startsWith('sd_')) {
    return null;
  }

  // Hash the key for lookup (in real implementation, hash the full key)
  const keyPrefix = apiKey.substring(0, 10);
  
  const { data: keyData, error } = await supabase
    .from('integration_api_keys')
    .select(`
      *,
      profiles!integration_api_keys_user_id_fkey (
        id,
        account_type
      )
    `)
    .eq('key_prefix', keyPrefix)
    .eq('is_active', true)
    .single();

  if (error || !keyData) {
    return null;
  }

  // Update last used timestamp
  await supabase
    .from('integration_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id);

  return keyData;
}

// Create ticket endpoint
async function createTicket(request: Request, userAuth: any) {
  try {
    const ticketData = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'description'];
    for (const field of requiredFields) {
      if (!ticketData[field]) {
        return new Response(JSON.stringify({ 
          error: `Missing required field: ${field}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Generate AI summary if content provided
    let aiSummary = '';
    if (openAIApiKey && ticketData.description) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'Create a concise summary of this support ticket. Extract the key issue, affected systems, and urgency. Keep under 150 words.'
              },
              {
                role: 'user',
                content: `Title: ${ticketData.title}\n\nDescription: ${ticketData.description}\n\nAsset: ${ticketData.asset_name || 'N/A'}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices[0]?.message?.content || '';
        }
      } catch (error) {
        console.error('AI summary failed:', error);
      }
    }

    // Get MSP info for the user
    const { data: mspData } = await supabase
      .from('msps')
      .select('id')
      .eq('user_id', userAuth.user_id)
      .single();

    const newTicket = {
      user_id: userAuth.user_id,
      msp_id: mspData?.id,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      category: ticketData.category || 'general',
      status: 'open',
      requester_name: ticketData.requester_name,
      requester_email: ticketData.requester_email,
      requester_phone: ticketData.requester_phone,
      asset_name: ticketData.asset_name,
      source_type: 'api',
      ai_summary: aiSummary,
      last_activity_at: new Date().toISOString(),
    };

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert(newTicket)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      ticket: {
        id: ticket.id,
        ticket_number: ticket.id.slice(-8),
        title: ticket.title,
        status: ticket.status,
        priority: ticket.priority,
        created_at: ticket.created_at,
        ai_summary: ticket.ai_summary
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Create ticket error:', error);
    return new Response(JSON.stringify({ error: 'Failed to create ticket' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

// Get tickets endpoint
async function getTickets(request: Request, userAuth: any) {
  try {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const priority = url.searchParams.get('priority');
    const limit = parseInt(url.searchParams.get('limit') || '50');

    let query = supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userAuth.user_id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tickets, error } = await query;

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({
      success: true,
      tickets: tickets.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.id.slice(-8),
        title: ticket.title,
        description: ticket.description,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
        requester_name: ticket.requester_name,
        requester_email: ticket.requester_email,
        asset_name: ticket.asset_name,
        ai_summary: ticket.ai_summary,
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        resolved_at: ticket.resolved_at
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Get tickets error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tickets' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract API key from header
    const apiKey = req.headers.get('x-api-key');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Missing API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userAuth = await validateAPIKey(apiKey);
    if (!userAuth) {
      return new Response(JSON.stringify({ error: 'Invalid API key' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname;

    // Route API requests
    switch (true) {
      case path.endsWith('/tickets') && req.method === 'POST':
        if (!userAuth.permissions.create_tickets) {
          return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await createTicket(req, userAuth);

      case path.endsWith('/tickets') && req.method === 'GET':
        if (!userAuth.permissions.read_tickets) {
          return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        return await getTickets(req, userAuth);

      default:
        return new Response(JSON.stringify({
          error: 'Endpoint not found',
          available_endpoints: {
            'POST /tickets': 'Create a new support ticket',
            'GET /tickets': 'List tickets with optional filters (status, priority, limit)'
          },
          example_create_ticket: {
            title: 'System Issue',
            description: 'Detailed description of the problem',
            priority: 'high', // optional: low, medium, high, critical
            category: 'technical', // optional
            requester_name: 'John Doe', // optional
            requester_email: 'john@company.com', // optional
            requester_phone: '+1234567890', // optional
            asset_name: 'Server-01' // optional
          }
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
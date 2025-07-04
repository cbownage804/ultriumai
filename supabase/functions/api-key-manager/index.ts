import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateAPIKeyRequest {
  name: string;
  gpt_id?: string;
  permissions: {
    chat: boolean;
    analytics: boolean;
    management: boolean;
  };
  rate_limit_rpm?: number;
  rate_limit_rpd?: number;
  expires_at?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'create':
        return await handleCreateAPIKey(req, supabaseClient);
      case 'validate':
        return await handleValidateAPIKey(req, supabaseClient);
      case 'revoke':
        return await handleRevokeAPIKey(req, supabaseClient);
      case 'log-usage':
        return await handleLogUsage(req, supabaseClient);
      case 'get-usage':
        return await handleGetUsage(req, supabaseClient);
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

  } catch (error) {
    console.error('API Key Manager error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleCreateAPIKey(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { name, gpt_id, permissions, rate_limit_rpm = 60, rate_limit_rpd = 1000, expires_at }: CreateAPIKeyRequest = await req.json();

  if (!name || !permissions) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = generateAPIKey();
  const keyPrefix = apiKey.substring(0, 8);
  const keyHash = await hashAPIKey(apiKey);

  const { data: newAPIKey, error: createError } = await supabaseClient
    .from('api_keys')
    .insert({
      user_id: user.id,
      gpt_id: gpt_id || null,
      name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions,
      rate_limit_rpm,
      rate_limit_rpd,
      expires_at: expires_at || null,
      is_active: true
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating API key:', createError);
    return new Response(JSON.stringify({ error: 'Failed to create API key' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ 
    success: true, 
    api_key: apiKey,
    key_info: {
      id: newAPIKey.id,
      name: newAPIKey.name,
      key_prefix: newAPIKey.key_prefix,
      permissions: newAPIKey.permissions,
      rate_limit_rpm: newAPIKey.rate_limit_rpm,
      rate_limit_rpd: newAPIKey.rate_limit_rpd,
      created_at: newAPIKey.created_at
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleValidateAPIKey(req: Request, supabaseClient: any) {
  const { api_key } = await req.json();

  if (!api_key) {
    return new Response(JSON.stringify({ valid: false, error: 'API key required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const keyPrefix = api_key.substring(0, 8);
  const keyHash = await hashAPIKey(api_key);

  const { data: apiKeyData, error: keyError } = await supabaseClient
    .from('api_keys')
    .select('*, custom_gpts(*)')
    .eq('key_prefix', keyPrefix)
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (keyError || !apiKeyData) {
    return new Response(JSON.stringify({ valid: false, error: 'Invalid API key' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
    return new Response(JSON.stringify({ valid: false, error: 'API key expired' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  await supabaseClient
    .from('api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      usage_count: (apiKeyData.usage_count || 0) + 1
    })
    .eq('id', apiKeyData.id);

  return new Response(JSON.stringify({ 
    valid: true,
    key_info: {
      id: apiKeyData.id,
      user_id: apiKeyData.user_id,
      gpt_id: apiKeyData.gpt_id,
      permissions: apiKeyData.permissions,
      rate_limit_rpm: apiKeyData.rate_limit_rpm,
      rate_limit_rpd: apiKeyData.rate_limit_rpd,
      gpt: apiKeyData.custom_gpts
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleRevokeAPIKey(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { key_id } = await req.json();

  if (!key_id) {
    return new Response(JSON.stringify({ error: 'Key ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: revokeError } = await supabaseClient
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', key_id)
    .eq('user_id', user.id);

  if (revokeError) {
    console.error('Error revoking API key:', revokeError);
    return new Response(JSON.stringify({ error: 'Failed to revoke API key' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleLogUsage(req: Request, supabaseClient: any) {
  const { api_key, endpoint, method, status_code, response_time_ms, tokens_used, error_message, ip_address, user_agent } = await req.json();

  const keyPrefix = api_key.substring(0, 8);
  const keyHash = await hashAPIKey(api_key);

  const { data: apiKeyData, error: keyError } = await supabaseClient
    .from('api_keys')
    .select('id, gpt_id')
    .eq('key_prefix', keyPrefix)
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single();

  if (keyError || !apiKeyData) {
    return new Response(JSON.stringify({ error: 'Invalid API key' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { error: logError } = await supabaseClient
    .from('api_usage_logs')
    .insert({
      api_key_id: apiKeyData.id,
      gpt_id: apiKeyData.gpt_id,
      endpoint,
      method,
      status_code,
      response_time_ms,
      tokens_used,
      error_message,
      ip_address,
      user_agent
    });

  if (logError) {
    console.error('Error logging API usage:', logError);
    return new Response(JSON.stringify({ error: 'Failed to log usage' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleGetUsage(req: Request, supabaseClient: any) {
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const keyId = url.searchParams.get('key_id');
  const timeRange = url.searchParams.get('range') || '7d';

  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
  }

  let query = supabaseClient
    .from('api_usage_logs')
    .select('*, api_keys!inner(*)')
    .eq('api_keys.user_id', user.id)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  if (keyId) {
    query = query.eq('api_key_id', keyId);
  }

  const { data: usageLogs, error: usageError } = await query;

  if (usageError) {
    console.error('Error fetching usage logs:', usageError);
    return new Response(JSON.stringify({ error: 'Failed to fetch usage data' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const totalRequests = usageLogs.length;
  const successfulRequests = usageLogs.filter(log => log.status_code >= 200 && log.status_code < 300).length;
  const errorRequests = usageLogs.filter(log => log.status_code >= 400).length;
  const avgResponseTime = usageLogs
    .filter(log => log.response_time_ms)
    .reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / totalRequests || 0;
  const totalTokens = usageLogs.reduce((sum, log) => sum + (log.tokens_used || 0), 0);

  return new Response(JSON.stringify({ 
    total_requests: totalRequests,
    successful_requests: successfulRequests,
    error_requests: errorRequests,
    success_rate: totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0,
    avg_response_time_ms: Math.round(avgResponseTime),
    total_tokens: totalTokens,
    time_range: timeRange,
    logs: usageLogs.slice(0, 100)
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateAPIKey(): string {
  const prefix = 'uk_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = prefix;
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function hashAPIKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
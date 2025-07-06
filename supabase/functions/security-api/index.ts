import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
};

interface SecurityAPIRequest {
  action: 'endpoints' | 'threats' | 'alerts' | 'workflows' | 'compliance' | 'stats';
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  filters?: {
    severity?: string[];
    date_from?: string;
    date_to?: string;
    hostnames?: string[];
    limit?: number;
    offset?: number;
  };
}

// Rate limiting cache
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(apiKey: string, limit: number): boolean {
  const now = Date.now();
  const hour = Math.floor(now / (1000 * 60 * 60));
  const key = `${apiKey}:${hour}`;
  
  const current = rateLimitCache.get(key) || { count: 0, resetTime: (hour + 1) * (1000 * 60 * 60) };
  
  if (now > current.resetTime) {
    current.count = 0;
    current.resetTime = (hour + 1) * (1000 * 60 * 60);
  }
  
  if (current.count >= limit) {
    return false;
  }
  
  current.count++;
  rateLimitCache.set(key, current);
  return true;
}

async function validateApiKey(apiKeyHeader: string, supabase: any) {
  if (!apiKeyHeader) {
    throw new Error('API key required');
  }

  const [prefix, hash] = apiKeyHeader.split('.');
  if (!prefix || !hash) {
    throw new Error('Invalid API key format');
  }

  const { data: apiKey, error } = await supabase
    .from('security_api_keys')
    .select('*')
    .eq('key_prefix', prefix)
    .eq('key_hash', hash)
    .eq('is_active', true)
    .single();

  if (error || !apiKey) {
    throw new Error('Invalid or inactive API key');
  }

  if (apiKey.expires_at && new Date(apiKey.expires_at) < new Date()) {
    throw new Error('API key expired');
  }

  // Check rate limit
  if (!checkRateLimit(apiKey.id, apiKey.rate_limit_per_hour)) {
    throw new Error('Rate limit exceeded');
  }

  // Update usage
  await supabase
    .from('security_api_keys')
    .update({ 
      last_used_at: new Date().toISOString(),
      usage_count: apiKey.usage_count + 1
    })
    .eq('id', apiKey.id);

  return apiKey;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const apiKeyHeader = req.headers.get('x-api-key');
    const apiKey = await validateApiKey(apiKeyHeader || '', supabase);

    const { action, method = 'GET', data, filters } = await req.json().catch(() => ({}));
    
    // Check permissions
    const hasReadPermission = apiKey.permissions.read;
    const hasWritePermission = apiKey.permissions.write;
    const hasAdminPermission = apiKey.permissions.admin;

    if ((method === 'GET' && !hasReadPermission) || 
        (['POST', 'PUT', 'DELETE'].includes(method) && !hasWritePermission)) {
      throw new Error('Insufficient permissions');
    }

    let response;

    switch (action) {
      case 'endpoints':
        if (method === 'GET') {
          const { data: endpoints, error } = await supabase
            .from('safe_shield_endpoints')
            .select(`
              *,
              msp_client_endpoints(client_name, location, sla_tier)
            `)
            .eq('user_id', apiKey.user_id)
            .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 50) - 1);

          if (error) throw error;
          response = { endpoints, total: endpoints?.length || 0 };
        }
        break;

      case 'threats':
        if (method === 'GET') {
          let query = supabase
            .from('safe_shield_threats')
            .select('*')
            .eq('user_id', apiKey.user_id);

          if (filters?.severity?.length) {
            query = query.in('severity', filters.severity);
          }
          if (filters?.date_from) {
            query = query.gte('detected_at', filters.date_from);
          }
          if (filters?.date_to) {
            query = query.lte('detected_at', filters.date_to);
          }
          if (filters?.hostnames?.length) {
            query = query.in('hostname', filters.hostnames);
          }

          const { data: threats, error } = await query
            .order('detected_at', { ascending: false })
            .range(filters?.offset || 0, (filters?.offset || 0) + (filters?.limit || 100) - 1);

          if (error) throw error;
          response = { threats, total: threats?.length || 0 };
        }
        break;

      case 'alerts':
        if (method === 'POST' && hasWritePermission) {
          // External system creating alert
          const alertData = {
            user_id: apiKey.user_id,
            title: data.title,
            description: data.description,
            severity: data.severity || 'medium',
            source: 'external_api',
            metadata: { api_key_id: apiKey.id, source_system: data.source_system }
          };

          const { data: alert, error } = await supabase
            .from('security_events')
            .insert(alertData)
            .select()
            .single();

          if (error) throw error;
          response = { alert, message: 'Alert created successfully' };
        }
        break;

      case 'workflows':
        if (method === 'GET') {
          const { data: workflows, error } = await supabase
            .from('response_workflows')
            .select('*')
            .eq('user_id', apiKey.user_id)
            .eq('is_active', true);

          if (error) throw error;
          response = { workflows };
        } else if (method === 'POST' && hasAdminPermission) {
          const workflowData = {
            user_id: apiKey.user_id,
            msp_org_id: apiKey.msp_org_id,
            name: data.name,
            description: data.description,
            trigger_conditions: data.trigger_conditions,
            actions: data.actions,
            created_by: apiKey.user_id
          };

          const { data: workflow, error } = await supabase
            .from('response_workflows')
            .insert(workflowData)
            .select()
            .single();

          if (error) throw error;
          response = { workflow, message: 'Workflow created successfully' };
        }
        break;

      case 'compliance':
        if (method === 'GET') {
          const { data: compliance, error } = await supabase
            .from('compliance_status')
            .select(`
              *,
              compliance_frameworks(framework_name, version, description)
            `)
            .eq('user_id', apiKey.user_id);

          if (error) throw error;
          response = { compliance };
        }
        break;

      case 'stats':
        if (method === 'GET') {
          const [
            { data: endpoints },
            { data: threats },
            { data: criticalThreats }
          ] = await Promise.all([
            supabase
              .from('safe_shield_endpoints')
              .select('status')
              .eq('user_id', apiKey.user_id),
            supabase
              .from('safe_shield_threats')
              .select('severity, detected_at')
              .eq('user_id', apiKey.user_id)
              .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
            supabase
              .from('safe_shield_threats')
              .select('id')
              .eq('user_id', apiKey.user_id)
              .eq('severity', 'critical')
              .gte('detected_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          ]);

          response = {
            stats: {
              endpoints: {
                total: endpoints?.length || 0,
                online: endpoints?.filter(e => e.status === 'online').length || 0,
                isolated: endpoints?.filter(e => e.status === 'isolated').length || 0
              },
              threats: {
                last_24h: threats?.length || 0,
                critical_24h: criticalThreats?.length || 0,
                by_severity: {
                  critical: threats?.filter(t => t.severity === 'critical').length || 0,
                  high: threats?.filter(t => t.severity === 'high').length || 0,
                  medium: threats?.filter(t => t.severity === 'medium').length || 0,
                  low: threats?.filter(t => t.severity === 'low').length || 0
                }
              },
              api_usage: {
                requests_today: apiKey.usage_count,
                rate_limit: apiKey.rate_limit_per_hour,
                last_used: apiKey.last_used_at
              }
            }
          };
        }
        break;

      default:
        throw new Error(`Unsupported action: ${action}`);
    }

    // Trigger webhook if configured
    if (apiKey.webhook_url && ['POST', 'PUT', 'DELETE'].includes(method)) {
      try {
        await fetch(apiKey.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `${action}.${method.toLowerCase()}`,
            data: response,
            timestamp: new Date().toISOString(),
            api_key_id: apiKey.id
          })
        });
      } catch (webhookError) {
        console.error('Webhook delivery failed:', webhookError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: response,
      meta: {
        timestamp: new Date().toISOString(),
        api_version: '1.0',
        rate_limit_remaining: apiKey.rate_limit_per_hour - (rateLimitCache.get(`${apiKey.id}:${Math.floor(Date.now() / (1000 * 60 * 60))}`)?.count || 0)
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Security API error:', error);
    
    const status = error.message.includes('key') ? 401 :
                  error.message.includes('permission') ? 403 :
                  error.message.includes('rate limit') ? 429 : 500;

    return new Response(JSON.stringify({ 
      error: error.message,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
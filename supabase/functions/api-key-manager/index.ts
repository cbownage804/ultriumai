import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateApiKeyRequest {
  action: 'create' | 'regenerate';
  id?: string;
  user_id: string;
  name?: string;
  gpt_id?: string;
  permissions?: {
    chat: boolean;
    analytics: boolean;
  };
  rate_limit_rpm?: number;
  rate_limit_rpd?: number;
  expires_at?: string;
}

const generateApiKey = (): { key: string; hash: string; prefix: string } => {
  // Generate a random API key
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const key = `sk-proj_${Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')}`;
  
  // Create hash for storage (in production, use proper hashing like bcrypt)
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  return crypto.subtle.digest('SHA-256', data).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const prefix = key.substring(0, 12) + '...';
    
    return { key, hash, prefix };
  });
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CreateApiKeyRequest = await req.json();
    const { action, user_id } = requestData;

    if (action === 'create') {
      const { key, hash, prefix } = await generateApiKey();
      
      const { data, error } = await supabase
        .from('api_keys')
        .insert({
          user_id,
          gpt_id: requestData.gpt_id || null,
          name: requestData.name || 'API Key',
          key_hash: hash,
          key_prefix: prefix,
          permissions: requestData.permissions || { chat: true, analytics: false },
          rate_limit_rpm: requestData.rate_limit_rpm || 60,
          rate_limit_rpd: requestData.rate_limit_rpd || 1000,
          expires_at: requestData.expires_at || null,
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        key, 
        api_key: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'regenerate' && requestData.id) {
      const { key, hash, prefix } = await generateApiKey();
      
      const { data, error } = await supabase
        .from('api_keys')
        .update({
          key_hash: hash,
          key_prefix: prefix,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestData.id)
        .eq('user_id', user_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        key, 
        api_key: data 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in api-key-manager function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
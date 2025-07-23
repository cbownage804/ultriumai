import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    console.log('🔍 Agent check-in received:', {
      ...body,
      agent_token: body.agent_token ? `${body.agent_token.substring(0, 15)}...` : 'missing'
    });

    const { connector_key, client_code, system_info, agent_version, device_id } = body;

    if (!connector_key && !client_code) {
      return new Response(JSON.stringify({ error: 'connector_key or client_code required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use the upsert helper function to get/create device
    const { data: deviceId, error: upsertError } = await supabase.rpc(
      'upsert_device_from_checkin',
      {
        p_connector_key: connector_key || '',
        p_client_code: client_code || '',
        p_system_info: system_info || {},
        p_agent_version: agent_version || 'unknown'
      }
    );

    if (upsertError) {
      console.error('❌ Device upsert failed:', upsertError);
      return new Response(JSON.stringify({ error: 'Device registration failed', details: upsertError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Device upserted:', deviceId);

    // Log the checkin event
    const { error: checkinError } = await supabase
      .from('device_checkins')
      .insert({
        device_id: deviceId,
        payload: {
          system_info: system_info || {},
          agent_version: agent_version,
          timestamp: new Date().toISOString()
        }
      });

    if (checkinError) {
      console.error('❌ Checkin logging failed:', checkinError);
      // Don't fail the request for logging issues
    }

    // Count queued commands for this device
    const { count: queuedCommands } = await supabase
      .from('device_commands')
      .select('*', { count: 'exact', head: true })
      .eq('device_id', deviceId)
      .eq('status', 'queued');

    console.log('🎉 Agent check-in processed successfully for device:', deviceId);

    return new Response(JSON.stringify({
      success: true,
      device_id: deviceId,
      queued_command_count: queuedCommands || 0,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Agent checkin error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
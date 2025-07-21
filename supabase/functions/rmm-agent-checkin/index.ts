import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      connector_key,
      agent_token = connector_key, // Support both parameter names
      hostname, 
      ip_address, 
      agent_version,
      system_info,
      performance_metrics,
      installed_software,
      security_status,
      status,
      last_scan
    } = await req.json();

    console.log('Agent check-in received:', { 
      agent_token: agent_token?.substring(0, 20) + '...', 
      hostname, 
      ip_address 
    });

    // Validate agent token and get user info
    const { data: connectorData, error: connectorError } = await supabase
      .from('safenet_connectors')
      .select('id, user_id')
      .eq('connector_key', agent_token)
      .eq('status', 'active')
      .single();

    if (connectorError || !connectorData) {
      throw new Error('Invalid or inactive agent token');
    }

    // Find the device by IP address and user
    const { data: deviceData, error: deviceError } = await supabase
      .from('safenet_devices')
      .select('id')
      .eq('user_id', connectorData.user_id)
      .eq('ip_address', ip_address)
      .single();

    if (deviceError || !deviceData) {
      throw new Error('Device not found or not registered');
    }

    // Update device as managed and online
    await supabase
      .from('safenet_devices')
      .update({
        is_managed: true,
        status: 'online',
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceData.id);

    // Insert or update agent check-in
    const { data: existingCheckin } = await supabase
      .from('rmm_agent_checkins')
      .select('id')
      .eq('device_id', deviceData.id)
      .single();

    if (existingCheckin) {
      // Update existing check-in
      await supabase
        .from('rmm_agent_checkins')
        .update({
          agent_version,
          system_info: system_info || {},
          performance_metrics: performance_metrics || {},
          installed_software: installed_software || [],
          security_status: security_status || {},
          last_checkin: new Date().toISOString()
        })
        .eq('id', existingCheckin.id);
    } else {
      // Create new check-in record
      await supabase
        .from('rmm_agent_checkins')
        .insert({
          user_id: connectorData.user_id,
          device_id: deviceData.id,
          agent_token,
          hostname,
          ip_address,
          agent_version,
          system_info: system_info || {},
          performance_metrics: performance_metrics || {},
          installed_software: installed_software || [],
          security_status: security_status || {}
        });
    }

    console.log('Agent check-in processed successfully for device:', deviceData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Check-in received successfully',
        device_id: deviceData.id,
        next_checkin: 300 // Check in every 5 minutes
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Agent check-in error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process agent check-in' 
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

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

    const requestBody = await req.json();
    const { 
      connector_key,
      agent_token = connector_key, // Support both parameter names
      hostname: directHostname, 
      ip_address: directIpAddress, 
      agent_version = '1.0.0',
      system_info = {},
      performance_metrics = {},
      installed_software = [],
      security_status = {},
      status = 'online',
      last_scan
    } = requestBody;

    // Extract hostname and IP from direct fields or system_info fallback
    const hostname = directHostname || system_info?.hostname || 'Unknown';
    const ip_address = directIpAddress || system_info?.ip_address || '127.0.0.1';

    console.log('🔍 Agent check-in received:', { 
      agent_token: agent_token?.substring(0, 20) + '...', 
      hostname, 
      ip_address,
      agent_version,
      system_info_keys: Object.keys(system_info)
    });

    // Validate agent token and get user info
    const { data: connectorData, error: connectorError } = await supabase
      .from('safenet_connectors')
      .select('id, user_id')
      .eq('connector_key', agent_token)
      .eq('status', 'active')
      .single();

    if (connectorError || !connectorData) {
      console.error('❌ Invalid connector:', connectorError);
      throw new Error('Invalid or inactive agent token');
    }

    console.log('✅ Connector validated:', connectorData.id);

    // Find or create device record
    let deviceData;
    const { data: existingDevice, error: deviceError } = await supabase
      .from('safenet_devices')
      .select('id, is_managed, status')
      .eq('user_id', connectorData.user_id)
      .eq('ip_address', ip_address)
      .single();

    if (deviceError || !existingDevice) {
      console.log('📝 Creating new device record for:', hostname, ip_address);
      
      // Auto-register new device
      const { data: newDevice, error: createError } = await supabase
        .from('safenet_devices')
        .insert({
          user_id: connectorData.user_id,
          connector_key: agent_token,
          ip_address,
          hostname,
          device_name: `${hostname} Workstation`,
          device_type: 'workstation',
          status: 'online',
          is_managed: true,
          network_segment: 'local',
          discovery_method: ['agent_checkin'],
          last_seen_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Failed to create device:', createError);
        throw new Error('Failed to register device');
      }

      deviceData = newDevice;
      console.log('✅ Device auto-registered:', deviceData.id);
    } else {
      deviceData = existingDevice;
      console.log('✅ Using existing device:', deviceData.id);
    }

    // Update device as managed and online
    const { error: updateError } = await supabase
      .from('safenet_devices')
      .update({
        is_managed: true,
        status: 'online',
        hostname: hostname, // Update hostname in case it changed
        connector_key: agent_token,
        last_seen_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', deviceData.id);

    if (updateError) {
      console.error('❌ Failed to update device:', updateError);
      throw new Error('Failed to update device status');
    }

    // Insert or update agent check-in record in rmm_agent_checkins table
    const { data: existingCheckin } = await supabase
      .from('rmm_agent_checkins')
      .select('id')
      .eq('device_id', deviceData.id)
      .single();

    if (existingCheckin) {
      // Update existing check-in
      const { error: updateCheckinError } = await supabase
        .from('rmm_agent_checkins')
        .update({
          agent_version,
          system_info,
          performance_metrics,
          installed_software,
          security_status,
          last_checkin: new Date().toISOString()
        })
        .eq('id', existingCheckin.id);

      if (updateCheckinError) {
        console.error('⚠️ Failed to update check-in record:', updateCheckinError);
        // Don't fail the whole request for this
      }
    } else {
      // Create new check-in record
      const { error: insertCheckinError } = await supabase
        .from('rmm_agent_checkins')
        .insert({
          user_id: connectorData.user_id,
          device_id: deviceData.id,
          agent_token,
          hostname,
          ip_address,
          agent_version,
          system_info,
          performance_metrics,
          installed_software,
          security_status,
          last_checkin: new Date().toISOString()
        });

      if (insertCheckinError) {
        console.error('⚠️ Failed to create check-in record:', insertCheckinError);
        // Don't fail the whole request for this
      }
    }

    console.log('🎉 Agent check-in processed successfully for device:', deviceData.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Check-in received successfully',
        device_id: deviceData.id,
        is_managed: true,
        status: 'online',
        next_checkin: 300, // Check in every 5 minutes
        hostname: hostname,
        ip_address: ip_address
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('💥 Agent check-in error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process agent check-in',
        success: false
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

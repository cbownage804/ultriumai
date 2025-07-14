import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connector-key',
}

interface ConnectorAuthRequest {
  connector_key: string;
  connector_name: string;
  client_name?: string;
  version?: string;
  system_info?: any;
  network_info?: any;
}

interface ScanDataRequest {
  connector_key: string;
  scan_type: string;
  network_ranges: string[];
  devices_found: number;
  scan_duration: number;
  hostname: string;
  results: any;
  devices?: Array<{
    ip_address: string;
    hostname: string;
    device_type: string;
    mac_address?: string;
    os_info?: string;
    open_ports?: number[];
    services?: any[];
    vulnerabilities?: string[];
    risk_level: string;
    status: string;
    network_range: string;
  }>;
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
    );

    const url = new URL(req.url);
    const path = url.pathname;

    // Register/Authenticate Connector
    if (path === '/register' && req.method === 'POST') {
      const { connector_key, connector_name, client_name, version, system_info, network_info }: ConnectorAuthRequest = await req.json();

      if (!connector_key || !connector_name) {
        return new Response(
          JSON.stringify({ error: 'connector_key and connector_name are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the connector key exists and get user info
      const { data: connectorData, error: validateError } = await supabase
        .rpc('validate_connector_key', { p_connector_key: connector_key });

      if (validateError || !connectorData || connectorData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid connector key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connector = connectorData[0];

      // Update connector with registration details
      const { error: updateError } = await supabase
        .from('safenet_connectors')
        .update({
          status: 'active',
          client_name,
          version,
          system_info,
          network_info,
          last_heartbeat: new Date().toISOString()
        })
        .eq('id', connector.connector_id);

      if (updateError) {
        console.error('Error updating connector:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to register connector' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          connector_id: connector.connector_id,
          message: 'Connector registered successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send Scan Data
    else if (path === '/scan-data' && req.method === 'POST') {
      const scanData: ScanDataRequest = await req.json();

      if (!scanData.connector_key) {
        return new Response(
          JSON.stringify({ error: 'connector_key is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate the connector key
      const { data: connectorData, error: validateError } = await supabase
        .rpc('validate_connector_key', { p_connector_key: scanData.connector_key });

      if (validateError || !connectorData || connectorData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid connector key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connector = connectorData[0];

      // Insert scan data
      const { data: scanResult, error: scanError } = await supabase
        .from('network_scans')
        .insert({
          user_id: connector.user_id,
          connector_id: connector.connector_id,
          scan_type: scanData.scan_type,
          network_ranges: scanData.network_ranges,
          devices_found: scanData.devices_found,
          scan_duration: scanData.scan_duration,
          scanned_at: new Date().toISOString(),
          hostname: scanData.hostname,
          results: scanData.results
        })
        .select()
        .single();

      if (scanError) {
        console.error('Error inserting scan data:', scanError);
        return new Response(
          JSON.stringify({ error: 'Failed to save scan data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert device data if provided
      if (scanData.devices && scanData.devices.length > 0) {
        const deviceInserts = scanData.devices.map(device => ({
          user_id: connector.user_id,
          connector_id: connector.connector_id,
          scan_id: scanResult.id,
          ip_address: device.ip_address,
          hostname: device.hostname,
          device_type: device.device_type,
          mac_address: device.mac_address,
          os_info: device.os_info,
          open_ports: device.open_ports || [],
          services: device.services || [],
          vulnerabilities: device.vulnerabilities || [],
          risk_level: device.risk_level,
          last_seen: new Date().toISOString(),
          status: device.status,
          network_range: device.network_range
        }));

        const { error: deviceError } = await supabase
          .from('network_devices')
          .upsert(deviceInserts, { 
            onConflict: 'ip_address,user_id',
            ignoreDuplicates: false 
          });

        if (deviceError) {
          console.error('Error inserting device data:', deviceError);
          // Don't fail the entire request for device insertion errors
        }
      }

      // Update connector heartbeat
      await supabase
        .from('safenet_connectors')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', connector.connector_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          scan_id: scanResult.id,
          message: 'Scan data saved successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Heartbeat endpoint
    else if (path === '/heartbeat' && req.method === 'POST') {
      const { connector_key } = await req.json();

      if (!connector_key) {
        return new Response(
          JSON.stringify({ error: 'connector_key is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate and update heartbeat
      const { data: connectorData, error: validateError } = await supabase
        .rpc('validate_connector_key', { p_connector_key: connector_key });

      if (validateError || !connectorData || connectorData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid connector key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connector = connectorData[0];

      await supabase
        .from('safenet_connectors')
        .update({ last_heartbeat: new Date().toISOString() })
        .eq('id', connector.connector_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Heartbeat updated' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SafeNet API Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
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
    hostname?: string;
    device_name?: string;
    manufacturer?: string;
    model?: string;
    serial_number?: string;
    os_family?: string;
    os_version?: string;
    device_type?: string;
    device_role?: string;
    mac_address?: string;
    uptime_hours?: number;
    cpu_usage?: number;
    memory_usage?: number;
    is_managed?: boolean;
    is_critical?: boolean;
    network_segment?: string;
    open_ports?: number[];
    services?: any[];
    installed_software?: string[];
    hardware_info?: any;
    performance_metrics?: any;
    vulnerabilities?: string[];
    risk_level: string;
    status: string;
    discovery_method?: string[];
    device_metadata?: any;
  }>;
}

serve(async (req) => {
  console.log(`SafeNet API called: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Returning CORS headers for OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const fullPath = url.pathname;
    // Extract the endpoint path (everything after the function name)
    const path = fullPath.split('/').pop() || fullPath;

    // Register/Authenticate Connector
    if (path === 'register' && req.method === 'POST') {
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
    else if (path === 'scan-data' && req.method === 'POST') {
      try {
        console.log('Starting scan-data endpoint');
        const scanData: ScanDataRequest = await req.json();
        console.log('Received scan data:', JSON.stringify(scanData, null, 2));

        if (!scanData.connector_key) {
          console.log('Missing connector_key');
          return new Response(
            JSON.stringify({ error: 'connector_key is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate the connector key
        console.log('Validating connector key:', scanData.connector_key);
        const { data: connectorData, error: validateError } = await supabase
          .rpc('validate_connector_key', { p_connector_key: scanData.connector_key });

        console.log('Connector validation result:', { connectorData, validateError });

        if (validateError || !connectorData || connectorData.length === 0) {
          console.error('Connector validation failed:', validateError);
          return new Response(
            JSON.stringify({ error: 'Invalid connector key' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const connector = connectorData[0];
        console.log('Using connector:', connector);

        // Insert scan data using service role to bypass RLS
        console.log('About to insert scan data with:', {
          user_id: connector.user_id,
          connector_id: connector.connector_id,
          scan_type: scanData.scan_type,
          network_ranges: scanData.network_ranges,
          devices_found: scanData.devices_found,
          scan_duration: scanData.scan_duration,
          hostname: scanData.hostname
        });
        
        const { data: scanResult, error: scanError } = await supabase
          .from('network_scans')
          .insert({
            user_id: connector.user_id,
            connector_id: connector.connector_id,
            target_ip: scanData.network_ranges[0] || 'unknown',
            scan_type: scanData.scan_type,
            scan_status: 'completed', // Mark as completed immediately
            network_ranges: scanData.network_ranges,
            devices_found: scanData.devices_found,
            scan_duration: scanData.scan_duration,
            scanned_at: new Date().toISOString(),
            completed_at: new Date().toISOString(), // Add completion time
            hostname: scanData.hostname,
            results: scanData.results,
            vulnerabilities_found: 0,
            risk_score: 0
          })
          .select()
          .single();

        if (scanError) {
          console.error('Detailed error inserting scan data:', JSON.stringify(scanError, null, 2));
          console.error('Data being inserted:', JSON.stringify({
            user_id: connector.user_id,
            connector_id: connector.connector_id,
            target_ip: scanData.network_ranges[0] || 'unknown',
            scan_type: scanData.scan_type,
            network_ranges: scanData.network_ranges,
            devices_found: scanData.devices_found,
            scan_duration: scanData.scan_duration,
            hostname: scanData.hostname
          }, null, 2));
          return new Response(
            JSON.stringify({ error: 'Failed to save scan data', details: scanError }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Insert device data if provided
        if (scanData.devices && scanData.devices.length > 0) {
          console.log(`Processing ${scanData.devices.length} discovered devices`);
          
          const deviceInserts = scanData.devices.map(device => ({
            user_id: connector.user_id,
            connector_key: scanData.connector_key,
            ip_address: device.ip_address,
            hostname: device.hostname,
            device_name: device.device_name,
            manufacturer: device.manufacturer,
            model: device.model,
            os_family: device.os_family,
            os_version: device.os_version,
            device_type: device.device_type,
            device_role: device.device_role,
            mac_address: device.mac_address,
            uptime_hours: device.uptime_hours,
            cpu_usage: device.cpu_usage,
            memory_usage: device.memory_usage,
            is_managed: device.is_managed || false,
            is_critical: device.is_critical || false,
            network_segment: device.network_segment || 'unknown',
            vulnerability_count: device.vulnerabilities?.length || 0,
            security_patches_needed: 0,
            discovery_method: device.discovery_method || ['network_scan'],
            device_metadata: device.device_metadata || {},
            status: device.status,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }));

          const { error: deviceError } = await supabase
            .from('safenet_devices')
            .upsert(deviceInserts, { 
              onConflict: 'ip_address,user_id' // Now this constraint exists
            });

          if (deviceError) {
            console.error('Error inserting device data:', deviceError);
            // Don't fail the entire request for device insertion errors
          } else {
            console.log('Device data saved successfully');

            // Automatically trigger enhanced discovery for each device
            console.log('Starting enhanced discovery for all discovered devices');
            const enhancedDiscoveryPromises = scanData.devices.map(async (device: any) => {
              try {
                console.log(`Triggering enhanced discovery for device: ${device.ip_address}`);
                console.log('Enhanced discovery payload:', {
                  connector_key: scanData.connector_key,
                  target_ip: device.ip_address,
                  discovery_methods: ['snmp', 'wmi', 'ssh', 'nmap']
                });
                
                // Call the enhanced discovery function
                const enhancedResponse = await supabase.functions.invoke('safenet-enhanced-discovery', {
                  body: {
                    connector_key: scanData.connector_key,
                    target_ip: device.ip_address,
                    discovery_methods: ['snmp', 'wmi', 'ssh', 'nmap'], // Use all available methods
                    credentials: {
                      snmp_community: 'public', // Default SNMP community
                      // Add other default credentials or get from connector config
                    }
                  }
                });

                if (enhancedResponse.error) {
                  console.error(`Enhanced discovery failed for ${device.ip_address}:`, enhancedResponse.error);
                } else {
                  console.log(`Enhanced discovery completed for ${device.ip_address}:`, enhancedResponse.data);
                }
              } catch (error) {
                console.error(`Error in enhanced discovery for ${device.ip_address}:`, error);
                console.error('Full error details:', JSON.stringify(error, null, 2));
              }
            });

            // Run enhanced discovery in background (don't wait for completion)
            Promise.allSettled(enhancedDiscoveryPromises).then((results) => {
              const successful = results.filter(r => r.status === 'fulfilled').length;
              const failed = results.filter(r => r.status === 'rejected').length;
              console.log(`Enhanced discovery completed: ${successful} successful, ${failed} failed`);
            });
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
      } catch (error) {
        console.error('Scan data error:', error);
        return new Response(
          JSON.stringify({ error: 'Internal server error in scan-data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Heartbeat endpoint
    else if (path === 'heartbeat' && req.method === 'POST') {
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
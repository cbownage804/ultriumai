import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ultrium-key',
};

interface ConnectorScanResult {
  scan_type: string;
  timestamp: string;
  hostname: string;
  networks_scanned: number;
  total_devices: number;
  scan_duration: number;
  results: Array<{
    network_range: string;
    devices_found: number;
    devices: Array<{
      ip_address: string;
      hostname: string;
      device_type: string;
      mac_address?: string;
      os_info: string;
      open_ports: number[];
      services: Array<{
        port: number;
        protocol: string;
        service: string;
        version: string;
        product: string;
      }>;
      vulnerabilities: string[];
      risk_level: string;
      last_seen: string;
      status: string;
    }>;
  }>;
}

function validateApiKey(headers: Headers): string | null {
  const apiKey = headers.get('x-ultrium-key') || headers.get('authorization')?.replace('Bearer ', '');
  
  // In production, validate against stored API keys
  const validKey = Deno.env.get('ULTRIUM_AGENT_KEY');
  
  if (!apiKey || !validKey) {
    return null;
  }
  
  return apiKey === validKey ? apiKey : null;
}

async function processConnectorScan(scanData: ConnectorScanResult, userId?: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    // Store network scan results
    const scanResult = {
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Use system user if no user_id
      scan_type: scanData.scan_type,
      network_ranges: scanData.results.map(r => r.network_range),
      devices_found: scanData.total_devices,
      scan_duration: scanData.scan_duration,
      scanned_at: scanData.timestamp,
      hostname: scanData.hostname,
      results: scanData,
    };

    const { data: scan, error: scanError } = await supabase
      .from('network_scans')
      .insert(scanResult)
      .select()
      .single();

    if (scanError) {
      console.error('Error storing scan result:', scanError);
      throw scanError;
    }

    // Process each device found
    for (const networkResult of scanData.results) {
      for (const device of networkResult.devices) {
        // Store/update device in network inventory
        const deviceData = {
          ip_address: device.ip_address,
          hostname: device.hostname,
          device_type: device.device_type,
          mac_address: device.mac_address,
          os_info: device.os_info,
          open_ports: device.open_ports,
          services: device.services,
          vulnerabilities: device.vulnerabilities,
          risk_level: device.risk_level,
          last_seen: device.last_seen,
          status: device.status,
          network_range: networkResult.network_range,
          scan_id: scan.id,
          user_id: userId,
        };

        // Upsert device (insert or update if exists)
        const { error: deviceError } = await supabase
          .from('network_devices')
          .upsert(deviceData, {
            onConflict: 'ip_address,user_id',
            ignoreDuplicates: false
          });

        if (deviceError) {
          console.error('Error storing device:', deviceError);
        }

        // Create security events for high/critical risk devices
        if (device.risk_level === 'high' || device.risk_level === 'critical') {
          const eventData = {
            user_id: userId,
            title: `${device.risk_level.toUpperCase()} Risk Device Detected`,
            description: `Device ${device.hostname} (${device.ip_address}) has ${device.risk_level} risk level with vulnerabilities: ${device.vulnerabilities.join(', ')}`,
            severity: device.risk_level === 'critical' ? 'critical' : 'high',
            event_type: 'network_security',
            source: 'safenet_connector',
            affected_assets: [device.hostname],
            metadata: {
              device,
              scan_id: scan.id,
              connector_hostname: scanData.hostname,
            },
          };

          const { error: eventError } = await supabase
            .from('security_events')
            .insert(eventData);

          if (eventError) {
            console.error('Error creating security event:', eventError);
          }
        }
      }
    }

    // Log analytics
    await supabase.from('gpt_analytics').insert({
      user_id: userId,
      gpt_id: 'safenet-connector',
      interaction_type: 'network_scan',
      metadata: {
        scan_type: scanData.scan_type,
        networks_scanned: scanData.networks_scanned,
        devices_found: scanData.total_devices,
        scan_duration: scanData.scan_duration,
        hostname: scanData.hostname,
        vulnerabilities_found: scanData.results.reduce((sum, r) => 
          sum + r.devices.reduce((deviceSum, d) => deviceSum + d.vulnerabilities.length, 0), 0
        ),
      },
    });

    return { success: true, scan_id: scan.id };

  } catch (error) {
    console.error('Error processing connector scan:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate API key
    const apiKey = validateApiKey(req.headers);
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing API key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scanData: ConnectorScanResult = await req.json();
    
    if (!scanData.scan_type || !scanData.results) {
      return new Response(
        JSON.stringify({ error: 'Invalid scan data format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing ${scanData.scan_type} scan from ${scanData.hostname}`);
    console.log(`Found ${scanData.total_devices} devices across ${scanData.networks_scanned} networks`);

    // Process the scan data
    const result = await processConnectorScan(scanData);

    const response = {
      success: true,
      message: 'Scan data processed successfully',
      scan_id: result.scan_id,
      devices_processed: scanData.total_devices,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in safenet-connector function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
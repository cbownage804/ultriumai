import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-ultrium-key',
};

interface ConnectorScanData {
  connector_key: string;
  scan_timestamp: string;
  network_ranges: string[];
  devices: Array<{
    ip: string;
    hostname: string;
    mac: string;
    os: string;
    ports: number[];
    vulnerabilities: string[];
    risk_level: string;
  }>;
  network_info: {
    interfaces: number;
    subnets: string[];
    gateway: string;
  };
  system_info: {
    os: string;
    cpu: string;
    memory: string;
    diskSpace: string;
  };
  connector_version: string;
}

async function validateConnectorKey(connectorKey: string): Promise<{ isValid: boolean; userId?: string; connectorId?: string }> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { data, error } = await supabase
      .from('safenet_connectors')
      .select('id, user_id, status')
      .eq('connector_key', connectorKey)
      .single();

    if (error || !data) {
      console.error('Connector validation error:', error);
      return { isValid: false };
    }

    return { 
      isValid: true, 
      userId: data.user_id,
      connectorId: data.id
    };
  } catch (error) {
    console.error('Error validating connector key:', error);
    return { isValid: false };
  }
}

async function processConnectorScan(scanData: ConnectorScanData, userId: string, connectorId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  console.log(`Starting scan processing for connector ${connectorId}`);

  try {
    // Update connector status and system info first
    console.log('Updating connector status...');
    const { error: updateError } = await supabase
      .from('safenet_connectors')
      .update({
        status: 'active',
        last_heartbeat: new Date().toISOString(),
        system_info: scanData.system_info || {},
        network_info: scanData.network_info || {},
        version: scanData.connector_version || '2.1.4'
      })
      .eq('id', connectorId);

    if (updateError) {
      console.error('Error updating connector:', updateError);
      throw updateError;
    }

    // Store network scan results
    console.log('Storing scan results...');
    const scanResult = {
      user_id: userId,
      connector_id: connectorId,
      scan_type: 'network_discovery',
      network_ranges: scanData.network_ranges || [],
      devices_found: scanData.devices?.length || 0,
      scan_duration: 300, // Approximate duration
      scanned_at: scanData.scan_timestamp || new Date().toISOString(),
      results: {
        summary: {
          networks_scanned: scanData.network_ranges?.length || 0,
          devices_found: scanData.devices?.length || 0,
          total_ports: scanData.devices?.reduce((sum, d) => sum + (d.ports?.length || 0), 0) || 0
        },
        devices: scanData.devices || []
      },
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

    console.log(`Scan stored with ID: ${scan.id}`);
    
    // For now, just store the basic scan - device processing can be done later to avoid timeouts
    // This ensures we get a quick response back to the connector
    
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
    console.log('Request received, processing...');
    
    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Parsing request body...');
    const scanData: ConnectorScanData = await req.json();
    console.log('Devices found:', scanData.devices?.length || 0);
    
    // Get connector key from either JSON body or Authorization header
    let connectorKey = scanData.connector_key;
    if (!connectorKey) {
      const authHeader = req.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        connectorKey = authHeader.substring(7);
      }
    }
    
    if (!connectorKey || !scanData.devices) {
      console.log('Missing connector key or devices');
      return new Response(
        JSON.stringify({ error: 'Invalid scan data format - missing connector_key or devices' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Validating connector key...');
    // Validate connector key
    const validation = await validateConnectorKey(connectorKey);
    if (!validation.isValid || !validation.userId || !validation.connectorId) {
      console.log('Invalid connector key validation');
      return new Response(
        JSON.stringify({ error: 'Invalid connector key' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Processing scan from connector ${validation.connectorId}`);
    console.log(`Found ${scanData.devices.length} devices across ${scanData.network_ranges.length} networks`);

    // Process the scan data
    const result = await processConnectorScan(scanData, validation.userId, validation.connectorId);

    const response = {
      success: true,
      message: 'Scan data processed successfully',
      scan_id: result.scan_id,
      devices_processed: scanData.devices.length,
      timestamp: new Date().toISOString(),
    };

    console.log('Scan processed successfully, returning response');
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
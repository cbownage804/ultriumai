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

  try {
    // Update connector status and system info
    await supabase
      .from('safenet_connectors')
      .update({
        status: 'active',
        last_heartbeat: new Date().toISOString(),
        system_info: scanData.system_info,
        network_info: scanData.network_info,
        version: scanData.connector_version
      })
      .eq('id', connectorId);

    // Store network scan results
    const scanResult = {
      user_id: userId,
      connector_id: connectorId,
      scan_type: 'network_discovery',
      network_ranges: scanData.network_ranges,
      devices_found: scanData.devices.length,
      scan_duration: 300, // Approximate duration
      scanned_at: scanData.scan_timestamp,
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
    for (const device of scanData.devices) {
      // Store/update device in safenet_devices table
      const deviceData = {
        connector_id: connectorId,
        user_id: userId,
        ip_address: device.ip,
        hostname: device.hostname || 'Unknown',
        mac_address: device.mac || 'Unknown',
        os_detected: device.os || 'Unknown',
        device_type: 'unknown', // Will be determined by ML later
        open_ports: device.ports || [],
        risk_level: device.risk_level || 'low',
        last_seen: new Date().toISOString(),
        first_discovered: new Date().toISOString(),
        status: 'active'
      };

      // Upsert device (insert or update if exists)
      const { data: deviceRecord, error: deviceError } = await supabase
        .from('safenet_devices')
        .upsert(deviceData, {
          onConflict: 'ip_address,connector_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (deviceError) {
        console.error('Error storing device:', deviceError);
        continue;
      }

      // Store vulnerabilities if any
      if (device.vulnerabilities && device.vulnerabilities.length > 0) {
        for (const vuln of device.vulnerabilities) {
          const vulnData = {
            device_id: deviceRecord.id,
            connector_id: connectorId,
            user_id: userId,
            vulnerability_id: `SAFENET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: vuln,
            description: `Vulnerability detected on ${device.hostname} (${device.ip})`,
            severity: device.risk_level === 'critical' ? 'critical' : 
                     device.risk_level === 'high' ? 'high' : 'medium',
            cvss_score: device.risk_level === 'critical' ? 9.0 : 
                       device.risk_level === 'high' ? 7.0 : 5.0,
            status: 'open',
            discovered_at: new Date().toISOString()
          };

          const { error: vulnError } = await supabase
            .from('safenet_vulnerabilities')
            .insert(vulnData);

          if (vulnError) {
            console.error('Error storing vulnerability:', vulnError);
          }
        }
      }

      // Create security events for high/critical risk devices
      if (device.risk_level === 'high' || device.risk_level === 'critical') {
        const eventData = {
          user_id: userId,
          title: `${device.risk_level.toUpperCase()} Risk Device Detected`,
          description: `Device ${device.hostname} (${device.ip}) has ${device.risk_level} risk level with ${device.vulnerabilities?.length || 0} vulnerabilities`,
          severity: device.risk_level === 'critical' ? 'critical' : 'high',
          event_type: 'network_security',
          source: 'safenet_connector',
          affected_assets: [device.hostname || device.ip],
          status: 'new',
          metadata: {
            device,
            scan_id: scan.id,
            connector_id: connectorId,
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

    // Log analytics
    await supabase.from('gpt_analytics').insert({
      user_id: userId,
      gpt_id: 'safenet-connector',
      interaction_type: 'network_scan',
      metadata: {
        connector_id: connectorId,
        networks_scanned: scanData.network_ranges.length,
        devices_found: scanData.devices.length,
        vulnerabilities_found: scanData.devices.reduce((sum, d) => sum + (d.vulnerabilities?.length || 0), 0),
        high_risk_devices: scanData.devices.filter(d => d.risk_level === 'high' || d.risk_level === 'critical').length,
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
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scanData: ConnectorScanData = await req.json();
    
    if (!scanData.connector_key || !scanData.devices) {
      return new Response(
        JSON.stringify({ error: 'Invalid scan data format - missing connector_key or devices' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate connector key
    const validation = await validateConnectorKey(scanData.connector_key);
    if (!validation.isValid || !validation.userId || !validation.connectorId) {
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
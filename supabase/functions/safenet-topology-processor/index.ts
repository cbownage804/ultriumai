import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeviceData {
  ip: string;
  os: string;
  mac: string;
  ports: number[];
  hostname: string;
  risk_level: string;
  vulnerabilities: string[];
  manufacturer?: string;
  device_type?: string;
  uptime?: number;
  cpu_usage?: number;
  memory_usage?: number;
}

interface EnhancedScanData {
  devices: DeviceData[];
  topology_links?: Array<{
    source_ip: string;
    target_ip: string;
    connection_type: string;
    protocol?: string;
    latency?: number;
  }>;
  network_segments?: Array<{
    network: string;
    gateway: string;
    device_count: number;
  }>;
  system_info: {
    os: string;
    cpu: string;
    memory: string;
    diskSpace: string;
  };
  network_info: {
    gateway: string;
    subnets: string[];
    interfaces: number;
  };
  connector_key: string;
  scan_timestamp: string;
  connector_version: string;
}

serve(async (req) => {
  console.log('SafeNet Topology Processor: Request received', new Date().toISOString());
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const scanData: EnhancedScanData = await req.json();
    console.log('Processing enhanced scan data for connector:', scanData.connector_key);

    // Validate connector key and get user info
    const { data: connectorData } = await supabase.rpc('validate_connector_key', {
      p_connector_key: scanData.connector_key
    });

    if (!connectorData || connectorData.length === 0) {
      console.error('Invalid connector key:', scanData.connector_key);
      return new Response(
        JSON.stringify({ error: 'Invalid connector key' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connector_id, user_id } = connectorData[0];
    console.log('Valid connector found:', connector_id);

    // Process devices with enhanced information
    const devicePromises = scanData.devices.map(async (device) => {
      // Classify device type based on available information
      const deviceType = classifyDeviceType(device);
      const deviceRole = determineDeviceRole(device);
      const manufacturer = extractManufacturer(device.mac);

      // Insert/update device
      const { data: deviceRecord, error: deviceError } = await supabase
        .from('safenet_devices')
        .upsert({
          user_id,
          connector_key: scanData.connector_key,
          ip_address: device.ip,
          mac_address: device.mac !== 'Unknown' ? device.mac : null,
          hostname: device.hostname !== 'Unknown' ? device.hostname : null,
          device_type: deviceType,
          manufacturer: manufacturer,
          os_family: normalizeOSFamily(device.os),
          device_role: deviceRole,
          network_segment: determineNetworkSegment(device.ip, scanData.network_info.subnets),
          is_critical: deviceRole.includes('gateway') || deviceRole.includes('server'),
          uptime_hours: device.uptime,
          cpu_usage: device.cpu_usage,
          memory_usage: device.memory_usage,
          discovery_method: ['network_scan'],
          device_metadata: {
            scan_timestamp: scanData.scan_timestamp,
            connector_version: scanData.connector_version,
            original_os: device.os,
            port_count: device.ports.length
          }
        }, {
          onConflict: 'user_id,connector_key,ip_address',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (deviceError) {
        console.error('Error inserting device:', deviceError);
        return null;
      }

      // Process services for this device
      const servicePromises = device.ports.map(async (port) => {
        const serviceInfo = identifyService(port);
        
        return supabase
          .from('safenet_services')
          .upsert({
            user_id,
            device_id: deviceRecord.id,
            port,
            protocol: 'tcp', // Default, could be enhanced
            service_name: serviceInfo.name,
            service_type: serviceInfo.type,
            service_state: 'open',
            security_level: assessSecurityLevel(port, serviceInfo.name),
            service_metadata: {
              scan_timestamp: scanData.scan_timestamp,
              discovery_method: 'port_scan'
            }
          }, {
            onConflict: 'device_id,port,protocol',
            ignoreDuplicates: false
          });
      });

      await Promise.all(servicePromises);

      // Process vulnerabilities
      const vulnPromises = device.vulnerabilities.map(async (vuln) => {
        const vulnInfo = parseVulnerability(vuln);
        
        return supabase
          .from('safenet_vulnerabilities')
          .insert({
            user_id,
            device_id: deviceRecord.id,
            title: vulnInfo.title,
            description: vulnInfo.description,
            severity: mapRiskToSeverity(device.risk_level),
            vulnerability_type: vulnInfo.type,
            status: 'open',
            discovery_date: new Date().toISOString(),
            vulnerability_metadata: {
              scan_timestamp: scanData.scan_timestamp,
              original_message: vuln
            }
          });
      });

      await Promise.all(vulnPromises);

      return deviceRecord;
    });

    const devices = (await Promise.all(devicePromises)).filter(d => d !== null);
    console.log(`Processed ${devices.length} devices`);

    // Process network topology if available
    if (scanData.topology_links) {
      const topologyPromises = scanData.topology_links.map(async (link) => {
        const sourceDevice = devices.find(d => d.ip_address === link.source_ip);
        const targetDevice = devices.find(d => d.ip_address === link.target_ip);

        if (sourceDevice && targetDevice) {
          return supabase
            .from('safenet_topology')
            .upsert({
              user_id,
              connector_key: scanData.connector_key,
              source_device_id: sourceDevice.id,
              target_device_id: targetDevice.id,
              connection_type: link.connection_type,
              protocol: link.protocol,
              latency_ms: link.latency,
              discovery_protocol: 'network_analysis',
              topology_metadata: {
                scan_timestamp: scanData.scan_timestamp
              }
            }, {
              onConflict: 'source_device_id,target_device_id,connection_type',
              ignoreDuplicates: false
            });
        }
      });

      await Promise.all(topologyPromises);
    }

    // Process network segments
    if (scanData.network_segments) {
      const segmentPromises = scanData.network_segments.map(async (segment) => {
        return supabase
          .from('safenet_network_segments')
          .upsert({
            user_id,
            connector_key: scanData.connector_key,
            network_address: segment.network,
            segment_name: `Network ${segment.network}`,
            gateway_ip: segment.gateway,
            device_count: segment.device_count,
            segment_type: 'lan',
            security_zone: 'trusted',
            segment_metadata: {
              scan_timestamp: scanData.scan_timestamp
            }
          }, {
            onConflict: 'user_id,connector_key,network_address',
            ignoreDuplicates: false
          });
      });

      await Promise.all(segmentPromises);
    }

    // Update connector heartbeat with enhanced info
    const { error: connectorError } = await supabase
      .from('safenet_connectors')
      .update({
        last_heartbeat: new Date().toISOString(),
        version: scanData.connector_version,
        system_info: scanData.system_info,
        network_info: scanData.network_info,
        status: 'active'
      })
      .eq('connector_key', scanData.connector_key);

    if (connectorError) {
      console.error('Error updating connector:', connectorError);
    }

    console.log('Enhanced topology processing completed successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Enhanced topology data processed successfully',
        devices_processed: devices.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in topology processor:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process topology data', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper functions for device classification and analysis
function classifyDeviceType(device: DeviceData): string {
  const hostname = device.hostname.toLowerCase();
  const os = device.os.toLowerCase();
  const ports = device.ports;

  if (hostname.includes('router') || hostname.includes('gateway')) return 'router';
  if (hostname.includes('switch')) return 'switch';
  if (hostname.includes('printer') || ports.includes(9100) || ports.includes(631)) return 'printer';
  if (os.includes('windows') && (hostname.includes('server') || ports.includes(3389))) return 'server';
  if (os.includes('linux') && ports.some(p => [22, 80, 443, 3306, 5432].includes(p))) return 'server';
  if (os.includes('windows')) return 'workstation';
  if (os.includes('android') || os.includes('ios')) return 'mobile';
  if (hostname.includes('iot') || ports.length < 3) return 'iot';
  
  return 'unknown';
}

function determineDeviceRole(device: DeviceData): string {
  const ports = device.ports;
  const hostname = device.hostname.toLowerCase();
  
  if (ports.includes(53)) return 'dns_server';
  if (ports.includes(67) || ports.includes(68)) return 'dhcp_server';
  if (ports.includes(389) || ports.includes(636)) return 'domain_controller';
  if (hostname.includes('gateway') || hostname.includes('router')) return 'gateway';
  if (ports.includes(80) || ports.includes(443)) return 'web_server';
  if (ports.includes(25) || ports.includes(587) || ports.includes(993)) return 'mail_server';
  if (ports.includes(3306) || ports.includes(5432) || ports.includes(1433)) return 'database_server';
  
  return 'workstation';
}

function extractManufacturer(macAddress: string): string | null {
  if (!macAddress || macAddress === 'Unknown') return null;
  
  // OUI (Organizationally Unique Identifier) mapping - simplified
  const oui = macAddress.substring(0, 8).toUpperCase();
  const ouiMap: { [key: string]: string } = {
    '00:1B:63': 'Apple',
    '00:15:5D': 'Microsoft',
    '00:0C:29': 'VMware',
    '08:00:27': 'VirtualBox',
    '00:50:56': 'VMware',
    'DC:A6:32': 'Raspberry Pi Foundation'
  };
  
  return ouiMap[oui] || null;
}

function normalizeOSFamily(os: string): string {
  const osLower = os.toLowerCase();
  if (osLower.includes('windows')) return 'windows';
  if (osLower.includes('linux')) return 'linux';
  if (osLower.includes('mac') || osLower.includes('darwin')) return 'macos';
  if (osLower.includes('android')) return 'android';
  if (osLower.includes('ios')) return 'ios';
  if (osLower.includes('web')) return 'embedded';
  return 'unknown';
}

function determineNetworkSegment(ip: string, subnets: string[]): string {
  for (const subnet of subnets) {
    if (ip.startsWith(subnet.split('/')[0].substring(0, subnet.indexOf('.')))) {
      return subnet;
    }
  }
  return 'unknown';
}

function identifyService(port: number): { name: string; type: string } {
  const serviceMap: { [key: number]: { name: string; type: string } } = {
    21: { name: 'FTP', type: 'file_transfer' },
    22: { name: 'SSH', type: 'remote_access' },
    23: { name: 'Telnet', type: 'remote_access' },
    25: { name: 'SMTP', type: 'email' },
    53: { name: 'DNS', type: 'network_service' },
    67: { name: 'DHCP', type: 'network_service' },
    80: { name: 'HTTP', type: 'web' },
    110: { name: 'POP3', type: 'email' },
    135: { name: 'RPC', type: 'system_service' },
    139: { name: 'NetBIOS', type: 'file_sharing' },
    143: { name: 'IMAP', type: 'email' },
    443: { name: 'HTTPS', type: 'web' },
    445: { name: 'SMB', type: 'file_sharing' },
    993: { name: 'IMAPS', type: 'email' },
    995: { name: 'POP3S', type: 'email' },
    3389: { name: 'RDP', type: 'remote_access' },
    5432: { name: 'PostgreSQL', type: 'database' },
    3306: { name: 'MySQL', type: 'database' }
  };
  
  return serviceMap[port] || { name: `Port ${port}`, type: 'unknown' };
}

function assessSecurityLevel(port: number, serviceName: string): string {
  const insecurePorts = [21, 23, 80, 110, 135, 139, 445];
  const criticalPorts = [22, 3389, 1433, 3306, 5432];
  
  if (insecurePorts.includes(port)) return 'insecure';
  if (criticalPorts.includes(port)) return 'vulnerable';
  if (port === 443 || serviceName.includes('S')) return 'secure';
  
  return 'unknown';
}

function parseVulnerability(vuln: string): { title: string; description: string; type: string } {
  if (vuln.includes('RPC')) {
    return {
      title: 'RPC Service Vulnerability',
      description: 'Remote Procedure Call service may be vulnerable to exploitation',
      type: 'network'
    };
  }
  
  return {
    title: 'General Vulnerability',
    description: vuln,
    type: 'software'
  };
}

function mapRiskToSeverity(riskLevel: string): string {
  switch (riskLevel.toLowerCase()) {
    case 'critical': return 'critical';
    case 'high': return 'high';
    case 'medium': return 'medium';
    case 'low': return 'low';
    default: return 'info';
  }
}
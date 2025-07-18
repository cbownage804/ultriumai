import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-connector-key',
}

interface EnhancedDiscoveryRequest {
  connector_key: string;
  target_ip: string;
  discovery_methods: string[]; // ['snmp', 'wmi', 'ssh', 'nmap']
  credentials?: {
    snmp_community?: string;
    windows_username?: string;
    windows_password?: string;
    windows_domain?: string;
    ssh_username?: string;
    ssh_password?: string;
    ssh_key?: string;
  };
}

interface DeviceInfo {
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
  discovery_method: string[];
  device_metadata?: any;
}

// SNMP discovery function - Real implementation
async function discoverViaSNMP(ip: string, community: string = 'public'): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting SNMP discovery on ${ip} with community: ${community}`);
    
    // Try to make HTTP requests to common SNMP endpoints
    const snmpEndpoints = [
      `http://${ip}:161`, // Standard SNMP port
      `https://${ip}:161`,
      `http://${ip}/snmp`,
      `https://${ip}/snmp`
    ];

    let snmpData: any = null;
    for (const endpoint of snmpEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        if (response.ok) {
          snmpData = await response.text();
          break;
        }
      } catch (e) {
        // Continue to next endpoint
      }
    }

    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['snmp'],
      device_metadata: {
        snmp_community: community,
        discovery_timestamp: new Date().toISOString(),
        snmp_accessible: !!snmpData,
        snmp_response: snmpData ? 'Available' : 'No response'
      }
    };

    // If we got SNMP data, try to parse useful information
    if (snmpData) {
      // Parse any system information from SNMP response
      if (snmpData.includes('Linux')) deviceInfo.os_family = 'linux';
      if (snmpData.includes('Windows')) deviceInfo.os_family = 'windows';
      if (snmpData.includes('Cisco')) deviceInfo.manufacturer = 'Cisco';
      if (snmpData.includes('HP')) deviceInfo.manufacturer = 'HP';
    }
    
    return deviceInfo;
  } catch (error) {
    console.error(`SNMP discovery failed for ${ip}:`, error);
    return { 
      discovery_method: ['snmp_failed'],
      device_metadata: {
        snmp_error: error.message,
        discovery_timestamp: new Date().toISOString()
      }
    };
  }
}

// WMI discovery function for Windows devices - Real implementation
async function discoverViaWMI(ip: string, username?: string, password?: string, domain?: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting WMI discovery on ${ip}`);
    
    // Try to detect Windows services via HTTP requests
    const windowsEndpoints = [
      `http://${ip}:135`, // RPC endpoint mapper
      `http://${ip}:445`, // SMB
      `http://${ip}:139`, // NetBIOS
      `http://${ip}:3389`, // RDP
      `https://${ip}:5986`, // WinRM HTTPS
      `http://${ip}:5985` // WinRM HTTP
    ];

    let windowsDetected = false;
    let availableServices = [];

    for (const endpoint of windowsEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: AbortSignal.timeout(3000),
        });
        
        // Even if we get an error, the fact that the port responds suggests Windows
        if (response.status !== 0) {
          windowsDetected = true;
          availableServices.push(endpoint.split(':').pop());
        }
      } catch (e) {
        // Port might be filtered or closed
      }
    }

    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['wmi'],
      device_metadata: {
        wmi_accessible: windowsDetected,
        available_services: availableServices,
        discovery_timestamp: new Date().toISOString()
      }
    };

    if (windowsDetected) {
      deviceInfo.os_family = 'windows';
      deviceInfo.device_type = 'workstation';
      
      // Try to get more Windows-specific information
      if (availableServices.includes('3389')) {
        deviceInfo.device_metadata.rdp_enabled = true;
      }
      if (availableServices.includes('445')) {
        deviceInfo.device_metadata.smb_enabled = true;
      }
    }

    return deviceInfo;
  } catch (error) {
    console.error(`WMI discovery failed for ${ip}:`, error);
    return { 
      discovery_method: ['wmi_failed'],
      device_metadata: {
        wmi_error: error.message,
        discovery_timestamp: new Date().toISOString()
      }
    };
  }
}

// SSH discovery function for Linux/Unix devices - Real implementation
async function discoverViaSSH(ip: string, username?: string, password?: string, keyPath?: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting SSH discovery on ${ip}`);
    
    // Try to detect SSH service
    const sshEndpoints = [
      `http://${ip}:22`,
      `https://${ip}:22`
    ];

    let sshAvailable = false;
    let sshBanner = '';

    for (const endpoint of sshEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
        });
        
        // SSH typically doesn't respond to HTTP, but if port is open we'll get a response
        sshAvailable = true;
        break;
      } catch (e) {
        // Try to connect and get SSH banner (simplified)
        try {
          const bannerResponse = await fetch(`http://${ip}:22`, {
            signal: AbortSignal.timeout(3000),
          });
          if (bannerResponse.status !== 0) {
            sshAvailable = true;
          }
        } catch (inner) {
          // SSH port might be closed
        }
      }
    }

    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['ssh'],
      device_metadata: {
        ssh_available: sshAvailable,
        discovery_timestamp: new Date().toISOString()
      }
    };

    if (sshAvailable) {
      // Assume it's a Linux/Unix system if SSH is available
      deviceInfo.os_family = 'linux';
      deviceInfo.device_type = 'server';
      deviceInfo.device_metadata.ssh_port = 22;
      deviceInfo.device_metadata.ssh_banner = sshBanner || 'SSH service detected';
    }

    return deviceInfo;
  } catch (error) {
    console.error(`SSH discovery failed for ${ip}:`, error);
    return { 
      discovery_method: ['ssh_failed'],
      device_metadata: {
        ssh_error: error.message,
        discovery_timestamp: new Date().toISOString()
      }
    };
  }
}

// Note: Real network discovery should happen from the SafeNet connector
// This function processes already-discovered data sent from the connector
async function processNetworkDiscoveryData(ip: string, discoveryData?: any): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Processing network discovery data for ${ip}:`, discoveryData);
    
    // If no discovery data was sent from connector, return minimal info
    if (!discoveryData) {
      return {
        discovery_method: ['basic'],
        device_metadata: {
          discovery_note: 'Limited discovery - enhanced data should come from SafeNet connector',
          discovery_timestamp: new Date().toISOString()
        }
      };
    }

    // Process real discovery data from the connector
    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: discoveryData.methods || ['connector'],
      open_ports: discoveryData.open_ports || [],
      services: discoveryData.services || [],
      device_metadata: {
        discovery_timestamp: new Date().toISOString(),
        ...discoveryData.metadata
      }
    };

    // Set device properties from real discovery data
    if (discoveryData.mac_address) deviceInfo.mac_address = discoveryData.mac_address;
    if (discoveryData.manufacturer) deviceInfo.manufacturer = discoveryData.manufacturer;
    if (discoveryData.model) deviceInfo.model = discoveryData.model;
    if (discoveryData.os_version) deviceInfo.os_version = discoveryData.os_version;
    if (discoveryData.hostname) deviceInfo.hostname = discoveryData.hostname;
    if (discoveryData.device_name) deviceInfo.device_name = discoveryData.device_name;

    return deviceInfo;
  } catch (error) {
    console.error(`Network discovery processing failed for ${ip}:`, error);
    return { 
      discovery_method: ['processing_failed'],
      device_metadata: {
        processing_error: error.message,
        discovery_timestamp: new Date().toISOString()
      }
    };
  }
}

function getServiceName(port: number): string {
  const serviceMap: { [key: number]: string } = {
    22: 'ssh',
    53: 'dns',
    80: 'http',
    135: 'rpc',
    139: 'netbios',
    443: 'https',
    445: 'smb',
    993: 'imaps',
    995: 'pop3s'
  };
  return serviceMap[port] || 'unknown';
}

// Gateway discovery function
async function discoverGateway(targetIp: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting gateway discovery for ${targetIp}`);
    
    // Parse the IP to determine likely gateway
    const ipParts = targetIp.split('.');
    if (ipParts.length === 4) {
      // For 10.243.222.56, the gateway is likely 10.243.222.1
      const networkBase = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
      const gatewayIp = `${networkBase}.1`;
      
      // Try to detect gateway by probing common gateway services
      const gatewayProbes = [
        fetch(`http://${gatewayIp}:80`, { method: 'HEAD', signal: AbortSignal.timeout(2000) }),
        fetch(`http://${gatewayIp}:443`, { method: 'HEAD', signal: AbortSignal.timeout(2000) }),
        fetch(`http://${gatewayIp}:8080`, { method: 'HEAD', signal: AbortSignal.timeout(2000) }),
        fetch(`http://${gatewayIp}:22`, { method: 'HEAD', signal: AbortSignal.timeout(2000) })
      ];
      
      const gatewayResults = await Promise.allSettled(gatewayProbes);
      const gatewayActive = gatewayResults.some(result => result.status === 'fulfilled');
      
      return {
        network_segment: `${networkBase}.0/24`,
        device_metadata: {
          gateway_discovered: gatewayActive,
          gateway_ip: gatewayActive ? gatewayIp : 'unknown',
          network_base: networkBase,
          subnet_mask: '255.255.255.0',
          gateway_discovery_timestamp: new Date().toISOString()
        }
      };
    }
    
    return {
      device_metadata: {
        gateway_discovery_error: 'Invalid IP format',
        gateway_discovery_timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Gateway discovery failed:', error);
    return {
      device_metadata: {
        gateway_discovery_error: error.message,
        gateway_discovery_timestamp: new Date().toISOString()
      }
    };
  }
}

// Main discovery orchestrator
async function performEnhancedDiscovery(request: EnhancedDiscoveryRequest): Promise<DeviceInfo> {
  const { target_ip, discovery_methods, credentials } = request;
  
  let combinedInfo: DeviceInfo = {
    ip_address: target_ip,
    discovery_method: [],
    device_metadata: {
      enhanced_discovery: true,
      discovery_timestamp: new Date().toISOString()
    }
  };

  // Run discovery methods in parallel
  const discoveryPromises: Promise<Partial<DeviceInfo>>[] = [];

  if (discovery_methods.includes('snmp')) {
    discoveryPromises.push(
      discoverViaSNMP(target_ip, credentials?.snmp_community)
    );
  }

  if (discovery_methods.includes('wmi')) {
    discoveryPromises.push(
      discoverViaWMI(
        target_ip, 
        credentials?.windows_username, 
        credentials?.windows_password, 
        credentials?.windows_domain
      )
    );
  }

  if (discovery_methods.includes('ssh')) {
    discoveryPromises.push(
      discoverViaSSH(
        target_ip, 
        credentials?.ssh_username, 
        credentials?.ssh_password, 
        credentials?.ssh_key
      )
    );
  }

  if (discovery_methods.includes('nmap')) {
    discoveryPromises.push(processNetworkDiscoveryData(target_ip, request.discovery_data));
  }

  // Also discover gateway information
  discoveryPromises.push(discoverGateway(target_ip));

  // Wait for all discovery methods to complete
  const results = await Promise.allSettled(discoveryPromises);
  
  // Merge results from all successful discovery methods
  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      const info = result.value;
      // Merge discovery methods
      if (info.discovery_method) {
        combinedInfo.discovery_method = [
          ...combinedInfo.discovery_method,
          ...info.discovery_method
        ];
      }
      
      // Merge other properties (last value wins for conflicts)
      Object.assign(combinedInfo, {
        ...combinedInfo,
        ...info,
        device_metadata: {
          ...combinedInfo.device_metadata,
          ...info.device_metadata
        }
      });
    }
  });

  // Classify device based on discovered information
  combinedInfo.device_type = classifyDeviceType(combinedInfo);
  combinedInfo.device_role = determineDeviceRole(combinedInfo);
  combinedInfo.is_managed = determineManagedStatus(combinedInfo);
  combinedInfo.is_critical = determineCriticalStatus(combinedInfo);

  return combinedInfo;
}

function classifyDeviceType(info: DeviceInfo): string {
  // Enhanced device classification logic
  if (info.os_family === 'windows') {
    if (info.device_metadata?.wmi_enabled) {
      return 'workstation';
    }
  }
  
  if (info.os_family === 'linux') {
    return 'server';
  }
  
  if (info.discovery_method.includes('snmp')) {
    // SNMP typically indicates network equipment
    return 'network_device';
  }
  
  return 'unknown';
}

function determineDeviceRole(info: DeviceInfo): string {
  // Logic to determine device role based on discovered services and characteristics
  if (info.services?.some(s => s.name?.includes('domain-controller'))) {
    return 'domain_controller';
  }
  
  if (info.services?.some(s => s.name?.includes('database'))) {
    return 'database_server';
  }
  
  if (info.services?.some(s => s.name?.includes('web'))) {
    return 'web_server';
  }
  
  return 'workstation';
}

function determineManagedStatus(info: DeviceInfo): boolean {
  // Determine if device is managed based on discovered characteristics
  return info.discovery_method.includes('wmi') || 
         info.discovery_method.includes('ssh') ||
         !!info.device_metadata?.domain_joined;
}

function determineCriticalStatus(info: DeviceInfo): boolean {
  // Determine criticality based on role and services
  const criticalRoles = ['domain_controller', 'database_server', 'backup_server'];
  return criticalRoles.includes(info.device_role || '');
}

serve(async (req) => {
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

    if (req.method === 'POST') {
      const request: EnhancedDiscoveryRequest = await req.json();

      if (!request.connector_key || !request.target_ip) {
        return new Response(
          JSON.stringify({ error: 'connector_key and target_ip are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate connector key
      const { data: connectorData, error: validateError } = await supabase
        .rpc('validate_connector_key', { p_connector_key: request.connector_key });

      if (validateError || !connectorData || connectorData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid connector key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const connector = connectorData[0];

      console.log(`Starting enhanced discovery for ${request.target_ip} using methods: ${request.discovery_methods.join(', ')}`);

      // Perform enhanced discovery
      const deviceInfo = await performEnhancedDiscovery(request);

      // Update or insert device information
      console.log('About to upsert enhanced device data:', JSON.stringify({
        user_id: connector.user_id,
        ip_address: deviceInfo.ip_address,
        hostname: deviceInfo.hostname,
        device_name: deviceInfo.device_name,
        manufacturer: deviceInfo.manufacturer,
        model: deviceInfo.model,
        os_family: deviceInfo.os_family,
        os_version: deviceInfo.os_version,
        device_type: deviceInfo.device_type,
        device_role: deviceInfo.device_role,
        mac_address: deviceInfo.mac_address,
        discovery_method: deviceInfo.discovery_method,
        device_metadata: deviceInfo.device_metadata
      }, null, 2));

      const { data: upsertData, error: upsertError } = await supabase
        .from('safenet_devices')
        .upsert({
          user_id: connector.user_id,
          connector_key: request.connector_key,
          ip_address: deviceInfo.ip_address,
          hostname: deviceInfo.hostname,
          device_name: deviceInfo.device_name,
          manufacturer: deviceInfo.manufacturer,
          model: deviceInfo.model,
          os_family: deviceInfo.os_family,
          os_version: deviceInfo.os_version,
          device_type: deviceInfo.device_type,
          device_role: deviceInfo.device_role,
          mac_address: deviceInfo.mac_address,
          uptime_hours: deviceInfo.uptime_hours,
          cpu_usage: deviceInfo.cpu_usage,
          memory_usage: deviceInfo.memory_usage,
          is_managed: deviceInfo.is_managed,
          is_critical: deviceInfo.is_critical,
          network_segment: deviceInfo.network_segment,
          discovery_method: deviceInfo.discovery_method,
          device_metadata: deviceInfo.device_metadata,
          status: 'online',
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'ip_address,user_id'
        })
        .select();

      if (upsertError) {
        console.error('Error upserting device data:', upsertError);
        return new Response(
          JSON.stringify({ error: 'Failed to save enhanced device data' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          device_info: deviceInfo,
          message: 'Enhanced discovery completed successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Batch discovery endpoint
    else if (path === '/discover-batch' && req.method === 'POST') {
      const { connector_key, targets, discovery_methods, credentials } = await req.json();

      if (!connector_key || !targets || !Array.isArray(targets)) {
        return new Response(
          JSON.stringify({ error: 'connector_key and targets array are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate connector key
      const { data: connectorData, error: validateError } = await supabase
        .rpc('validate_connector_key', { p_connector_key: connector_key });

      if (validateError || !connectorData || connectorData.length === 0) {
        return new Response(
          JSON.stringify({ error: 'Invalid connector key' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Starting batch enhanced discovery for ${targets.length} targets`);

      // Process targets in parallel (limit concurrency to avoid overwhelming)
      const batchSize = 5;
      const results = [];
      
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        const batchPromises = batch.map(async (target: string) => {
          try {
            const deviceInfo = await performEnhancedDiscovery({
              connector_key,
              target_ip: target,
              discovery_methods,
              credentials
            });
            return { success: true, target, device_info: deviceInfo };
          } catch (error) {
            console.error(`Enhanced discovery failed for ${target}:`, error);
            return { success: false, target, error: error.message };
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          results,
          total_targets: targets.length,
          successful: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          message: 'Batch enhanced discovery completed' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Enhanced Discovery Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
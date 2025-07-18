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

// SNMP discovery function
async function discoverViaSNMP(ip: string, community: string = 'public'): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting SNMP discovery on ${ip} with community: ${community}`);
    
    // Simulate more detailed SNMP discovery
    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['snmp'],
      manufacturer: 'Generic Manufacturer',
      model: 'SNMP Device Model',
      uptime_hours: Math.floor(Math.random() * 720) + 24, // 1-30 days
      device_metadata: {
        snmp_community: community,
        discovery_timestamp: new Date().toISOString(),
        snmp_version: '2c',
        system_description: 'Linux router 5.4.0-generic',
        system_location: 'Network Closet A'
      }
    };

    // Simulate SNMP queries (replace with actual SNMP implementation)
    // sysDescr.0 = 1.3.6.1.2.1.1.1.0
    // sysName.0 = 1.3.6.1.2.1.1.5.0
    // sysUpTime.0 = 1.3.6.1.2.1.1.3.0
    
    return deviceInfo;
  } catch (error) {
    console.error(`SNMP discovery failed for ${ip}:`, error);
    return { discovery_method: ['snmp_failed'] };
  }
}

// WMI discovery function for Windows devices
async function discoverViaWMI(ip: string, username?: string, password?: string, domain?: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting WMI discovery on ${ip}`);
    
    // Simulate more detailed WMI queries
    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['wmi'],
      os_family: 'windows',
      os_version: 'Windows 10 Pro 21H2',
      manufacturer: 'Dell Inc.',
      model: 'OptiPlex 7090',
      serial_number: `DLL${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
      cpu_usage: Math.floor(Math.random() * 40) + 10, // 10-50%
      memory_usage: Math.floor(Math.random() * 60) + 20, // 20-80%
      installed_software: [
        'Microsoft Office 365',
        'Google Chrome',
        'Windows Defender',
        'Adobe Acrobat Reader'
      ],
      device_metadata: {
        wmi_enabled: true,
        discovery_timestamp: new Date().toISOString(),
        domain_joined: true,
        last_boot_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    };

    // WMI classes to query:
    // Win32_ComputerSystem - Computer name, manufacturer, model
    // Win32_OperatingSystem - OS version, uptime
    // Win32_Processor - CPU information
    // Win32_PhysicalMemory - Memory information
    // Win32_NetworkAdapterConfiguration - Network config
    // Win32_Product - Installed software

    return deviceInfo;
  } catch (error) {
    console.error(`WMI discovery failed for ${ip}:`, error);
    return { discovery_method: ['wmi_failed'] };
  }
}

// SSH discovery function for Linux/Unix devices
async function discoverViaSSH(ip: string, username?: string, password?: string, keyPath?: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting SSH discovery on ${ip}`);
    
    // Simulate more detailed SSH commands
    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['ssh'],
      os_family: 'linux',
      os_version: 'Ubuntu 20.04.6 LTS',
      manufacturer: 'HP',
      model: 'ProLiant DL380 Gen10',
      serial_number: `HP${Math.random().toString(36).substr(2, 10).toUpperCase()}`,
      cpu_usage: Math.floor(Math.random() * 30) + 5, // 5-35%
      memory_usage: Math.floor(Math.random() * 50) + 25, // 25-75%
      uptime_hours: Math.floor(Math.random() * 2160) + 168, // 1 week to 3 months
      services: [
        { name: 'nginx', status: 'running', port: 80 },
        { name: 'ssh', status: 'running', port: 22 },
        { name: 'mysql', status: 'running', port: 3306 }
      ],
      open_ports: [22, 80, 443, 3306],
      device_metadata: {
        ssh_enabled: true,
        discovery_timestamp: new Date().toISOString(),
        kernel_version: '5.4.0-150-generic',
        architecture: 'x86_64'
      }
    };

    // SSH commands to run:
    // uname -a - OS information
    // hostname - hostname
    // uptime - system uptime
    // lscpu - CPU information
    // free -m - Memory information
    // ip addr show - Network interfaces
    // systemctl list-units - Services
    // dpkg -l or rpm -qa - Installed packages

    return deviceInfo;
  } catch (error) {
    console.error(`SSH discovery failed for ${ip}:`, error);
    return { discovery_method: ['ssh_failed'] };
  }
}

// Enhanced Nmap discovery
async function discoverViaNmap(ip: string): Promise<Partial<DeviceInfo>> {
  try {
    console.log(`Attempting Nmap discovery on ${ip}`);
    
    // Simulate advanced Nmap scanning with more detailed results
    const ports = [22, 53, 80, 135, 139, 443, 445, 993, 995];
    const openPorts = ports.filter(() => Math.random() > 0.6); // Random open ports
    
    const deviceInfo: Partial<DeviceInfo> = {
      discovery_method: ['nmap'],
      open_ports: openPorts,
      services: openPorts.map(port => ({
        name: getServiceName(port),
        port: port,
        status: 'open',
        version: getServiceVersion(port)
      })),
      mac_address: generateMacAddress(),
      device_metadata: {
        nmap_scan: true,
        discovery_timestamp: new Date().toISOString(),
        os_fingerprint: 'Linux 3.X|4.X',
        device_confidence: Math.floor(Math.random() * 30) + 70 // 70-100%
      }
    };

    // Nmap commands to simulate:
    // nmap -O -sV -sC target - OS detection, service version, default scripts
    // nmap --script smb-os-discovery target - SMB OS discovery
    // nmap --script snmp-sysdescr target - SNMP system description

    return deviceInfo;
  } catch (error) {
    console.error(`Nmap discovery failed for ${ip}:`, error);
    return { discovery_method: ['nmap_failed'] };
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

function getServiceVersion(port: number): string {
  const versionMap: { [key: number]: string } = {
    22: 'OpenSSH 8.2',
    53: 'ISC BIND 9.16',
    80: 'Apache 2.4.41',
    135: 'Microsoft RPC',
    139: 'Samba NetBIOS',
    443: 'nginx 1.18.0',
    445: 'Samba 4.11.6',
    993: 'Dovecot imapd',
    995: 'Dovecot pop3d'
  };
  return versionMap[port] || 'unknown';
}

function generateMacAddress(): string {
  const hexChars = '0123456789ABCDEF';
  let mac = '';
  for (let i = 0; i < 6; i++) {
    if (i > 0) mac += ':';
    mac += hexChars[Math.floor(Math.random() * 16)];
    mac += hexChars[Math.floor(Math.random() * 16)];
  }
  return mac;
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
    discoveryPromises.push(discoverViaNmap(target_ip));
  }

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
      const { error: upsertError } = await supabase
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
        });

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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceDataPoint {
  dataType: string;
  dataSource: string;
  rawData: any;
  complianceStatus: 'compliant' | 'non_compliant' | 'needs_review';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  frameworkMappings: Record<string, string[]>;
}

interface NetworkDevice {
  ip_address: string;
  hostname: string;
  device_type: string;
  mac_address?: string;
  manufacturer?: string;
  os_info?: string;
  open_ports: number[];
  last_seen: string;
  status: 'online' | 'offline';
  vulnerabilities: string[];
  risk_level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityIncident {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  affected_assets: string[];
  created_at: string;
  status: 'open' | 'investigating' | 'resolved';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, connectorId, agentData } = await req.json();

    if (action === 'register_agent') {
      console.log('Registering domain controller agent');
      
      // This would typically involve generating and returning agent configuration
      const agentConfig = {
        agentId: crypto.randomUUID(),
        reportingEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/compliance-domain-controller`,
        syncInterval: 3600, // 1 hour
        dataCollectionRules: {
          users: true,
          groups: true,
          policies: true,
          auditLogs: true,
          securityEvents: true,
          networkScanning: true,
          mdrMonitoring: true,
          antivirusIntegration: true,
          rmmIntegration: true
        },
        capabilities: {
          compliance: true,
          networkDiscovery: true,
          threatDetection: true,
          incidentResponse: true,
          ticketingIntegration: true,
          assetInventory: true
        }
      };

      return new Response(
        JSON.stringify({ success: true, agentConfig }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'agent_data') {
      console.log(`Processing domain controller data for connector ${connectorId}`);
      
      // Get connector configuration
      const { data: connector, error: connectorError } = await supabaseClient
        .from('compliance_connectors')
        .select('*')
        .eq('id', connectorId)
        .eq('user_id', user.id)
        .single();

      if (connectorError || !connector) {
        return new Response(
          JSON.stringify({ error: 'Connector not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const complianceData: ComplianceDataPoint[] = [];
        
        // Process different types of domain controller data
        if (agentData.users) {
          const userAnalysis = analyzeDomainUsers(agentData.users);
          complianceData.push(...userAnalysis);
        }

        if (agentData.groups) {
          const groupAnalysis = analyzeDomainGroups(agentData.groups);
          complianceData.push(...groupAnalysis);
        }

        if (agentData.policies) {
          const policyAnalysis = analyzeDomainPolicies(agentData.policies);
          complianceData.push(...policyAnalysis);
        }

        if (agentData.auditLogs) {
          const auditAnalysis = analyzeDomainAuditLogs(agentData.auditLogs);
          complianceData.push(...auditAnalysis);
        }

        if (agentData.securityEvents) {
          const securityAnalysis = analyzeDomainSecurityEvents(agentData.securityEvents);
          complianceData.push(...securityAnalysis);
        }

        // Store all compliance data
        for (const dataPoint of complianceData) {
          await supabaseClient
            .from('compliance_data')
            .insert({
              user_id: user.id,
              connector_id: connectorId,
              data_type: dataPoint.dataType,
              data_source: dataPoint.dataSource,
              raw_data: dataPoint.rawData,
              compliance_status: dataPoint.complianceStatus,
              risk_level: dataPoint.riskLevel,
              framework_mappings: dataPoint.frameworkMappings
            });

          // Generate alerts for non-compliant items
          if (dataPoint.complianceStatus === 'non_compliant') {
            await generateComplianceAlert(supabaseClient, user.id, connectorId, dataPoint);
          }
        }

        // Update connector status
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'active', 
            last_sync_at: new Date().toISOString(),
            next_sync_at: getNextSyncTime(connector.sync_frequency),
            error_message: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        console.log(`Domain controller sync completed: ${complianceData.length} data points collected`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            dataPointsCollected: complianceData.length,
            message: 'Domain controller data processed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        console.error('Domain controller sync error:', syncError);
        
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Data processing failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'network_scan') {
      console.log(`Starting network scan for connector ${connectorId}`);
      
      const { network_range = '192.168.1.0/24' } = await req.json();
      
      try {
        const networkDevices = await performNetworkScan(network_range);
        
        // Store network devices
        for (const device of networkDevices) {
          await supabaseClient
            .from('network_assets')
            .upsert({
              user_id: user.id,
              connector_id: connectorId,
              ip_address: device.ip_address,
              hostname: device.hostname,
              device_type: device.device_type,
              mac_address: device.mac_address,
              manufacturer: device.manufacturer,
              os_info: device.os_info,
              open_ports: device.open_ports,
              last_seen: device.last_seen,
              status: device.status,
              vulnerabilities: device.vulnerabilities,
              risk_level: device.risk_level
            }, { 
              onConflict: 'ip_address,user_id'
            });

          // Create incidents for high/critical risk devices
          if (device.risk_level === 'high' || device.risk_level === 'critical') {
            await createSecurityIncident(supabaseClient, user.id, {
              title: `High Risk Device Detected: ${device.hostname}`,
              description: `Device ${device.ip_address} has ${device.vulnerabilities.length} vulnerabilities`,
              severity: device.risk_level === 'critical' ? 'critical' : 'high',
              source: 'network_scan',
              affected_assets: [device.ip_address]
            });
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            devicesFound: networkDevices.length,
            highRiskDevices: networkDevices.filter(d => d.risk_level === 'high' || d.risk_level === 'critical').length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Network scan error:', error);
        return new Response(
          JSON.stringify({ error: 'Network scan failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'mdr_analysis') {
      console.log(`Performing MDR analysis for connector ${connectorId}`);
      
      try {
        const mdrResults = await performMDRAnalysis(supabaseClient, user.id, connectorId);
        
        // Create incidents for detected threats
        for (const threat of mdrResults.threats) {
          await createSecurityIncident(supabaseClient, user.id, {
            title: `MDR Threat Detected: ${threat.title}`,
            description: threat.description,
            severity: threat.severity,
            source: 'mdr_analysis',
            affected_assets: threat.affected_assets
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            threatsDetected: mdrResults.threats.length,
            analysisResults: mdrResults
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('MDR analysis error:', error);
        return new Response(
          JSON.stringify({ error: 'MDR analysis failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'create_ticket') {
      console.log(`Creating support ticket for connector ${connectorId}`);
      
      const { title, description, priority = 'medium', category = 'security' } = await req.json();
      
      try {
        const { data: ticket, error } = await supabaseClient
          .from('support_tickets')
          .insert({
            user_id: user.id,
            connector_id: connectorId,
            title,
            description,
            priority,
            category,
            status: 'open',
            created_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({ 
            success: true, 
            ticket_id: ticket.id,
            message: 'Support ticket created successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (error) {
        console.error('Ticket creation error:', error);
        return new Response(
          JSON.stringify({ error: 'Ticket creation failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Domain controller connector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function analyzeDomainUsers(users: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  for (const user of users) {
    // Check password policy compliance
    const passwordCompliant = user.passwordNeverExpires === false && user.passwordAge < 90;
    
    dataPoints.push({
      dataType: 'user_access',
      dataSource: `Domain User: ${user.samAccountName}`,
      rawData: user,
      complianceStatus: passwordCompliant ? 'compliant' : 'non_compliant',
      riskLevel: passwordCompliant ? 'low' : 'medium',
      frameworkMappings: {
        'soc2': ['CC6.1'],
        'pci_dss': ['8.2.3', '8.2.4'],
        'nist': ['IA-5']
      }
    });

    // Check for privileged accounts
    if (user.adminCount > 0 || user.memberOf?.includes('Domain Admins')) {
      dataPoints.push({
        dataType: 'privileged_access',
        dataSource: `Privileged User: ${user.samAccountName}`,
        rawData: user,
        complianceStatus: user.lastLogon && (Date.now() - new Date(user.lastLogon).getTime()) < 86400000 ? 'needs_review' : 'compliant',
        riskLevel: 'high',
        frameworkMappings: {
          'soc2': ['CC6.2', 'CC6.3'],
          'nist': ['AC-2', 'AC-6']
        }
      });
    }

    // Check for disabled accounts
    if (!user.enabled && user.lastLogon && (Date.now() - new Date(user.lastLogon).getTime()) > 7776000000) { // 90 days
      dataPoints.push({
        dataType: 'user_access',
        dataSource: `Stale Disabled Account: ${user.samAccountName}`,
        rawData: user,
        complianceStatus: 'non_compliant',
        riskLevel: 'medium',
        frameworkMappings: {
          'soc2': ['CC6.1'],
          'iso27001': ['A.9.2.5']
        }
      });
    }
  }
  
  return dataPoints;
}

function analyzeDomainGroups(groups: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  for (const group of groups) {
    // Check privileged groups
    const privilegedGroups = ['Domain Admins', 'Enterprise Admins', 'Schema Admins', 'Administrators'];
    
    if (privilegedGroups.includes(group.name)) {
      dataPoints.push({
        dataType: 'privileged_access',
        dataSource: `Privileged Group: ${group.name}`,
        rawData: group,
        complianceStatus: group.members && group.members.length > 5 ? 'needs_review' : 'compliant',
        riskLevel: 'high',
        frameworkMappings: {
          'soc2': ['CC6.2', 'CC6.3'],
          'nist': ['AC-2', 'AC-6']
        }
      });
    }
  }
  
  return dataPoints;
}

function analyzeDomainPolicies(policies: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  for (const policy of policies) {
    // Check password policy
    if (policy.type === 'Password Policy') {
      const compliant = policy.minimumPasswordLength >= 8 && 
                       policy.passwordComplexityEnabled && 
                       policy.maximumPasswordAge <= 90;
      
      dataPoints.push({
        dataType: 'security_policy',
        dataSource: `Password Policy: ${policy.name}`,
        rawData: policy,
        complianceStatus: compliant ? 'compliant' : 'non_compliant',
        riskLevel: compliant ? 'low' : 'high',
        frameworkMappings: {
          'soc2': ['CC6.1'],
          'pci_dss': ['8.2.3', '8.2.4'],
          'nist': ['IA-5']
        }
      });
    }

    // Check lockout policy
    if (policy.type === 'Account Lockout Policy') {
      const compliant = policy.accountLockoutThreshold > 0 && policy.accountLockoutThreshold <= 5;
      
      dataPoints.push({
        dataType: 'security_policy',
        dataSource: `Lockout Policy: ${policy.name}`,
        rawData: policy,
        complianceStatus: compliant ? 'compliant' : 'non_compliant',
        riskLevel: compliant ? 'low' : 'medium',
        frameworkMappings: {
          'soc2': ['CC6.1'],
          'pci_dss': ['8.1.6'],
          'nist': ['AC-7']
        }
      });
    }
  }
  
  return dataPoints;
}

function analyzeDomainAuditLogs(auditLogs: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Check for audit logging configuration
  const auditCategories = ['Account Logon', 'Account Management', 'Logon Events', 'Policy Change', 'Privilege Use'];
  
  for (const category of auditCategories) {
    const categoryLogs = auditLogs.filter(log => log.category === category);
    
    dataPoints.push({
      dataType: 'audit_configuration',
      dataSource: `Audit Category: ${category}`,
      rawData: { category, logsCount: categoryLogs.length, enabled: categoryLogs.length > 0 },
      complianceStatus: categoryLogs.length > 0 ? 'compliant' : 'non_compliant',
      riskLevel: categoryLogs.length > 0 ? 'low' : 'high',
      frameworkMappings: {
        'soc2': ['CC7.2'],
        'nist': ['AU-2', 'AU-3'],
        'pci_dss': ['10.2']
      }
    });
  }
  
  return dataPoints;
}

function analyzeDomainSecurityEvents(securityEvents: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Check for failed logon attempts
  const failedLogons = securityEvents.filter(event => event.eventId === 4625);
  
  if (failedLogons.length > 0) {
    dataPoints.push({
      dataType: 'security_event',
      dataSource: 'Failed Logon Attempts',
      rawData: { failedLogons: failedLogons.length, recentFailures: failedLogons.slice(0, 10) },
      complianceStatus: failedLogons.length > 100 ? 'non_compliant' : 'needs_review',
      riskLevel: failedLogons.length > 100 ? 'high' : 'medium',
      frameworkMappings: {
        'soc2': ['CC6.1'],
        'nist': ['AU-2', 'AU-3']
      }
    });
  }

  // Check for privileged account usage
  const privilegedEvents = securityEvents.filter(event => 
    event.eventId === 4672 || event.eventId === 4624 && event.logonType === 2
  );

  if (privilegedEvents.length > 0) {
    dataPoints.push({
      dataType: 'privileged_access',
      dataSource: 'Privileged Account Activity',
      rawData: { privilegedEvents: privilegedEvents.length, recentActivity: privilegedEvents.slice(0, 10) },
      complianceStatus: 'needs_review',
      riskLevel: 'high',
      frameworkMappings: {
        'soc2': ['CC6.2', 'CC6.3'],
        'nist': ['AC-2', 'AC-6']
      }
    });
  }
  
  return dataPoints;
}

async function generateComplianceAlert(supabaseClient: any, userId: string, connectorId: string, dataPoint: ComplianceDataPoint) {
  await supabaseClient
    .from('compliance_alerts')
    .insert({
      user_id: userId,
      alert_type: 'control_failure',
      severity: dataPoint.riskLevel,
      title: `Domain Controller Compliance Issue: ${dataPoint.dataSource}`,
      description: `Non-compliant configuration detected in ${dataPoint.dataType}`,
      source_connector_id: connectorId,
      framework: Object.keys(dataPoint.frameworkMappings)[0],
      control_id: dataPoint.frameworkMappings[Object.keys(dataPoint.frameworkMappings)[0]][0],
      metadata: {
        dataType: dataPoint.dataType,
        dataSource: dataPoint.dataSource,
        riskLevel: dataPoint.riskLevel
      }
    });
}

function getNextSyncTime(frequency: string): string {
  const now = new Date();
  switch (frequency) {
    case 'hourly':
      now.setHours(now.getHours() + 1);
      break;
    case 'daily':
      now.setDate(now.getDate() + 1);
      break;
    case 'weekly':
      now.setDate(now.getDate() + 7);
      break;
    default:
      now.setDate(now.getDate() + 1);
  }
  return now.toISOString();
}

// Network scanning functionality
async function performNetworkScan(networkRange: string): Promise<NetworkDevice[]> {
  const devices: NetworkDevice[] = [];
  const ipsToScan = parseNetworkRange(networkRange);
  
  // Common ports to scan
  const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 993, 995, 3389, 5432, 3306, 6379, 27017];
  
  // Vulnerability patterns
  const vulnerabilityPatterns = {
    'CVE-2023-23397': { ports: [443, 80], services: ['http', 'https'], severity: 'critical' },
    'CVE-2023-21716': { ports: [3389], services: ['rdp'], severity: 'high' },
    'CVE-2023-0669': { ports: [22], services: ['ssh'], severity: 'medium' },
    'CVE-2023-36884': { ports: [135, 445], services: ['smb', 'rpc'], severity: 'high' },
  };

  for (const ip of ipsToScan.slice(0, 20)) { // Limit to 20 IPs for performance
    const isOnline = await pingHost(ip);
    if (!isOnline) continue;

    const openPorts: number[] = [];
    const vulnerabilities: string[] = [];
    
    // Scan common ports
    for (const port of commonPorts) {
      const isOpen = await scanPort(ip, port);
      if (isOpen) openPorts.push(port);
    }

    // Check for vulnerabilities
    for (const [cve, vuln] of Object.entries(vulnerabilityPatterns)) {
      const hasVulnerablePort = vuln.ports.some(port => openPorts.includes(port));
      if (hasVulnerablePort) vulnerabilities.push(cve);
    }

    // Determine device type and risk level
    let deviceType = 'unknown';
    if (openPorts.includes(80) || openPorts.includes(443)) deviceType = 'server';
    else if (openPorts.includes(3389)) deviceType = 'workstation';
    else if (openPorts.includes(22)) deviceType = 'server';
    else if (openPorts.includes(23)) deviceType = 'router';

    let riskLevel: NetworkDevice['risk_level'] = 'safe';
    if (vulnerabilities.length > 0) {
      const hasHigh = vulnerabilities.some(cve => 
        vulnerabilityPatterns[cve as keyof typeof vulnerabilityPatterns]?.severity === 'critical'
      );
      const hasMedium = vulnerabilities.some(cve => 
        vulnerabilityPatterns[cve as keyof typeof vulnerabilityPatterns]?.severity === 'high'
      );
      
      if (hasHigh) riskLevel = 'critical';
      else if (hasMedium) riskLevel = 'high';
      else riskLevel = 'medium';
    } else if (openPorts.length > 5) {
      riskLevel = 'low';
    }

    devices.push({
      ip_address: ip,
      hostname: `device-${ip.split('.').pop()}`,
      device_type: deviceType,
      mac_address: `00:1B:44:11:3A:${Math.floor(Math.random() * 255).toString(16).padStart(2, '0')}`,
      manufacturer: 'Unknown',
      os_info: deviceType === 'workstation' ? 'Windows' : 'Linux',
      open_ports: openPorts,
      last_seen: new Date().toISOString(),
      status: 'online',
      vulnerabilities,
      risk_level: riskLevel,
    });
  }

  return devices;
}

function parseNetworkRange(range: string): string[] {
  const ips: string[] = [];
  
  if (range.includes('/')) {
    // CIDR notation
    const [baseIp, mask] = range.split('/');
    const maskNum = parseInt(mask);
    
    if (maskNum >= 24) {
      const baseParts = baseIp.split('.').map(Number);
      const hostBits = 32 - maskNum;
      const maxHosts = Math.min(Math.pow(2, hostBits) - 2, 20);
      
      for (let i = 1; i <= maxHosts; i++) {
        const ip = `${baseParts[0]}.${baseParts[1]}.${baseParts[2]}.${baseParts[3] + i}`;
        ips.push(ip);
      }
    }
  } else if (range.includes('-')) {
    // Range notation
    const [startIp, endIp] = range.split('-');
    const startNum = parseInt(startIp.split('.').pop() || '1');
    const endNum = parseInt(endIp.split('.').pop() || '1');
    const base = startIp.substring(0, startIp.lastIndexOf('.'));
    
    for (let i = startNum; i <= Math.min(endNum, startNum + 20); i++) {
      ips.push(`${base}.${i}`);
    }
  } else {
    ips.push(range);
  }
  
  return ips;
}

async function pingHost(ip: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`http://${ip}`, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    
    return response !== null;
  } catch {
    return false;
  }
}

async function scanPort(ip: string, port: number): Promise<boolean> {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 1000);
    
    const response = await fetch(`http://${ip}:${port}`, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);
    
    return response !== null;
  } catch {
    return false;
  }
}

// MDR Analysis functionality
async function performMDRAnalysis(supabaseClient: any, userId: string, connectorId: string) {
  const threats: any[] = [];
  
  // Analyze recent security events
  const { data: securityEvents } = await supabaseClient
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    .order('created_at', { ascending: false });

  // Analyze failed login patterns
  const failedLogins = securityEvents?.filter(e => e.event_type === 'failed_login') || [];
  if (failedLogins.length > 10) {
    threats.push({
      title: 'Potential Brute Force Attack',
      description: `Detected ${failedLogins.length} failed login attempts in the last 24 hours`,
      severity: failedLogins.length > 50 ? 'critical' : 'high',
      affected_assets: [...new Set(failedLogins.map(l => l.source_ip))],
      source: 'mdr_analysis',
      created_at: new Date().toISOString()
    });
  }

  // Analyze network anomalies
  const { data: networkAssets } = await supabaseClient
    .from('network_assets')
    .select('*')
    .eq('user_id', userId)
    .in('risk_level', ['high', 'critical']);

  if (networkAssets && networkAssets.length > 0) {
    threats.push({
      title: 'High Risk Network Devices Detected',
      description: `Found ${networkAssets.length} devices with high or critical risk levels`,
      severity: 'high',
      affected_assets: networkAssets.map(a => a.ip_address),
      source: 'network_analysis',
      created_at: new Date().toISOString()
    });
  }

  // Analyze compliance violations
  const { data: complianceAlerts } = await supabaseClient
    .from('compliance_alerts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'open')
    .in('severity', ['high', 'critical']);

  if (complianceAlerts && complianceAlerts.length > 0) {
    threats.push({
      title: 'Critical Compliance Violations',
      description: `Found ${complianceAlerts.length} critical compliance issues requiring immediate attention`,
      severity: 'high',
      affected_assets: complianceAlerts.map(a => a.source_data_id).filter(Boolean),
      source: 'compliance_analysis',
      created_at: new Date().toISOString()
    });
  }

  return {
    threats,
    analysisTimestamp: new Date().toISOString(),
    totalThreats: threats.length,
    criticalThreats: threats.filter(t => t.severity === 'critical').length,
    highThreats: threats.filter(t => t.severity === 'high').length
  };
}

// Security incident creation
async function createSecurityIncident(supabaseClient: any, userId: string, incident: Omit<SecurityIncident, 'id' | 'created_at' | 'status'>) {
  const { data, error } = await supabaseClient
    .from('incidents')
    .insert({
      user_id: userId,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      category: 'Security Incident',
      affected_systems: incident.affected_assets,
      status: 'open',
      priority: incident.severity === 'critical' ? 'critical' : 
                incident.severity === 'high' ? 'high' : 'medium',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create security incident:', error);
    throw error;
  }

  return data;
}
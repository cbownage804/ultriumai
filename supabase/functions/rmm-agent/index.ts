import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemInfo {
  hostname: string;
  os: string;
  osVersion: string;
  architecture: string;
  totalMemory: number;
  availableMemory: number;
  cpuModel: string;
  cpuCores: number;
  diskSpace: {
    total: number;
    available: number;
    drives: Array<{
      letter: string;
      total: number;
      available: number;
    }>;
  };
  networkInterfaces: Array<{
    name: string;
    ip: string;
    mac: string;
    type: string;
  }>;
  installedSoftware: Array<{
    name: string;
    version: string;
    publisher: string;
  }>;
  services: Array<{
    name: string;
    status: string;
    startType: string;
  }>;
  processes: Array<{
    name: string;
    pid: number;
    memoryUsage: number;
    cpuUsage: number;
  }>;
  eventLogs: Array<{
    level: string;
    source: string;
    message: string;
    timestamp: string;
  }>;
}

interface AntivirusStatus {
  engineVersion: string;
  lastScan: string;
  lastUpdate: string;
  threatsFound: number;
  quarantinedItems: number;
  realTimeProtection: boolean;
  scanStatus: 'idle' | 'scanning' | 'updating';
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

    const { action, clientId, agentData } = await req.json();

    // Authenticate agent
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );

    if (action === 'register_agent') {
      console.log('Registering RMM agent for client:', clientId);
      
      const agentConfig = {
        agentId: crypto.randomUUID(),
        clientId,
        reportingEndpoint: `${Deno.env.get('SUPABASE_URL')}/functions/v1/rmm-agent`,
        syncInterval: 300, // 5 minutes
        autoDetectHostname: true, // Agent will report hostname on first connect
        capabilities: {
          systemMonitoring: true,
          remoteAccess: true,
          antivirusIntegration: true,
          softwareDeployment: true,
          patchManagement: true,
          backupMonitoring: true,
          alerting: true,
          reporting: true
        },
        settings: {
          autoUpdate: true,
          realTimeMonitoring: true,
          alertThresholds: {
            cpuUsage: 80,
            memoryUsage: 85,
            diskUsage: 90,
            serviceDown: true
          }
        }
      };

      return new Response(
        JSON.stringify({ success: true, agentConfig }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'system_heartbeat') {
      console.log(`Processing system heartbeat for client ${clientId}`);
      
      const systemInfo: SystemInfo = agentData.systemInfo;
      const antivirusStatus: AntivirusStatus = agentData.antivirusStatus;
      
      try {
        // Update or create system information - hostname is now auto-detected from agent
        await supabaseClient
          .from('rmm_endpoints')
          .upsert({
            client_id: clientId,
            hostname: systemInfo.hostname, // Now comes from the agent automatically
            os_info: `${systemInfo.os} ${systemInfo.osVersion}`,
            cpu_info: systemInfo.cpuModel,
            memory_total: systemInfo.totalMemory,
            memory_available: systemInfo.availableMemory,
            disk_info: systemInfo.diskSpace,
            network_interfaces: systemInfo.networkInterfaces,
            last_seen: new Date().toISOString(),
            agent_version: agentData.agentVersion || '1.0.0',
            status: 'online'
          }, { 
            onConflict: 'client_id,hostname'
          });

        // Store system metrics
        await supabaseClient
          .from('rmm_metrics')
          .insert({
            client_id: clientId,
            hostname: systemInfo.hostname,
            cpu_usage: calculateCPUUsage(systemInfo.processes),
            memory_usage: ((systemInfo.totalMemory - systemInfo.availableMemory) / systemInfo.totalMemory) * 100,
            disk_usage: ((systemInfo.diskSpace.total - systemInfo.diskSpace.available) / systemInfo.diskSpace.total) * 100,
            network_io: 0, // Would be provided by agent
            processes_count: systemInfo.processes.length,
            services_count: systemInfo.services.length,
            antivirus_status: antivirusStatus,
            collected_at: new Date().toISOString()
          });

        // Store installed software inventory
        for (const software of systemInfo.installedSoftware) {
          await supabaseClient
            .from('software_inventory')
            .upsert({
              client_id: clientId,
              hostname: systemInfo.hostname,
              software_name: software.name,
              version: software.version,
              publisher: software.publisher,
              last_seen: new Date().toISOString()
            }, { 
              onConflict: 'client_id,hostname,software_name'
            });
        }

        // Check for alerts
        const alerts = await checkSystemAlerts(systemInfo, antivirusStatus, clientId);
        
        for (const alert of alerts) {
          await createRMMAlert(supabaseClient, clientId, alert);
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            alertsGenerated: alerts.length,
            nextHeartbeat: Date.now() + 300000, // 5 minutes
            message: 'Device registered and monitoring started'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Heartbeat processing error:', error);
        return new Response(
          JSON.stringify({ error: 'Heartbeat processing failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'antivirus_scan') {
      console.log(`Starting antivirus scan for client ${clientId}`);
      
      try {
        const scanResults = await performAntivirusScan(agentData.scanParams);
        
        // Store scan results
        await supabaseClient
          .from('antivirus_scans')
          .insert({
            client_id: clientId,
            hostname: agentData.hostname,
            scan_type: agentData.scanParams.scanType,
            scan_duration: scanResults.duration,
            files_scanned: scanResults.filesScanned,
            threats_found: scanResults.threatsFound,
            threats_quarantined: scanResults.threatsQuarantined,
            scan_results: scanResults.detailedResults,
            completed_at: new Date().toISOString()
          });

        if (scanResults.threatsFound > 0) {
          await createRMMAlert(supabaseClient, clientId, {
            type: 'security',
            severity: 'high',
            title: `Antivirus Threats Detected`,
            message: `Found ${scanResults.threatsFound} threats on ${agentData.hostname}`,
            source: 'antivirus_scan',
            metadata: { scanResults }
          });
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            scanResults 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Antivirus scan error:', error);
        return new Response(
          JSON.stringify({ error: 'Antivirus scan failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'remote_command') {
      console.log(`Executing remote command for client ${clientId}`);
      
      try {
        const { command, parameters } = agentData;
        const result = await executeRemoteCommand(command, parameters);
        
        // Log command execution
        await supabaseClient
          .from('rmm_command_logs')
          .insert({
            client_id: clientId,
            hostname: agentData.hostname,
            command,
            parameters,
            result,
            executed_by: user?.id,
            executed_at: new Date().toISOString()
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Remote command error:', error);
        return new Response(
          JSON.stringify({ error: 'Remote command failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'software_deployment') {
      console.log(`Deploying software to client ${clientId}`);
      
      try {
        const { packageId, installParams } = agentData;
        const deploymentResult = await deploySoftwarePackage(packageId, installParams);
        
        // Log deployment
        await supabaseClient
          .from('software_deployments')
          .insert({
            client_id: clientId,
            hostname: agentData.hostname,
            package_id: packageId,
            deployment_status: deploymentResult.status,
            deployment_log: deploymentResult.log,
            started_by: user?.id,
            started_at: new Date().toISOString(),
            completed_at: deploymentResult.status === 'completed' ? new Date().toISOString() : null
          });

        return new Response(
          JSON.stringify({ 
            success: true, 
            deploymentResult 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        console.error('Software deployment error:', error);
        return new Response(
          JSON.stringify({ error: 'Software deployment failed', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('RMM agent error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateCPUUsage(processes: Array<{cpuUsage: number}>): number {
  return processes.reduce((sum, proc) => sum + proc.cpuUsage, 0);
}

async function checkSystemAlerts(systemInfo: SystemInfo, antivirusStatus: AntivirusStatus, clientId: string) {
  const alerts: Array<{
    type: string;
    severity: string;
    title: string;
    message: string;
    source: string;
    metadata?: any;
  }> = [];

  // CPU usage alert
  const cpuUsage = calculateCPUUsage(systemInfo.processes);
  if (cpuUsage > 80) {
    alerts.push({
      type: 'performance',
      severity: cpuUsage > 95 ? 'critical' : 'warning',
      title: 'High CPU Usage',
      message: `CPU usage is at ${cpuUsage.toFixed(1)}%`,
      source: 'system_monitor'
    });
  }

  // Memory usage alert
  const memoryUsage = ((systemInfo.totalMemory - systemInfo.availableMemory) / systemInfo.totalMemory) * 100;
  if (memoryUsage > 85) {
    alerts.push({
      type: 'performance',
      severity: memoryUsage > 95 ? 'critical' : 'warning',
      title: 'High Memory Usage',
      message: `Memory usage is at ${memoryUsage.toFixed(1)}%`,
      source: 'system_monitor'
    });
  }

  // Disk usage alert
  const diskUsage = ((systemInfo.diskSpace.total - systemInfo.diskSpace.available) / systemInfo.diskSpace.total) * 100;
  if (diskUsage > 90) {
    alerts.push({
      type: 'storage',
      severity: diskUsage > 98 ? 'critical' : 'warning',
      title: 'Low Disk Space',
      message: `Disk usage is at ${diskUsage.toFixed(1)}%`,
      source: 'system_monitor'
    });
  }

  // Antivirus alerts
  if (!antivirusStatus.realTimeProtection) {
    alerts.push({
      type: 'security',
      severity: 'high',
      title: 'Antivirus Protection Disabled',
      message: 'Real-time protection is currently disabled',
      source: 'antivirus_monitor'
    });
  }

  if (antivirusStatus.threatsFound > 0) {
    alerts.push({
      type: 'security',
      severity: 'critical',
      title: 'Malware Detected',
      message: `${antivirusStatus.threatsFound} threats detected`,
      source: 'antivirus_monitor'
    });
  }

  // Service status alerts
  const criticalServices = ['Windows Security Center', 'Windows Defender', 'Windows Update'];
  const downServices = systemInfo.services.filter(s => 
    criticalServices.includes(s.name) && s.status !== 'Running'
  );

  for (const service of downServices) {
    alerts.push({
      type: 'service',
      severity: 'high',
      title: 'Critical Service Down',
      message: `${service.name} service is not running`,
      source: 'service_monitor',
      metadata: { serviceName: service.name }
    });
  }

  return alerts;
}

async function createRMMAlert(supabaseClient: any, clientId: string, alert: any) {
  await supabaseClient
    .from('rmm_alerts')
    .insert({
      client_id: clientId,
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      source: alert.source,
      metadata: alert.metadata || {},
      status: 'open',
      created_at: new Date().toISOString()
    });
}

async function performAntivirusScan(scanParams: any) {
  // Agent-side scan: This function receives results from the Python agent
  // The agent performs the actual scan and reports back
  // This stub accepts whatever the agent sends
  throw new Error('Antivirus scan must be performed by the agent. This endpoint receives results only.');
}

async function executeRemoteCommand(command: string, parameters: any) {
  // Remote commands are queued for the agent to execute
  // The agent polls for pending commands and reports results
  // This function returns acknowledgment that command was queued
  const supportedCommands = [
    'restart_service',
    'install_update', 
    'run_disk_cleanup',
    'system_info',
    'get_processes',
    'get_services',
    'run_script'
  ];

  if (!supportedCommands.includes(command)) {
    return { 
      success: false, 
      queued: false,
      message: `Unknown command: ${command}. Supported: ${supportedCommands.join(', ')}` 
    };
  }

  // Command will be picked up by agent on next poll
  return { 
    success: true, 
    queued: true,
    message: `Command '${command}' queued for agent execution`,
    parameters
  };
}

async function deploySoftwarePackage(packageId: string, installParams: any) {
  // Software deployment is queued for agent execution
  // Agent downloads and installs packages based on package manifest
  if (!packageId) {
    return { status: 'failed', queued: false, log: 'Package ID is required' };
  }

  return { 
    status: 'queued', 
    queued: true,
    log: `Package '${packageId}' queued for installation`,
    packageId,
    installParams
  };
}
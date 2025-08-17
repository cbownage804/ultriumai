import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NetworkConnectorRequest {
  action: 'register' | 'heartbeat' | 'scan' | 'results';
  connectorId: string;
  data?: any;
}

interface NetworkScanRequest {
  targets: string[];
  scanType: 'discovery' | 'vulnerability' | 'compliance' | 'full';
  options: {
    depth?: number;
    aggressive?: boolean;
    credentials?: boolean;
    ports?: string;
  };
}

interface ScanResult {
  target: string;
  status: 'completed' | 'failed' | 'partial';
  findings: NetworkFinding[];
  metadata: {
    scanTime: number;
    toolsUsed: string[];
    coverage: number;
  };
}

interface NetworkFinding {
  id: string;
  type: 'vulnerability' | 'misconfiguration' | 'exposure' | 'compliance';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  target: string;
  port?: number;
  service?: string;
  impact: string;
  recommendation: string;
  evidence: any[];
  cve?: string;
  cvss?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, connectorId, data }: NetworkConnectorRequest = await req.json();

    switch (action) {
      case 'register':
        return await handleConnectorRegistration(supabase, connectorId, data);
      
      case 'heartbeat':
        return await handleConnectorHeartbeat(supabase, connectorId, data);
      
      case 'scan':
        return await handleNetworkScan(supabase, connectorId, data);
      
      case 'results':
        return await handleScanResults(supabase, connectorId, data);
      
      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in vanguard-network-connector:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function handleConnectorRegistration(supabase: any, connectorId: string, data: any) {
  console.log(`Registering network connector: ${connectorId}`);
  
  // Register or update connector
  const { error } = await supabase
    .from('network_connectors')
    .upsert({
      id: connectorId,
      name: data.name || `Connector-${connectorId.slice(0, 8)}`,
      location: data.location || 'Unknown',
      network_ranges: data.networkRanges || [],
      capabilities: data.capabilities || ['discovery', 'vulnerability'],
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      version: data.version || '1.0.0',
      os_info: data.osInfo || {},
      tools_available: data.toolsAvailable || []
    });

  if (error) {
    throw new Error(`Registration failed: ${error.message}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      message: 'Connector registered successfully',
      connectorId 
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleConnectorHeartbeat(supabase: any, connectorId: string, data: any) {
  // Update connector status and metrics
  const { error } = await supabase
    .from('network_connectors')
    .update({
      status: 'online',
      last_heartbeat: new Date().toISOString(),
      system_metrics: data.metrics || {},
      active_scans: data.activeScans || 0
    })
    .eq('id', connectorId);

  if (error) {
    console.error('Heartbeat update failed:', error);
  }

  // Get pending scan jobs for this connector
  const { data: pendingJobs, error: jobError } = await supabase
    .from('network_scan_jobs')
    .select('*')
    .eq('connector_id', connectorId)
    .eq('status', 'pending')
    .limit(5);

  return new Response(
    JSON.stringify({ 
      success: true,
      pendingJobs: pendingJobs || []
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleNetworkScan(supabase: any, connectorId: string, scanRequest: NetworkScanRequest) {
  console.log(`Initiating network scan via connector: ${connectorId}`);
  
  // Create scan job
  const jobId = crypto.randomUUID();
  const { error } = await supabase
    .from('network_scan_jobs')
    .insert({
      id: jobId,
      connector_id: connectorId,
      targets: scanRequest.targets,
      scan_type: scanRequest.scanType,
      options: scanRequest.options,
      status: 'running',
      started_at: new Date().toISOString()
    });

  if (error) {
    throw new Error(`Failed to create scan job: ${error.message}`);
  }

  // Generate scan commands based on type and options
  const scanCommands = generateScanCommands(scanRequest);

  return new Response(
    JSON.stringify({ 
      success: true,
      jobId,
      commands: scanCommands,
      message: 'Scan job created successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleScanResults(supabase: any, connectorId: string, results: any) {
  console.log(`Processing scan results from connector: ${connectorId}`);
  
  const { jobId, scanResults, status } = results;

  // Update scan job status
  await supabase
    .from('network_scan_jobs')
    .update({
      status,
      completed_at: new Date().toISOString(),
      results_summary: {
        targets_scanned: scanResults.length,
        total_findings: scanResults.reduce((sum: number, r: ScanResult) => sum + r.findings.length, 0)
      }
    })
    .eq('id', jobId);

  // Process and store findings
  for (const result of scanResults) {
    if (result.findings.length > 0) {
      // Store findings in database
      await supabase
        .from('network_findings')
        .insert(
          result.findings.map((finding: NetworkFinding) => ({
            ...finding,
            job_id: jobId,
            connector_id: connectorId,
            discovered_at: new Date().toISOString()
          }))
        );

      // Trigger AI analysis for high-severity findings
      const criticalFindings = result.findings.filter(f => 
        f.severity === 'critical' || f.severity === 'high'
      );

      if (criticalFindings.length > 0) {
        await triggerAIAnalysis(supabase, jobId, criticalFindings);
      }
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Scan results processed successfully'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateScanCommands(scanRequest: NetworkScanRequest): any[] {
  const commands = [];
  
  for (const target of scanRequest.targets) {
    switch (scanRequest.scanType) {
      case 'discovery':
        commands.push({
          tool: 'nmap',
          command: `nmap -sn ${target}`,
          description: 'Network discovery scan'
        });
        break;
        
      case 'vulnerability':
        commands.push({
          tool: 'nmap',
          command: `nmap -sV --script vuln ${target}`,
          description: 'Vulnerability scan with version detection'
        });
        break;
        
      case 'compliance':
        commands.push({
          tool: 'nmap',
          command: `nmap -sV --script ssl-enum-ciphers,ssh-audit ${target}`,
          description: 'Compliance and configuration audit'
        });
        break;
        
      case 'full':
        commands.push(
          {
            tool: 'nmap',
            command: `nmap -sS -sV -O --script default,vuln ${target}`,
            description: 'Comprehensive port and vulnerability scan'
          },
          {
            tool: 'nmap',
            command: `nmap --script ssl-cert,ssl-enum-ciphers ${target}`,
            description: 'SSL/TLS security assessment'
          }
        );
        break;
    }
  }
  
  return commands;
}

async function triggerAIAnalysis(supabase: any, jobId: string, findings: NetworkFinding[]) {
  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) return;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are a cybersecurity expert analyzing network vulnerability findings. Provide risk assessment, attack scenarios, and prioritized remediation recommendations.'
          },
          {
            role: 'user',
            content: `Analyze these critical network security findings and provide risk assessment:\n\n${JSON.stringify(findings, null, 2)}`
          }
        ],
        max_completion_tokens: 1500
      }),
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    // Store AI analysis
    await supabase
      .from('ai_analysis_results')
      .insert({
        job_id: jobId,
        analysis_type: 'network_security',
        findings_count: findings.length,
        ai_analysis: analysis,
        risk_score: calculateRiskScore(findings),
        created_at: new Date().toISOString()
      });

  } catch (error) {
    console.error('AI analysis failed:', error);
  }
}

function calculateRiskScore(findings: NetworkFinding[]): number {
  let score = 0;
  findings.forEach(finding => {
    switch (finding.severity) {
      case 'critical': score += 10; break;
      case 'high': score += 7; break;
      case 'medium': score += 4; break;
      case 'low': score += 1; break;
    }
  });
  return Math.min(score, 100);
}
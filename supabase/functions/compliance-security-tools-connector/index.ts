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

    const { action, connectorId, toolType } = await req.json();

    if (action === 'sync_data') {
      console.log(`Syncing security tools data for connector ${connectorId}, tool: ${toolType}`);
      
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
        
        // Route to appropriate security tool analyzer
        switch (toolType || connector.configuration.toolType) {
          case 'crowdstrike':
            const crowdStrikeData = await analyzeCrowdStrike(connector.configuration);
            complianceData.push(...crowdStrikeData);
            break;
          
          case 'splunk':
            const splunkData = await analyzeSplunk(connector.configuration);
            complianceData.push(...splunkData);
            break;
          
          case 'okta':
            const oktaData = await analyzeOkta(connector.configuration);
            complianceData.push(...oktaData);
            break;
          
          case 'qualys':
            const qualysData = await analyzeQualys(connector.configuration);
            complianceData.push(...qualysData);
            break;
          
          case 'tenable':
            const tenableData = await analyzeTenable(connector.configuration);
            complianceData.push(...tenableData);
            break;
          
          default:
            throw new Error(`Unsupported security tool: ${toolType}`);
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

        console.log(`Security tools sync completed: ${complianceData.length} data points collected`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            dataPointsCollected: complianceData.length,
            message: `${toolType} data processed successfully`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        console.error('Security tools sync error:', syncError);
        
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Security tools sync failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Security tools connector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeCrowdStrike(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock CrowdStrike endpoint analysis
  const endpoints = [
    {
      hostname: 'WORKSTATION-001',
      lastSeen: '2025-01-06T12:00:00Z',
      agentVersion: '7.10.123',
      isolationStatus: 'normal',
      preventionPolicyApplied: true,
      threatsDetected: 0,
      compliant: true
    },
    {
      hostname: 'SERVER-DB-01',
      lastSeen: '2025-01-04T08:00:00Z',
      agentVersion: '7.08.100',
      isolationStatus: 'normal',
      preventionPolicyApplied: false,
      threatsDetected: 2,
      compliant: false
    }
  ];

  for (const endpoint of endpoints) {
    dataPoints.push({
      dataType: 'endpoint_security',
      dataSource: `CrowdStrike Endpoint: ${endpoint.hostname}`,
      rawData: endpoint,
      complianceStatus: endpoint.compliant ? 'compliant' : 'non_compliant',
      riskLevel: endpoint.threatsDetected > 0 ? 'high' : 
                !endpoint.preventionPolicyApplied ? 'medium' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC7.1'],
        'nist': ['SI-3', 'SI-4'],
        'iso27001': ['A.12.2.1']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeSplunk(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Splunk log analysis
  const logAnalysis = {
    totalEvents: 1500000,
    securityEvents: 25000,
    criticalAlerts: 5,
    dataIngestionHealth: 98.5,
    retentionPolicyCompliant: true,
    encryptionEnabled: true,
    compliant: true
  };

  dataPoints.push({
    dataType: 'log_management',
    dataSource: 'Splunk Log Analysis',
    rawData: logAnalysis,
    complianceStatus: logAnalysis.compliant ? 'compliant' : 'non_compliant',
    riskLevel: logAnalysis.criticalAlerts > 10 ? 'high' : 'low',
    frameworkMappings: {
      'soc2': ['CC7.2'],
      'nist': ['AU-2', 'AU-6'],
      'pci_dss': ['10.2', '10.5']
    }
  });
  
  return dataPoints;
}

async function analyzeOkta(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Okta identity analysis
  const identityData = [
    {
      userName: 'admin@company.com',
      mfaEnabled: true,
      lastLogin: '2025-01-06T10:00:00Z',
      privilegedAccess: true,
      suspiciousActivity: false,
      compliant: true
    },
    {
      userName: 'contractor@company.com',
      mfaEnabled: false,
      lastLogin: '2024-12-15T15:00:00Z',
      privilegedAccess: false,
      suspiciousActivity: true,
      compliant: false
    }
  ];

  for (const user of identityData) {
    dataPoints.push({
      dataType: 'identity_access',
      dataSource: `Okta User: ${user.userName}`,
      rawData: user,
      complianceStatus: user.compliant ? 'compliant' : 'non_compliant',
      riskLevel: user.suspiciousActivity ? 'high' : 
                !user.mfaEnabled && user.privilegedAccess ? 'critical' :
                !user.mfaEnabled ? 'medium' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC6.2'],
        'nist': ['IA-2', 'AC-2'],
        'iso27001': ['A.9.2.4']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeQualys(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Qualys vulnerability scan results
  const vulnerabilities = [
    {
      asset: '192.168.1.100',
      title: 'Critical Windows Security Update Missing',
      severity: 'critical',
      cvss: 9.8,
      patchAvailable: true,
      ageInDays: 15,
      compliant: false
    },
    {
      asset: '192.168.1.101',
      title: 'SSL Certificate Expiring Soon',
      severity: 'medium',
      cvss: 5.3,
      patchAvailable: false,
      ageInDays: 5,
      compliant: false
    }
  ];

  for (const vuln of vulnerabilities) {
    dataPoints.push({
      dataType: 'vulnerability_scan',
      dataSource: `Qualys Vulnerability: ${vuln.asset}`,
      rawData: vuln,
      complianceStatus: vuln.compliant ? 'compliant' : 'non_compliant',
      riskLevel: vuln.severity as 'low' | 'medium' | 'high' | 'critical',
      frameworkMappings: {
        'soc2': ['CC7.1'],
        'nist': ['SI-2', 'RA-5'],
        'iso27001': ['A.12.6.1']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeTenable(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Tenable vulnerability management analysis
  const assetAnalysis = {
    totalAssets: 250,
    criticalVulnerabilities: 12,
    highVulnerabilities: 45,
    mediumVulnerabilities: 120,
    patchComplianceRate: 85.5,
    scanCoverage: 98.2,
    compliant: false // due to critical vulnerabilities
  };

  dataPoints.push({
    dataType: 'asset_vulnerability',
    dataSource: 'Tenable Asset Analysis',
    rawData: assetAnalysis,
    complianceStatus: assetAnalysis.compliant ? 'compliant' : 'non_compliant',
    riskLevel: assetAnalysis.criticalVulnerabilities > 10 ? 'critical' : 'medium',
    frameworkMappings: {
      'soc2': ['CC7.1'],
      'nist': ['SI-2', 'RA-5'],
      'pci_dss': ['11.2']
    }
  });
  
  return dataPoints;
}

async function generateComplianceAlert(supabaseClient: any, userId: string, connectorId: string, dataPoint: ComplianceDataPoint) {
  await supabaseClient
    .from('compliance_alerts')
    .insert({
      user_id: userId,
      alert_type: 'control_failure',
      severity: dataPoint.riskLevel,
      title: `Security Tool Compliance Issue: ${dataPoint.dataSource}`,
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
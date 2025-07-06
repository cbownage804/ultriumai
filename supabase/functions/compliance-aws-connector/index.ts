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

    const { action, connectorId, awsConfig } = await req.json();

    if (action === 'sync_data') {
      console.log(`Syncing AWS data for connector ${connectorId}`);
      
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
        
        // Analyze AWS IAM policies
        const iamData = await analyzeIAMPolicies(connector.configuration);
        complianceData.push(...iamData);

        // Analyze AWS S3 bucket configurations
        const s3Data = await analyzeS3Buckets(connector.configuration);
        complianceData.push(...s3Data);

        // Analyze AWS VPC security groups
        const vpcData = await analyzeVPCSecurityGroups(connector.configuration);
        complianceData.push(...vpcData);

        // Analyze AWS CloudTrail logs
        const cloudTrailData = await analyzeCloudTrailLogs(connector.configuration);
        complianceData.push(...cloudTrailData);

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

        console.log(`AWS sync completed: ${complianceData.length} data points collected`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            dataPointsCollected: complianceData.length,
            message: 'AWS data processed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        console.error('AWS sync error:', syncError);
        
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'AWS sync failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AWS connector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeIAMPolicies(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock IAM policy analysis - in production, this would call AWS APIs
  const iamPolicies = [
    {
      policyName: 'AdminAccess',
      attachedTo: ['user1', 'user2'],
      permissions: ['*'],
      overprivileged: true
    },
    {
      policyName: 'S3ReadOnly',
      attachedTo: ['user3'],
      permissions: ['s3:GetObject'],
      overprivileged: false
    }
  ];

  for (const policy of iamPolicies) {
    dataPoints.push({
      dataType: 'iam_policy',
      dataSource: `IAM Policy: ${policy.policyName}`,
      rawData: policy,
      complianceStatus: policy.overprivileged ? 'non_compliant' : 'compliant',
      riskLevel: policy.overprivileged ? 'high' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC6.2'],
        'nist': ['AC-2', 'AC-6'],
        'iso27001': ['A.9.2.3']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeS3Buckets(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock S3 bucket analysis
  const s3Buckets = [
    {
      bucketName: 'company-data-backup',
      publicRead: false,
      publicWrite: false,
      encryption: true,
      versioning: true,
      compliant: true
    },
    {
      bucketName: 'public-assets',
      publicRead: true,
      publicWrite: false,
      encryption: false,
      versioning: false,
      compliant: false
    }
  ];

  for (const bucket of s3Buckets) {
    dataPoints.push({
      dataType: 's3_bucket',
      dataSource: `S3 Bucket: ${bucket.bucketName}`,
      rawData: bucket,
      complianceStatus: bucket.compliant ? 'compliant' : 'non_compliant',
      riskLevel: bucket.publicWrite ? 'critical' : bucket.publicRead ? 'medium' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1'],
        'hipaa': ['164.312(a)(2)(iv)'],
        'gdpr': ['Art 32']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeVPCSecurityGroups(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock VPC security group analysis
  const securityGroups = [
    {
      groupId: 'sg-12345678',
      groupName: 'web-servers',
      inboundRules: [
        { protocol: 'tcp', port: 80, source: '0.0.0.0/0' },
        { protocol: 'tcp', port: 443, source: '0.0.0.0/0' }
      ],
      overpermissive: false
    },
    {
      groupId: 'sg-87654321',
      groupName: 'database-servers',
      inboundRules: [
        { protocol: 'tcp', port: 3306, source: '0.0.0.0/0' }
      ],
      overpermissive: true
    }
  ];

  for (const sg of securityGroups) {
    dataPoints.push({
      dataType: 'vpc_security_group',
      dataSource: `Security Group: ${sg.groupName}`,
      rawData: sg,
      complianceStatus: sg.overpermissive ? 'non_compliant' : 'compliant',
      riskLevel: sg.overpermissive ? 'high' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1'],
        'nist': ['AC-4', 'SC-7'],
        'pci_dss': ['1.2', '1.3']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeCloudTrailLogs(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock CloudTrail log analysis
  const cloudTrailConfig = {
    enabled: true,
    logFileValidation: true,
    multiRegion: true,
    includeGlobalServices: true,
    s3Bucket: 'cloudtrail-logs-bucket',
    compliant: true
  };

  dataPoints.push({
    dataType: 'cloudtrail_config',
    dataSource: 'AWS CloudTrail Configuration',
    rawData: cloudTrailConfig,
    complianceStatus: cloudTrailConfig.compliant ? 'compliant' : 'non_compliant',
    riskLevel: cloudTrailConfig.compliant ? 'low' : 'high',
    frameworkMappings: {
      'soc2': ['CC7.2'],
      'nist': ['AU-2', 'AU-3'],
      'pci_dss': ['10.2', '10.3']
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
      title: `AWS Compliance Issue: ${dataPoint.dataSource}`,
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
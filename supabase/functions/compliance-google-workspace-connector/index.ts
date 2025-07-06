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

    const { action, connectorId } = await req.json();

    if (action === 'sync_data') {
      console.log(`Syncing Google Workspace data for connector ${connectorId}`);
      
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
        
        // Analyze Google Workspace users
        const userData = await analyzeWorkspaceUsers(connector.configuration);
        complianceData.push(...userData);

        // Analyze Google Drive sharing settings
        const driveData = await analyzeDriveSharing(connector.configuration);
        complianceData.push(...driveData);

        // Analyze Gmail security settings
        const gmailData = await analyzeGmailSecurity(connector.configuration);
        complianceData.push(...gmailData);

        // Analyze Google Admin console settings
        const adminData = await analyzeAdminSettings(connector.configuration);
        complianceData.push(...adminData);

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

        console.log(`Google Workspace sync completed: ${complianceData.length} data points collected`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            dataPointsCollected: complianceData.length,
            message: 'Google Workspace data processed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        console.error('Google Workspace sync error:', syncError);
        
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Google Workspace sync failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Google Workspace connector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function analyzeWorkspaceUsers(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Google Workspace users analysis
  const users = [
    {
      email: 'admin@company.com',
      suspended: false,
      twoStepVerificationEnabled: true,
      lastLoginTime: '2025-01-06T10:00:00Z',
      isAdmin: true,
      compliant: true
    },
    {
      email: 'user@company.com',
      suspended: false,
      twoStepVerificationEnabled: false,
      lastLoginTime: '2025-01-05T15:30:00Z',
      isAdmin: false,
      compliant: false
    }
  ];

  for (const user of users) {
    dataPoints.push({
      dataType: 'workspace_user',
      dataSource: `Workspace User: ${user.email}`,
      rawData: user,
      complianceStatus: user.compliant ? 'compliant' : 'non_compliant',
      riskLevel: !user.twoStepVerificationEnabled && user.isAdmin ? 'critical' : 
                 !user.twoStepVerificationEnabled ? 'medium' : 'low',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC6.2'],
        'nist': ['IA-2', 'IA-5'],
        'iso27001': ['A.9.4.2']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeDriveSharing(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Google Drive sharing analysis
  const driveFiles = [
    {
      fileName: 'Financial_Report_2024.xlsx',
      shared: true,
      sharedWith: ['external@example.com'],
      permissions: 'editor',
      sensitive: true,
      compliant: false
    },
    {
      fileName: 'Team_Meeting_Notes.doc',
      shared: true,
      sharedWith: ['team@company.com'],
      permissions: 'viewer',
      sensitive: false,
      compliant: true
    }
  ];

  for (const file of driveFiles) {
    dataPoints.push({
      dataType: 'drive_sharing',
      dataSource: `Drive File: ${file.fileName}`,
      rawData: file,
      complianceStatus: file.compliant ? 'compliant' : 'non_compliant',
      riskLevel: file.sensitive && !file.compliant ? 'high' : 'low',
      frameworkMappings: {
        'gdpr': ['Art 32'],
        'hipaa': ['164.312(a)(1)'],
        'soc2': ['CC6.1']
      }
    });
  }
  
  return dataPoints;
}

async function analyzeGmailSecurity(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Gmail security settings analysis
  const gmailSettings = {
    spfRecord: true,
    dkimEnabled: true,
    dmarcPolicy: 'quarantine',
    externalSharingRestricted: false,
    dlpRulesEnabled: true,
    compliant: false // due to external sharing not restricted
  };

  dataPoints.push({
    dataType: 'gmail_security',
    dataSource: 'Gmail Security Configuration',
    rawData: gmailSettings,
    complianceStatus: gmailSettings.compliant ? 'compliant' : 'non_compliant',
    riskLevel: !gmailSettings.externalSharingRestricted ? 'medium' : 'low',
    frameworkMappings: {
      'soc2': ['CC6.1'],
      'nist': ['SC-7'],
      'iso27001': ['A.13.2.1']
    }
  });
  
  return dataPoints;
}

async function analyzeAdminSettings(config: any): Promise<ComplianceDataPoint[]> {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Mock Google Admin console settings analysis
  const adminSettings = {
    passwordPolicy: {
      minLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      maxAge: 90
    },
    sessionTimeout: 24, // hours
    auditLogsEnabled: true,
    apiAccessRestricted: true,
    compliant: true
  };

  dataPoints.push({
    dataType: 'admin_settings',
    dataSource: 'Google Admin Console Settings',
    rawData: adminSettings,
    complianceStatus: adminSettings.compliant ? 'compliant' : 'non_compliant',
    riskLevel: adminSettings.compliant ? 'low' : 'medium',
    frameworkMappings: {
      'soc2': ['CC6.1', 'CC7.2'],
      'nist': ['IA-5', 'AU-2'],
      'pci_dss': ['8.2.3']
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
      title: `Google Workspace Compliance Issue: ${dataPoint.dataSource}`,
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
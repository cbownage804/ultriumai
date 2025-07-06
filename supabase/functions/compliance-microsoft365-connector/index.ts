import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MICROSOFT_CLIENT_ID = Deno.env.get('MICROSOFT_CLIENT_ID');
const MICROSOFT_CLIENT_SECRET = Deno.env.get('MICROSOFT_CLIENT_SECRET');
const MICROSOFT_TENANT_ID = Deno.env.get('MICROSOFT_TENANT_ID');

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

    const { action, connectorId, tenantId, clientId, clientSecret } = await req.json();

    if (action === 'test_connection') {
      const token = await getMicrosoftAccessToken(clientId || MICROSOFT_CLIENT_ID, clientSecret || MICROSOFT_CLIENT_SECRET, tenantId || MICROSOFT_TENANT_ID);
      
      if (token) {
        return new Response(
          JSON.stringify({ success: true, message: 'Successfully connected to Microsoft 365' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to authenticate with Microsoft 365' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'sync_data') {
      console.log(`Starting Microsoft 365 data sync for connector ${connectorId}`);
      
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

      const config = connector.configuration;
      const token = await getMicrosoftAccessToken(
        config.clientId || MICROSOFT_CLIENT_ID,
        config.clientSecret || MICROSOFT_CLIENT_SECRET,
        config.tenantId || MICROSOFT_TENANT_ID
      );

      if (!token) {
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: 'Failed to authenticate with Microsoft 365',
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Collect compliance data
      const complianceData: ComplianceDataPoint[] = [];
      
      try {
        // 1. Get user and access data
        const users = await getMicrosoftUsers(token);
        const userAnalysis = analyzeUserCompliance(users);
        complianceData.push(...userAnalysis);

        // 2. Get conditional access policies
        const conditionalAccessPolicies = await getConditionalAccessPolicies(token);
        const policyAnalysis = analyzeConditionalAccessCompliance(conditionalAccessPolicies);
        complianceData.push(...policyAnalysis);

        // 3. Get audit logs
        const auditLogs = await getAuditLogs(token);
        const auditAnalysis = analyzeAuditLogCompliance(auditLogs);
        complianceData.push(...auditAnalysis);

        // 4. Get mailbox permissions and security settings
        const mailboxData = await getMailboxSecurityData(token);
        const mailboxAnalysis = analyzeMailboxCompliance(mailboxData);
        complianceData.push(...mailboxAnalysis);

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

        console.log(`Microsoft 365 sync completed: ${complianceData.length} data points collected`);

        return new Response(
          JSON.stringify({ 
            success: true, 
            dataPointsCollected: complianceData.length,
            message: 'Microsoft 365 data sync completed successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        console.error('Microsoft 365 sync error:', syncError);
        
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Data sync failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Microsoft 365 connector error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getMicrosoftAccessToken(clientId: string, clientSecret: string, tenantId: string): Promise<string | null> {
  try {
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }),
    });

    if (!response.ok) {
      console.error('Failed to get Microsoft access token:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Error getting Microsoft access token:', error);
    return null;
  }
}

async function getMicrosoftUsers(token: string) {
  const response = await fetch('https://graph.microsoft.com/v1.0/users?$select=id,userPrincipalName,displayName,accountEnabled,lastSignInDateTime,createdDateTime,assignedLicenses,mfaDetail', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

async function getConditionalAccessPolicies(token: string) {
  const response = await fetch('https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch conditional access policies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

async function getAuditLogs(token: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const response = await fetch(`https://graph.microsoft.com/v1.0/auditLogs/signIns?$filter=createdDateTime ge ${thirtyDaysAgo.toISOString()}&$top=100`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
  }

  const data = await response.json();
  return data.value || [];
}

async function getMailboxSecurityData(token: string) {
  const response = await fetch('https://graph.microsoft.com/v1.0/admin/exchange/settings', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  }
  
  return {}; // Fallback if Exchange settings aren't accessible
}

function analyzeUserCompliance(users: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  for (const user of users) {
    // Check for MFA compliance
    const hasMFA = user.mfaDetail || user.assignedLicenses?.some((license: any) => 
      license.skuId && license.disabledPlans?.length === 0
    );
    
    dataPoints.push({
      dataType: 'user_access',
      dataSource: `User: ${user.userPrincipalName}`,
      rawData: user,
      complianceStatus: hasMFA ? 'compliant' : 'non_compliant',
      riskLevel: hasMFA ? 'low' : 'high',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC6.2'],
        'hipaa': ['164.312(a)(2)(i)'],
        'pci_dss': ['8.2', '8.3']
      }
    });

    // Check for inactive users
    const lastSignIn = user.lastSignInDateTime ? new Date(user.lastSignInDateTime) : null;
    const daysSinceLastSignIn = lastSignIn ? 
      Math.floor((Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24)) : 
      999;
    
    if (daysSinceLastSignIn > 90 && user.accountEnabled) {
      dataPoints.push({
        dataType: 'user_access',
        dataSource: `Inactive User: ${user.userPrincipalName}`,
        rawData: { ...user, daysSinceLastSignIn },
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

function analyzeConditionalAccessCompliance(policies: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  for (const policy of policies) {
    const requiresMFA = policy.grantControls?.builtInControls?.includes('mfa');
    const isEnabled = policy.state === 'enabled';
    
    dataPoints.push({
      dataType: 'security_policy',
      dataSource: `Conditional Access Policy: ${policy.displayName}`,
      rawData: policy,
      complianceStatus: (isEnabled && requiresMFA) ? 'compliant' : 'non_compliant',
      riskLevel: (isEnabled && requiresMFA) ? 'low' : 'high',
      frameworkMappings: {
        'soc2': ['CC6.1', 'CC6.2'],
        'nist': ['IA-2', 'AC-2']
      }
    });
  }
  
  return dataPoints;
}

function analyzeAuditLogCompliance(auditLogs: any[]): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // Check for failed sign-in attempts
  const failedAttempts = auditLogs.filter(log => log.status?.errorCode !== 0);
  
  if (failedAttempts.length > 0) {
    dataPoints.push({
      dataType: 'security_event',
      dataSource: 'Failed Sign-in Attempts',
      rawData: { failedAttempts: failedAttempts.length, recentFailures: failedAttempts.slice(0, 10) },
      complianceStatus: failedAttempts.length > 100 ? 'non_compliant' : 'needs_review',
      riskLevel: failedAttempts.length > 100 ? 'high' : 'medium',
      frameworkMappings: {
        'soc2': ['CC6.1'],
        'nist': ['AU-2', 'AU-3']
      }
    });
  }
  
  return dataPoints;
}

function analyzeMailboxCompliance(mailboxData: any): ComplianceDataPoint[] {
  const dataPoints: ComplianceDataPoint[] = [];
  
  // This would analyze Exchange settings for compliance
  // For now, we'll create a placeholder entry
  dataPoints.push({
    dataType: 'email_security',
    dataSource: 'Exchange Security Settings',
    rawData: mailboxData,
    complianceStatus: 'needs_review',
    riskLevel: 'medium',
    frameworkMappings: {
      'soc2': ['CC6.1'],
      'hipaa': ['164.312(e)(1)']
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
      title: `Microsoft 365 Compliance Issue: ${dataPoint.dataSource}`,
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
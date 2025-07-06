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
          securityEvents: true
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
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || (await req.json()).action;

    if (action === 'get_dashboard_data') {
      console.log('Fetching compliance dashboard data');
      
      const dashboardData = await getComplianceDashboardData(supabaseClient, user.id);
      
      return new Response(
        JSON.stringify(dashboardData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create_connector') {
      const { connectorType, connectorName, configuration } = await req.json();
      
      console.log(`Creating ${connectorType} connector: ${connectorName}`);
      
      const { data: connector, error } = await supabaseClient
        .from('compliance_connectors')
        .insert({
          user_id: user.id,
          connector_type: connectorType,
          connector_name: connectorName,
          configuration: configuration || {},
          status: 'inactive'
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to create connector', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, connector }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'sync_connector') {
      const { connectorId } = await req.json();
      
      console.log(`Syncing connector: ${connectorId}`);
      
      // Get connector details
      const { data: connector } = await supabaseClient
        .from('compliance_connectors')
        .select('*')
        .eq('id', connectorId)
        .eq('user_id', user.id)
        .single();

      if (!connector) {
        return new Response(
          JSON.stringify({ error: 'Connector not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update connector status to connecting
      await supabaseClient
        .from('compliance_connectors')
        .update({ status: 'connecting', updated_at: new Date().toISOString() })
        .eq('id', connectorId);

      // Trigger appropriate connector based on type
      let syncResult;
      try {
        switch (connector.connector_type) {
          case 'microsoft_365':
            syncResult = await supabaseClient.functions.invoke('compliance-microsoft365-connector', {
              body: { action: 'sync_data', connectorId }
            });
            break;
          
          case 'domain_controller':
            syncResult = await supabaseClient.functions.invoke('compliance-domain-controller', {
              body: { action: 'agent_data', connectorId, agentData: {} }
            });
            break;
          
          default:
            throw new Error(`Unsupported connector type: ${connector.connector_type}`);
        }

        if (syncResult.error) {
          throw new Error(syncResult.error.message);
        }

        return new Response(
          JSON.stringify({ success: true, result: syncResult.data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (syncError) {
        // Update connector status to error
        await supabaseClient
          .from('compliance_connectors')
          .update({ 
            status: 'error', 
            error_message: syncError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', connectorId);

        return new Response(
          JSON.stringify({ error: 'Sync failed', details: syncError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'get_compliance_report') {
      const { framework } = await req.json();
      
      console.log(`Generating compliance report for: ${framework}`);
      
      const report = await generateComplianceReport(supabaseClient, user.id, framework);
      
      return new Response(
        JSON.stringify(report),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'resolve_alert') {
      const { alertId, resolution } = await req.json();
      
      console.log(`Resolving alert: ${alertId}`);
      
      const { data: alert, error } = await supabaseClient
        .from('compliance_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          resolution_notes: resolution,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Failed to resolve alert', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, alert }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Compliance manager error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getComplianceDashboardData(supabaseClient: any, userId: string) {
  try {
    // Get connectors
    const { data: connectors } = await supabaseClient
      .from('compliance_connectors')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // Get recent compliance data
    const { data: complianceData } = await supabaseClient
      .from('compliance_data')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    // Get active alerts
    const { data: alerts } = await supabaseClient
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50);

    // Get evidence count
    const { data: evidence } = await supabaseClient
      .from('compliance_evidence')
      .select('id, framework, verification_status')
      .eq('user_id', userId);

    // Calculate compliance metrics
    const metrics = calculateComplianceMetrics(complianceData || [], alerts || [], evidence || []);

    return {
      connectors: connectors || [],
      complianceData: complianceData || [],
      alerts: alerts || [],
      evidence: evidence || [],
      metrics,
      lastUpdated: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      connectors: [],
      complianceData: [],
      alerts: [],
      evidence: [],
      metrics: {
        overallCompliance: 0,
        totalControls: 0,
        compliantControls: 0,
        criticalIssues: 0,
        frameworkStatus: {}
      },
      error: error.message
    };
  }
}

function calculateComplianceMetrics(complianceData: any[], alerts: any[], evidence: any[]) {
  const totalDataPoints = complianceData.length;
  const compliantDataPoints = complianceData.filter(d => d.compliance_status === 'compliant').length;
  const criticalIssues = alerts.filter(a => a.severity === 'critical').length;
  
  // Calculate framework-specific metrics
  const frameworks = ['soc2', 'hipaa', 'pci_dss', 'gdpr', 'iso27001'];
  const frameworkStatus: Record<string, any> = {};
  
  for (const framework of frameworks) {
    const frameworkData = complianceData.filter(d => 
      d.framework_mappings && d.framework_mappings[framework]
    );
    const frameworkCompliant = frameworkData.filter(d => d.compliance_status === 'compliant').length;
    const frameworkEvidence = evidence.filter(e => e.framework === framework);
    
    frameworkStatus[framework] = {
      totalControls: frameworkData.length,
      compliantControls: frameworkCompliant,
      compliancePercentage: frameworkData.length > 0 ? Math.round((frameworkCompliant / frameworkData.length) * 100) : 0,
      evidenceCount: frameworkEvidence.length,
      verifiedEvidence: frameworkEvidence.filter(e => e.verification_status === 'verified').length
    };
  }

  return {
    overallCompliance: totalDataPoints > 0 ? Math.round((compliantDataPoints / totalDataPoints) * 100) : 0,
    totalControls: totalDataPoints,
    compliantControls: compliantDataPoints,
    criticalIssues,
    frameworkStatus
  };
}

async function generateComplianceReport(supabaseClient: any, userId: string, framework: string) {
  try {
    // Get all compliance data for the framework
    const { data: complianceData } = await supabaseClient
      .from('compliance_data')
      .select('*')
      .eq('user_id', userId)
      .contains('framework_mappings', { [framework.toLowerCase()]: [] });

    // Get framework-specific evidence
    const { data: evidence } = await supabaseClient
      .from('compliance_evidence')
      .select('*')
      .eq('user_id', userId)
      .eq('framework', framework.toLowerCase());

    // Get framework-specific alerts
    const { data: alerts } = await supabaseClient
      .from('compliance_alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('framework', framework.toLowerCase());

    const report = {
      framework: framework.toUpperCase(),
      generatedAt: new Date().toISOString(),
      summary: {
        totalControls: complianceData?.length || 0,
        compliantControls: complianceData?.filter(d => d.compliance_status === 'compliant').length || 0,
        nonCompliantControls: complianceData?.filter(d => d.compliance_status === 'non_compliant').length || 0,
        needsReview: complianceData?.filter(d => d.compliance_status === 'needs_review').length || 0,
        totalEvidence: evidence?.length || 0,
        verifiedEvidence: evidence?.filter(e => e.verification_status === 'verified').length || 0,
        openAlerts: alerts?.filter(a => a.status === 'open').length || 0,
        criticalAlerts: alerts?.filter(a => a.severity === 'critical' && a.status === 'open').length || 0
      },
      controlStatus: complianceData?.map(d => ({
        controlId: d.framework_mappings[framework.toLowerCase()]?.[0] || 'Unknown',
        dataType: d.data_type,
        dataSource: d.data_source,
        status: d.compliance_status,
        riskLevel: d.risk_level,
        lastUpdated: d.updated_at
      })) || [],
      evidence: evidence?.map(e => ({
        controlId: e.control_id,
        title: e.title,
        type: e.evidence_type,
        collectedAt: e.collected_at,
        verificationStatus: e.verification_status
      })) || [],
      openIssues: alerts?.filter(a => a.status === 'open').map(a => ({
        alertId: a.id,
        title: a.title,
        severity: a.severity,
        controlId: a.control_id,
        createdAt: a.created_at
      })) || [],
      recommendations: generateRecommendations(complianceData || [], alerts || [])
    };

    return report;

  } catch (error) {
    console.error('Error generating compliance report:', error);
    return {
      framework: framework.toUpperCase(),
      generatedAt: new Date().toISOString(),
      error: error.message,
      summary: {},
      controlStatus: [],
      evidence: [],
      openIssues: [],
      recommendations: []
    };
  }
}

function generateRecommendations(complianceData: any[], alerts: any[]) {
  const recommendations = [];
  
  // Critical alerts recommendations
  const criticalAlerts = alerts.filter(a => a.severity === 'critical' && a.status === 'open');
  if (criticalAlerts.length > 0) {
    recommendations.push({
      priority: 'high',
      title: 'Address Critical Security Issues',
      description: `You have ${criticalAlerts.length} critical compliance issues that require immediate attention.`,
      action: 'Review and resolve all critical alerts in the compliance dashboard.'
    });
  }

  // Non-compliant controls recommendations
  const nonCompliantControls = complianceData.filter(d => d.compliance_status === 'non_compliant');
  if (nonCompliantControls.length > 0) {
    recommendations.push({
      priority: 'medium',
      title: 'Remediate Non-Compliant Controls',
      description: `${nonCompliantControls.length} controls are currently non-compliant.`,
      action: 'Implement necessary security controls and policies to address compliance gaps.'
    });
  }

  // Evidence collection recommendations
  const needsReview = complianceData.filter(d => d.compliance_status === 'needs_review');
  if (needsReview.length > 0) {
    recommendations.push({
      priority: 'low',
      title: 'Complete Evidence Review',
      description: `${needsReview.length} controls require additional review and evidence collection.`,
      action: 'Collect and verify evidence for controls marked as "needs review".'
    });
  }

  return recommendations;
}
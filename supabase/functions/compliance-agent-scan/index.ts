import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ComplianceCheckPayload {
  agent_id: string;
  api_key: string;
  framework_type: string;
  results: Array<{
    check_id: string;
    check_name: string;
    category: string;
    status: 'pass' | 'fail' | 'warning' | 'not_applicable';
    severity: string;
    actual_value?: string;
    expected_value?: string;
    evidence?: Record<string, any>;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // Agent requesting compliance checks to run
      const url = new URL(req.url);
      const agentId = url.searchParams.get('agent_id');
      const apiKey = url.searchParams.get('api_key');
      const frameworkType = url.searchParams.get('framework');

      if (!agentId || !apiKey) {
        return new Response(
          JSON.stringify({ error: 'Missing agent_id or api_key' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify agent
      const { data: agent, error: agentError } = await supabase
        .from('vanguard_agents')
        .select('id, user_id, name')
        .eq('id', agentId)
        .eq('api_key', apiKey)
        .single();

      if (agentError || !agent) {
        console.error('Agent verification failed:', agentError);
        return new Response(
          JSON.stringify({ error: 'Invalid agent credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get compliance benchmarks
      let query = supabase
        .from('compliance_benchmarks')
        .select('*')
        .eq('is_active', true)
        .eq('is_automated', true);

      if (frameworkType) {
        query = query.eq('framework_type', frameworkType);
      }

      const { data: benchmarks, error: benchError } = await query;

      if (benchError) {
        console.error('Failed to fetch benchmarks:', benchError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch compliance checks' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Sending ${benchmarks?.length || 0} compliance checks to agent ${agentId}`);

      return new Response(
        JSON.stringify({
          success: true,
          agent_id: agentId,
          checks: benchmarks || [],
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      // Agent submitting compliance results
      const payload: ComplianceCheckPayload = await req.json();

      if (!payload.agent_id || !payload.api_key || !payload.framework_type) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify agent
      const { data: agent, error: agentError } = await supabase
        .from('vanguard_agents')
        .select('id, user_id, name')
        .eq('id', payload.agent_id)
        .eq('api_key', payload.api_key)
        .single();

      if (agentError || !agent) {
        console.error('Agent verification failed:', agentError);
        return new Response(
          JSON.stringify({ error: 'Invalid agent credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Create scan job
      const passedChecks = payload.results.filter(r => r.status === 'pass').length;
      const failedChecks = payload.results.filter(r => r.status === 'fail').length;
      const warningChecks = payload.results.filter(r => r.status === 'warning').length;
      const totalChecks = payload.results.length;
      const complianceScore = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

      const { data: job, error: jobError } = await supabase
        .from('compliance_scan_jobs')
        .insert({
          user_id: agent.user_id,
          agent_id: payload.agent_id,
          framework_type: payload.framework_type,
          scan_status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          total_checks: totalChecks,
          passed_checks: passedChecks,
          failed_checks: failedChecks,
          warning_checks: warningChecks,
          compliance_score: complianceScore
        })
        .select()
        .single();

      if (jobError) {
        console.error('Failed to create scan job:', jobError);
        return new Response(
          JSON.stringify({ error: 'Failed to create scan job' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert check results
      const checkResults = payload.results.map(result => ({
        job_id: job.id,
        user_id: agent.user_id,
        agent_id: payload.agent_id,
        check_id: result.check_id,
        check_name: result.check_name,
        category: result.category,
        framework_type: payload.framework_type,
        status: result.status,
        severity: result.severity,
        actual_value: result.actual_value,
        expected_value: result.expected_value,
        evidence: result.evidence || {}
      }));

      const { error: resultsError } = await supabase
        .from('compliance_check_results')
        .insert(checkResults);

      if (resultsError) {
        console.error('Failed to insert check results:', resultsError);
        // Don't fail the request, job was created
      }

      // Create alerts for critical/high failed checks
      const criticalFailures = payload.results.filter(
        r => r.status === 'fail' && (r.severity === 'critical' || r.severity === 'high')
      );

      if (criticalFailures.length > 0) {
        await supabase
          .from('compliance_alerts')
          .insert({
            user_id: agent.user_id,
            alert_type: 'compliance_failure',
            title: `${criticalFailures.length} Critical/High Compliance Failures`,
            description: `Agent ${agent.name} failed ${criticalFailures.length} critical or high severity compliance checks in ${payload.framework_type}`,
            severity: 'high',
            status: 'open',
            framework: payload.framework_type,
            metadata: {
              agent_id: payload.agent_id,
              agent_name: agent.name,
              job_id: job.id,
              failed_checks: criticalFailures.map(f => f.check_id)
            }
          });
      }

      console.log(`Compliance scan completed for agent ${agent.name}: ${complianceScore}% compliant`);

      return new Response(
        JSON.stringify({
          success: true,
          job_id: job.id,
          compliance_score: complianceScore,
          summary: {
            total: totalChecks,
            passed: passedChecks,
            failed: failedChecks,
            warnings: warningChecks
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Compliance agent scan error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

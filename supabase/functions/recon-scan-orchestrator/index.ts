import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      // ==================== ENGAGEMENTS ====================
      case 'list_engagements': {
        const { data, error } = await supabase
          .from('recon_pentest_engagements')
          .select('*, vanguard_agents!recon_pentest_engagements_assigned_recon_unit_id_fkey(id, name, hostname)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse({ engagements: data });
      }

      case 'create_engagement': {
        const { data, error } = await supabase
          .from('recon_pentest_engagements')
          .insert({ user_id: user.id, ...params.engagement })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ engagement: data });
      }

      case 'update_engagement': {
        const { data, error } = await supabase
          .from('recon_pentest_engagements')
          .update(params.updates)
          .eq('id', params.engagement_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ engagement: data });
      }

      // ==================== SCAN JOBS ====================
      case 'create_scan': {
        const { data: job, error } = await supabase
          .from('recon_scan_jobs')
          .insert({ user_id: user.id, ...params.scan })
          .select()
          .single();
        if (error) throw error;

        // If a recon unit is assigned, dispatch the scan command
        if (job.recon_unit_id) {
          await supabase.from('vanguard_agent_commands').insert({
            agent_id: job.recon_unit_id,
            command_type: 'recon_scan',
            parameters: {
              job_id: job.id,
              scan_type: job.scan_type,
              scan_profile: job.scan_profile,
              targets: job.targets,
              port_range: job.port_range,
              scan_config: job.scan_config,
            },
            status: 'pending',
          });

          await supabase
            .from('recon_scan_jobs')
            .update({ status: 'dispatched' })
            .eq('id', job.id);
        }

        return jsonResponse({ job });
      }

      case 'list_scans': {
        let query = supabase
          .from('recon_scan_jobs')
          .select('*, vanguard_agents!recon_scan_jobs_recon_unit_id_fkey(id, name, hostname)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (params.engagement_id) {
          query = query.eq('engagement_id', params.engagement_id);
        }
        if (params.status) {
          query = query.eq('status', params.status);
        }
        if (params.limit) {
          query = query.limit(params.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return jsonResponse({ scans: data });
      }

      case 'get_scan_details': {
        const { data: job, error: jobError } = await supabase
          .from('recon_scan_jobs')
          .select('*')
          .eq('id', params.scan_id)
          .eq('user_id', user.id)
          .single();
        if (jobError) throw jobError;

        const { data: services } = await supabase
          .from('recon_discovered_services')
          .select('*')
          .eq('scan_job_id', params.scan_id)
          .order('host_ip', { ascending: true });

        const { data: findings } = await supabase
          .from('recon_vulnerability_findings')
          .select('*')
          .eq('scan_job_id', params.scan_id)
          .order('cvss_score', { ascending: false });

        return jsonResponse({ job, services: services || [], findings: findings || [] });
      }

      // ==================== FINDINGS ====================
      case 'list_findings': {
        let query = supabase
          .from('recon_vulnerability_findings')
          .select('*')
          .eq('user_id', user.id)
          .order('cvss_score', { ascending: false });

        if (params.engagement_id) query = query.eq('engagement_id', params.engagement_id);
        if (params.severity) query = query.eq('severity', params.severity);
        if (params.status) query = query.eq('status', params.status);
        if (params.limit) query = query.limit(params.limit);

        const { data, error } = await query;
        if (error) throw error;
        return jsonResponse({ findings: data });
      }

      case 'update_finding': {
        const { data, error } = await supabase
          .from('recon_vulnerability_findings')
          .update(params.updates)
          .eq('id', params.finding_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ finding: data });
      }

      // ==================== REMEDIATION ====================
      case 'create_remediation_task': {
        const { data, error } = await supabase
          .from('recon_remediation_tasks')
          .insert({ user_id: user.id, ...params.task })
          .select()
          .single();
        if (error) throw error;

        // Update finding status
        await supabase
          .from('recon_vulnerability_findings')
          .update({ status: 'in_remediation' })
          .eq('id', params.task.finding_id)
          .eq('user_id', user.id);

        return jsonResponse({ task: data });
      }

      case 'list_remediation_tasks': {
        let query = supabase
          .from('recon_remediation_tasks')
          .select('*, recon_vulnerability_findings(title, severity, cvss_score, affected_host)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (params.engagement_id) query = query.eq('engagement_id', params.engagement_id);
        if (params.status) query = query.eq('status', params.status);

        const { data, error } = await query;
        if (error) throw error;
        return jsonResponse({ tasks: data });
      }

      // ==================== SCHEDULES ====================
      case 'create_schedule': {
        const { data, error } = await supabase
          .from('recon_scan_schedules')
          .insert({ user_id: user.id, ...params.schedule })
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ schedule: data });
      }

      case 'list_schedules': {
        const { data, error } = await supabase
          .from('recon_scan_schedules')
          .select('*, vanguard_agents!recon_scan_schedules_recon_unit_id_fkey(id, name, hostname)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse({ schedules: data });
      }

      case 'toggle_schedule': {
        const { data, error } = await supabase
          .from('recon_scan_schedules')
          .update({ is_active: params.is_active })
          .eq('id', params.schedule_id)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        return jsonResponse({ schedule: data });
      }

      // ==================== DASHBOARD STATS ====================
      case 'get_dashboard': {
        const [engagements, scans, findings, schedules] = await Promise.all([
          supabase.from('recon_pentest_engagements').select('id, engagement_name, status, engagement_type, findings_count, critical_count, high_count, overall_risk_score, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
          supabase.from('recon_scan_jobs').select('id, scan_name, scan_type, status, progress_percent, vulns_found, started_at, completed_at, duration_seconds').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
          supabase.from('recon_vulnerability_findings').select('id, title, severity, cvss_score, affected_host, status, created_at').eq('user_id', user.id).order('cvss_score', { ascending: false }).limit(50),
          supabase.from('recon_scan_schedules').select('id, schedule_name, scan_type, frequency, next_run_at, is_active').eq('user_id', user.id),
        ]);

        // Aggregate severity counts
        const allFindings = findings.data || [];
        const severityCounts = {
          critical: allFindings.filter(f => f.severity === 'critical').length,
          high: allFindings.filter(f => f.severity === 'high').length,
          medium: allFindings.filter(f => f.severity === 'medium').length,
          low: allFindings.filter(f => f.severity === 'low').length,
          info: allFindings.filter(f => f.severity === 'info').length,
        };

        const statusCounts = {
          open: allFindings.filter(f => f.status === 'open').length,
          confirmed: allFindings.filter(f => f.status === 'confirmed').length,
          in_remediation: allFindings.filter(f => f.status === 'in_remediation').length,
          remediated: allFindings.filter(f => f.status === 'remediated').length,
          false_positive: allFindings.filter(f => f.status === 'false_positive').length,
        };

        return jsonResponse({
          engagements: engagements.data || [],
          recent_scans: scans.data || [],
          top_findings: allFindings.slice(0, 20),
          severity_counts: severityCounts,
          status_counts: statusCounts,
          schedules: schedules.data || [],
          total_findings: allFindings.length,
        });
      }

      // ==================== SCAN RESULTS INGEST (from Recon Unit) ====================
      case 'ingest_results': {
        const { job_id, services, vulnerabilities, summary } = params;

        // Update job
        await supabase.from('recon_scan_jobs').update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          hosts_scanned: summary?.hosts_scanned || 0,
          services_found: summary?.services_found || 0,
          vulns_found: summary?.vulns_found || 0,
          progress_percent: 100,
          duration_seconds: summary?.duration_seconds || 0,
        }).eq('id', job_id).eq('user_id', user.id);

        // Get job details for engagement_id
        const { data: jobData } = await supabase
          .from('recon_scan_jobs')
          .select('engagement_id')
          .eq('id', job_id)
          .single();

        // Insert discovered services
        if (services?.length > 0) {
          const serviceRecords = services.map((s: any) => ({
            user_id: user.id,
            scan_job_id: job_id,
            engagement_id: jobData?.engagement_id,
            ...s,
          }));
          await supabase.from('recon_discovered_services').insert(serviceRecords);
        }

        // Insert vulnerability findings
        if (vulnerabilities?.length > 0) {
          const findingRecords = vulnerabilities.map((v: any) => ({
            user_id: user.id,
            scan_job_id: job_id,
            engagement_id: jobData?.engagement_id,
            ...v,
          }));
          await supabase.from('recon_vulnerability_findings').insert(findingRecords);

          // Update engagement counts if applicable
          if (jobData?.engagement_id) {
            const { data: allEngFindings } = await supabase
              .from('recon_vulnerability_findings')
              .select('severity')
              .eq('engagement_id', jobData.engagement_id);

            if (allEngFindings) {
              await supabase.from('recon_pentest_engagements').update({
                findings_count: allEngFindings.length,
                critical_count: allEngFindings.filter(f => f.severity === 'critical').length,
                high_count: allEngFindings.filter(f => f.severity === 'high').length,
                medium_count: allEngFindings.filter(f => f.severity === 'medium').length,
                low_count: allEngFindings.filter(f => f.severity === 'low').length,
                info_count: allEngFindings.filter(f => f.severity === 'info').length,
              }).eq('id', jobData.engagement_id);
            }
          }
        }

        return jsonResponse({ success: true, job_id });
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Recon scan orchestrator error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function jsonResponse(data: any) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Content-Type': 'application/json',
    },
  });
}

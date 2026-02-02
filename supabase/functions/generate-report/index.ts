import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  report_type: 'executive' | 'compliance' | 'inventory' | 'security' | 'sla' | 'custom';
  format: 'pdf' | 'csv' | 'json';
  date_range?: { start: string; end: string };
  filters?: Record<string, any>;
  tenant_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body: ReportRequest = await req.json();
    const { report_type, format, date_range, filters, tenant_id } = body;

    // Build date range filter
    const startDate = date_range?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = date_range?.end || new Date().toISOString();

    let reportData: Record<string, any> = {
      generated_at: new Date().toISOString(),
      report_type,
      date_range: { start: startDate, end: endDate },
      generated_by: user.email
    };

    switch (report_type) {
      case 'executive': {
        // Fetch high-level metrics
        const [agentsResult, alertsResult, ticketsResult] = await Promise.all([
          supabase.from('vanguard_agents').select('id, status').eq('user_id', user.id),
          supabase.from('vanguard_alerts')
            .select('id, severity, resolved')
            .eq('user_id', user.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate),
          supabase.from('tickets')
            .select('id, status, priority')
            .eq('user_id', user.id)
            .gte('created_at', startDate)
            .lte('created_at', endDate)
        ]);

        const agents = agentsResult.data || [];
        const alerts = alertsResult.data || [];
        const tickets = ticketsResult.data || [];

        reportData = {
          ...reportData,
          summary: {
            total_devices: agents.length,
            online_devices: agents.filter((a: any) => a.status === 'online').length,
            offline_devices: agents.filter((a: any) => a.status === 'offline').length,
            total_alerts: alerts.length,
            critical_alerts: alerts.filter((a: any) => a.severity === 'critical').length,
            resolved_alerts: alerts.filter((a: any) => a.resolved).length,
            total_tickets: tickets.length,
            open_tickets: tickets.filter((t: any) => t.status === 'open').length,
            closed_tickets: tickets.filter((t: any) => t.status === 'closed').length
          },
          health_score: calculateHealthScore(agents, alerts)
        };
        break;
      }

      case 'security': {
        // Fetch security-related data
        const [vulnResult, huntResult, baselineResult] = await Promise.all([
          supabase.from('horizon_vulnerability_scans')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startDate)
            .order('created_at', { ascending: false })
            .limit(10),
          supabase.from('horizon_threat_hunts')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startDate),
          supabase.from('horizon_security_baselines')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
        ]);

        const vulnerabilities = vulnResult.data || [];
        const threatHunts = huntResult.data || [];
        const baselines = baselineResult.data || [];

        reportData = {
          ...reportData,
          vulnerability_summary: {
            total_scans: vulnerabilities.length,
            total_vulnerabilities: vulnerabilities.reduce((sum: number, v: any) => sum + (v.total_vulnerabilities || 0), 0),
            critical: vulnerabilities.reduce((sum: number, v: any) => sum + (v.critical_count || 0), 0),
            high: vulnerabilities.reduce((sum: number, v: any) => sum + (v.high_count || 0), 0),
            medium: vulnerabilities.reduce((sum: number, v: any) => sum + (v.medium_count || 0), 0),
            low: vulnerabilities.reduce((sum: number, v: any) => sum + (v.low_count || 0), 0)
          },
          threat_hunts: {
            total: threatHunts.length,
            findings: threatHunts.reduce((sum: number, h: any) => sum + (h.results_count || 0), 0)
          },
          active_baselines: baselines.length,
          recent_scans: vulnerabilities.slice(0, 5).map((v: any) => ({
            id: v.id,
            scan_type: v.scan_type,
            status: v.status,
            total: v.total_vulnerabilities,
            date: v.created_at
          }))
        };
        break;
      }

      case 'inventory': {
        // Fetch device inventory
        const { data: agents } = await supabase
          .from('vanguard_agents')
          .select('*')
          .eq('user_id', user.id)
          .order('hostname');

        const deviceList = (agents || []).map((a: any) => ({
          id: a.id,
          hostname: a.hostname,
          os: a.os_type,
          os_version: a.os_version,
          status: a.status,
          ip_address: a.ip_address,
          last_seen: a.last_seen,
          agent_version: a.agent_version
        }));

        reportData = {
          ...reportData,
          total_devices: deviceList.length,
          by_os: groupBy(deviceList, 'os'),
          by_status: groupBy(deviceList, 'status'),
          devices: deviceList
        };
        break;
      }

      case 'sla': {
        // Fetch SLA metrics
        const { data: metrics } = await supabase
          .from('horizon_sla_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('metric_date', startDate.split('T')[0])
          .lte('metric_date', endDate.split('T')[0])
          .order('metric_date');

        const slaData = metrics || [];
        
        reportData = {
          ...reportData,
          metrics_count: slaData.length,
          averages: {
            response_time: average(slaData, 'avg_response_time_minutes'),
            resolution_time: average(slaData, 'avg_resolution_time_minutes'),
            uptime: average(slaData, 'uptime_percent')
          },
          total_tickets: slaData.reduce((sum: number, m: any) => sum + (m.total_tickets || 0), 0),
          sla_compliance: {
            response: slaData.length > 0 
              ? (slaData.reduce((sum: number, m: any) => sum + (m.tickets_within_response_sla || 0), 0) / 
                 slaData.reduce((sum: number, m: any) => sum + (m.total_tickets || 1), 0) * 100).toFixed(1)
              : 0,
            resolution: slaData.length > 0
              ? (slaData.reduce((sum: number, m: any) => sum + (m.tickets_within_resolution_sla || 0), 0) /
                 slaData.reduce((sum: number, m: any) => sum + (m.total_tickets || 1), 0) * 100).toFixed(1)
              : 0
          },
          daily_metrics: slaData
        };
        break;
      }

      case 'compliance': {
        // Fetch compliance-related data
        const [baselinesResult, scansResult] = await Promise.all([
          supabase.from('horizon_security_baselines')
            .select('*')
            .eq('user_id', user.id),
          supabase.from('agentless_check_results')
            .select('*')
            .eq('user_id', user.id)
            .gte('created_at', startDate)
        ]);

        const baselines = baselinesResult.data || [];
        const checks = scansResult.data || [];

        reportData = {
          ...reportData,
          baselines: baselines.map((b: any) => ({
            name: b.baseline_name,
            type: b.baseline_type,
            is_active: b.is_active
          })),
          compliance_checks: {
            total: checks.length,
            passed: checks.filter((c: any) => c.status === 'pass').length,
            failed: checks.filter((c: any) => c.status === 'fail').length,
            by_severity: groupBy(checks.filter((c: any) => c.status === 'fail'), 'severity')
          }
        };
        break;
      }

      default:
        reportData = { ...reportData, message: 'Custom report type - add specific queries' };
    }

    // Format response based on requested format
    if (format === 'csv') {
      const csvContent = convertToCSV(reportData);
      return new Response(csvContent, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${report_type}_report_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Failed to generate report' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper functions
function calculateHealthScore(agents: any[], alerts: any[]): number {
  const totalDevices = agents.length || 1;
  const onlinePercent = (agents.filter(a => a.status === 'online').length / totalDevices) * 100;
  const unresolvedCritical = alerts.filter(a => a.severity === 'critical' && !a.resolved).length;
  const alertPenalty = Math.min(unresolvedCritical * 5, 30);
  return Math.max(0, Math.min(100, Math.round(onlinePercent - alertPenalty)));
}

function groupBy(items: any[], key: string): Record<string, number> {
  return items.reduce((acc, item) => {
    const val = item[key] || 'unknown';
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}

function average(items: any[], key: string): number {
  if (items.length === 0) return 0;
  const sum = items.reduce((acc, item) => acc + (item[key] || 0), 0);
  return Math.round(sum / items.length * 100) / 100;
}

function convertToCSV(data: Record<string, any>): string {
  const lines: string[] = [];
  
  function flattenObject(obj: any, prefix = ''): Record<string, any> {
    const result: Record<string, any> = {};
    for (const key in obj) {
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        Object.assign(result, flattenObject(obj[key], newKey));
      } else if (Array.isArray(obj[key])) {
        result[newKey] = obj[key].length;
      } else {
        result[newKey] = obj[key];
      }
    }
    return result;
  }

  const flattened = flattenObject(data);
  lines.push(Object.keys(flattened).join(','));
  lines.push(Object.values(flattened).map(v => `"${v}"`).join(','));
  
  return lines.join('\n');
}
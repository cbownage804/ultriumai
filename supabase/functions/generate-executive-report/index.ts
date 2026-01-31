import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GENERATE-EXECUTIVE-REPORT] ${step}${detailsStr}`);
};

interface ReportRequest {
  reportType: 'security' | 'compliance' | 'helpdesk' | 'billing' | 'executive';
  dateRange?: { start: string; end: string };
  clientId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const body: ReportRequest = await req.json();
    const { reportType, dateRange, clientId } = body;
    logStep("Report request", { reportType, clientId });

    const endDate = dateRange?.end || new Date().toISOString();
    const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    let reportData: any = {
      generatedAt: new Date().toISOString(),
      reportType,
      dateRange: { start: startDate, end: endDate },
      sections: []
    };

    switch (reportType) {
      case 'security':
        reportData = await generateSecurityReport(supabaseClient, user.id, startDate, endDate);
        break;
      case 'compliance':
        reportData = await generateComplianceReport(supabaseClient, user.id, startDate, endDate);
        break;
      case 'helpdesk':
        reportData = await generateHelpdeskReport(supabaseClient, user.id, startDate, endDate, clientId);
        break;
      case 'billing':
        reportData = await generateBillingReport(supabaseClient, user.id, startDate, endDate, clientId);
        break;
      case 'executive':
      default:
        reportData = await generateExecutiveReport(supabaseClient, user.id, startDate, endDate);
    }

    // Store report
    const { data: report, error: reportError } = await supabaseClient
      .from('bi_reports')
      .insert({
        user_id: user.id,
        report_name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report - ${new Date().toLocaleDateString()}`,
        report_type: reportType,
        report_config: reportData,
        data_sources: { tables: reportData.dataSources || [] },
        last_generated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (reportError) {
      console.error('Failed to store report:', reportError);
    }

    logStep("Report generated", { reportType, sections: reportData.sections?.length });

    return new Response(JSON.stringify({
      success: true,
      reportId: report?.id,
      report: reportData
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateSecurityReport(supabase: any, userId: string, startDate: string, endDate: string) {
  // Fetch security events
  const { data: events } = await supabase
    .from('vanguard_m365_security_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Fetch vulnerabilities
  const { data: vulns } = await supabase
    .from('safenet_vulnerabilities')
    .select('*')
    .gte('discovered_at', startDate)
    .lte('discovered_at', endDate);

  const eventsByType = (events || []).reduce((acc: any, e: any) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1;
    return acc;
  }, {});

  const vulnsBySeverity = (vulns || []).reduce((acc: any, v: any) => {
    acc[v.severity] = (acc[v.severity] || 0) + 1;
    return acc;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'security',
    dateRange: { start: startDate, end: endDate },
    dataSources: ['vanguard_m365_security_events', 'safenet_vulnerabilities'],
    summary: {
      totalSecurityEvents: events?.length || 0,
      criticalEvents: events?.filter((e: any) => e.severity === 'critical').length || 0,
      totalVulnerabilities: vulns?.length || 0,
      patchedVulnerabilities: vulns?.filter((v: any) => v.status === 'patched').length || 0
    },
    sections: [
      {
        title: 'Security Events by Type',
        type: 'table',
        data: Object.entries(eventsByType).map(([type, count]) => ({ type, count }))
      },
      {
        title: 'Vulnerabilities by Severity',
        type: 'chart',
        chartType: 'pie',
        data: Object.entries(vulnsBySeverity).map(([severity, count]) => ({ severity, count }))
      }
    ]
  };
}

async function generateComplianceReport(supabase: any, userId: string, startDate: string, endDate: string) {
  const { data: jobs } = await supabase
    .from('compliance_scan_jobs')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const byFramework = (jobs || []).reduce((acc: any, j: any) => {
    if (!acc[j.framework_type]) {
      acc[j.framework_type] = { scans: 0, avgScore: 0, scores: [] };
    }
    acc[j.framework_type].scans++;
    if (j.compliance_score) {
      acc[j.framework_type].scores.push(j.compliance_score);
    }
    return acc;
  }, {});

  Object.keys(byFramework).forEach(k => {
    const scores = byFramework[k].scores;
    byFramework[k].avgScore = scores.length > 0 
      ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
      : 0;
  });

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'compliance',
    dateRange: { start: startDate, end: endDate },
    dataSources: ['compliance_scan_jobs'],
    summary: {
      totalScans: jobs?.length || 0,
      frameworksCovered: Object.keys(byFramework).length,
      overallScore: Math.round(
        Object.values(byFramework).reduce((sum: number, f: any) => sum + f.avgScore, 0) / 
        Math.max(Object.keys(byFramework).length, 1)
      )
    },
    sections: [
      {
        title: 'Compliance by Framework',
        type: 'table',
        data: Object.entries(byFramework).map(([framework, data]: [string, any]) => ({
          framework,
          scans: data.scans,
          avgScore: data.avgScore
        }))
      }
    ]
  };
}

async function generateHelpdeskReport(supabase: any, userId: string, startDate: string, endDate: string, clientId?: string) {
  let query = supabase
    .from('vanguard_tickets')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data: tickets } = await query;

  const byStatus = (tickets || []).reduce((acc: any, t: any) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const byPriority = (tickets || []).reduce((acc: any, t: any) => {
    acc[t.priority] = (acc[t.priority] || 0) + 1;
    return acc;
  }, {});

  const resolved = tickets?.filter((t: any) => t.status === 'resolved' || t.status === 'closed') || [];
  const avgResolutionTime = resolved.length > 0
    ? Math.round(resolved.reduce((sum: number, t: any) => {
        const created = new Date(t.created_at).getTime();
        const closed = new Date(t.resolved_at || t.updated_at).getTime();
        return sum + (closed - created) / (1000 * 60 * 60); // hours
      }, 0) / resolved.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'helpdesk',
    dateRange: { start: startDate, end: endDate },
    dataSources: ['vanguard_tickets'],
    summary: {
      totalTickets: tickets?.length || 0,
      openTickets: tickets?.filter((t: any) => t.status === 'open' || t.status === 'in_progress').length || 0,
      resolvedTickets: resolved.length,
      avgResolutionHours: avgResolutionTime
    },
    sections: [
      {
        title: 'Tickets by Status',
        type: 'chart',
        chartType: 'bar',
        data: Object.entries(byStatus).map(([status, count]) => ({ status, count }))
      },
      {
        title: 'Tickets by Priority',
        type: 'chart',
        chartType: 'pie',
        data: Object.entries(byPriority).map(([priority, count]) => ({ priority, count }))
      }
    ]
  };
}

async function generateBillingReport(supabase: any, userId: string, startDate: string, endDate: string, clientId?: string) {
  // Fetch time entries
  let teQuery = supabase
    .from('vanguard_time_entries')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (clientId) {
    teQuery = teQuery.eq('client_id', clientId);
  }

  const { data: timeEntries } = await teQuery;

  // Fetch invoices
  const { data: invoices } = await supabase
    .from('business_invoices')
    .select('*')
    .gte('issued_at', startDate)
    .lte('issued_at', endDate);

  const billableEntries = timeEntries?.filter((t: any) => t.is_billable) || [];
  const totalBillableHours = billableEntries.reduce((sum: number, t: any) => sum + (t.duration_minutes || 0) / 60, 0);
  const totalRevenue = billableEntries.reduce((sum: number, t: any) => 
    sum + ((t.duration_minutes || 0) / 60) * (t.hourly_rate || 0), 0
  );

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'billing',
    dateRange: { start: startDate, end: endDate },
    dataSources: ['vanguard_time_entries', 'business_invoices'],
    summary: {
      totalTimeEntries: timeEntries?.length || 0,
      billableHours: Math.round(totalBillableHours * 10) / 10,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      invoicesGenerated: invoices?.length || 0,
      invoicesPaid: invoices?.filter((i: any) => i.status === 'paid').length || 0
    },
    sections: [
      {
        title: 'Revenue Summary',
        type: 'kpi',
        data: {
          billableHours: totalBillableHours,
          revenue: totalRevenue,
          avgRate: billableEntries.length > 0 
            ? totalRevenue / totalBillableHours 
            : 0
        }
      }
    ]
  };
}

async function generateExecutiveReport(supabase: any, userId: string, startDate: string, endDate: string) {
  // Aggregate data from all modules
  const [security, compliance, helpdesk, billing] = await Promise.all([
    generateSecurityReport(supabase, userId, startDate, endDate),
    generateComplianceReport(supabase, userId, startDate, endDate),
    generateHelpdeskReport(supabase, userId, startDate, endDate),
    generateBillingReport(supabase, userId, startDate, endDate)
  ]);

  return {
    generatedAt: new Date().toISOString(),
    reportType: 'executive',
    dateRange: { start: startDate, end: endDate },
    dataSources: ['vanguard_m365_security_events', 'safenet_vulnerabilities', 'compliance_scan_jobs', 'vanguard_tickets', 'vanguard_time_entries', 'business_invoices'],
    summary: {
      security: security.summary,
      compliance: compliance.summary,
      helpdesk: helpdesk.summary,
      billing: billing.summary
    },
    sections: [
      {
        title: 'Security Overview',
        type: 'summary',
        data: security.summary
      },
      {
        title: 'Compliance Status',
        type: 'summary',
        data: compliance.summary
      },
      {
        title: 'Service Desk Metrics',
        type: 'summary',
        data: helpdesk.summary
      },
      {
        title: 'Financial Summary',
        type: 'summary',
        data: billing.summary
      }
    ]
  };
}

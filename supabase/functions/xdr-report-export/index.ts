import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * XDR Report & Export Generator
 * 
 * Supports:
 * - PDF threat reports
 * - CSV IOC exports
 * - STIX 2.1 bundle exports
 * - Executive summaries
 */

interface ExportRequest {
  user_id: string;
  export_type: 'pdf' | 'csv' | 'stix' | 'json';
  report_type?: 'threat_summary' | 'ioc_list' | 'incident_report' | 'executive';
  filters?: {
    date_from?: string;
    date_to?: string;
    severity?: string[];
    threat_types?: string[];
    agent_ids?: string[];
  };
  threat_ids?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: ExportRequest = await req.json();
    const { user_id, export_type, report_type = 'threat_summary', filters, threat_ids } = body;

    // Build query for threats
    let query = supabase
      .from('xdr_threats')
      .select(`
        *,
        vanguard_agents (
          id,
          hostname,
          os_name,
          os_version
        )
      `)
      .eq('user_id', user_id)
      .order('detected_at', { ascending: false });

    // Apply filters
    if (threat_ids?.length) {
      query = query.in('id', threat_ids);
    }
    if (filters?.date_from) {
      query = query.gte('detected_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('detected_at', filters.date_to);
    }
    if (filters?.severity?.length) {
      query = query.in('severity', filters.severity);
    }
    if (filters?.threat_types?.length) {
      query = query.in('threat_type', filters.threat_types);
    }
    if (filters?.agent_ids?.length) {
      query = query.in('agent_id', filters.agent_ids);
    }

    const { data: threats, error } = await query.limit(500);

    if (error) throw error;

    // Get response actions for these threats
    const threatIds = threats?.map(t => t.id) || [];
    const { data: responseActions } = await supabase
      .from('xdr_response_actions')
      .select('*')
      .in('threat_id', threatIds);

    // Generate export based on type
    let exportData: any;
    let contentType: string;
    let filename: string;

    switch (export_type) {
      case 'csv':
        exportData = generateCSV(threats || [], responseActions || []);
        contentType = 'text/csv';
        filename = `xdr-iocs-${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'stix':
        exportData = JSON.stringify(generateSTIXBundle(threats || [], responseActions || []), null, 2);
        contentType = 'application/json';
        filename = `xdr-stix-bundle-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'json':
        exportData = JSON.stringify({
          export_type: report_type,
          generated_at: new Date().toISOString(),
          filters: filters,
          total_threats: threats?.length || 0,
          threats: threats,
          response_actions: responseActions,
          statistics: generateStatistics(threats || [])
        }, null, 2);
        contentType = 'application/json';
        filename = `xdr-report-${new Date().toISOString().split('T')[0]}.json`;
        break;

      case 'pdf':
      default:
        // For PDF, we return HTML that can be rendered to PDF client-side
        exportData = generatePDFHTML(threats || [], responseActions || [], report_type);
        contentType = 'text/html';
        filename = `xdr-report-${new Date().toISOString().split('T')[0]}.html`;
        break;
    }

    // Log export activity
    await supabase.from('audit_logs').insert({
      user_id,
      action: 'xdr_export',
      resource_type: 'xdr_report',
      details: {
        export_type,
        report_type,
        threat_count: threats?.length || 0,
        filters
      }
    });

    return new Response(exportData, {
      headers: {
        ...corsHeaders,
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });

  } catch (error: any) {
    console.error('XDR Export error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateCSV(threats: any[], actions: any[]): string {
  const headers = [
    'Threat ID',
    'Detected At',
    'Threat Type',
    'Severity',
    'Confidence',
    'Hostname',
    'Process Name',
    'Process Path',
    'File Path',
    'File Hash',
    'Remote IP',
    'Remote Port',
    'MITRE Techniques',
    'AI Analysis',
    'Status',
    'Actions Taken'
  ];

  const rows = threats.map(t => {
    const threatActions = actions.filter(a => a.threat_id === t.id);
    return [
      t.id,
      t.detected_at,
      t.threat_type,
      t.severity,
      `${Math.round((t.confidence || 0) * 100)}%`,
      t.vanguard_agents?.hostname || t.hostname || '',
      t.affected_process?.name || '',
      t.affected_process?.path || '',
      t.affected_file?.path || '',
      t.affected_file?.hash || '',
      t.affected_network?.remote_ip || '',
      t.affected_network?.remote_port || '',
      (t.mitre_techniques || []).join('; '),
      (t.ai_analysis?.analysis || '').replace(/,/g, ';').replace(/\n/g, ' '),
      t.status,
      threatActions.map(a => a.action_type).join('; ')
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function generateSTIXBundle(threats: any[], actions: any[]): any {
  const stixObjects: any[] = [];
  const bundleId = `bundle--${crypto.randomUUID()}`;

  for (const threat of threats) {
    // Create indicator for each threat
    const indicatorId = `indicator--${threat.id}`;
    
    let pattern = '';
    if (threat.affected_file?.hash) {
      pattern = `[file:hashes.'SHA-256' = '${threat.affected_file.hash}']`;
    } else if (threat.affected_network?.remote_ip) {
      pattern = `[ipv4-addr:value = '${threat.affected_network.remote_ip}']`;
    } else if (threat.affected_process?.name) {
      pattern = `[process:name = '${threat.affected_process.name}']`;
    }

    if (pattern) {
      stixObjects.push({
        type: 'indicator',
        spec_version: '2.1',
        id: indicatorId,
        created: threat.detected_at,
        modified: threat.detected_at,
        name: `${threat.threat_type} - ${threat.vanguard_agents?.hostname || 'Unknown Host'}`,
        description: threat.ai_analysis?.analysis || `Detected ${threat.threat_type}`,
        indicator_types: [mapThreatTypeToSTIX(threat.threat_type)],
        pattern: pattern,
        pattern_type: 'stix',
        valid_from: threat.detected_at,
        kill_chain_phases: (threat.mitre_techniques || []).map((t: string) => ({
          kill_chain_name: 'mitre-attack',
          phase_name: t
        })),
        labels: [threat.severity, threat.threat_type],
        confidence: Math.round((threat.confidence || 0) * 100),
        external_references: (threat.mitre_techniques || []).map((t: string) => ({
          source_name: 'mitre-attack',
          external_id: t
        }))
      });
    }

    // Create malware object if applicable
    if (threat.threat_type.toLowerCase().includes('malware') || 
        threat.threat_type.toLowerCase().includes('ransomware')) {
      stixObjects.push({
        type: 'malware',
        spec_version: '2.1',
        id: `malware--${crypto.randomUUID()}`,
        created: threat.detected_at,
        modified: threat.detected_at,
        name: threat.threat_type,
        description: threat.ai_analysis?.analysis,
        malware_types: [mapThreatTypeToMalwareType(threat.threat_type)],
        is_family: false,
        kill_chain_phases: (threat.mitre_techniques || []).map((t: string) => ({
          kill_chain_name: 'mitre-attack',
          phase_name: t
        }))
      });
    }

    // Create observed-data for network IOCs
    if (threat.affected_network?.remote_ip) {
      stixObjects.push({
        type: 'ipv4-addr',
        spec_version: '2.1',
        id: `ipv4-addr--${crypto.randomUUID()}`,
        value: threat.affected_network.remote_ip
      });
    }
  }

  return {
    type: 'bundle',
    id: bundleId,
    spec_version: '2.1',
    objects: stixObjects
  };
}

function mapThreatTypeToSTIX(threatType: string): string {
  const typeMap: Record<string, string> = {
    'ransomware': 'malicious-activity',
    'process_injection': 'malicious-activity',
    'encoded_command': 'anomalous-activity',
    'suspicious_process': 'anomalous-activity',
    'c2_communication': 'malicious-activity',
    'lateral_movement': 'malicious-activity',
    'credential_theft': 'malicious-activity',
    'data_exfiltration': 'malicious-activity'
  };
  return typeMap[threatType.toLowerCase()] || 'anomalous-activity';
}

function mapThreatTypeToMalwareType(threatType: string): string {
  if (threatType.toLowerCase().includes('ransomware')) return 'ransomware';
  if (threatType.toLowerCase().includes('trojan')) return 'trojan';
  if (threatType.toLowerCase().includes('backdoor')) return 'backdoor';
  return 'unknown';
}

function generateStatistics(threats: any[]): any {
  const stats = {
    total: threats.length,
    by_severity: {} as Record<string, number>,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    by_host: {} as Record<string, number>,
    mitre_techniques: {} as Record<string, number>,
    timeline: [] as any[]
  };

  for (const threat of threats) {
    stats.by_severity[threat.severity] = (stats.by_severity[threat.severity] || 0) + 1;
    stats.by_type[threat.threat_type] = (stats.by_type[threat.threat_type] || 0) + 1;
    stats.by_status[threat.status] = (stats.by_status[threat.status] || 0) + 1;
    
    const hostname = threat.vanguard_agents?.hostname || threat.hostname || 'Unknown';
    stats.by_host[hostname] = (stats.by_host[hostname] || 0) + 1;

    for (const technique of (threat.mitre_techniques || [])) {
      stats.mitre_techniques[technique] = (stats.mitre_techniques[technique] || 0) + 1;
    }
  }

  // Group by day for timeline
  const byDay: Record<string, number> = {};
  for (const threat of threats) {
    const day = threat.detected_at?.split('T')[0];
    if (day) {
      byDay[day] = (byDay[day] || 0) + 1;
    }
  }
  stats.timeline = Object.entries(byDay).map(([date, count]) => ({ date, count }));

  return stats;
}

function generatePDFHTML(threats: any[], actions: any[], reportType: string): string {
  const stats = generateStatistics(threats);
  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    high: '#ea580c',
    medium: '#f59e0b',
    low: '#22c55e'
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Vanguard Pursuit XDR Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; padding: 40px; background: #fff; color: #1f2937; }
    .header { background: linear-gradient(135deg, #1e3a5f, #0f2644); color: white; padding: 30px; border-radius: 8px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 10px; }
    .header p { opacity: 0.8; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border-radius: 8px; padding: 20px; text-align: center; border: 1px solid #e2e8f0; }
    .stat-card .value { font-size: 32px; font-weight: bold; color: #1e3a5f; }
    .stat-card .label { color: #64748b; font-size: 14px; }
    .section { margin-bottom: 30px; }
    .section h2 { font-size: 20px; color: #1e3a5f; margin-bottom: 15px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-weight: 600; color: #475569; }
    .severity-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; color: white; font-size: 11px; font-weight: 600; }
    .mitre { font-family: monospace; font-size: 11px; color: #6366f1; }
    .footer { margin-top: 40px; text-align: center; color: #94a3b8; font-size: 12px; }
    @media print { body { padding: 20px; } .header { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ Vanguard Pursuit XDR Report</h1>
    <p>Generated: ${new Date().toLocaleString()} | Report Type: ${reportType.replace(/_/g, ' ').toUpperCase()}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <div class="value">${stats.total}</div>
      <div class="label">Total Threats</div>
    </div>
    <div class="stat-card">
      <div class="value" style="color: #dc2626">${stats.by_severity['critical'] || 0}</div>
      <div class="label">Critical</div>
    </div>
    <div class="stat-card">
      <div class="value" style="color: #ea580c">${stats.by_severity['high'] || 0}</div>
      <div class="label">High</div>
    </div>
    <div class="stat-card">
      <div class="value">${Object.keys(stats.by_host).length}</div>
      <div class="label">Affected Hosts</div>
    </div>
  </div>

  <div class="section">
    <h2>📊 Severity Distribution</h2>
    <table>
      <tr>
        ${Object.entries(stats.by_severity).map(([severity, count]) => 
          `<td><span class="severity-badge" style="background: ${severityColors[severity] || '#6b7280'}">${severity.toUpperCase()}</span> ${count} threats</td>`
        ).join('')}
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>🎯 MITRE ATT&CK Techniques</h2>
    <table>
      <tr><th>Technique</th><th>Count</th></tr>
      ${Object.entries(stats.mitre_techniques).slice(0, 10).map(([technique, count]) => 
        `<tr><td class="mitre">${technique}</td><td>${count}</td></tr>`
      ).join('')}
    </table>
  </div>

  <div class="section">
    <h2>🔍 Threat Details</h2>
    <table>
      <tr>
        <th>Time</th>
        <th>Type</th>
        <th>Severity</th>
        <th>Host</th>
        <th>MITRE</th>
        <th>Status</th>
      </tr>
      ${threats.slice(0, 50).map(t => `
        <tr>
          <td>${new Date(t.detected_at).toLocaleString()}</td>
          <td>${t.threat_type}</td>
          <td><span class="severity-badge" style="background: ${severityColors[t.severity] || '#6b7280'}">${t.severity.toUpperCase()}</span></td>
          <td>${t.vanguard_agents?.hostname || t.hostname || 'Unknown'}</td>
          <td class="mitre">${(t.mitre_techniques || []).join(', ') || '-'}</td>
          <td>${t.status}</td>
        </tr>
      `).join('')}
    </table>
    ${threats.length > 50 ? `<p style="margin-top: 10px; color: #64748b;">... and ${threats.length - 50} more threats</p>` : ''}
  </div>

  <div class="footer">
    <p>Vanguard Pursuit XDR - AI-Powered Extended Detection & Response</p>
    <p>© ${new Date().getFullYear()} UltriumAI. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

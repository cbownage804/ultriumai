import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyslogMessage {
  facility: number;
  severity: number;
  timestamp: string;
  hostname: string;
  appName: string;
  procId: string;
  msgId: string;
  message: string;
  structuredData?: Record<string, any>;
}

interface CEFMessage {
  version: string;
  deviceVendor: string;
  deviceProduct: string;
  deviceVersion: string;
  signatureId: string;
  name: string;
  severity: number;
  extensions: Record<string, string>;
}

// Parse syslog RFC 5424 format
function parseSyslog(raw: string): SyslogMessage | null {
  const syslogRegex = /^<(\d+)>(\d+)?\s*(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s*(.*)/;
  const match = raw.match(syslogRegex);
  
  if (!match) return null;
  
  const priority = parseInt(match[1]);
  return {
    facility: Math.floor(priority / 8),
    severity: priority % 8,
    timestamp: match[3] || new Date().toISOString(),
    hostname: match[4] || 'unknown',
    appName: match[5] || '-',
    procId: match[6] || '-',
    msgId: match[7] || '-',
    message: match[8] || '',
  };
}

// Parse CEF format
function parseCEF(raw: string): CEFMessage | null {
  const cefRegex = /^CEF:(\d+)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|([^|]*)\|(\d+)\|(.*)/;
  const match = raw.match(cefRegex);
  
  if (!match) return null;
  
  const extensions: Record<string, string> = {};
  const extStr = match[8];
  const extPairs = extStr.match(/(\w+)=([^\s]+(?:\s+(?!\w+=)[^\s]+)*)/g);
  
  extPairs?.forEach(pair => {
    const [key, ...valueParts] = pair.split('=');
    extensions[key] = valueParts.join('=');
  });
  
  return {
    version: match[1],
    deviceVendor: match[2],
    deviceProduct: match[3],
    deviceVersion: match[4],
    signatureId: match[5],
    name: match[6],
    severity: parseInt(match[7]),
    extensions,
  };
}

// Parse JSON log format
function parseJSON(raw: string): Record<string, any> | null {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Detect log format and parse
function parseLog(raw: string): { format: string; parsed: any } {
  // Try CEF first
  if (raw.startsWith('CEF:')) {
    const cef = parseCEF(raw);
    if (cef) return { format: 'cef', parsed: cef };
  }
  
  // Try syslog
  if (raw.startsWith('<')) {
    const syslog = parseSyslog(raw);
    if (syslog) return { format: 'syslog', parsed: syslog };
  }
  
  // Try JSON
  if (raw.startsWith('{')) {
    const json = parseJSON(raw);
    if (json) return { format: 'json', parsed: json };
  }
  
  // Fallback to raw
  return { format: 'raw', parsed: { message: raw } };
}

// Map severity to our standard levels
function mapSeverity(format: string, parsed: any): string {
  if (format === 'syslog') {
    const severityMap: Record<number, string> = {
      0: 'critical', 1: 'critical', 2: 'critical',
      3: 'high', 4: 'medium', 5: 'low', 6: 'info', 7: 'info'
    };
    return severityMap[parsed.severity] || 'info';
  }
  
  if (format === 'cef') {
    if (parsed.severity >= 8) return 'critical';
    if (parsed.severity >= 6) return 'high';
    if (parsed.severity >= 4) return 'medium';
    if (parsed.severity >= 2) return 'low';
    return 'info';
  }
  
  if (format === 'json') {
    const level = parsed.level || parsed.severity || parsed.priority || '';
    if (/critical|emergency|fatal/i.test(level)) return 'critical';
    if (/high|error|err/i.test(level)) return 'high';
    if (/medium|warning|warn/i.test(level)) return 'medium';
    if (/low|notice/i.test(level)) return 'low';
  }
  
  return 'info';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { logs, api_key, user_id } = body;

    // Sanitize source field
    const stripHtml = (val: unknown, maxLen = 500): string => {
      if (typeof val !== 'string') return '';
      return val.replace(/<[^>]*>/g, '').substring(0, maxLen);
    };
    const source = stripHtml(body.source, 100);

    // Validate required fields
    if (!logs) {
      return new Response(JSON.stringify({ error: 'logs field is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[SIEM Ingest] Received ${Array.isArray(logs) ? logs.length : 1} logs from source: ${source}`);

    // Validate API key if provided (for external sources)
    if (api_key) {
      const { data: keyData } = await supabase
        .from('api_keys')
        .select('user_id, is_active')
        .eq('key_hash', api_key)
        .single();
      
      if (!keyData?.is_active) {
        return new Response(JSON.stringify({ error: 'Invalid API key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const logsArray = Array.isArray(logs) ? logs : [logs];
    const processedLogs = [];

    for (const log of logsArray) {
      const rawLog = typeof log === 'string' ? log : JSON.stringify(log);
      const { format, parsed } = parseLog(rawLog);
      const severity = mapSeverity(format, parsed);
      
      // Extract message
      let message = '';
      if (format === 'syslog') message = parsed.message;
      else if (format === 'cef') message = parsed.name;
      else if (format === 'json') message = parsed.message || parsed.msg || JSON.stringify(parsed);
      else message = rawLog;

      // Extract hostname/source
      const hostname = parsed.hostname || parsed.host || parsed.source || source || 'unknown';
      
      // Sanitize output fields before storage
      const sanitizedTitle = stripHtml(message, 200);
      const sanitizedDescription = stripHtml(message, 5000);
      const sanitizedHostname = stripHtml(hostname, 100);

      processedLogs.push({
        user_id: user_id || null,
        title: sanitizedTitle,
        description: sanitizedDescription,
        severity,
        source_ip: parsed.src || parsed.sourceAddress || null,
        affected_assets: [sanitizedHostname],
        raw_data: { format, parsed, raw: rawLog },
        created_at: parsed.timestamp || new Date().toISOString(),
      });
    }

    // Batch insert into security_events
    const { data, error } = await supabase
      .from('security_events')
      .insert(processedLogs)
      .select('id');

    if (error) {
      console.error('[SIEM Ingest] Insert error:', error);
      throw error;
    }

    console.log(`[SIEM Ingest] Successfully ingested ${data?.length || 0} logs`);

    // Check for critical events and create alerts
    const criticalLogs = processedLogs.filter(l => l.severity === 'critical' || l.severity === 'high');
    if (criticalLogs.length > 0) {
      console.log(`[SIEM Ingest] ${criticalLogs.length} critical/high severity events detected`);
      
      // Trigger alert creation for critical events
      for (const critical of criticalLogs.slice(0, 5)) { // Limit to 5 alerts
        await supabase.from('security_incidents').insert({
          user_id: user_id,
          title: `[SIEM Alert] ${critical.title}`,
          description: critical.description,
          severity: critical.severity,
          status: 'open',
          source: source || 'SIEM',
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      ingested: data?.length || 0,
      alerts_created: criticalLogs.length,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[SIEM Ingest] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

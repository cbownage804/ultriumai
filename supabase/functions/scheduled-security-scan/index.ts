import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const scanType = body.scan_type || 'all';
    
    console.log(`[Scheduled Scan] Running ${scanType} scan at ${new Date().toISOString()}`);
    
    const results: Record<string, any> = {};

    // 1. Dark Web Monitoring Check
    if (scanType === 'all' || scanType === 'dark_web') {
      console.log('[Scheduled Scan] Checking dark web monitors...');
      
      const { data: monitors } = await supabase
        .from('dark_web_monitors')
        .select('*')
        .eq('status', 'active');
      
      // Simulate dark web check (in production, call actual APIs)
      const darkWebResults = [];
      for (const monitor of monitors || []) {
        // Check if credentials appear in breach databases
        // This is a simulation - real implementation would call HaveIBeenPwned, etc.
        const breachFound = Math.random() < 0.1; // 10% chance of finding breach
        
        if (breachFound) {
          darkWebResults.push({
            monitor_id: monitor.id,
            keyword: monitor.keyword,
            breach_type: 'credential_leak',
            source: 'simulated_breach_db',
          });
          
          // Update monitor with finding
          await supabase
            .from('dark_web_monitors')
            .update({ 
              last_checked: new Date().toISOString(),
              results_count: (monitor.results_count || 0) + 1 
            })
            .eq('id', monitor.id);
        } else {
          await supabase
            .from('dark_web_monitors')
            .update({ last_checked: new Date().toISOString() })
            .eq('id', monitor.id);
        }
      }
      
      results.dark_web = { checked: monitors?.length || 0, findings: darkWebResults.length };
    }

    // 2. Patch Compliance Check
    if (scanType === 'all' || scanType === 'patches') {
      console.log('[Scheduled Scan] Checking patch compliance...');
      
      const { data: devices } = await supabase
        .from('rmm_devices')
        .select('id, hostname, os_type, os_version')
        .eq('status', 'online');
      
      // Check for missing patches
      const { data: patches } = await supabase
        .from('patch_management')
        .select('*')
        .eq('status', 'pending');
      
      // Auto-mark overdue patches as critical
      const overduePatches = patches?.filter(p => 
        new Date(p.release_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ) || [];
      
      for (const patch of overduePatches) {
        await supabase
          .from('patch_management')
          .update({ severity: 'critical', notes: 'Auto-escalated: 30+ days overdue' })
          .eq('id', patch.id);
      }
      
      results.patches = { 
        devices_checked: devices?.length || 0, 
        pending_patches: patches?.length || 0,
        critical_overdue: overduePatches.length 
      };
    }

    // 3. Backup Verification
    if (scanType === 'all' || scanType === 'backups') {
      console.log('[Scheduled Scan] Verifying backups...');
      
      const { data: backups } = await supabase
        .from('backup_jobs')
        .select('*')
        .eq('status', 'scheduled');
      
      // Check for failed or missed backups
      const { data: recentBackups } = await supabase
        .from('backup_jobs')
        .select('*')
        .gte('completed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
      
      const failedBackups = recentBackups?.filter(b => b.status === 'failed') || [];
      
      // Create alerts for failed backups
      for (const failed of failedBackups) {
        await supabase.from('security_events').insert({
          title: `Backup Failed: ${failed.backup_name}`,
          description: `Backup job "${failed.backup_name}" failed. Error: ${failed.error_message || 'Unknown error'}`,
          severity: 'high',
          raw_data: { backup_id: failed.id, type: 'backup_failure' }
        });
      }
      
      results.backups = {
        scheduled: backups?.length || 0,
        recent_completed: recentBackups?.filter(b => b.status === 'completed').length || 0,
        failed: failedBackups.length
      };
    }

    // 4. Threat Intelligence Feed Update
    if (scanType === 'all' || scanType === 'threat_intel') {
      console.log('[Scheduled Scan] Updating threat intelligence...');
      
      // Fetch latest threat indicators from configured feeds
      const abuseIPDBKey = Deno.env.get('ABUSEIPDB_API_KEY');
      const virusTotalKey = Deno.env.get('VIRUSTOTAL_API_KEY');
      
      let threatCount = 0;
      
      if (abuseIPDBKey) {
        try {
          const response = await fetch('https://api.abuseipdb.com/api/v2/blacklist?limit=100', {
            headers: {
              'Key': abuseIPDBKey,
              'Accept': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            const indicators = data.data || [];
            
            for (const ip of indicators.slice(0, 50)) {
              await supabase.from('threat_intel_indicators').upsert({
                indicator: ip.ipAddress,
                indicator_type: 'ip',
                source: 'abuseipdb',
                risk_score: ip.abuseConfidenceScore,
                metadata: ip,
                updated_at: new Date().toISOString()
              }, { onConflict: 'indicator' });
              threatCount++;
            }
          }
        } catch (e) {
          console.error('[Scheduled Scan] AbuseIPDB error:', e);
        }
      }
      
      results.threat_intel = { indicators_updated: threatCount };
    }

    // Log scan completion
    console.log('[Scheduled Scan] Completed:', results);
    
    // Record scan in audit log
    await supabase.from('audit_logs').insert({
      action: 'scheduled_security_scan',
      resource_type: 'system',
      details: { scan_type: scanType, results }
    });

    return new Response(JSON.stringify({
      success: true,
      scan_type: scanType,
      timestamp: new Date().toISOString(),
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Scheduled Scan] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledScan {
  id?: string;
  user_id: string;
  name: string;
  scan_type: 'url' | 'email_domain';
  targets: string[];
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
  is_active?: boolean;
  last_run?: string;
  next_run?: string;
  notify_on_threat?: boolean;
  notify_email?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (action) {
      case 'create':
        return await createScheduledScan(supabase, payload as ScheduledScan);
      
      case 'list':
        return await listScheduledScans(supabase, payload.user_id);
      
      case 'update':
        return await updateScheduledScan(supabase, payload);
      
      case 'delete':
        return await deleteScheduledScan(supabase, payload.id, payload.user_id);
      
      case 'run':
        return await runScheduledScan(supabase, payload.id, payload.user_id);
      
      case 'process_due':
        return await processDueScans(supabase);
      
      default:
        throw new Error('Unknown action: ' + action);
    }
  } catch (error: any) {
    console.error('Scheduled scan error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function createScheduledScan(supabase: any, scan: ScheduledScan) {
  const nextRun = calculateNextRun(scan.frequency);
  
  const { data, error } = await supabase
    .from('scheduled_scans')
    .insert({
      user_id: scan.user_id,
      name: scan.name,
      scan_type: scan.scan_type,
      scan_target: scan.targets[0] || '', // Use first target for backwards compat
      targets: scan.targets,
      frequency: scan.frequency,
      is_active: true,
      next_run_at: nextRun,
      notify_on_threat: scan.notify_on_threat ?? true,
      notify_email: scan.notify_email
    })
    .select()
    .single();

  if (error) throw error;

  // Map to expected format
  const mappedData = {
    ...data,
    next_run: data.next_run_at,
    last_run: data.last_run_at
  };

  return new Response(
    JSON.stringify({ success: true, scheduled_scan: mappedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function listScheduledScans(supabase: any, user_id: string) {
  const { data, error } = await supabase
    .from('scheduled_scans')
    .select('*')
    .eq('user_id', user_id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Map column names for frontend
  const mappedData = (data || []).map((item: any) => ({
    ...item,
    next_run: item.next_run_at,
    last_run: item.last_run_at,
    targets: item.targets || [item.scan_target].filter(Boolean)
  }));

  return new Response(
    JSON.stringify({ success: true, scheduled_scans: mappedData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function updateScheduledScan(supabase: any, payload: any) {
  const { id, user_id, ...updates } = payload;
  
  // Map field names
  if (updates.frequency) {
    updates.next_run_at = calculateNextRun(updates.frequency);
  }

  const { data, error } = await supabase
    .from('scheduled_scans')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user_id)
    .select()
    .single();

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true, scheduled_scan: { ...data, next_run: data.next_run_at, last_run: data.last_run_at } }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function deleteScheduledScan(supabase: any, id: string, user_id: string) {
  const { error } = await supabase
    .from('scheduled_scans')
    .delete()
    .eq('id', id)
    .eq('user_id', user_id);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function runScheduledScan(supabase: any, id: string, user_id: string) {
  // Get the scheduled scan
  const { data: scan, error: fetchError } = await supabase
    .from('scheduled_scans')
    .select('*')
    .eq('id', id)
    .eq('user_id', user_id)
    .single();

  if (fetchError || !scan) throw new Error('Scheduled scan not found');

  // Run the scan
  const results = await executeScan(supabase, scan);

  // Update last_run and next_run
  await supabase
    .from('scheduled_scans')
    .update({
      last_run: new Date().toISOString(),
      next_run: calculateNextRun(scan.frequency)
    })
    .eq('id', id);

  // Store scan results
  await supabase.from('scheduled_scan_results').insert({
    scheduled_scan_id: id,
    user_id: user_id,
    results: results,
    threats_found: results.filter((r: any) => !r.safe).length
  });

  // Send notification if threats found and notifications enabled
  if (scan.notify_on_threat && results.some((r: any) => !r.safe)) {
    await sendThreatNotification(supabase, scan, results);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      results,
      summary: {
        total: results.length,
        threats: results.filter((r: any) => !r.safe).length,
        safe: results.filter((r: any) => r.safe).length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processDueScans(supabase: any) {
  // Get all active scans that are due
  const { data: dueScans, error } = await supabase
    .from('scheduled_scans')
    .select('*')
    .eq('is_active', true)
    .lte('next_run', new Date().toISOString());

  if (error) throw error;

  const processedScans = [];
  
  for (const scan of dueScans || []) {
    try {
      const results = await executeScan(supabase, scan);
      
      // Update scan timestamps
      await supabase
        .from('scheduled_scans')
        .update({
          last_run: new Date().toISOString(),
          next_run: calculateNextRun(scan.frequency)
        })
        .eq('id', scan.id);

      // Store results
      await supabase.from('scheduled_scan_results').insert({
        scheduled_scan_id: scan.id,
        user_id: scan.user_id,
        results: results,
        threats_found: results.filter((r: any) => !r.safe).length
      });

      // Notify on threats
      if (scan.notify_on_threat && results.some((r: any) => !r.safe)) {
        await sendThreatNotification(supabase, scan, results);
      }

      processedScans.push({
        id: scan.id,
        name: scan.name,
        threats_found: results.filter((r: any) => !r.safe).length
      });
    } catch (err: any) {
      console.error(`Failed to process scan ${scan.id}:`, err);
    }
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      processed: processedScans.length,
      scans: processedScans
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function executeScan(supabase: any, scan: any) {
  const results = [];

  for (const target of scan.targets) {
    try {
      let response;
      
      if (scan.scan_type === 'url') {
        response = await supabase.functions.invoke('ultrium-safelink-scanner', {
          body: { url: target, user_id: scan.user_id }
        });
      } else if (scan.scan_type === 'email_domain') {
        response = await supabase.functions.invoke('safemail-scanner', {
          body: {
            action: 'analyze_sender',
            sender: `test@${target}`
          }
        });
      }

      results.push({
        target,
        safe: response?.data?.safe ?? !response?.data?.isRisky,
        risk_level: response?.data?.risk_level || response?.data?.severity || 'unknown',
        threats_detected: response?.data?.threats_detected || [],
        details: response?.data
      });
    } catch (err: any) {
      results.push({
        target,
        safe: false,
        risk_level: 'unknown',
        threats_detected: ['Scan failed: ' + err.message],
        details: null
      });
    }
  }

  return results;
}

function calculateNextRun(frequency: string): string {
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
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
  }
  
  return now.toISOString();
}

async function sendThreatNotification(supabase: any, scan: any, results: any[]) {
  const threats = results.filter(r => !r.safe);
  
  if (scan.notify_email) {
    // Use existing email function
    try {
      await supabase.functions.invoke('send-email', {
        body: {
          to: scan.notify_email,
          subject: `⚠️ SafeScan Alert: ${threats.length} threats detected in "${scan.name}"`,
          html: `
            <h2>Scheduled Scan Alert</h2>
            <p>Your scheduled scan "<strong>${scan.name}</strong>" has detected ${threats.length} potential threat(s).</p>
            <h3>Affected Targets:</h3>
            <ul>
              ${threats.map(t => `<li><strong>${t.target}</strong> - Risk: ${t.risk_level}</li>`).join('')}
            </ul>
            <p>Please review these findings in your SafeScan dashboard.</p>
          `
        }
      });
    } catch (err) {
      console.error('Failed to send notification email:', err);
    }
  }

  // Also create in-app notification
  await supabase.from('user_notifications').insert({
    user_id: scan.user_id,
    type: 'security_alert',
    title: `Threats detected in scheduled scan`,
    message: `${threats.length} potential threats found in "${scan.name}"`,
    metadata: { scan_id: scan.id, threats_count: threats.length },
    is_read: false
  });
}

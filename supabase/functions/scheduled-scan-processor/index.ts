import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledScan {
  id: string;
  user_id: string;
  scan_type: 'email' | 'url' | 'document' | 'bulk';
  scan_target: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  schedule_time: string;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing scheduled scans...');

    // Get all active scheduled scans that are due to run
    const now = new Date().toISOString();
    const { data: dueScans, error: scanError } = await supabase
      .from('scheduled_scans')
      .select('*')
      .eq('is_active', true)
      .lte('next_run_at', now);

    if (scanError) {
      console.error('Error fetching scheduled scans:', scanError);
      throw scanError;
    }

    console.log(`Found ${dueScans?.length || 0} scheduled scans due for execution`);

    if (!dueScans || dueScans.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No scheduled scans due for execution',
          processed: 0 
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    let successCount = 0;
    let failureCount = 0;

    // Process each scheduled scan
    for (const scan of dueScans as ScheduledScan[]) {
      try {
        console.log(`Processing scan ${scan.id} for user ${scan.user_id}`);

        // Execute the appropriate scan function based on scan type
        let scanFunctionName = '';
        let scanBody: any = { user_id: scan.user_id };

        switch (scan.scan_type) {
          case 'email':
            scanFunctionName = 'safemail-scanner';
            scanBody.action = 'scan_email';
            scanBody.email = {
              subject: 'Scheduled Email Scan',
              sender: 'scheduled@scanner.com',
              content: scan.scan_target,
              timestamp: new Date().toISOString()
            };
            break;

          case 'url':
            scanFunctionName = 'ultrium-safelink-scanner';
            scanBody.url = scan.scan_target;
            break;

          case 'document':
            scanFunctionName = 'safedoc-scanner';
            scanBody.file_name = `scheduled_scan_${scan.id}.txt`;
            scanBody.file_size = 1024;
            scanBody.scan_target = scan.scan_target;
            break;

          case 'bulk':
            // For bulk scans, we could process multiple targets
            console.log(`Bulk scan scheduled for: ${scan.scan_target}`);
            continue; // Skip for now, implement based on requirements
        }

        if (scanFunctionName) {
          console.log(`Invoking ${scanFunctionName} for scan ${scan.id}`);
          
          const { data: scanResult, error: scanExecutionError } = await supabase.functions.invoke(
            scanFunctionName,
            { body: scanBody }
          );

          if (scanExecutionError) {
            console.error(`Error executing scan ${scan.id}:`, scanExecutionError);
            failureCount++;
          } else {
            console.log(`Successfully executed scan ${scan.id}`);
            successCount++;

            // Send notification if threats detected
            if (scanResult && (!scanResult.safe || scanResult.threats_detected?.length > 0)) {
              try {
                // Get user details for notification
                const { data: userData } = await supabase.auth.admin.getUserById(scan.user_id);
                
                await supabase.functions.invoke('send-scan-notification', {
                  body: {
                    userEmail: userData.user?.email || 'user@example.com',
                    userName: userData.user?.user_metadata?.full_name || 'User',
                    scanType: scan.scan_type,
                    threatCount: scanResult.threats_detected?.length || 0,
                    safe: scanResult.safe,
                    riskLevel: scanResult.risk_level,
                    scanDetails: scanResult.scan_details,
                    isScheduled: true,
                    scanTarget: scan.scan_target
                  }
                });
                console.log(`Sent notification for scheduled scan ${scan.id}`);
              } catch (notificationError) {
                console.error(`Failed to send notification for scan ${scan.id}:`, notificationError);
              }
            }
          }
        }

        // Calculate next run time based on frequency
        const nextRunAt = calculateNextRun(scan.frequency, scan.schedule_time);

        // Update the scheduled scan with last run and next run times
        const { error: updateError } = await supabase
          .from('scheduled_scans')
          .update({
            last_run_at: now,
            next_run_at: nextRunAt
          })
          .eq('id', scan.id);

        if (updateError) {
          console.error(`Error updating scan ${scan.id}:`, updateError);
        }

      } catch (error) {
        console.error(`Error processing scan ${scan.id}:`, error);
        failureCount++;
      }
    }

    console.log(`Processed ${successCount + failureCount} scans: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${successCount + failureCount} scheduled scans`,
        processed: successCount + failureCount,
        successful: successCount,
        failed: failureCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in scheduled scan processor:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

function calculateNextRun(frequency: string, scheduleTime: string): string {
  const now = new Date();
  const [hours, minutes] = scheduleTime.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  // If the scheduled time for today has passed, move to next occurrence
  if (nextRun <= now) {
    switch (frequency) {
      case 'daily':
        nextRun.setDate(nextRun.getDate() + 1);
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + 7);
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
    }
  }
  
  return nextRun.toISOString();
}
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Offline threshold in minutes
const OFFLINE_THRESHOLD_MINUTES = 5;

interface DeviceOfflinePayload {
  device_id: string;
  device_name: string;
  user_id: string;
  last_heartbeat: string;
  client_id?: string;
}

async function sendEmailNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  subject: string,
  body: string
) {
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (!resendApiKey) {
    console.log('[Email] RESEND_API_KEY not configured, skipping email');
    return false;
  }

  // Get users with ticket notification settings enabled
  const { data: settings } = await supabase
    .from('notification_settings')
    .select('user_id')
    .eq('user_id', userId)
    .eq('email_enabled', true)
    .eq('ticket_created', true)
    .single();

  if (!settings) {
    console.log('[Email] User has email notifications disabled');
    return false;
  }

  // Get user email from profiles or auth
  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single();

  const recipientEmail = profile?.email;
  if (!recipientEmail) {
    console.log('[Email] No email found for user');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Vanguard Alerts <hello@send.ultriumai.com>',
        to: [recipientEmail],
        subject,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background: #111827; border-radius: 12px; overflow: hidden; border: 1px solid #1f2937;">
              <div style="background: linear-gradient(135deg, #0ea5e9 0%, #8b5cf6 100%); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🛡️ Ultrium Vanguard</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Availability Alert</p>
              </div>
              <div style="padding: 32px 24px;">
                <div style="background: #dc2626; color: white; padding: 12px 16px; border-radius: 8px; margin-bottom: 20px;">
                  <strong>⚠️ ${subject}</strong>
                </div>
                <div style="color: #d1d5db; line-height: 1.6; font-size: 15px;">
                  ${body.replace(/\n/g, '<br>')}
                </div>
              </div>
              <div style="background: #0f172a; padding: 16px 24px; text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #1f2937;">
                <p style="margin: 0;">This is an automated alert from Vanguard Availability Monitoring.</p>
                <p style="margin: 8px 0 0 0;">© ${new Date().getFullYear()} UltriumAI. All rights reserved.</p>
              </div>
            </div>
          </body>
          </html>
        `
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Email] Resend API error:', errorData);
      return false;
    }

    console.log('[Email] Notification sent successfully');
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

async function createOfflineTicket(
  supabase: ReturnType<typeof createClient>,
  payload: DeviceOfflinePayload
): Promise<string | null> {
  const ticketNumber = `AVL-${Date.now().toString(36).toUpperCase()}`;
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .insert({
      user_id: payload.user_id,
      client_id: payload.client_id || null,
      ticket_number: ticketNumber,
      title: `Device Offline: ${payload.device_name}`,
      description: `
**Automated Alert: Device Offline**

The following device has gone offline and requires attention:

- **Device Name:** ${payload.device_name}
- **Device ID:** ${payload.device_id}
- **Last Heartbeat:** ${new Date(payload.last_heartbeat).toLocaleString()}
- **Offline Duration:** More than ${OFFLINE_THRESHOLD_MINUTES} minutes

Please investigate the device connectivity and take appropriate action.

---
*This ticket was automatically created by Vanguard Availability Monitoring.*
      `.trim(),
      priority: 'high',
      status: 'open',
      category: 'Monitoring',
      source: 'system',
      tags: ['availability', 'device-offline', 'automated'],
      metadata: {
        device_id: payload.device_id,
        device_name: payload.device_name,
        last_heartbeat: payload.last_heartbeat,
        alert_type: 'device_offline',
        auto_generated: true
      }
    })
    .select('id')
    .single();

  if (error) {
    console.error('[Ticket] Error creating ticket:', error);
    return null;
  }

  console.log('[Ticket] Created offline alert ticket:', ticket.id);
  return ticket.id;
}

async function checkDeviceAvailability(supabase: ReturnType<typeof createClient>) {
  const offlineThreshold = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);
  
  // Find devices with availability monitoring enabled that are offline
  const { data: offlineDevices, error: devicesError } = await supabase
    .from('vanguard_agents')
    .select('id, name, user_id, client_id, last_heartbeat, device_id')
    .eq('availability_monitoring_enabled', true)
    .lt('last_heartbeat', offlineThreshold.toISOString());

  if (devicesError) {
    console.error('[Monitor] Error fetching devices:', devicesError);
    throw devicesError;
  }

  if (!offlineDevices?.length) {
    console.log('[Monitor] No offline devices with monitoring enabled');
    return { alerts_created: 0, tickets_created: 0 };
  }

  console.log(`[Monitor] Found ${offlineDevices.length} offline devices`);
  
  let alertsCreated = 0;
  let ticketsCreated = 0;

  for (const device of offlineDevices) {
    // Check if there's already an unresolved alert for this device
    const { data: existingAlert } = await supabase
      .from('device_availability_alerts')
      .select('id')
      .eq('device_id', device.id)
      .is('resolved_at', null)
      .single();

    if (existingAlert) {
      console.log(`[Monitor] Alert already exists for device ${device.name}`);
      continue;
    }

    // Create a ticket for the offline device
    const ticketId = await createOfflineTicket(supabase, {
      device_id: device.id,
      device_name: device.name,
      user_id: device.user_id,
      last_heartbeat: device.last_heartbeat,
      client_id: device.client_id
    });

    // Record the alert
    const { error: alertError } = await supabase
      .from('device_availability_alerts')
      .insert({
        user_id: device.user_id,
        device_id: device.id,
        device_name: device.name,
        alert_type: 'device_offline',
        ticket_id: ticketId,
        last_heartbeat_at: device.last_heartbeat,
        notification_sent: false
      });

    if (alertError) {
      console.error('[Monitor] Error creating alert:', alertError);
      continue;
    }

    alertsCreated++;
    if (ticketId) ticketsCreated++;

    // Send email notification
    const emailSent = await sendEmailNotification(
      supabase,
      device.user_id,
      `Device Offline: ${device.name}`,
      `
A device has gone offline and requires attention.

**Device:** ${device.name}
**Last Seen:** ${new Date(device.last_heartbeat).toLocaleString()}
**Offline Duration:** More than ${OFFLINE_THRESHOLD_MINUTES} minutes

A ticket has been created automatically. Please investigate the device connectivity.
      `.trim()
    );

    // Update alert with notification status
    if (emailSent) {
      await supabase
        .from('device_availability_alerts')
        .update({ notification_sent: true })
        .eq('device_id', device.id)
        .is('resolved_at', null);
    }
  }

  return { alerts_created: alertsCreated, tickets_created: ticketsCreated };
}

async function resolveDeviceAlerts(supabase: ReturnType<typeof createClient>) {
  const onlineThreshold = new Date(Date.now() - OFFLINE_THRESHOLD_MINUTES * 60 * 1000);
  
  // Find devices that are back online
  const { data: onlineDevices, error: devicesError } = await supabase
    .from('vanguard_agents')
    .select('id, name, user_id')
    .gte('last_heartbeat', onlineThreshold.toISOString());

  if (devicesError) {
    console.error('[Monitor] Error fetching online devices:', devicesError);
    return { resolved: 0 };
  }

  if (!onlineDevices?.length) {
    return { resolved: 0 };
  }

  const deviceIds = onlineDevices.map(d => d.id);
  
  // Resolve any open alerts for these devices
  const { data: resolvedAlerts, error: resolveError } = await supabase
    .from('device_availability_alerts')
    .update({ resolved_at: new Date().toISOString() })
    .in('device_id', deviceIds)
    .is('resolved_at', null)
    .select('id, device_name, ticket_id');

  if (resolveError) {
    console.error('[Monitor] Error resolving alerts:', resolveError);
    return { resolved: 0 };
  }

  // Auto-resolve associated tickets
  for (const alert of resolvedAlerts || []) {
    if (alert.ticket_id) {
      await supabase
        .from('tickets')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          internal_notes: `Automatically resolved - device ${alert.device_name} is back online.`
        })
        .eq('id', alert.ticket_id)
        .eq('status', 'open');
    }
  }

  console.log(`[Monitor] Resolved ${resolvedAlerts?.length || 0} alerts`);
  return { resolved: resolvedAlerts?.length || 0 };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let body: { action?: string } = {};
    try {
      body = await req.json();
    } catch {
      // No body provided, use defaults
    }

    const action = body.action || 'check';
    console.log(`[availability-monitor] Action: ${action}`);

    if (action === 'check') {
      // Check for offline devices and create alerts/tickets
      const checkResult = await checkDeviceAvailability(supabase);
      
      // Also resolve alerts for devices that are back online
      const resolveResult = await resolveDeviceAlerts(supabase);
      
      return new Response(
        JSON.stringify({ 
          success: true,
          ...checkResult,
          resolved: resolveResult.resolved,
          timestamp: new Date().toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'toggle') {
      // Toggle availability monitoring for a specific device
      const { device_id, enabled } = body as { device_id: string; enabled: boolean };
      
      if (!device_id) {
        return new Response(
          JSON.stringify({ error: 'device_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase
        .from('vanguard_agents')
        .update({ availability_monitoring_enabled: enabled })
        .eq('id', device_id);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, device_id, enabled }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[availability-monitor] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

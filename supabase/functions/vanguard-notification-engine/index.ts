import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface NotificationPayload {
  user_id: string;
  alert_type: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  metadata?: Record<string, unknown>;
  channel_ids?: string[];
  rule_id?: string;
}

interface ChannelConfig {
  // Email
  emails?: string[];
  // Slack
  slack_webhook_url?: string;
  slack_channel?: string;
  // Teams
  teams_webhook_url?: string;
  // SMS (Twilio)
  phone_numbers?: string[];
  twilio_sid?: string;
  twilio_token?: string;
  twilio_from?: string;
  // PagerDuty
  pagerduty_routing_key?: string;
  // OpsGenie
  opsgenie_api_key?: string;
  // Webhook
  webhook_url?: string;
  webhook_headers?: Record<string, string>;
}

const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#ca8a04';
    case 'low': return '#2563eb';
    default: return '#6b7280';
  }
};

const getSeverityEmoji = (severity: string): string => {
  switch (severity) {
    case 'critical': return '🚨';
    case 'high': return '⚠️';
    case 'medium': return '⚡';
    case 'low': return 'ℹ️';
    default: return '📢';
  }
};

async function sendEmail(to: string[], subject: string, body: string): Promise<boolean> {
  // In production, integrate with SendGrid, Resend, or AWS SES
  console.log(`[Email] Sending to ${to.join(', ')}: ${subject}`);
  // Placeholder - would call email API
  return true;
}

async function sendSlack(webhookUrl: string, payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${getSeverityEmoji(payload.severity)} ${payload.title}`,
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: payload.message
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Severity:* ${payload.severity.toUpperCase()} | *Type:* ${payload.alert_type} | *Time:* ${new Date().toISOString()}`
              }
            ]
          }
        ],
        attachments: [
          {
            color: getSeverityColor(payload.severity)
          }
        ]
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[Slack] Error:', error);
    return false;
  }
}

async function sendTeams(webhookUrl: string, payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        themeColor: getSeverityColor(payload.severity).replace('#', ''),
        summary: payload.title,
        sections: [{
          activityTitle: `${getSeverityEmoji(payload.severity)} ${payload.title}`,
          activitySubtitle: `Severity: ${payload.severity.toUpperCase()}`,
          facts: [
            { name: "Type", value: payload.alert_type },
            { name: "Time", value: new Date().toISOString() }
          ],
          text: payload.message,
          markdown: true
        }]
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[Teams] Error:', error);
    return false;
  }
}

async function sendSMS(config: ChannelConfig, payload: NotificationPayload): Promise<boolean> {
  if (!config.twilio_sid || !config.twilio_token || !config.twilio_from || !config.phone_numbers?.length) {
    console.error('[SMS] Missing Twilio configuration');
    return false;
  }
  
  try {
    const message = `${getSeverityEmoji(payload.severity)} VANGUARD: ${payload.title} - ${payload.message}`.slice(0, 160);
    
    for (const phone of config.phone_numbers) {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${config.twilio_sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${btoa(`${config.twilio_sid}:${config.twilio_token}`)}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            To: phone,
            From: config.twilio_from,
            Body: message
          })
        }
      );
      if (!response.ok) {
        console.error('[SMS] Failed to send to', phone);
      }
    }
    return true;
  } catch (error) {
    console.error('[SMS] Error:', error);
    return false;
  }
}

async function sendPagerDuty(routingKey: string, payload: NotificationPayload): Promise<boolean> {
  try {
    const pdSeverity = payload.severity === 'critical' ? 'critical' : 
                       payload.severity === 'high' ? 'error' :
                       payload.severity === 'medium' ? 'warning' : 'info';
    
    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        routing_key: routingKey,
        event_action: 'trigger',
        payload: {
          summary: payload.title,
          severity: pdSeverity,
          source: 'Vanguard Security',
          custom_details: {
            message: payload.message,
            alert_type: payload.alert_type,
            ...payload.metadata
          }
        }
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[PagerDuty] Error:', error);
    return false;
  }
}

async function sendOpsGenie(apiKey: string, payload: NotificationPayload): Promise<boolean> {
  try {
    const priority = payload.severity === 'critical' ? 'P1' :
                     payload.severity === 'high' ? 'P2' :
                     payload.severity === 'medium' ? 'P3' : 'P4';
    
    const response = await fetch('https://api.opsgenie.com/v2/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `GenieKey ${apiKey}`
      },
      body: JSON.stringify({
        message: payload.title,
        description: payload.message,
        priority,
        source: 'Vanguard Security',
        details: {
          alert_type: payload.alert_type,
          ...payload.metadata
        }
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[OpsGenie] Error:', error);
    return false;
  }
}

async function sendWebhook(url: string, headers: Record<string, string>, payload: NotificationPayload): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        event: 'vanguard.alert',
        timestamp: new Date().toISOString(),
        data: payload
      })
    });
    return response.ok;
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { action = 'send', ...payload } = body;

    console.log(`[notification-engine] Action: ${action}`);

    if (action === 'send') {
      const notificationPayload = payload as NotificationPayload;
      
      // Get user's notification channels
      let channelQuery = supabase
        .from('vanguard_notification_channels')
        .select('*')
        .eq('user_id', notificationPayload.user_id)
        .eq('is_enabled', true);
      
      if (notificationPayload.channel_ids?.length) {
        channelQuery = channelQuery.in('id', notificationPayload.channel_ids);
      }
      
      const { data: channels, error: channelsError } = await channelQuery;
      
      if (channelsError) {
        console.error('[notification-engine] Error fetching channels:', channelsError);
        throw channelsError;
      }

      const results: { channel_id: string; channel_type: string; success: boolean; error?: string }[] = [];

      for (const channel of channels || []) {
        const config = channel.config as ChannelConfig;
        let success = false;
        let errorMessage: string | undefined;

        try {
          switch (channel.channel_type) {
            case 'email':
              success = await sendEmail(
                config.emails || [],
                `[${notificationPayload.severity.toUpperCase()}] ${notificationPayload.title}`,
                notificationPayload.message
              );
              break;
            case 'slack':
              if (config.slack_webhook_url) {
                success = await sendSlack(config.slack_webhook_url, notificationPayload);
              }
              break;
            case 'teams':
              if (config.teams_webhook_url) {
                success = await sendTeams(config.teams_webhook_url, notificationPayload);
              }
              break;
            case 'sms':
              success = await sendSMS(config, notificationPayload);
              break;
            case 'pagerduty':
              if (config.pagerduty_routing_key) {
                success = await sendPagerDuty(config.pagerduty_routing_key, notificationPayload);
              }
              break;
            case 'opsgenie':
              if (config.opsgenie_api_key) {
                success = await sendOpsGenie(config.opsgenie_api_key, notificationPayload);
              }
              break;
            case 'webhook':
              if (config.webhook_url) {
                success = await sendWebhook(config.webhook_url, config.webhook_headers || {}, notificationPayload);
              }
              break;
          }
        } catch (err) {
          errorMessage = err instanceof Error ? err.message : 'Unknown error';
        }

        results.push({
          channel_id: channel.id,
          channel_type: channel.channel_type,
          success,
          error: errorMessage
        });

        // Log to alert history
        await supabase.from('vanguard_alert_history').insert({
          user_id: notificationPayload.user_id,
          rule_id: notificationPayload.rule_id,
          channel_id: channel.id,
          alert_type: notificationPayload.alert_type,
          title: notificationPayload.title,
          message: notificationPayload.message,
          severity: notificationPayload.severity,
          metadata: notificationPayload.metadata,
          status: success ? 'sent' : 'failed',
          error_message: errorMessage
        });

        // Update channel last_used_at
        if (success) {
          await supabase
            .from('vanguard_notification_channels')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', channel.id);
        }
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'test_channel') {
      const { channel_id, user_id } = payload;
      
      const { data: channel } = await supabase
        .from('vanguard_notification_channels')
        .select('*')
        .eq('id', channel_id)
        .eq('user_id', user_id)
        .single();
      
      if (!channel) {
        return new Response(
          JSON.stringify({ error: 'Channel not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const testPayload: NotificationPayload = {
        user_id,
        alert_type: 'test',
        title: 'Test Notification from Vanguard',
        message: 'This is a test notification to verify your channel configuration is working correctly.',
        severity: 'info',
        metadata: { test: true }
      };

      const config = channel.config as ChannelConfig;
      let success = false;

      switch (channel.channel_type) {
        case 'email':
          success = await sendEmail(config.emails || [], testPayload.title, testPayload.message);
          break;
        case 'slack':
          success = config.slack_webhook_url ? await sendSlack(config.slack_webhook_url, testPayload) : false;
          break;
        case 'teams':
          success = config.teams_webhook_url ? await sendTeams(config.teams_webhook_url, testPayload) : false;
          break;
        case 'pagerduty':
          success = config.pagerduty_routing_key ? await sendPagerDuty(config.pagerduty_routing_key, testPayload) : false;
          break;
        case 'opsgenie':
          success = config.opsgenie_api_key ? await sendOpsGenie(config.opsgenie_api_key, testPayload) : false;
          break;
        case 'webhook':
          success = config.webhook_url ? await sendWebhook(config.webhook_url, config.webhook_headers || {}, testPayload) : false;
          break;
      }

      // Update verification status
      await supabase
        .from('vanguard_notification_channels')
        .update({ 
          is_verified: success,
          last_used_at: new Date().toISOString()
        })
        .eq('id', channel_id);

      return new Response(
        JSON.stringify({ success, channel_type: channel.channel_type }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check_escalations') {
      // Check for unacknowledged alerts that need escalation
      const { data: unacknowledged } = await supabase
        .from('vanguard_alert_history')
        .select(`
          *,
          rule:vanguard_alert_rules(
            id,
            vanguard_alert_escalations(*)
          )
        `)
        .is('acknowledged_at', null)
        .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      const escalated: string[] = [];

      for (const alert of unacknowledged || []) {
        const escalations = alert.rule?.vanguard_alert_escalations || [];
        const alertAge = (Date.now() - new Date(alert.sent_at).getTime()) / (60 * 1000);

        for (const escalation of escalations) {
          if (alertAge >= escalation.delay_minutes) {
            // Send escalation notification
            await supabase.functions.invoke('vanguard-notification-engine', {
              body: {
                action: 'send',
                user_id: alert.user_id,
                alert_type: 'escalation',
                title: `[ESCALATION] ${alert.title}`,
                message: `Alert not acknowledged after ${escalation.delay_minutes} minutes. Original: ${alert.message}`,
                severity: 'critical',
                channel_ids: [escalation.channel_id],
                metadata: { original_alert_id: alert.id, escalation_level: escalation.level }
              }
            });
            escalated.push(alert.id);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, escalated_count: escalated.length }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[notification-engine] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

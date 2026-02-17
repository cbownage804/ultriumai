import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SLACK-TEAMS-NOTIFY] ${step}${detailsStr}`);
};

// Format Slack Block Kit message
const formatSlackMessage = (event: string, payload: any): any => {
  const severityEmoji: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🟢',
    info: 'ℹ️',
  };

  const emoji = severityEmoji[payload.severity?.toLowerCase()] || '📢';
  const title = payload.title || event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const timestamp = Math.floor(Date.now() / 1000);

  return {
    blocks: [
      {
        type: "header",
        text: { type: "plain_text", text: `${emoji} ${title}`, emoji: true }
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Event:*\n\`${event}\`` },
          { type: "mrkdwn", text: `*Severity:*\n${payload.severity || 'N/A'}` },
          ...(payload.device ? [{ type: "mrkdwn", text: `*Device:*\n${payload.device}` }] : []),
          ...(payload.assignee ? [{ type: "mrkdwn", text: `*Assignee:*\n${payload.assignee}` }] : []),
        ]
      },
      ...(payload.description ? [{
        type: "section",
        text: { type: "mrkdwn", text: `*Details:*\n${payload.description.substring(0, 500)}` }
      }] : []),
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Sent by *Vanguard* • <!date^${timestamp}^{date_short_pretty} at {time}|${new Date().toISOString()}>` }
        ]
      },
      ...(payload.action_url ? [{
        type: "actions",
        elements: [{
          type: "button",
          text: { type: "plain_text", text: "View in Vanguard", emoji: true },
          url: payload.action_url,
          style: "primary"
        }]
      }] : []),
    ]
  };
};

// Format Microsoft Teams Adaptive Card
const formatTeamsMessage = (event: string, payload: any): any => {
  const severityColor: Record<string, string> = {
    critical: 'attention',
    high: 'warning',
    medium: 'accent',
    low: 'good',
    info: 'default',
  };

  const title = payload.title || event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
  const color = severityColor[payload.severity?.toLowerCase()] || 'default';

  return {
    type: "message",
    attachments: [{
      contentType: "application/vnd.microsoft.card.adaptive",
      content: {
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.4",
        body: [
          {
            type: "TextBlock",
            text: `🛡️ ${title}`,
            size: "Large",
            weight: "Bolder",
            color
          },
          {
            type: "FactSet",
            facts: [
              { title: "Event", value: event },
              { title: "Severity", value: payload.severity || 'N/A' },
              ...(payload.device ? [{ title: "Device", value: payload.device }] : []),
              ...(payload.assignee ? [{ title: "Assignee", value: payload.assignee }] : []),
              { title: "Time", value: new Date().toLocaleString() },
            ]
          },
          ...(payload.description ? [{
            type: "TextBlock",
            text: payload.description.substring(0, 500),
            wrap: true,
            size: "Small"
          }] : []),
        ],
        actions: payload.action_url ? [{
          type: "Action.OpenUrl",
          title: "View in Vanguard",
          url: payload.action_url
        }] : []
      }
    }]
  };
};

// Format Discord embed
const formatDiscordMessage = (event: string, payload: any): any => {
  const severityColor: Record<string, number> = {
    critical: 0xFF0000,
    high: 0xFF8800,
    medium: 0xFFDD00,
    low: 0x00CC00,
    info: 0x0088FF,
  };

  const title = payload.title || event.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());

  return {
    embeds: [{
      title: `🛡️ ${title}`,
      color: severityColor[payload.severity?.toLowerCase()] || 0x0088FF,
      fields: [
        { name: "Event", value: `\`${event}\``, inline: true },
        { name: "Severity", value: payload.severity || 'N/A', inline: true },
        ...(payload.device ? [{ name: "Device", value: payload.device, inline: true }] : []),
        ...(payload.description ? [{ name: "Details", value: payload.description.substring(0, 250) }] : []),
      ],
      footer: { text: "Vanguard Security" },
      timestamp: new Date().toISOString(),
    }]
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { event, payload, userId, webhookIds } = await req.json();

    if (!event || !payload) {
      throw new Error('Event and payload are required');
    }

    logStep("Processing notification", { event, userId });

    // Get matching webhook configs
    let query = supabase
      .from('webhook_configs')
      .select('*')
      .eq('is_active', true)
      .contains('events', [event]);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    if (webhookIds?.length) {
      query = query.in('id', webhookIds);
    }

    const { data: webhooks, error } = await query;

    if (error) throw error;

    if (!webhooks?.length) {
      return new Response(JSON.stringify({ message: 'No matching webhooks', delivered: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    logStep("Found webhooks", { count: webhooks.length });

    const results = await Promise.allSettled(webhooks.map(async (webhook: any) => {
      let body: any;

      switch (webhook.webhook_type) {
        case 'slack':
          body = formatSlackMessage(event, payload);
          break;
        case 'teams':
          body = formatTeamsMessage(event, payload);
          break;
        case 'discord':
          body = formatDiscordMessage(event, payload);
          break;
        default:
          body = { event, payload, timestamp: new Date().toISOString(), source: 'vanguard' };
      }

      const startTime = Date.now();
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      });

      const responseTime = Date.now() - startTime;
      const success = response.ok;

      // Update webhook stats
      await supabase
        .from('webhook_configs')
        .update({
          [success ? 'success_count' : 'failure_count']: webhook[success ? 'success_count' : 'failure_count'] + 1,
          ...(success ? { last_triggered_at: new Date().toISOString() } : {}),
        })
        .eq('id', webhook.id);

      logStep(success ? "Delivered" : "Failed", { webhookId: webhook.id, type: webhook.webhook_type, status: response.status, responseTime });

      return { webhookId: webhook.id, success, status: response.status, responseTime };
    }));

    const successCount = results.filter(r => r.status === 'fulfilled' && (r.value as any).success).length;

    return new Response(JSON.stringify({
      delivered: results.length,
      successful: successCount,
      failed: results.length - successCount,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);

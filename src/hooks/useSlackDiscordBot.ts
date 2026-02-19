import { useState, useCallback } from 'react';

export type NotificationChannel = 'slack' | 'discord';
export type EventType = 'build_success' | 'build_failure' | 'deploy' | 'error_alert' | 'new_comment' | 'pr_merged';

export interface BotConfig {
  id: string;
  channel: NotificationChannel;
  webhookUrl: string;
  name: string;
  events: EventType[];
  isActive: boolean;
}

export interface NotificationLog {
  id: string;
  botId: string;
  event: EventType;
  message: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error?: string;
}

const EVENT_LABELS: Record<EventType, string> = {
  build_success: '✅ Build Success',
  build_failure: '❌ Build Failure',
  deploy: '🚀 Deployment',
  error_alert: '🚨 Error Alert',
  new_comment: '💬 New Comment',
  pr_merged: '🔀 PR Merged',
};

export function useSlackDiscordBot() {
  const [bots, setBots] = useState<BotConfig[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);

  const addBot = useCallback((channel: NotificationChannel, webhookUrl: string, name: string) => {
    const bot: BotConfig = {
      id: crypto.randomUUID(),
      channel,
      webhookUrl,
      name,
      events: ['build_success', 'build_failure', 'deploy'],
      isActive: true,
    };
    setBots(prev => [...prev, bot]);
    return bot;
  }, []);

  const updateBot = useCallback((id: string, updates: Partial<BotConfig>) => {
    setBots(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const removeBot = useCallback((id: string) => {
    setBots(prev => prev.filter(b => b.id !== id));
  }, []);

  const toggleEvent = useCallback((botId: string, event: EventType) => {
    setBots(prev => prev.map(b => {
      if (b.id !== botId) return b;
      const events = b.events.includes(event) ? b.events.filter(e => e !== event) : [...b.events, event];
      return { ...b, events };
    }));
  }, []);

  const generateEdgeFunctionCode = useCallback((bot: BotConfig): string => {
    if (bot.channel === 'slack') {
      return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event, message, details } = await req.json();
    const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL");
    if (!webhookUrl) throw new Error("SLACK_WEBHOOK_URL not configured");

    const payload = {
      blocks: [
        { type: "header", text: { type: "plain_text", text: \`\${event}: \${message}\` } },
        ...(details ? [{ type: "section", text: { type: "mrkdwn", text: details } }] : []),
        { type: "context", elements: [{ type: "mrkdwn", text: \`_Sent by ${bot.name} • \${new Date().toISOString()}_\` }] },
      ],
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) throw new Error(\`Slack API error: \${resp.status}\`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});`;
    }

    return `import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { event, message, details } = await req.json();
    const webhookUrl = Deno.env.get("DISCORD_WEBHOOK_URL");
    if (!webhookUrl) throw new Error("DISCORD_WEBHOOK_URL not configured");

    const payload = {
      embeds: [{
        title: \`\${event}: \${message}\`,
        description: details || undefined,
        color: event.includes("success") ? 0x00ff00 : event.includes("failure") ? 0xff0000 : 0x0078d4,
        footer: { text: \`${bot.name} • \${new Date().toISOString()}\` },
      }],
    };

    const resp = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) throw new Error(\`Discord API error: \${resp.status}\`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});`;
  }, []);

  const sendTestNotification = useCallback(async (bot: BotConfig) => {
    const log: NotificationLog = {
      id: crypto.randomUUID(),
      botId: bot.id,
      event: 'build_success',
      message: `Test notification from ${bot.name}`,
      sentAt: new Date(),
      status: 'sent',
    };
    setLogs(prev => [log, ...prev].slice(0, 50));
    return log;
  }, []);

  return { bots, logs, addBot, updateBot, removeBot, toggleEvent, generateEdgeFunctionCode, sendTestNotification, EVENT_LABELS };
}

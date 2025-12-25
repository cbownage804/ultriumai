import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  type: 'threat' | 'scan_complete' | 'agent_offline' | 'compliance_failure';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  device_name?: string;
  device_ip?: string;
  user_id: string;
  channels: ('email' | 'teams')[];
  email_recipients?: string[];
  teams_webhook_url?: string;
}

async function sendEmail(to: string[], subject: string, body: string) {
  // Using Supabase's built-in email or a simple SMTP approach
  // For now, log the email (in production, integrate with SendGrid, Resend, etc.)
  console.log(`[EMAIL] To: ${to.join(', ')}`);
  console.log(`[EMAIL] Subject: ${subject}`);
  console.log(`[EMAIL] Body: ${body}`);
  
  // Return success for now - in production, implement actual email sending
  return { success: true, message: 'Email queued (implement with email provider)' };
}

async function sendTeamsNotification(webhookUrl: string, payload: AlertPayload) {
  const severityColors: Record<string, string> = {
    critical: 'FF0000',
    high: 'FF8C00',
    medium: 'FFD700',
    low: '1E90FF',
    info: '808080'
  };

  const typeEmojis: Record<string, string> = {
    threat: '🚨',
    scan_complete: '✅',
    agent_offline: '⚠️',
    compliance_failure: '📋'
  };

  const adaptiveCard = {
    "@type": "MessageCard",
    "@context": "http://schema.org/extensions",
    "themeColor": severityColors[payload.severity] || '0078D7',
    "summary": `${typeEmojis[payload.type]} ${payload.title}`,
    "sections": [{
      "activityTitle": `${typeEmojis[payload.type]} **${payload.title}**`,
      "activitySubtitle": `Severity: ${payload.severity.toUpperCase()}`,
      "facts": [
        {
          "name": "Description",
          "value": payload.description
        },
        ...(payload.device_name ? [{
          "name": "Device",
          "value": `${payload.device_name}${payload.device_ip ? ` (${payload.device_ip})` : ''}`
        }] : []),
        {
          "name": "Time",
          "value": new Date().toISOString()
        }
      ],
      "markdown": true
    }],
    "potentialAction": [{
      "@type": "OpenUri",
      "name": "View in Vanguard",
      "targets": [{
        "os": "default",
        "uri": "https://vanguard.ultriumai.com/soc"
      }]
    }]
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adaptiveCard)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Teams webhook error:', errorText);
      return { success: false, error: errorText };
    }

    return { success: true };
  } catch (error) {
    console.error('Teams notification error:', error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: AlertPayload = await req.json();
    console.log('Processing alert:', payload);

    const results: { channel: string; success: boolean; error?: string }[] = [];

    // Send to each requested channel
    for (const channel of payload.channels) {
      if (channel === 'email' && payload.email_recipients?.length) {
        const subject = `[Vanguard ${payload.severity.toUpperCase()}] ${payload.title}`;
        const body = `
Ultrium Vanguard Security Alert
================================

Type: ${payload.type}
Severity: ${payload.severity.toUpperCase()}
Title: ${payload.title}

Description:
${payload.description}

${payload.device_name ? `Device: ${payload.device_name}` : ''}
${payload.device_ip ? `IP Address: ${payload.device_ip}` : ''}

Time: ${new Date().toISOString()}

---
View in Vanguard: https://vanguard.ultriumai.com/soc
        `.trim();

        const emailResult = await sendEmail(payload.email_recipients, subject, body);
        results.push({ channel: 'email', ...emailResult });
      }

      if (channel === 'teams' && payload.teams_webhook_url) {
        const teamsResult = await sendTeamsNotification(payload.teams_webhook_url, payload);
        results.push({ channel: 'teams', ...teamsResult });
      }
    }

    // Log the notification
    await supabase.from('alert_notifications').insert({
      user_id: payload.user_id,
      notification_type: payload.type,
      recipient: payload.channels.join(','),
      status: results.every(r => r.success) ? 'sent' : 'failed',
      error_message: results.find(r => !r.success)?.error || null
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        results,
        message: `Alert sent to ${results.filter(r => r.success).length}/${payload.channels.length} channels`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Alerting error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

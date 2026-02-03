import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ThreatNotificationRequest {
  threat_id?: string;
  user_id: string;
  notification_type: 'email' | 'ticket' | 'webhook' | 'all';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
  // For XDR direct notifications
  xdr_threat?: {
    threat_type: string;
    severity: string;
    confidence: number;
    hostname: string;
    agent_id: string;
    affected_process?: any;
    affected_file?: any;
    affected_network?: any;
    mitre_techniques?: string[];
    ai_analysis?: string;
    actions_taken?: any[];
  };
  webhook_url?: string;
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

    const body: ThreatNotificationRequest = await req.json();
    const { threat_id, user_id, notification_type, urgency = 'medium', xdr_threat, webhook_url } = body;

    let threat: any;
    
    // Support both database threat lookup and direct XDR notifications
    if (xdr_threat) {
      // Direct XDR notification - no database lookup needed
      threat = {
        threat_type: xdr_threat.threat_type,
        severity: xdr_threat.severity,
        hostname: xdr_threat.hostname,
        ai_confidence_score: xdr_threat.confidence / 100,
        detected_at: new Date().toISOString(),
        ai_analysis: { threat_assessment: xdr_threat.ai_analysis },
        file_path: xdr_threat.affected_file?.path,
        process_name: xdr_threat.affected_process?.name,
        command_line: xdr_threat.affected_process?.command_line,
        network_connection: xdr_threat.affected_network ? 
          `${xdr_threat.affected_network.remote_ip}:${xdr_threat.affected_network.remote_port}` : null,
        mitre_techniques: xdr_threat.mitre_techniques,
        actions_taken: xdr_threat.actions_taken,
        status: 'detected'
      };
    } else if (threat_id) {
      // Get threat details from database
      const { data, error: threatError } = await supabase
        .from('safe_shield_threats')
        .select('*')
        .eq('id', threat_id)
        .single();

      if (threatError || !data) {
        throw new Error('Threat not found');
      }
      threat = data;
    } else {
      throw new Error('Either threat_id or xdr_threat must be provided');
    }

    // Get user profile for notifications
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name, company_name')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Get user's webhook configurations
    const { data: webhookConfigs } = await supabase
      .from('notification_webhooks')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true);

    const responses = [];

    // Create helpdesk ticket for critical threats
    if ((notification_type === 'ticket' || notification_type === 'all') && 
        (threat.severity === 'critical' || threat.severity === 'high')) {
      
      const ticketResponse = await supabase
        .from('helpdesk_tickets')
        .insert({
          title: `🚨 XDR Alert: ${threat.threat_type.toUpperCase()}`,
          description: `
**AUTOMATED XDR SECURITY ALERT**

**Threat Details:**
- **Type:** ${threat.threat_type}
- **Severity:** ${threat.severity.toUpperCase()}
- **Host:** ${threat.hostname}
- **Confidence:** ${Math.round((threat.ai_confidence_score || 0) * 100)}%
- **Detected:** ${new Date(threat.detected_at).toLocaleString()}

**AI Analysis:**
${threat.ai_analysis?.threat_assessment || threat.ai_analysis || 'Analysis pending'}

${threat.mitre_techniques?.length > 0 ? `**MITRE ATT&CK:** ${threat.mitre_techniques.join(', ')}` : ''}

**Technical Details:**
- **File Path:** ${threat.file_path || 'N/A'}
- **Process:** ${threat.process_name || 'N/A'}
- **Command:** ${threat.command_line || 'N/A'}
- **Network:** ${threat.network_connection || 'N/A'}

${threat.actions_taken?.length > 0 ? `**Auto-Remediation Actions:**
${threat.actions_taken.map((a: any, i: number) => `${i + 1}. ${a.description || a.action_type}`).join('\n')}` : ''}

**Status:** ${threat.status}

This ticket was automatically created by Vanguard Pursuit XDR.
          `,
          priority: threat.severity === 'critical' ? 'critical' : 'high',
          status: 'open',
          category: 'security_incident',
          device_context: {
            hostname: threat.hostname,
            threat_type: threat.threat_type,
            ai_confidence: threat.ai_confidence_score,
            mitre_techniques: threat.mitre_techniques
          }
        });

      responses.push({ type: 'ticket', success: !ticketResponse.error, data: ticketResponse });
    }

    // Send webhook notifications (Slack, Teams, Discord, custom)
    if (notification_type === 'webhook' || notification_type === 'all') {
      const webhooks = webhook_url ? [{ webhook_url, platform: 'custom' }] : (webhookConfigs || []);
      
      for (const webhook of webhooks) {
        try {
          const webhookPayload = buildWebhookPayload(webhook.platform || 'custom', threat, profile);
          
          const webhookResponse = await fetch(webhook.webhook_url || webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookPayload)
          });
          
          responses.push({ 
            type: 'webhook', 
            platform: webhook.platform,
            success: webhookResponse.ok, 
            status: webhookResponse.status 
          });
        } catch (err: any) {
          responses.push({ type: 'webhook', platform: webhook.platform, success: false, error: err.message });
        }
      }
    }

    // Send email notification
    if (notification_type === 'email' || notification_type === 'all') {
      const emailSubject = `🚨 XDR Alert: ${threat.severity.toUpperCase()} threat on ${threat.hostname}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ Vanguard Pursuit XDR Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">AI-powered threat detection and response</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #dc2626; margin-top: 0;">Threat Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Threat Type:</td><td>${threat.threat_type}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Severity:</td><td><span style="background: ${getSeverityColor(threat.severity)}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${threat.severity.toUpperCase()}</span></td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Hostname:</td><td>${threat.hostname}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Confidence:</td><td>${Math.round((threat.ai_confidence_score || 0) * 100)}%</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Detected:</td><td>${new Date(threat.detected_at).toLocaleString()}</td></tr>
              ${threat.mitre_techniques?.length > 0 ? `<tr><td style="padding: 8px 0; font-weight: bold;">MITRE ATT&CK:</td><td>${threat.mitre_techniques.join(', ')}</td></tr>` : ''}
            </table>
          </div>

          <div style="background: white; padding: 20px;">
            <h3 style="color: #1f2937;">🤖 AI Threat Analysis</h3>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
              ${threat.ai_analysis?.threat_assessment || threat.ai_analysis || 'Analysis in progress...'}
            </p>
            
            ${threat.actions_taken?.length > 0 ? `
            <h3 style="color: #1f2937;">🛡️ Auto-Remediation Actions</h3>
            <div style="background: #dcfce7; padding: 15px; border-radius: 6px; border-left: 4px solid #22c55e;">
              ${threat.actions_taken.map((action: any, i: number) => 
                `<p style="margin: 8px 0;"><strong>${i + 1}.</strong> ${action.description || action.action_type} ${action.executed ? '✅' : '⏳'}</p>`
              ).join('')}
            </div>
            ` : ''}

            <h3 style="color: #1f2937;">📋 Technical Details</h3>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px;">
              ${threat.process_name ? `<p>Process: ${threat.process_name}</p>` : ''}
              ${threat.file_path ? `<p>File: ${threat.file_path}</p>` : ''}
              ${threat.command_line ? `<p>Command: ${threat.command_line.substring(0, 100)}${threat.command_line.length > 100 ? '...' : ''}</p>` : ''}
              ${threat.network_connection ? `<p>Network: ${threat.network_connection}</p>` : ''}
            </div>
          </div>

          <div style="background: #1f2937; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0;">
              <a href="https://ultriumai.lovable.app/vanguard/app/pursuit" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px;">
                🛡️ Open Pursuit Dashboard
              </a>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
              Vanguard Pursuit XDR - AI-Powered Extended Detection & Response
            </p>
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: 'Vanguard Security <security@send.ultriumai.com>',
        to: [profile.email],
        subject: emailSubject,
        html: emailHtml,
      });

      responses.push({ type: 'email', success: !emailResponse.error, data: emailResponse });
    }

    // Log notification activity
    await supabase
      .from('safe_shield_actions')
      .insert({
        user_id: user_id,
        hostname: threat.hostname,
        action_type: 'xdr_notification',
        action_details: {
          threat_id: threat_id,
          notification_type: notification_type,
          severity: threat.severity,
          responses: responses.map(r => ({ type: r.type, success: r.success }))
        },
        performed_at: new Date().toISOString(),
        status: responses.every(r => r.success) ? 'completed' : 'failed'
      });

    return new Response(JSON.stringify({
      success: true,
      message: `Threat notifications sent successfully`,
      threat_id: threat_id,
      responses: responses,
      notification_summary: {
        email_sent: responses.some(r => r.type === 'email' && r.success),
        ticket_created: responses.some(r => r.type === 'ticket' && r.success),
        webhooks_sent: responses.filter(r => r.type === 'webhook' && r.success).length,
        severity: threat.severity,
        hostname: threat.hostname
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in threat-notification function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper to get severity color
function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'high': return '#ea580c';
    case 'medium': return '#f59e0b';
    case 'low': return '#22c55e';
    default: return '#6b7280';
  }
}

// Build webhook payload for different platforms
function buildWebhookPayload(platform: string, threat: any, profile: any) {
  const baseInfo = {
    threat_type: threat.threat_type,
    severity: threat.severity,
    hostname: threat.hostname,
    confidence: Math.round((threat.ai_confidence_score || 0) * 100),
    detected_at: threat.detected_at,
    ai_analysis: threat.ai_analysis?.threat_assessment || threat.ai_analysis,
    mitre_techniques: threat.mitre_techniques,
    actions_taken: threat.actions_taken
  };

  switch (platform) {
    case 'slack':
      return {
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: `🚨 XDR Alert: ${threat.threat_type}`, emoji: true }
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Severity:*\n${threat.severity.toUpperCase()}` },
              { type: 'mrkdwn', text: `*Hostname:*\n${threat.hostname}` },
              { type: 'mrkdwn', text: `*Confidence:*\n${baseInfo.confidence}%` },
              { type: 'mrkdwn', text: `*MITRE:*\n${threat.mitre_techniques?.join(', ') || 'N/A'}` }
            ]
          },
          {
            type: 'section',
            text: { type: 'mrkdwn', text: `*AI Analysis:*\n${baseInfo.ai_analysis || 'Analysis pending'}` }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'View in Pursuit', emoji: true },
                url: 'https://ultriumai.lovable.app/vanguard/app/pursuit',
                style: 'primary'
              }
            ]
          }
        ]
      };

    case 'teams':
      return {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": getSeverityColor(threat.severity).replace('#', ''),
        "summary": `XDR Alert: ${threat.threat_type}`,
        "sections": [{
          "activityTitle": `🚨 XDR Alert: ${threat.threat_type}`,
          "facts": [
            { "name": "Severity", "value": threat.severity.toUpperCase() },
            { "name": "Hostname", "value": threat.hostname },
            { "name": "Confidence", "value": `${baseInfo.confidence}%` },
            { "name": "MITRE", "value": threat.mitre_techniques?.join(', ') || 'N/A' }
          ],
          "text": baseInfo.ai_analysis || 'Analysis pending'
        }],
        "potentialAction": [{
          "@type": "OpenUri",
          "name": "View in Pursuit",
          "targets": [{ "os": "default", "uri": "https://ultriumai.lovable.app/vanguard/app/pursuit" }]
        }]
      };

    case 'discord':
      return {
        embeds: [{
          title: `🚨 XDR Alert: ${threat.threat_type}`,
          color: parseInt(getSeverityColor(threat.severity).replace('#', ''), 16),
          fields: [
            { name: 'Severity', value: threat.severity.toUpperCase(), inline: true },
            { name: 'Hostname', value: threat.hostname, inline: true },
            { name: 'Confidence', value: `${baseInfo.confidence}%`, inline: true },
            { name: 'MITRE ATT&CK', value: threat.mitre_techniques?.join(', ') || 'N/A', inline: false },
            { name: 'AI Analysis', value: (baseInfo.ai_analysis || 'Analysis pending').substring(0, 1024), inline: false }
          ],
          timestamp: new Date().toISOString()
        }]
      };

    default:
      // Generic webhook format
      return {
        event: 'xdr_threat_detected',
        timestamp: new Date().toISOString(),
        source: 'vanguard_pursuit_xdr',
        ...baseInfo
      };
  }
}
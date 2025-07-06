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
  threat_id: string;
  user_id: string;
  notification_type: 'email' | 'ticket' | 'both';
  urgency?: 'low' | 'medium' | 'high' | 'critical';
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

    const { threat_id, user_id, notification_type, urgency = 'medium' }: ThreatNotificationRequest = await req.json();

    // Get threat details
    const { data: threat, error: threatError } = await supabase
      .from('safe_shield_threats')
      .select('*')
      .eq('id', threat_id)
      .single();

    if (threatError || !threat) {
      throw new Error('Threat not found');
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

    const responses = [];

    // Create helpdesk ticket for critical threats
    if ((notification_type === 'ticket' || notification_type === 'both') && 
        (threat.severity === 'critical' || threat.severity === 'high')) {
      
      const ticketResponse = await supabase
        .from('helpdesk_tickets')
        .insert({
          title: `🚨 SafeShield Security Alert: ${threat.threat_type.toUpperCase()}`,
          description: `
**AUTOMATED SECURITY ALERT**

**Threat Details:**
- **Type:** ${threat.threat_type}
- **Severity:** ${threat.severity.toUpperCase()}
- **Host:** ${threat.hostname}
- **Confidence:** ${Math.round(threat.ai_confidence_score * 100)}%
- **Detected:** ${new Date(threat.detected_at).toLocaleString()}

**AI Analysis:**
${threat.ai_analysis?.threat_assessment || 'Analysis pending'}

**Recommended Actions:**
${threat.ai_analysis?.recommended_actions?.map((action: string, i: number) => `${i + 1}. ${action}`).join('\n') || 'See SafeShield dashboard for details'}

**Technical Details:**
- **Event ID:** ${threat.event_id}
- **File Path:** ${threat.file_path || 'N/A'}
- **Process:** ${threat.process_name || 'N/A'}
- **Command:** ${threat.command_line || 'N/A'}
- **Network:** ${threat.network_connection || 'N/A'}

**Status:** ${threat.status}

This ticket was automatically created by SafeShield EDR. Please review immediately.
          `,
          priority: threat.severity === 'critical' ? 'critical' : 'high',
          status: 'open',
          category: 'security_incident',
          device_context: {
            hostname: threat.hostname,
            threat_type: threat.threat_type,
            ai_confidence: threat.ai_confidence_score,
            behavioral_indicators: threat.behavioral_indicators
          }
        });

      responses.push({ type: 'ticket', success: !ticketResponse.error, data: ticketResponse });
    }

    // Send email notification
    if (notification_type === 'email' || notification_type === 'both') {
      const emailSubject = `🚨 SafeShield Alert: ${threat.severity.toUpperCase()} threat detected on ${threat.hostname}`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #dc2626, #991b1b); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">⚠️ SafeShield Security Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Critical security threat detected and analyzed</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #dc2626;">
            <h2 style="color: #dc2626; margin-top: 0;">Threat Summary</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold;">Threat Type:</td><td>${threat.threat_type}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Severity:</td><td><span style="background: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${threat.severity.toUpperCase()}</span></td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Hostname:</td><td>${threat.hostname}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">AI Confidence:</td><td>${Math.round(threat.ai_confidence_score * 100)}%</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold;">Detected:</td><td>${new Date(threat.detected_at).toLocaleString()}</td></tr>
            </table>
          </div>

          <div style="background: white; padding: 20px;">
            <h3 style="color: #1f2937;">🤖 AI Threat Analysis</h3>
            <p style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 10px 0;">
              ${threat.ai_analysis?.threat_assessment || 'Analysis in progress...'}
            </p>
            
            <h3 style="color: #1f2937;">📋 Recommended Actions</h3>
            <div style="background: #eff6ff; padding: 15px; border-radius: 6px; border-left: 4px solid #3b82f6;">
              ${threat.ai_analysis?.walkthrough_steps?.map((step: string, i: number) => 
                `<p style="margin: 8px 0;"><strong>${i + 1}.</strong> ${step}</p>`
              ).join('') || '<p>Please check SafeShield dashboard for detailed guidance.</p>'}
            </div>

            ${threat.behavioral_indicators?.length > 0 ? `
            <h3 style="color: #1f2937;">🔍 Behavioral Indicators</h3>
            <ul style="background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b;">
              ${threat.behavioral_indicators.map((indicator: string) => `<li>${indicator.replace(/_/g, ' ')}</li>`).join('')}
            </ul>
            ` : ''}
          </div>

          <div style="background: #1f2937; color: white; padding: 20px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0;">
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app')}/dashboard/safeshield" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px;">
                🛡️ Open SafeShield Dashboard
              </a>
            </p>
            <p style="margin: 15px 0 0 0; font-size: 12px; opacity: 0.7;">
              This alert was generated by SafeShield EDR - AI-Powered Endpoint Detection & Response
            </p>
          </div>
        </div>
      `;

      const emailResponse = await resend.emails.send({
        from: 'SafeShield Security <security@ultriumai.com>',
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
        action_type: 'threat_notification',
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
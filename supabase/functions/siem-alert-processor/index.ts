import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    console.log('Processing pending alert notifications...')

    // Get pending alert notifications
    const { data: pendingAlerts, error: alertsError } = await supabase
      .from('alert_notifications')
      .select(`
        *,
        alert_rules (name, description),
        security_events (title, description, severity, source_app, created_at)
      `)
      .eq('status', 'pending')
      .limit(50)

    if (alertsError) {
      console.error('Error fetching pending alerts:', alertsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch pending alerts' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!pendingAlerts || pendingAlerts.length === 0) {
      console.log('No pending alerts to process')
      return new Response(
        JSON.stringify({ message: 'No pending alerts', processed: 0 }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Processing ${pendingAlerts.length} pending alerts`)

    let processedCount = 0
    let failedCount = 0

    // Process each alert notification
    for (const alert of pendingAlerts) {
      try {
        let success = false

        if (alert.notification_type === 'email') {
          success = await sendEmailAlert(alert)
        } else if (alert.notification_type === 'webhook') {
          success = await sendWebhookAlert(alert)
        } else {
          console.warn(`Unknown notification type: ${alert.notification_type}`)
          continue
        }

        // Update alert status
        const newStatus = success ? 'sent' : 'failed'
        await supabase
          .from('alert_notifications')
          .update({
            status: newStatus,
            sent_at: success ? new Date().toISOString() : null,
            error_message: success ? null : 'Failed to send notification'
          })
          .eq('id', alert.id)

        if (success) {
          processedCount++
          console.log(`Successfully processed alert ${alert.id}`)
        } else {
          failedCount++
          console.error(`Failed to process alert ${alert.id}`)
        }

      } catch (error) {
        failedCount++
        console.error(`Error processing alert ${alert.id}:`, error)
        
        // Update alert with error
        await supabase
          .from('alert_notifications')
          .update({
            status: 'failed',
            error_message: error.message || 'Unknown error'
          })
          .eq('id', alert.id)
      }
    }

    console.log(`Alert processing complete: ${processedCount} sent, ${failedCount} failed`)

    return new Response(
      JSON.stringify({ 
        message: 'Alert processing complete',
        processed: processedCount,
        failed: failedCount,
        total: pendingAlerts.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in alert processor:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function sendEmailAlert(alert: any): Promise<boolean> {
  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured')
      return false
    }

    const event = alert.security_events
    const rule = alert.alert_rules

    const subject = `🚨 Security Alert: ${event.title}`
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h1 style="color: #dc3545; margin: 0; font-size: 24px;">🚨 Security Alert</h1>
          <p style="margin: 5px 0 0 0; color: #6c757d;">Alert Rule: ${rule.name}</p>
        </div>
        
        <div style="background: white; border: 1px solid #dee2e6; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <h2 style="color: #495057; margin-top: 0;">${event.title}</h2>
          <p style="color: #6c757d; line-height: 1.5;">${event.description || 'No description provided'}</p>
          
          <div style="margin-top: 20px;">
            <strong>Event Details:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li><strong>Severity:</strong> <span style="color: ${getSeverityColor(event.severity)}; text-transform: uppercase; font-weight: bold;">${event.severity}</span></li>
              <li><strong>Source:</strong> ${event.source_app}</li>
              <li><strong>Time:</strong> ${new Date(event.created_at).toLocaleString()}</li>
            </ul>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 14px; color: #6c757d;">
          <p style="margin: 0;">This alert was generated by your SafeSIEM security monitoring system.</p>
          <p style="margin: 5px 0 0 0;"><a href="https://your-domain.com/safesiem" style="color: #007bff;">View in SafeSIEM Dashboard</a></p>
        </div>
      </div>
    `

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'SafeSIEM <alerts@yourdomain.com>',
        to: [alert.recipient],
        subject: subject,
        html: htmlContent,
      }),
    })

    if (response.ok) {
      const result = await response.json()
      console.log(`Email sent successfully:`, result.id)
      return true
    } else {
      const error = await response.text()
      console.error('Failed to send email:', error)
      return false
    }

  } catch (error) {
    console.error('Error sending email alert:', error)
    return false
  }
}

async function sendWebhookAlert(alert: any): Promise<boolean> {
  try {
    const event = alert.security_events
    const rule = alert.alert_rules

    const payload = {
      alert_id: alert.id,
      rule_name: rule.name,
      event: {
        id: event.id,
        title: event.title,
        description: event.description,
        severity: event.severity,
        source_app: event.source_app,
        created_at: event.created_at
      },
      timestamp: new Date().toISOString()
    }

    const response = await fetch(alert.recipient, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SafeSIEM-Webhook/1.0'
      },
      body: JSON.stringify(payload),
    })

    if (response.ok) {
      console.log(`Webhook sent successfully to ${alert.recipient}`)
      return true
    } else {
      console.error(`Webhook failed with status ${response.status}:`, await response.text())
      return false
    }

  } catch (error) {
    console.error('Error sending webhook alert:', error)
    return false
  }
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc3545'
    case 'high': return '#fd7e14'
    case 'medium': return '#ffc107'
    case 'low': return '#17a2b8'
    default: return '#6c757d'
  }
}
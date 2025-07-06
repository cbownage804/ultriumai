import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

interface SecurityEventPayload {
  source_app: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description?: string
  affected_assets?: string[]
  user_email?: string
  ip_address?: string
  threat_indicators?: string[]
  raw_data?: Record<string, any>
  user_id?: string
}

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

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const payload: SecurityEventPayload = await req.json()
    console.log('Received security event:', JSON.stringify(payload, null, 2))

    // Validate required fields
    if (!payload.source_app || !payload.event_type || !payload.severity || !payload.title) {
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: source_app, event_type, severity, title' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate severity level
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(payload.severity)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid severity level. Must be: low, medium, high, or critical' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for threat indicators and enrich with threat intelligence
    let enrichedIndicators = payload.threat_indicators || []
    if (payload.ip_address) {
      // Check if IP is in threat intelligence
      const { data: threatIntel } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('indicator_type', 'ip')
        .eq('indicator_value', payload.ip_address)
        .eq('is_active', true)
        .maybeSingle()

      if (threatIntel) {
        enrichedIndicators.push(`ip:${payload.ip_address}:threat_confidence:${threatIntel.confidence}`)
        console.log(`Found threat intelligence for IP ${payload.ip_address}:`, threatIntel)
      }
    }

    // Generate correlation ID for similar events
    const correlationId = crypto.randomUUID()

    // Insert security event
    const { data: event, error: eventError } = await supabase
      .from('security_events')
      .insert({
        user_id: payload.user_id,
        source_app: payload.source_app,
        event_type: payload.event_type,
        severity: payload.severity,
        title: payload.title,
        description: payload.description,
        affected_assets: payload.affected_assets || [],
        user_email: payload.user_email,
        ip_address: payload.ip_address,
        threat_indicators: enrichedIndicators,
        raw_data: payload.raw_data || {},
        correlation_id: correlationId
      })
      .select()
      .single()

    if (eventError) {
      console.error('Error inserting security event:', eventError)
      return new Response(
        JSON.stringify({ error: 'Failed to create security event' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Created security event:', event.id)

    // Process event correlation in background
    EdgeRuntime.waitUntil(correlateEvent(supabase, event))

    // Process alerting in background
    EdgeRuntime.waitUntil(processAlerts(supabase, event))

    return new Response(
      JSON.stringify({ 
        success: true, 
        event_id: event.id,
        correlation_id: correlationId
      }),
      { 
        status: 201, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error processing security event:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function correlateEvent(supabase: any, event: any) {
  try {
    console.log('Starting event correlation for:', event.id)

    // Find similar events within the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // IP-based correlation
    if (event.ip_address) {
      const { data: relatedByIP } = await supabase
        .from('security_events')
        .select('id, title, severity')
        .eq('ip_address', event.ip_address)
        .neq('id', event.id)
        .gte('created_at', oneDayAgo)
        .limit(10)

      if (relatedByIP && relatedByIP.length > 0) {
        for (const related of relatedByIP) {
          await supabase
            .from('event_correlations')
            .insert({
              correlation_id: event.correlation_id,
              primary_event_id: event.id,
              related_event_id: related.id,
              correlation_type: 'ip_match',
              confidence_score: 0.8
            })
        }
        console.log(`Found ${relatedByIP.length} IP-correlated events for ${event.id}`)
      }
    }

    // User-based correlation
    if (event.user_email) {
      const { data: relatedByUser } = await supabase
        .from('security_events')
        .select('id, title, severity')
        .eq('user_email', event.user_email)
        .neq('id', event.id)
        .gte('created_at', oneDayAgo)
        .limit(10)

      if (relatedByUser && relatedByUser.length > 0) {
        for (const related of relatedByUser) {
          await supabase
            .from('event_correlations')
            .insert({
              correlation_id: event.correlation_id,
              primary_event_id: event.id,
              related_event_id: related.id,
              correlation_type: 'user_match',
              confidence_score: 0.7
            })
        }
        console.log(`Found ${relatedByUser.length} user-correlated events for ${event.id}`)
      }
    }

    // Time-based correlation (events from same source within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    const { data: relatedByTime } = await supabase
      .from('security_events')
      .select('id, title, severity')
      .eq('source_app', event.source_app)
      .neq('id', event.id)
      .gte('created_at', fiveMinutesAgo)
      .limit(5)

    if (relatedByTime && relatedByTime.length > 0) {
      for (const related of relatedByTime) {
        await supabase
          .from('event_correlations')
          .insert({
            correlation_id: event.correlation_id,
            primary_event_id: event.id,
            related_event_id: related.id,
            correlation_type: 'time_based',
            confidence_score: 0.6
          })
      }
      console.log(`Found ${relatedByTime.length} time-correlated events for ${event.id}`)
    }

  } catch (error) {
    console.error('Error in event correlation:', error)
  }
}

async function processAlerts(supabase: any, event: any) {
  try {
    console.log('Processing alerts for event:', event.id)

    // Get active alert rules for the user
    const { data: alertRules, error: rulesError } = await supabase
      .from('alert_rules')
      .select('*')
      .eq('user_id', event.user_id)
      .eq('is_active', true)

    if (rulesError) {
      console.error('Error fetching alert rules:', rulesError)
      return
    }

    if (!alertRules || alertRules.length === 0) {
      console.log('No active alert rules found for user:', event.user_id)
      return
    }

    // Check each alert rule
    for (const rule of alertRules) {
      let shouldAlert = false

      // Check severity threshold
      const severityLevels = { low: 1, medium: 2, high: 3, critical: 4 }
      const eventSeverityLevel = severityLevels[event.severity]
      const ruleSeverityLevel = severityLevels[rule.severity_threshold]

      if (eventSeverityLevel >= ruleSeverityLevel) {
        shouldAlert = true
      }

      // Check additional conditions from rule.conditions
      if (rule.conditions && typeof rule.conditions === 'object') {
        const conditions = rule.conditions

        // Source app filter
        if (conditions.source_apps && Array.isArray(conditions.source_apps)) {
          if (!conditions.source_apps.includes(event.source_app)) {
            shouldAlert = false
          }
        }

        // Event type filter
        if (conditions.event_types && Array.isArray(conditions.event_types)) {
          if (!conditions.event_types.includes(event.event_type)) {
            shouldAlert = false
          }
        }

        // Keyword filter
        if (conditions.keywords && Array.isArray(conditions.keywords)) {
          const eventText = `${event.title} ${event.description || ''}`.toLowerCase()
          const hasKeyword = conditions.keywords.some((keyword: string) => 
            eventText.includes(keyword.toLowerCase())
          )
          if (!hasKeyword) {
            shouldAlert = false
          }
        }
      }

      if (shouldAlert) {
        console.log(`Alert rule ${rule.id} triggered for event ${event.id}`)

        // Create alert notification for each configured channel
        const channels = rule.notification_channels || {}

        if (channels.email) {
          await supabase
            .from('alert_notifications')
            .insert({
              user_id: event.user_id,
              alert_rule_id: rule.id,
              security_event_id: event.id,
              notification_type: 'email',
              recipient: channels.email,
              status: 'pending'
            })

          console.log(`Created email alert notification for ${channels.email}`)
        }

        if (channels.webhook) {
          await supabase
            .from('alert_notifications')
            .insert({
              user_id: event.user_id,
              alert_rule_id: rule.id,
              security_event_id: event.id,
              notification_type: 'webhook',
              recipient: channels.webhook,
              status: 'pending'
            })

          console.log(`Created webhook alert notification for ${channels.webhook}`)
        }
      }
    }

  } catch (error) {
    console.error('Error processing alerts:', error)
  }
}
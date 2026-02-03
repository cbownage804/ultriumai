import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * XDR SIEM Correlation Engine
 * Correlates events across multiple sources, detects attack patterns,
 * and generates high-fidelity alerts
 */

interface CorrelationRule {
  id: string
  name: string
  pattern_type: 'sequence' | 'threshold' | 'statistical' | 'behavioral'
  conditions: any
  time_window_minutes: number
  severity: string
  mitre_tactics: string[]
}

// Built-in correlation rules
const CORRELATION_RULES: CorrelationRule[] = [
  {
    id: 'brute_force_attack',
    name: 'Brute Force Attack Detected',
    pattern_type: 'threshold',
    conditions: {
      event_type: 'failed_login',
      threshold: 10,
      group_by: 'source_ip'
    },
    time_window_minutes: 5,
    severity: 'high',
    mitre_tactics: ['T1110']
  },
  {
    id: 'lateral_movement',
    name: 'Potential Lateral Movement',
    pattern_type: 'sequence',
    conditions: {
      sequence: [
        { event_type: 'successful_login' },
        { event_type: 'process_creation', process_name: ['powershell.exe', 'cmd.exe', 'wmic.exe'] },
        { event_type: 'network_connection', port: [445, 135, 5985] }
      ]
    },
    time_window_minutes: 15,
    severity: 'critical',
    mitre_tactics: ['T1021', 'T1570']
  },
  {
    id: 'ransomware_behavior',
    name: 'Ransomware Activity Pattern',
    pattern_type: 'behavioral',
    conditions: {
      behaviors: [
        { type: 'file_rename', pattern: '.*\\.(encrypted|locked|crypted)$', threshold: 50 },
        { type: 'file_delete', pattern: 'shadow|backup|vss', threshold: 3 },
        { type: 'registry_modify', key: 'DisableAntiSpyware|DisableRealtimeMonitoring' }
      ]
    },
    time_window_minutes: 10,
    severity: 'critical',
    mitre_tactics: ['T1486', 'T1490']
  },
  {
    id: 'data_exfiltration',
    name: 'Potential Data Exfiltration',
    pattern_type: 'statistical',
    conditions: {
      metric: 'network_bytes_out',
      baseline_deviation: 3,
      min_bytes: 100000000 // 100MB
    },
    time_window_minutes: 60,
    severity: 'high',
    mitre_tactics: ['T1041']
  },
  {
    id: 'privilege_escalation',
    name: 'Privilege Escalation Attempt',
    pattern_type: 'sequence',
    conditions: {
      sequence: [
        { event_type: 'process_creation', user_type: 'standard' },
        { event_type: 'process_creation', user_type: 'admin', parent_match: true }
      ]
    },
    time_window_minutes: 5,
    severity: 'critical',
    mitre_tactics: ['T1068', 'T1548']
  },
  {
    id: 'c2_communication',
    name: 'Command & Control Communication',
    pattern_type: 'behavioral',
    conditions: {
      behaviors: [
        { type: 'dns_query', pattern: 'dga_detected|suspicious_tld' },
        { type: 'network_beacon', interval_variance: 0.2 },
        { type: 'encrypted_channel', destination: 'uncommon_port' }
      ]
    },
    time_window_minutes: 30,
    severity: 'critical',
    mitre_tactics: ['T1071', 'T1573']
  }
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'correlate'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'correlate':
        return await runCorrelation(supabase)
      
      case 'analyze_user':
        const { user_id } = await req.json()
        return await analyzeUserEvents(supabase, user_id)
      
      case 'get_attack_chains':
        const body = await req.json()
        return await getAttackChains(supabase, body.user_id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('[xdr-siem-correlator] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function runCorrelation(supabase: any) {
  console.log('[xdr-siem-correlator] Starting correlation engine...')

  const results = {
    events_analyzed: 0,
    correlations_found: 0,
    alerts_generated: 0,
    attack_chains_detected: 0
  }

  // Get all users with recent events
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  
  const { data: recentEvents } = await supabase
    .from('security_events')
    .select('user_id')
    .gte('created_at', oneHourAgo)
    .limit(1000)

  if (!recentEvents || recentEvents.length === 0) {
    return new Response(
      JSON.stringify({ message: 'No recent events to correlate', ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get unique user IDs
  const userIds = [...new Set(recentEvents.map((e: any) => e.user_id))]
  results.events_analyzed = recentEvents.length

  for (const userId of userIds) {
    if (!userId) continue

    // Run correlation rules for each user
    for (const rule of CORRELATION_RULES) {
      try {
        const correlation = await checkCorrelationRule(supabase, userId, rule)
        
        if (correlation.matched) {
          results.correlations_found++
          
          // Create correlated alert
          const { data: alert } = await supabase
            .from('security_events')
            .insert({
              user_id: userId,
              source_app: 'SIEM Correlator',
              event_type: 'correlated_alert',
              severity: rule.severity,
              title: rule.name,
              description: `Correlation rule matched: ${correlation.description}`,
              affected_assets: correlation.affected_assets,
              threat_indicators: rule.mitre_tactics.map(t => `mitre:${t}`),
              raw_data: {
                rule_id: rule.id,
                matched_events: correlation.matched_events,
                correlation_confidence: correlation.confidence
              },
              correlation_id: correlation.chain_id
            })
            .select()
            .single()

          if (alert) {
            results.alerts_generated++

            // If this looks like an attack chain, record it
            if (correlation.is_attack_chain) {
              await supabase
                .from('xdr_attack_chains')
                .insert({
                  user_id: userId,
                  chain_id: correlation.chain_id,
                  chain_name: rule.name,
                  severity: rule.severity,
                  mitre_tactics: rule.mitre_tactics,
                  events: correlation.matched_events,
                  start_time: correlation.start_time,
                  end_time: new Date().toISOString(),
                  status: 'active'
                })
              
              results.attack_chains_detected++
            }
          }
        }
      } catch (ruleError) {
        console.error(`[xdr-siem-correlator] Error running rule ${rule.id}:`, ruleError)
      }
    }
  }

  console.log('[xdr-siem-correlator] Correlation complete:', results)

  return new Response(
    JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function checkCorrelationRule(supabase: any, userId: string, rule: CorrelationRule) {
  const timeWindowStart = new Date(Date.now() - rule.time_window_minutes * 60 * 1000).toISOString()

  switch (rule.pattern_type) {
    case 'threshold':
      return await checkThresholdRule(supabase, userId, rule, timeWindowStart)
    
    case 'sequence':
      return await checkSequenceRule(supabase, userId, rule, timeWindowStart)
    
    case 'behavioral':
      return await checkBehavioralRule(supabase, userId, rule, timeWindowStart)
    
    case 'statistical':
      return await checkStatisticalRule(supabase, userId, rule, timeWindowStart)
    
    default:
      return { matched: false }
  }
}

async function checkThresholdRule(supabase: any, userId: string, rule: CorrelationRule, since: string) {
  const { data: events } = await supabase
    .from('security_events')
    .select('id, ip_address, user_email, created_at')
    .eq('user_id', userId)
    .eq('event_type', rule.conditions.event_type)
    .gte('created_at', since)

  if (!events || events.length < rule.conditions.threshold) {
    return { matched: false }
  }

  // Group by specified field
  const grouped: Record<string, any[]> = {}
  for (const event of events) {
    const key = event[rule.conditions.group_by] || 'unknown'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(event)
  }

  // Check if any group exceeds threshold
  for (const [key, groupEvents] of Object.entries(grouped)) {
    if (groupEvents.length >= rule.conditions.threshold) {
      return {
        matched: true,
        description: `${groupEvents.length} ${rule.conditions.event_type} events from ${key}`,
        affected_assets: [key],
        matched_events: groupEvents.map((e: any) => e.id),
        confidence: Math.min(100, 70 + groupEvents.length * 2),
        chain_id: crypto.randomUUID(),
        start_time: groupEvents[0].created_at,
        is_attack_chain: groupEvents.length > rule.conditions.threshold * 2
      }
    }
  }

  return { matched: false }
}

async function checkSequenceRule(supabase: any, userId: string, rule: CorrelationRule, since: string) {
  const sequence = rule.conditions.sequence
  const matchedEvents: any[] = []

  for (const step of sequence) {
    let query = supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .eq('event_type', step.event_type)
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .limit(10)

    const { data: events } = await query

    if (!events || events.length === 0) {
      return { matched: false }
    }

    matchedEvents.push(...events)
  }

  if (matchedEvents.length >= sequence.length) {
    return {
      matched: true,
      description: `Sequence pattern detected: ${sequence.map((s: any) => s.event_type).join(' → ')}`,
      affected_assets: [...new Set(matchedEvents.map(e => e.affected_assets).flat().filter(Boolean))],
      matched_events: matchedEvents.map(e => e.id),
      confidence: 85,
      chain_id: crypto.randomUUID(),
      start_time: matchedEvents[0].created_at,
      is_attack_chain: true
    }
  }

  return { matched: false }
}

async function checkBehavioralRule(supabase: any, userId: string, rule: CorrelationRule, since: string) {
  const behaviors = rule.conditions.behaviors
  let matchedBehaviors = 0
  const allEvents: any[] = []

  for (const behavior of behaviors) {
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', since)
      .ilike('event_type', `%${behavior.type}%`)
      .limit(100)

    if (events && events.length > 0) {
      matchedBehaviors++
      allEvents.push(...events)
    }
  }

  // Require at least half of behaviors to match
  if (matchedBehaviors >= Math.ceil(behaviors.length / 2)) {
    return {
      matched: true,
      description: `Behavioral pattern detected: ${matchedBehaviors}/${behaviors.length} indicators`,
      affected_assets: [...new Set(allEvents.map(e => e.affected_assets).flat().filter(Boolean))],
      matched_events: allEvents.map(e => e.id),
      confidence: 75 + (matchedBehaviors / behaviors.length) * 25,
      chain_id: crypto.randomUUID(),
      start_time: allEvents[0]?.created_at,
      is_attack_chain: matchedBehaviors === behaviors.length
    }
  }

  return { matched: false }
}

async function checkStatisticalRule(supabase: any, userId: string, rule: CorrelationRule, since: string) {
  // This would require baseline metrics - simplified for demo
  return { matched: false }
}

async function analyzeUserEvents(supabase: any, userId: string) {
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data: events } = await supabase
    .from('security_events')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', oneWeekAgo)
    .order('created_at', { ascending: false })
    .limit(500)

  // Analyze patterns
  const eventTypes: Record<string, number> = {}
  const severityCounts: Record<string, number> = {}
  const sourceApps: Record<string, number> = {}

  for (const event of events || []) {
    eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1
    severityCounts[event.severity] = (severityCounts[event.severity] || 0) + 1
    sourceApps[event.source_app] = (sourceApps[event.source_app] || 0) + 1
  }

  return new Response(
    JSON.stringify({
      user_id: userId,
      period: '7d',
      total_events: events?.length || 0,
      event_types: eventTypes,
      severity_breakdown: severityCounts,
      source_apps: sourceApps,
      risk_score: calculateRiskScore(severityCounts)
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getAttackChains(supabase: any, userId: string) {
  const { data: chains } = await supabase
    .from('xdr_attack_chains')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('start_time', { ascending: false })
    .limit(20)

  return new Response(
    JSON.stringify({ attack_chains: chains || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function calculateRiskScore(severityCounts: Record<string, number>): number {
  const weights = { low: 1, medium: 3, high: 7, critical: 15 }
  let score = 0
  
  for (const [severity, count] of Object.entries(severityCounts)) {
    score += (weights[severity as keyof typeof weights] || 1) * count
  }
  
  return Math.min(100, Math.round(score / 10))
}

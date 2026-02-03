import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * XDR Threat Ingestion Edge Function
 * Receives threat data from Vanguard agents and processes it into the XDR system
 * Supports: AV detections, memory scans, script analysis, behavioral alerts
 */

interface ThreatPayload {
  device_id: string
  user_id?: string
  threat_type: 'malware' | 'ransomware' | 'behavioral' | 'memory' | 'script' | 'network' | 'ioc_match'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  source_component: string // AV, EDR, Memory Scanner, Script Analyzer, etc.
  
  // File-based threats
  file_path?: string
  file_hash?: string
  file_name?: string
  
  // Process-based threats
  process_id?: number
  process_name?: string
  command_line?: string
  parent_process?: string
  
  // Network-based threats
  source_ip?: string
  destination_ip?: string
  destination_port?: number
  protocol?: string
  
  // MITRE ATT&CK mapping
  mitre_tactics?: string[]
  mitre_techniques?: string[]
  
  // IOC data
  indicators?: {
    type: string
    value: string
    confidence: number
  }[]
  
  // Response actions taken
  actions_taken?: string[]
  
  // Raw telemetry
  raw_data?: Record<string, any>
}

const VANGUARD_SECRET = Deno.env.get('VANGUARD_AGENT_SECRET') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Validate agent authentication
    const agentKey = req.headers.get('x-vanguard-key')
    if (agentKey !== VANGUARD_SECRET) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const payload: ThreatPayload = await req.json()
    console.log(`[xdr-threat-ingestion] Received ${payload.threat_type} threat from device ${payload.device_id}`)

    // Validate required fields
    if (!payload.device_id || !payload.threat_type || !payload.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get agent info
    const { data: agent } = await supabase
      .from('vanguard_agents')
      .select('id, user_id, name, ip_address')
      .eq('device_id', payload.device_id)
      .single()

    if (!agent) {
      return new Response(
        JSON.stringify({ error: 'Agent not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = payload.user_id || agent.user_id

    // Check IOCs against threat intelligence
    let threatIntelMatches: any[] = []
    if (payload.file_hash) {
      const { data: hashMatch } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('indicator_type', 'hash')
        .eq('indicator_value', payload.file_hash)
        .eq('is_active', true)
        .maybeSingle()
      
      if (hashMatch) {
        threatIntelMatches.push(hashMatch)
        console.log(`[xdr-threat-ingestion] Hash matched threat intel: ${hashMatch.source}`)
      }
    }

    if (payload.destination_ip) {
      const { data: ipMatch } = await supabase
        .from('threat_intelligence')
        .select('*')
        .eq('indicator_type', 'ip')
        .eq('indicator_value', payload.destination_ip)
        .eq('is_active', true)
        .maybeSingle()
      
      if (ipMatch) {
        threatIntelMatches.push(ipMatch)
        console.log(`[xdr-threat-ingestion] IP matched threat intel: ${ipMatch.source}`)
      }
    }

    // Elevate severity if threat intel match found
    let finalSeverity = payload.severity
    if (threatIntelMatches.length > 0) {
      const maxConfidence = Math.max(...threatIntelMatches.map(t => t.confidence))
      if (maxConfidence >= 90 && finalSeverity !== 'critical') {
        finalSeverity = 'critical'
      } else if (maxConfidence >= 70 && finalSeverity === 'low') {
        finalSeverity = 'medium'
      }
    }

    // Insert into xdr_threats table
    const { data: threat, error: threatError } = await supabase
      .from('xdr_threats')
      .insert({
        user_id: userId,
        agent_id: agent.id,
        threat_type: payload.threat_type,
        severity: finalSeverity,
        title: payload.title,
        description: payload.description,
        source_component: payload.source_component,
        file_path: payload.file_path,
        file_hash: payload.file_hash,
        file_name: payload.file_name,
        process_id: payload.process_id,
        process_name: payload.process_name,
        command_line: payload.command_line,
        parent_process: payload.parent_process,
        source_ip: payload.source_ip || agent.ip_address,
        destination_ip: payload.destination_ip,
        destination_port: payload.destination_port,
        protocol: payload.protocol,
        mitre_tactics: payload.mitre_tactics || [],
        mitre_techniques: payload.mitre_techniques || [],
        indicators: payload.indicators || [],
        actions_taken: payload.actions_taken || [],
        threat_intel_matches: threatIntelMatches,
        raw_data: payload.raw_data || {},
        status: 'new',
        detection_time: new Date().toISOString()
      })
      .select()
      .single()

    if (threatError) {
      console.error('[xdr-threat-ingestion] Error inserting threat:', threatError)
      return new Response(
        JSON.stringify({ error: 'Failed to create threat record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[xdr-threat-ingestion] Created threat: ${threat.id}`)

    // Also create security event for SIEM correlation
    await supabase
      .from('security_events')
      .insert({
        user_id: userId,
        source_app: `Vanguard ${payload.source_component}`,
        event_type: payload.threat_type,
        severity: finalSeverity,
        title: payload.title,
        description: payload.description,
        affected_assets: [agent.name],
        ip_address: agent.ip_address,
        threat_indicators: payload.indicators?.map(i => `${i.type}:${i.value}`) || [],
        raw_data: { threat_id: threat.id, ...payload.raw_data }
      })

    // Process IOCs for storage
    if (payload.indicators && payload.indicators.length > 0) {
      for (const ioc of payload.indicators) {
        await supabase
          .from('xdr_iocs')
          .upsert({
            user_id: userId,
            ioc_type: ioc.type,
            ioc_value: ioc.value,
            confidence: ioc.confidence,
            source: payload.source_component,
            threat_types: [payload.threat_type],
            first_seen: new Date().toISOString(),
            last_seen: new Date().toISOString(),
            hit_count: 1,
            is_active: true
          }, { onConflict: 'user_id,ioc_type,ioc_value' })
      }
    }

    // Trigger auto-remediation if critical
    let remediationTriggered = false
    if (finalSeverity === 'critical') {
      const { data: policies } = await supabase
        .from('xdr_automation_policies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_enabled', true)
        .eq('automation_mode', 'full_auto')
        .contains('trigger_conditions', { severity: ['critical'] })

      if (policies && policies.length > 0) {
        // Queue auto-remediation action
        await supabase
          .from('xdr_response_actions')
          .insert({
            user_id: userId,
            threat_id: threat.id,
            action_type: 'isolate_endpoint',
            status: 'pending',
            auto_triggered: true,
            policy_id: policies[0].id,
            target_agent_id: agent.id,
            parameters: { 
              reason: `Auto-isolation triggered by critical ${payload.threat_type} threat`,
              threat_title: payload.title
            }
          })
        remediationTriggered = true
        console.log(`[xdr-threat-ingestion] Auto-remediation triggered for critical threat`)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        threat_id: threat.id,
        severity: finalSeverity,
        threat_intel_matches: threatIntelMatches.length,
        remediation_triggered: remediationTriggered
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[xdr-threat-ingestion] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

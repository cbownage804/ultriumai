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

    const rawPayload = await req.json()

    // Sanitize string fields to prevent XSS/injection
    const stripHtml = (val: unknown, maxLen = 500): string => {
      if (typeof val !== 'string') return '';
      return val.replace(/<[^>]*>/g, '').substring(0, maxLen);
    }

    const payload: ThreatPayload = {
      ...rawPayload,
      device_id: stripHtml(rawPayload.device_id, 100),
      threat_type: rawPayload.threat_type,
      severity: rawPayload.severity,
      title: stripHtml(rawPayload.title, 200),
      description: stripHtml(rawPayload.description, 2000),
      source_component: stripHtml(rawPayload.source_component, 100),
      file_path: rawPayload.file_path ? stripHtml(rawPayload.file_path, 500) : undefined,
      file_hash: rawPayload.file_hash ? stripHtml(rawPayload.file_hash, 128) : undefined,
      file_name: rawPayload.file_name ? stripHtml(rawPayload.file_name, 255) : undefined,
      process_name: rawPayload.process_name ? stripHtml(rawPayload.process_name, 255) : undefined,
      command_line: rawPayload.command_line ? stripHtml(rawPayload.command_line, 1000) : undefined,
      parent_process: rawPayload.parent_process ? stripHtml(rawPayload.parent_process, 255) : undefined,
    }

    // Validate required fields
    const validThreatTypes = ['malware', 'ransomware', 'behavioral', 'memory', 'script', 'network', 'ioc_match']
    const validSeverities = ['low', 'medium', 'high', 'critical']

    if (!payload.device_id || !payload.threat_type || !payload.title) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: device_id, threat_type, title' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!validThreatTypes.includes(payload.threat_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid threat_type. Must be one of: ${validThreatTypes.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!validSeverities.includes(payload.severity)) {
      return new Response(
        JSON.stringify({ error: `Invalid severity. Must be one of: ${validSeverities.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`[xdr-threat-ingestion] Received ${payload.threat_type} threat from device ${payload.device_id}`)

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

    // Cross-client threat correlation — detect campaigns
    let campaignDetected = false
    try {
      // Find matching threats from OTHER users in last 72 hours
      const correlationWindow = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      const { data: similarThreats } = await supabase
        .from('xdr_threats')
        .select('id, user_id, threat_type, file_hash, destination_ip, severity, title, detection_time')
        .eq('threat_type', payload.threat_type)
        .neq('user_id', userId)
        .gte('detection_time', correlationWindow)

      // Also check for shared IOCs (file hash or dest IP)
      let iocMatches: any[] = []
      if (payload.file_hash) {
        const { data } = await supabase
          .from('xdr_threats')
          .select('id, user_id, threat_type, file_hash, severity, title, detection_time')
          .eq('file_hash', payload.file_hash)
          .neq('user_id', userId)
          .gte('detection_time', correlationWindow)
        if (data?.length) iocMatches.push(...data)
      }
      if (payload.destination_ip) {
        const { data } = await supabase
          .from('xdr_threats')
          .select('id, user_id, threat_type, destination_ip, severity, title, detection_time')
          .eq('destination_ip', payload.destination_ip)
          .neq('user_id', userId)
          .gte('detection_time', correlationWindow)
        if (data?.length) iocMatches.push(...data)
      }

      // Deduplicate
      const allCorrelated = [...(similarThreats || []), ...iocMatches]
      const uniqueMap = new Map(allCorrelated.map(t => [t.id, t]))
      const uniqueCorrelated = Array.from(uniqueMap.values())

      // If threats match across 2+ distinct users, create/update a campaign
      const affectedUserIds = new Set(uniqueCorrelated.map(t => t.user_id))
      affectedUserIds.add(userId)

      if (affectedUserIds.size >= 2) {
        campaignDetected = true
        const sharedIndicators: any[] = []
        if (payload.file_hash) sharedIndicators.push({ type: 'hash', value: payload.file_hash })
        if (payload.destination_ip) sharedIndicators.push({ type: 'ip', value: payload.destination_ip })
        payload.indicators?.forEach(i => sharedIndicators.push({ type: i.type, value: i.value }))

        const relatedIds = uniqueCorrelated.map(t => t.id)
        relatedIds.push(threat.id)
        const campaignSeverity = finalSeverity === 'critical' || uniqueCorrelated.some(t => t.severity === 'critical') ? 'critical' : 'high'

        // Check for existing active campaign with same type
        const { data: existingCampaign } = await supabase
          .from('xdr_cross_client_campaigns')
          .select('id, affected_user_ids, related_threat_ids, shared_indicators')
          .eq('campaign_type', payload.threat_type)
          .eq('status', 'active')
          .gte('created_at', correlationWindow)
          .maybeSingle()

        if (existingCampaign) {
          // Update existing campaign with new data
          const updatedUserIds = Array.from(new Set([...(existingCampaign.affected_user_ids || []), ...Array.from(affectedUserIds)]))
          const updatedThreatIds = Array.from(new Set([...(existingCampaign.related_threat_ids || []), ...relatedIds]))
          const existingIndicators = (existingCampaign.shared_indicators as any[]) || []
          const mergedIndicators = [...existingIndicators, ...sharedIndicators.filter(si => 
            !existingIndicators.some((ei: any) => ei.type === si.type && ei.value === si.value)
          )]

          await supabase
            .from('xdr_cross_client_campaigns')
            .update({
              affected_user_ids: updatedUserIds,
              related_threat_ids: updatedThreatIds,
              shared_indicators: mergedIndicators,
              severity: campaignSeverity,
              confidence: Math.min(98, 60 + updatedUserIds.length * 12),
              last_seen: new Date().toISOString(),
              mitre_tactics: payload.mitre_tactics || [],
              mitre_techniques: payload.mitre_techniques || [],
            })
            .eq('id', existingCampaign.id)
          
          console.log(`[xdr-threat-ingestion] Updated campaign ${existingCampaign.id} — now ${updatedUserIds.length} clients affected`)
        } else {
          // Create new campaign
          await supabase
            .from('xdr_cross_client_campaigns')
            .insert({
              user_id: userId,
              campaign_name: `${payload.threat_type} Campaign — ${affectedUserIds.size} Clients`,
              campaign_type: payload.threat_type,
              severity: campaignSeverity,
              status: 'active',
              confidence: Math.min(95, 60 + affectedUserIds.size * 12),
              affected_user_ids: Array.from(affectedUserIds),
              shared_indicators: sharedIndicators,
              triggering_threat_id: threat.id,
              related_threat_ids: relatedIds,
              mitre_tactics: payload.mitre_tactics || [],
              mitre_techniques: payload.mitre_techniques || [],
              first_seen: new Date().toISOString(),
              last_seen: new Date().toISOString(),
            })

          console.log(`[xdr-threat-ingestion] NEW CAMPAIGN DETECTED: ${payload.threat_type} across ${affectedUserIds.size} clients`)
        }

        // Create high-priority security event for the campaign
        await supabase
          .from('security_events')
          .insert({
            user_id: userId,
            source_app: 'Vanguard XDR Cross-Client Correlation',
            event_type: 'cross_client_campaign',
            severity: campaignSeverity,
            title: `Cross-Client Campaign: ${payload.threat_type} detected across ${affectedUserIds.size} organizations`,
            description: `Coordinated ${payload.threat_type} activity detected across ${affectedUserIds.size} managed clients. Shared indicators: ${sharedIndicators.map(s => `${s.type}:${s.value}`).join(', ')}`,
            affected_assets: [agent.name],
            ip_address: agent.ip_address,
            threat_indicators: sharedIndicators.map(s => `${s.type}:${s.value}`),
            raw_data: { campaign: true, affected_clients: affectedUserIds.size, threat_id: threat.id }
          })
      }
    } catch (corrError) {
      console.error('[xdr-threat-ingestion] Cross-client correlation error (non-fatal):', corrError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        threat_id: threat.id,
        severity: finalSeverity,
        threat_intel_matches: threatIntelMatches.length,
        remediation_triggered: remediationTriggered,
        campaign_detected: campaignDetected
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

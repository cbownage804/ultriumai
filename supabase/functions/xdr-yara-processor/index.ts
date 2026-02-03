import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * XDR YARA Processor Edge Function
 * Handles YARA rule management, match processing, and rule distribution to agents
 */

interface YaraMatchPayload {
  device_id: string
  rule_id?: string
  rule_name: string
  file_path: string
  file_hash: string
  file_size: number
  matched_strings?: string[]
  meta?: Record<string, any>
}

interface GetRulesPayload {
  device_id: string
  categories?: string[]
  last_sync?: string
}

const VANGUARD_SECRET = Deno.env.get('VANGUARD_AGENT_SECRET') || ''

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'report_match'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Agent actions require key auth
    if (['report_match', 'get_rules'].includes(action)) {
      const agentKey = req.headers.get('x-vanguard-key')
      if (agentKey !== VANGUARD_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    switch (action) {
      case 'report_match':
        return await handleYaraMatch(supabase, await req.json())
      
      case 'get_rules':
        return await getRulesForAgent(supabase, await req.json())
      
      case 'compile_rule':
        return await compileYaraRule(supabase, await req.json())
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('[xdr-yara-processor] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleYaraMatch(supabase: any, payload: YaraMatchPayload) {
  console.log(`[xdr-yara-processor] YARA match from ${payload.device_id}: ${payload.rule_name}`)

  // Get agent
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id, name')
    .eq('device_id', payload.device_id)
    .single()

  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Find the YARA rule
  let rule = null
  if (payload.rule_id) {
    const { data } = await supabase
      .from('xdr_yara_rules')
      .select('*')
      .eq('id', payload.rule_id)
      .single()
    rule = data
  } else {
    const { data } = await supabase
      .from('xdr_yara_rules')
      .select('*')
      .eq('name', payload.rule_name)
      .eq('user_id', agent.user_id)
      .maybeSingle()
    rule = data
  }

  // Determine severity from rule or default
  const severity = rule?.severity || 'medium'

  // Create XDR threat
  const { data: threat, error: threatError } = await supabase
    .from('xdr_threats')
    .insert({
      user_id: agent.user_id,
      agent_id: agent.id,
      threat_type: 'malware',
      severity,
      title: `YARA Match: ${payload.rule_name}`,
      description: `YARA rule "${payload.rule_name}" matched file ${payload.file_path}`,
      source_component: 'YARA Scanner',
      file_path: payload.file_path,
      file_hash: payload.file_hash,
      file_name: payload.file_path.split(/[/\\]/).pop(),
      indicators: [
        { type: 'hash', value: payload.file_hash, confidence: 95 },
        { type: 'yara_rule', value: payload.rule_name, confidence: 100 }
      ],
      mitre_tactics: rule?.mitre_tactics || [],
      mitre_techniques: rule?.mitre_techniques || [],
      raw_data: {
        rule_name: payload.rule_name,
        matched_strings: payload.matched_strings,
        file_size: payload.file_size,
        meta: payload.meta
      },
      status: 'new',
      detection_time: new Date().toISOString()
    })
    .select()
    .single()

  if (threatError) {
    console.error('[xdr-yara-processor] Error creating threat:', threatError)
    return new Response(
      JSON.stringify({ error: 'Failed to create threat' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update rule match count
  if (rule) {
    await supabase
      .from('xdr_yara_rules')
      .update({ 
        match_count: (rule.match_count || 0) + 1,
        last_match: new Date().toISOString()
      })
      .eq('id', rule.id)
  }

  // Add to IOC database
  await supabase
    .from('xdr_iocs')
    .upsert({
      user_id: agent.user_id,
      ioc_type: 'hash',
      ioc_value: payload.file_hash,
      confidence: 95,
      source: `YARA: ${payload.rule_name}`,
      threat_types: ['malware'],
      first_seen: new Date().toISOString(),
      last_seen: new Date().toISOString(),
      hit_count: 1,
      is_active: true
    }, { onConflict: 'user_id,ioc_type,ioc_value' })

  return new Response(
    JSON.stringify({
      success: true,
      threat_id: threat.id,
      severity,
      action: severity === 'critical' ? 'quarantine_recommended' : 'investigate'
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getRulesForAgent(supabase: any, payload: GetRulesPayload) {
  console.log(`[xdr-yara-processor] Rules request from ${payload.device_id}`)

  // Get agent
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, user_id')
    .eq('device_id', payload.device_id)
    .single()

  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Build query
  let query = supabase
    .from('xdr_yara_rules')
    .select('id, name, rule_content, category, severity, description, is_enabled')
    .eq('user_id', agent.user_id)
    .eq('is_enabled', true)

  // Filter by categories if specified
  if (payload.categories && payload.categories.length > 0) {
    query = query.in('category', payload.categories)
  }

  // Only get updated rules if last_sync provided
  if (payload.last_sync) {
    query = query.gte('updated_at', payload.last_sync)
  }

  const { data: rules, error } = await query

  if (error) {
    console.error('[xdr-yara-processor] Error fetching rules:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch rules' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Format rules for agent consumption
  const formattedRules = rules.map((r: any) => ({
    id: r.id,
    name: r.name,
    content: r.rule_content,
    category: r.category,
    severity: r.severity
  }))

  return new Response(
    JSON.stringify({
      rules: formattedRules,
      count: formattedRules.length,
      sync_time: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function compileYaraRule(supabase: any, payload: any) {
  // This would validate YARA rule syntax
  // In production, you'd use a YARA library or sandbox
  const { rule_content, rule_name } = payload

  // Basic syntax validation
  const errors: string[] = []
  
  if (!rule_content.includes('rule ')) {
    errors.push('Missing "rule" keyword')
  }
  
  if (!rule_content.includes('condition:')) {
    errors.push('Missing "condition:" section')
  }
  
  if (!rule_content.includes('{') || !rule_content.includes('}')) {
    errors.push('Missing rule braces')
  }

  // Check for common syntax patterns
  const ruleNameMatch = rule_content.match(/rule\s+(\w+)/)
  if (!ruleNameMatch) {
    errors.push('Invalid rule name format')
  }

  if (errors.length > 0) {
    return new Response(
      JSON.stringify({ valid: false, errors }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ 
      valid: true, 
      rule_name: ruleNameMatch?.[1] || rule_name,
      message: 'YARA rule syntax appears valid'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

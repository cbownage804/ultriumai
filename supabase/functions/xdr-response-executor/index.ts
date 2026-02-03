import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'
import { corsHeaders } from '../_shared/cors.ts'

/**
 * XDR Response Executor Edge Function
 * Executes approved response actions on endpoints
 * Supports: isolate, quarantine, kill process, collect forensics, remediate
 */

const VANGUARD_SECRET = Deno.env.get('VANGUARD_AGENT_SECRET') || ''

interface ResponseAction {
  action_type: 'isolate_endpoint' | 'quarantine_file' | 'kill_process' | 'collect_forensics' | 
               'run_scan' | 'update_signatures' | 'restore_file' | 'unisolate_endpoint' |
               'block_hash' | 'block_ip' | 'disable_user'
  target_agent_id: string
  parameters: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'critical'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'execute'

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    switch (action) {
      case 'execute':
        return await executeAction(supabase, await req.json())
      
      case 'approve':
        return await approveAction(supabase, await req.json())
      
      case 'reject':
        return await rejectAction(supabase, await req.json())
      
      case 'get_pending':
        return await getPendingActions(supabase, await req.json())
      
      case 'agent_poll':
        return await agentPollActions(supabase, req, await req.json())
      
      case 'agent_result':
        return await agentReportResult(supabase, req, await req.json())
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('[xdr-response-executor] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function executeAction(supabase: any, body: ResponseAction) {
  const { action_type, target_agent_id, parameters, priority } = body

  console.log(`[xdr-response-executor] Executing ${action_type} on agent ${target_agent_id}`)

  // Get agent details
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id, device_id, user_id, name, status')
    .eq('id', target_agent_id)
    .single()

  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create response action record
  const { data: responseAction, error: insertError } = await supabase
    .from('xdr_response_actions')
    .insert({
      user_id: agent.user_id,
      action_type,
      target_agent_id,
      parameters,
      priority: priority || 'high',
      status: 'queued',
      queued_at: new Date().toISOString()
    })
    .select()
    .single()

  if (insertError) {
    console.error('[xdr-response-executor] Error creating action:', insertError)
    return new Response(
      JSON.stringify({ error: 'Failed to create action' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Queue command for agent to pick up
  const commandPayload = buildCommandPayload(action_type, parameters)
  
  await supabase
    .from('vanguard_commands')
    .insert({
      agent_id: target_agent_id,
      user_id: agent.user_id,
      command_type: `xdr_${action_type}`,
      command_data: commandPayload,
      status: 'pending',
      priority: priorityToInt(priority)
    })

  console.log(`[xdr-response-executor] Action ${responseAction.id} queued for agent ${agent.name}`)

  return new Response(
    JSON.stringify({
      success: true,
      action_id: responseAction.id,
      status: 'queued',
      message: `Action ${action_type} queued for ${agent.name}`
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

function buildCommandPayload(actionType: string, parameters: Record<string, any>) {
  switch (actionType) {
    case 'isolate_endpoint':
      return {
        action: 'network_isolate',
        allow_management: true,
        management_ips: parameters.management_ips || [],
        reason: parameters.reason
      }
    
    case 'unisolate_endpoint':
      return {
        action: 'network_restore',
        reason: parameters.reason
      }
    
    case 'quarantine_file':
      return {
        action: 'quarantine',
        file_path: parameters.file_path,
        file_hash: parameters.file_hash,
        backup: true
      }
    
    case 'kill_process':
      return {
        action: 'terminate_process',
        process_id: parameters.process_id,
        process_name: parameters.process_name,
        force: parameters.force || false
      }
    
    case 'collect_forensics':
      return {
        action: 'forensic_collect',
        collect_memory: parameters.collect_memory || false,
        collect_logs: parameters.collect_logs || true,
        collect_registry: parameters.collect_registry || true,
        time_range_hours: parameters.time_range_hours || 24
      }
    
    case 'run_scan':
      return {
        action: 'av_scan',
        scan_type: parameters.scan_type || 'quick',
        target_path: parameters.target_path || 'C:\\'
      }
    
    case 'update_signatures':
      return {
        action: 'update_definitions',
        source: parameters.source || 'windows_defender',
        force: true
      }
    
    case 'restore_file':
      return {
        action: 'restore_quarantine',
        file_hash: parameters.file_hash,
        original_path: parameters.original_path
      }
    
    case 'block_hash':
      return {
        action: 'add_hash_block',
        hash_type: parameters.hash_type || 'sha256',
        hash_value: parameters.hash_value,
        description: parameters.description
      }
    
    case 'block_ip':
      return {
        action: 'firewall_block',
        ip_address: parameters.ip_address,
        direction: parameters.direction || 'both',
        description: parameters.description
      }
    
    default:
      return parameters
  }
}

function priorityToInt(priority: string): number {
  switch (priority) {
    case 'critical': return 1
    case 'high': return 2
    case 'medium': return 3
    case 'low': return 4
    default: return 3
  }
}

async function approveAction(supabase: any, body: any) {
  const { action_id, approved_by } = body

  const { data: action, error } = await supabase
    .from('xdr_response_actions')
    .update({
      status: 'approved',
      approved_by,
      approved_at: new Date().toISOString()
    })
    .eq('id', action_id)
    .eq('status', 'pending')
    .select()
    .single()

  if (error || !action) {
    return new Response(
      JSON.stringify({ error: 'Action not found or already processed' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Now queue the command for execution
  await supabase
    .from('vanguard_commands')
    .insert({
      agent_id: action.target_agent_id,
      user_id: action.user_id,
      command_type: `xdr_${action.action_type}`,
      command_data: buildCommandPayload(action.action_type, action.parameters),
      status: 'pending',
      priority: priorityToInt(action.priority)
    })

  // Update action status to queued
  await supabase
    .from('xdr_response_actions')
    .update({ status: 'queued', queued_at: new Date().toISOString() })
    .eq('id', action_id)

  return new Response(
    JSON.stringify({ success: true, action_id, status: 'queued' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function rejectAction(supabase: any, body: any) {
  const { action_id, rejected_by, reason } = body

  const { error } = await supabase
    .from('xdr_response_actions')
    .update({
      status: 'rejected',
      rejected_by,
      rejected_at: new Date().toISOString(),
      error_message: reason
    })
    .eq('id', action_id)
    .eq('status', 'pending')

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to reject action' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true, action_id, status: 'rejected' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function getPendingActions(supabase: any, body: any) {
  const { user_id, status } = body

  let query = supabase
    .from('xdr_response_actions')
    .select(`
      *,
      agent:target_agent_id (id, name, device_id, status)
    `)
    .eq('user_id', user_id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) {
    query = query.eq('status', status)
  } else {
    query = query.in('status', ['pending', 'queued', 'executing'])
  }

  const { data: actions, error } = await query

  if (error) {
    return new Response(
      JSON.stringify({ error: 'Failed to fetch actions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ actions: actions || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function agentPollActions(supabase: any, req: Request, body: any) {
  const agentKey = req.headers.get('x-vanguard-key')
  if (agentKey !== VANGUARD_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { device_id } = body

  // Get agent
  const { data: agent } = await supabase
    .from('vanguard_agents')
    .select('id')
    .eq('device_id', device_id)
    .single()

  if (!agent) {
    return new Response(
      JSON.stringify({ error: 'Agent not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get pending XDR commands
  const { data: commands } = await supabase
    .from('vanguard_commands')
    .select('*')
    .eq('agent_id', agent.id)
    .like('command_type', 'xdr_%')
    .eq('status', 'pending')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(10)

  // Mark as executing
  if (commands && commands.length > 0) {
    await supabase
      .from('vanguard_commands')
      .update({ status: 'executing', started_at: new Date().toISOString() })
      .in('id', commands.map((c: any) => c.id))
  }

  return new Response(
    JSON.stringify({ commands: commands || [] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function agentReportResult(supabase: any, req: Request, body: any) {
  const agentKey = req.headers.get('x-vanguard-key')
  if (agentKey !== VANGUARD_SECRET) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { command_id, success, result, error_message } = body

  // Update command status
  await supabase
    .from('vanguard_commands')
    .update({
      status: success ? 'completed' : 'failed',
      result: result || {},
      error_message,
      completed_at: new Date().toISOString()
    })
    .eq('id', command_id)

  // Find and update related response action
  const { data: command } = await supabase
    .from('vanguard_commands')
    .select('command_type, agent_id')
    .eq('id', command_id)
    .single()

  if (command && command.command_type.startsWith('xdr_')) {
    const actionType = command.command_type.replace('xdr_', '')
    
    await supabase
      .from('xdr_response_actions')
      .update({
        status: success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        result: result || {},
        error_message
      })
      .eq('target_agent_id', command.agent_id)
      .eq('action_type', actionType)
      .eq('status', 'queued')
      .order('created_at', { ascending: false })
      .limit(1)
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

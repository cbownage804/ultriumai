import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { method } = req
    const url = new URL(req.url)

    switch (method) {
      case 'POST':
        if (url.pathname.includes('/execute')) {
          return await handleCommandExecution(supabase, req)
        } else if (url.pathname.includes('/result')) {
          return await handleCommandResult(supabase, req)
        } else {
          return await handleCommandCreation(supabase, req)
        }
      case 'GET':
        return await handleCommandStatus(supabase, req)
      default:
        return new Response('Method not allowed', { status: 405, headers: corsHeaders })
    }
  } catch (error) {
    console.error('RMM Command Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Create command for agent execution
async function handleCommandCreation(supabase: any, req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const {
    agent_id,
    command_type,
    command_data,
    priority = 5,
    timeout_seconds = 300
  } = await req.json()

  // Verify user has access to this agent
  const { data: agent, error: agentError } = await supabase
    .from('rmm_agents')
    .select(`
      id,
      client_id,
      msp_clients!inner(
        msp_id,
        msps!inner(user_id)
      )
    `)
    .eq('id', agent_id)
    .single()

  if (agentError || !agent || agent.msp_clients.msps.user_id !== user.id) {
    return new Response('Agent not found or unauthorized', { 
      status: 404, 
      headers: corsHeaders 
    })
  }

  // Create command
  const { data: command, error: commandError } = await supabase
    .from('rmm_agent_commands')
    .insert({
      agent_id,
      user_id: user.id,
      command_type,
      command_data,
      priority,
      timeout_seconds,
      status: 'pending'
    })
    .select()
    .single()

  if (commandError) {
    throw new Error(commandError.message)
  }

  return new Response(JSON.stringify({
    success: true,
    command_id: command.id,
    message: 'Command queued for execution'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Execute PowerShell/CMD commands
async function handleCommandExecution(supabase: any, req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const {
    agent_id,
    script_type,
    script_content,
    parameters = {}
  } = await req.json()

  // Create command for script execution
  const command_data = {
    script_type,
    script_content,
    parameters,
    execution_mode: 'immediate'
  }

  const { data: command, error: commandError } = await supabase
    .from('rmm_agent_commands')
    .insert({
      agent_id,
      user_id: user.id,
      command_type: script_type === 'powershell' ? 'powershell' : 'cmd',
      command_data,
      priority: 8, // High priority for immediate execution
      timeout_seconds: 600
    })
    .select()
    .single()

  if (commandError) {
    throw new Error(commandError.message)
  }

  return new Response(JSON.stringify({
    success: true,
    command_id: command.id,
    message: 'Script queued for execution'
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Handle command result from agent
async function handleCommandResult(supabase: any, req: Request) {
  const {
    command_id,
    status,
    output,
    error_message,
    exit_code
  } = await req.json()

  // Update command with result
  const { error: updateError } = await supabase
    .from('rmm_agent_commands')
    .update({
      status,
      completed_at: new Date().toISOString(),
      output,
      error_message,
      exit_code
    })
    .eq('id', command_id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

// Get command status
async function handleCommandStatus(supabase: any, req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const url = new URL(req.url)
  const commandId = url.searchParams.get('command_id')
  
  if (!commandId) {
    return new Response(JSON.stringify({ error: 'Command ID required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  const { data: command, error: commandError } = await supabase
    .from('rmm_agent_commands')
    .select(`
      *,
      rmm_agents!inner(
        hostname,
        client_id,
        msp_clients!inner(
          msp_id,
          msps!inner(user_id)
        )
      )
    `)
    .eq('id', commandId)
    .single()

  if (commandError || !command || command.rmm_agents.msp_clients.msps.user_id !== user.id) {
    return new Response('Command not found or unauthorized', { 
      status: 404, 
      headers: corsHeaders 
    })
  }

  return new Response(JSON.stringify({ command }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}
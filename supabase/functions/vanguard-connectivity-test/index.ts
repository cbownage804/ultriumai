import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify user authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const body = await req.json()
    const { action, credential_id, agent_id, target_hosts, command_id } = body

    console.log(`[vanguard-connectivity-test] Action: ${action}, User: ${user.id}`)

    // Start a connectivity test
    if (action === 'test_credential') {
      if (!credential_id || !agent_id) {
        return new Response(JSON.stringify({ error: 'credential_id and agent_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get the credential
      const { data: credential, error: credError } = await supabase
        .from('vanguard_agent_credentials')
        .select('*')
        .eq('id', credential_id)
        .eq('user_id', user.id)
        .single()

      if (credError || !credential) {
        return new Response(JSON.stringify({ error: 'Credential not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Verify agent belongs to user
      const { data: agent, error: agentError } = await supabase
        .from('vanguard_agents')
        .select('id, status')
        .eq('id', agent_id)
        .eq('user_id', user.id)
        .single()

      if (agentError || !agent) {
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Determine test targets
      let testTargets = target_hosts || credential.target_scope || []
      if (testTargets.length === 0) {
        return new Response(JSON.stringify({ 
          error: 'No target hosts specified. Please add target scope to the credential or provide target_hosts.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Build credential payload (decrypt in production)
      const credentialPayload = {
        credential_id: credential.id,
        credential_type: credential.credential_type,
        username: credential.username,
        domain: credential.domain,
        port: credential.port,
        use_ssl: credential.use_ssl,
        // In production, these would be decrypted
        encrypted_password: credential.encrypted_password,
        encrypted_private_key: credential.encrypted_private_key,
        snmp_community: credential.snmp_community,
        snmp_auth_protocol: credential.snmp_auth_protocol,
        snmp_priv_protocol: credential.snmp_priv_protocol,
      }

      // Queue connectivity test command to the agent
      const { data: command, error: cmdError } = await supabase
        .from('vanguard_agent_commands')
        .insert({
          agent_id: agent.id,
          user_id: user.id,
          command_type: 'test_connectivity',
          payload: {
            credential: credentialPayload,
            targets: testTargets,
            test_type: getTestTypeForCredential(credential.credential_type)
          },
          status: 'pending'
        })
        .select()
        .single()

      if (cmdError) {
        console.error('[vanguard-connectivity-test] Failed to queue command:', cmdError)
        return new Response(JSON.stringify({ error: 'Failed to queue test' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log(`[vanguard-connectivity-test] Queued test for credential ${credential_id}, command: ${command.id}`)

      return new Response(JSON.stringify({ 
        status: 'queued',
        command_id: command.id,
        message: 'Connectivity test queued. Agent will pick it up on next poll.',
        targets: testTargets
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check test status
    if (action === 'check_status') {
      if (!command_id) {
        return new Response(JSON.stringify({ error: 'command_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: command, error: cmdError } = await supabase
        .from('vanguard_agent_commands')
        .select('*')
        .eq('id', command_id)
        .eq('user_id', user.id)
        .single()

      if (cmdError || !command) {
        return new Response(JSON.stringify({ error: 'Command not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({
        status: command.status,
        response: command.response,
        error_message: command.error_message,
        completed_at: command.completed_at
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Test all credentials for an agent (bulk test)
    if (action === 'test_all') {
      if (!agent_id) {
        return new Response(JSON.stringify({ error: 'agent_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get all active credentials for the user
      const { data: credentials } = await supabase
        .from('vanguard_agent_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (!credentials || credentials.length === 0) {
        return new Response(JSON.stringify({ error: 'No active credentials found' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Queue test for each credential
      const queuedTests = []
      for (const cred of credentials) {
        if (!cred.target_scope || cred.target_scope.length === 0) continue

        const credentialPayload = {
          credential_id: cred.id,
          credential_type: cred.credential_type,
          username: cred.username,
          domain: cred.domain,
          port: cred.port,
          use_ssl: cred.use_ssl,
          encrypted_password: cred.encrypted_password,
          encrypted_private_key: cred.encrypted_private_key,
          snmp_community: cred.snmp_community,
          snmp_auth_protocol: cred.snmp_auth_protocol,
          snmp_priv_protocol: cred.snmp_priv_protocol,
        }

        const { data: command } = await supabase
          .from('vanguard_agent_commands')
          .insert({
            agent_id,
            user_id: user.id,
            command_type: 'test_connectivity',
            payload: {
              credential: credentialPayload,
              targets: cred.target_scope,
              test_type: getTestTypeForCredential(cred.credential_type)
            },
            status: 'pending'
          })
          .select()
          .single()

        if (command) {
          queuedTests.push({
            credential_id: cred.id,
            credential_name: cred.credential_name,
            command_id: command.id
          })
        }
      }

      return new Response(JSON.stringify({
        status: 'queued',
        tests: queuedTests,
        message: `Queued ${queuedTests.length} connectivity tests`
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update credential test result (called after agent reports back)
    if (action === 'update_result') {
      const { test_result, error_message } = body

      if (!credential_id) {
        return new Response(JSON.stringify({ error: 'credential_id is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { error: updateError } = await supabase
        .from('vanguard_agent_credentials')
        .update({
          last_test_result: test_result,
          last_used_at: new Date().toISOString()
        })
        .eq('id', credential_id)
        .eq('user_id', user.id)

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update credential' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('[vanguard-connectivity-test] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function getTestTypeForCredential(credentialType: string): string {
  switch (credentialType) {
    case 'winrm':
      return 'winrm'
    case 'ssh_password':
    case 'ssh_key':
      return 'ssh'
    case 'snmp_v2':
    case 'snmp_v3':
      return 'snmp'
    default:
      return 'ping'
  }
}

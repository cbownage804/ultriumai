import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vanguard-key',
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

    const body = await req.json()
    const { action, job_id, device_id, results } = body

    // Agent submitting results
    if (action === 'submit_results' && device_id) {
      const vanguardKey = req.headers.get('x-vanguard-key')
      if (vanguardKey !== Deno.env.get('VANGUARD_SECRET_KEY')) {
        return new Response(JSON.stringify({ error: 'Invalid key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Update job status
      if (job_id && results) {
        const { job_id: resultJobId, check_results, scan_status, error_message } = results

        // Insert check results
        if (check_results && Array.isArray(check_results)) {
          for (const result of check_results) {
            await supabase.from('agentless_check_results').insert({
              job_id: resultJobId || job_id,
              user_id: result.user_id,
              target_host: result.target_host,
              check_id: result.check_id,
              check_name: result.check_name,
              check_description: result.check_description,
              category: result.category,
              framework_type: result.framework_type,
              status: result.status,
              severity: result.severity,
              actual_value: result.actual_value,
              expected_value: result.expected_value,
              remediation_steps: result.remediation_steps,
              evidence: result.evidence,
              cis_benchmark_id: result.cis_benchmark_id,
            })
          }
        }

        // Update job
        const updateData: any = {
          scanned_hosts: results.scanned_hosts || 0,
          updated_at: new Date().toISOString(),
        }
        
        if (scan_status) {
          updateData.scan_status = scan_status
          if (scan_status === 'completed' || scan_status === 'failed') {
            updateData.completed_at = new Date().toISOString()
          }
        }
        
        if (error_message) {
          updateData.error_message = error_message
        }

        if (results.compliance_results) {
          updateData.compliance_results = results.compliance_results
        }

        await supabase.from('agentless_scan_jobs')
          .update(updateData)
          .eq('id', resultJobId || job_id)
      }

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Get pending scan jobs for agent
    if (action === 'get_pending_scans' && device_id) {
      const vanguardKey = req.headers.get('x-vanguard-key')
      if (vanguardKey !== Deno.env.get('VANGUARD_SECRET_KEY')) {
        return new Response(JSON.stringify({ error: 'Invalid key' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get agent by device_id
      const { data: agent } = await supabase
        .from('vanguard_agents')
        .select('id, user_id')
        .eq('device_id', device_id)
        .single()

      if (!agent) {
        return new Response(JSON.stringify({ scans: [] }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get pending scans for this agent
      const { data: scans } = await supabase
        .from('agentless_scan_jobs')
        .select('*')
        .eq('agent_id', agent.id)
        .eq('scan_status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5)

      // Get credentials for these scans
      const credentialIds = new Set<string>()
      scans?.forEach(scan => {
        if (Array.isArray(scan.credential_ids)) {
          scan.credential_ids.forEach((id: string) => credentialIds.add(id))
        }
      })

      let credentials: any[] = []
      if (credentialIds.size > 0) {
        const { data: creds } = await supabase
          .from('vanguard_agent_credentials')
          .select('*')
          .in('id', Array.from(credentialIds))

        credentials = creds || []
      }

      // Mark scans as running
      if (scans && scans.length > 0) {
        await supabase
          .from('agentless_scan_jobs')
          .update({ 
            scan_status: 'running',
            started_at: new Date().toISOString()
          })
          .in('id', scans.map(s => s.id))
      }

      return new Response(JSON.stringify({ 
        scans: scans || [],
        credentials
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // User starting a scan (authenticated)
    if (action === 'start_scan' && job_id) {
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

      // Verify job belongs to user
      const { data: job, error: jobError } = await supabase
        .from('agentless_scan_jobs')
        .select('*')
        .eq('id', job_id)
        .eq('user_id', user.id)
        .single()

      if (jobError || !job) {
        return new Response(JSON.stringify({ error: 'Job not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Job will be picked up by the agent on next poll
      return new Response(JSON.stringify({ 
        status: 'ok',
        message: 'Scan queued. Agent will pick it up on next poll.'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Agentless scan error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

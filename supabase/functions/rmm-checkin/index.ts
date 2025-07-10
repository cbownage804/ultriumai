import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate API key
  const reqKey = req.headers.get('x-ultrium-key')
  const expectedKey = Deno.env.get('ULTRIUM_AGENT_KEY')

  if (!reqKey || reqKey !== expectedKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const data = await req.json()
    
    // Get deployment configuration from headers
    const deploymentType = req.headers.get('x-deployment-type') || 'direct' // 'direct' or 'msp_client'
    const mspClientId = req.headers.get('x-msp-client-id') // Client ID for MSP deployments
    
    console.log('📥 Device check-in received:', { 
      hostname: data.hostname, 
      ip: data.ip_address,
      deploymentType,
      mspClientId: mspClientId ? mspClientId.substring(0, 8) + '...' : null
    })

    const {
      hostname,
      ip_address,
      os,
      cpu_usage,
      ram_usage,
      disk_usage,
      rustdesk_id,
      user_id // Optional - for associating device with specific user
    } = data

    if (!hostname) {
      console.error('❌ Missing hostname in check-in request')
      return new Response(
        JSON.stringify({ error: 'hostname is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // For MSP deployments, validate client exists and get customer_id
    let assignedCustomerId = null
    if (deploymentType === 'msp_client' && mspClientId) {
      const { data: client } = await supabase
        .from('msp_clients')
        .select('id')
        .eq('id', mspClientId)
        .maybeSingle()
      
      if (!client) {
        console.error('❌ Invalid MSP client ID:', mspClientId)
        return new Response(
          JSON.stringify({ error: 'Invalid MSP client configuration' }), 
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      assignedCustomerId = mspClientId
      console.log('✅ MSP client validated:', mspClientId.substring(0, 8) + '...')
    }

    // Upsert device in rmm_devices table
    const { data: device, error: upsertError } = await supabase
      .from('rmm_devices')
      .upsert({
        hostname,
        ip_address,
        os_info: os,
        rustdesk_id,
        customer_id: assignedCustomerId, // Assign to MSP client if specified
        last_seen: new Date().toISOString(),
        status: 'online',
        cpu_usage: Math.round(cpu_usage || 0),
        memory_usage: Math.round(ram_usage || 0),
        disk_usage: Math.round(disk_usage || 0),
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'hostname',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (upsertError) {
      console.error('❌ Device upsert error:', upsertError)
      return new Response(
        JSON.stringify({ error: upsertError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Device upserted:', device.id)

    // Insert historical metrics into rmm_metrics table (if user_id provided)
    if (user_id) {
      const { error: metricsError } = await supabase
        .from('rmm_metrics')
        .insert({
          user_id,
          device_id: device.id,
          cpu_usage: cpu_usage || 0,
          ram_usage: ram_usage || 0,
          disk_usage: disk_usage || 0,
          timestamp: new Date().toISOString()
        })

      if (metricsError) {
        console.error('❌ Metrics insert error:', metricsError)
        // Don't fail the whole request for metrics error
      } else {
        console.log('✅ Metrics recorded for device:', hostname)
      }
    }


    // Return success response
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        device_id: device.id,
        deployment_type: deploymentType,
        client_assigned: !!assignedCustomerId,
        message: `Device ${hostname} checked in successfully (${deploymentType})`
      }), 
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error in RMM check-in:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const url = new URL(req.url)
    const hostname = url.searchParams.get('hostname')

    if (!hostname) {
      return new Response(JSON.stringify({ error: 'Missing hostname parameter' }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📋 Fetching commands for hostname:', hostname)

    // First, find the device by hostname
    const { data: device, error: deviceError } = await supabase
      .from('rmm_devices')
      .select('id')
      .eq('hostname', hostname)
      .single()

    if (deviceError || !device) {
      console.error('❌ Device not found:', deviceError)
      return new Response(JSON.stringify({ error: 'Device not found' }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Found device:', device.id)

    // Get all pending commands for this device
    const { data: commands, error: commandError } = await supabase
      .from('rmm_agent_commands')
      .select(`
        id,
        command_type,
        command_data,
        priority,
        timeout_seconds,
        status,
        created_at,
        user_id
      `)
      .eq('agent_id', device.id)
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (commandError) {
      console.error('❌ Error fetching commands:', commandError)
      return new Response(JSON.stringify({ error: commandError.message }), { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Found ${commands?.length || 0} pending commands`)

    return new Response(JSON.stringify({
      device_id: device.id,
      commands: commands || []
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
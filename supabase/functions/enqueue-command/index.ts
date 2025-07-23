import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const { device_id, command_type, payload = {} } = await req.json()

    if (!device_id || !command_type) {
      return new Response(JSON.stringify({ error: 'device_id and command_type required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate command type
    const validTypes = ['run_scan', 'checkin_now', 'restart_service', 'custom_script', 'update_config']
    if (!validTypes.includes(command_type)) {
      return new Response(JSON.stringify({ error: `Invalid command_type. Must be one of: ${validTypes.join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify device exists
    const { data: device, error: deviceError } = await supabase
      .from('safenet_devices')
      .select('id, hostname')
      .eq('id', device_id)
      .single()

    if (deviceError || !device) {
      return new Response(JSON.stringify({ error: 'Device not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert command into queue
    const { data: command, error: commandError } = await supabase
      .from('device_commands')
      .insert({
        device_id,
        command_type,
        payload,
        status: 'queued',
        created_at: new Date().toISOString()
      })
      .select('id, command_type, status, created_at')
      .single()

    if (commandError) {
      console.error('Error creating command:', commandError)
      return new Response(JSON.stringify({ error: 'Failed to enqueue command', details: commandError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`Command enqueued: ${command_type} for device ${device.hostname} (${device_id})`)

    return new Response(JSON.stringify({
      command_id: command.id,
      device_id,
      command_type: command.command_type,
      status: command.status,
      created_at: command.created_at,
      message: `Command ${command_type} successfully enqueued for device ${device.hostname}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error enqueuing command:', error)
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
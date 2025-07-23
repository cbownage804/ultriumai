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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    const data = await req.json()
    const { device_id, command_id, status, result, error_message } = data

    if (!device_id || !command_id || !status) {
      return new Response(JSON.stringify({ error: 'Missing required fields: device_id, command_id, status' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Validate status
    const validStatuses = ['done', 'error']
    if (!validStatuses.includes(status)) {
      return new Response(JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📝 Processing command result for command:', command_id, 'device:', device_id, 'status:', status)

    // Verify the command exists and belongs to the device
    const { data: command, error: commandError } = await supabase
      .from('device_commands')
      .select('id, device_id, type, status as current_status')
      .eq('id', command_id)
      .eq('device_id', device_id)
      .single()

    if (commandError || !command) {
      console.error('❌ Command not found or does not belong to device:', commandError)
      return new Response(JSON.stringify({ error: 'Command not found or unauthorized' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update command with result
    const updateData: any = {
      status,
      finished_at: new Date().toISOString()
    }

    if (result) {
      updateData.result = result
    }

    if (error_message) {
      updateData.error_message = error_message
    }

    const { error: updateError } = await supabase
      .from('device_commands')
      .update(updateData)
      .eq('id', command_id)

    if (updateError) {
      console.error('❌ Error updating command:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Command ${command_id} marked as ${status}`)

    return new Response(JSON.stringify({ 
      status: 'ok',
      command_id,
      command_status: status,
      updated_at: new Date().toISOString()
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
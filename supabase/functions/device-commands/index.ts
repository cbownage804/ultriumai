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

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceKey)

    if (req.method === 'POST' && req.url.includes('/pop')) {
      // Pop next command for device
      const { device_id } = await req.json()

      if (!device_id) {
        return new Response(JSON.stringify({ error: 'device_id required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Get next queued command
      const { data: command, error: fetchError } = await supabase
        .from('device_commands')
        .select('*')
        .eq('device_id', device_id)
        .eq('status', 'queued')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (fetchError || !command) {
        return new Response(JSON.stringify({ command: null }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Mark command as sent
      const { error: updateError } = await supabase
        .from('device_commands')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', command.id)

      if (updateError) {
        console.error('Failed to update command status:', updateError)
      }

      return new Response(JSON.stringify({ command }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && req.url.includes('/ack')) {
      // Acknowledge command execution
      const { command_id, status, error_message } = await req.json()

      if (!command_id || !status) {
        return new Response(JSON.stringify({ error: 'command_id and status required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'ack') {
        updateData.acked_at = new Date().toISOString()
      } else if (status === 'done') {
        updateData.done_at = new Date().toISOString()
      } else if (status === 'error') {
        updateData.error_message = error_message
      }

      const { error: updateError } = await supabase
        .from('device_commands')
        .update(updateData)
        .eq('id', command_id)

      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update command' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST' && req.url.includes('/queue')) {
      // Queue new command for device
      const { device_id, type, payload = {} } = await req.json()

      if (!device_id || !type) {
        return new Response(JSON.stringify({ error: 'device_id and type required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: command, error: insertError } = await supabase
        .from('device_commands')
        .insert({
          device_id,
          type,
          payload,
          status: 'queued'
        })
        .select()
        .single()

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Failed to queue command' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ command }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid endpoint' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Device commands error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
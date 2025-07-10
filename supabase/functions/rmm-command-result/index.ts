import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const data = await req.json()
    const { command_id, output, error } = data

    if (!command_id) {
      return new Response(JSON.stringify({ error: 'Missing command_id' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📝 Processing command result for command:', command_id)

    // Get the command to find user_id
    const { data: command, error: commandError } = await supabase
      .from('rmm_agent_commands')
      .select('user_id')
      .eq('id', command_id)
      .single()

    if (commandError || !command) {
      console.error('❌ Command not found:', commandError)
      return new Response(JSON.stringify({ error: 'Command not found' }), { 
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Insert result into rmm_command_results table
    const { error: insertError } = await supabase
      .from('rmm_command_results')
      .insert({ 
        command_id, 
        output, 
        error,
        user_id: command.user_id,
        timestamp: new Date().toISOString()
      })

    if (insertError) {
      console.error('❌ Error inserting result:', insertError)
      return new Response(JSON.stringify({ error: insertError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Update command status
    const status = error ? 'failed' : 'completed'
    
    const { error: updateError } = await supabase
      .from('rmm_agent_commands')
      .update({ 
        status,
        completed_at: new Date().toISOString()
      })
      .eq('id', command_id)

    if (updateError) {
      console.error('❌ Error updating command status:', updateError)
      return new Response(JSON.stringify({ error: updateError.message }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`✅ Command ${command_id} marked as ${status}`)

    return new Response(JSON.stringify({ 
      status: 'ok',
      command_status: status 
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
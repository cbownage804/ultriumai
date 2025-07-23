import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { device_id } = body;

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🔍 Fetching next command for device:', device_id);

    // Get the next queued command and atomically mark it as running
    const { data: command, error: fetchError } = await supabase
      .from('device_commands')
      .select('*')
      .eq('device_id', device_id)
      .eq('status', 'queued')
      .order('queued_at', { ascending: true })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('❌ Command fetch failed:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch command', details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!command) {
      console.log('ℹ️ No queued commands for device:', device_id);
      return new Response(JSON.stringify({ command: null }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark command as running
    const { error: updateError } = await supabase
      .from('device_commands')
      .update({
        status: 'running',
        started_at: new Date().toISOString()
      })
      .eq('id', command.id);

    if (updateError) {
      console.error('❌ Command update failed:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update command status', details: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('✅ Command claimed for execution:', command.id, command.type);

    return new Response(JSON.stringify({
      command: {
        id: command.id,
        type: command.type,
        payload: command.payload,
        queued_at: command.queued_at
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Commands-next error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
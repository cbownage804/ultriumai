import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const data = await req.json()
    console.log('📥 Device check-in received:', { hostname: data.hostname, ip: data.ip_address })

    const {
      hostname,
      ip_address,
      os,
      cpu_usage,
      ram_usage,
      disk_usage,
      rustdesk_id,
      user_id // Required for RLS policies
    } = data

    if (!user_id) {
      console.error('❌ Missing user_id in check-in request')
      return new Response(
        JSON.stringify({ error: 'user_id is required' }), 
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upsert device in rmm_devices table
    const { data: device, error: upsertError } = await supabase
      .from('rmm_devices')
      .upsert({
        hostname,
        ip_address,
        os_info: os,
        rustdesk_id,
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

    // Insert historical metrics into rmm_metrics table
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
      return new Response(
        JSON.stringify({ error: metricsError.message }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Metrics recorded for device:', hostname)

    // Return success response
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        device_id: device.id,
        message: `Device ${hostname} checked in successfully`
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
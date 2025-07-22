import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { create } from "https://esm.sh/djwt@3.0.1"

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
    const { device_id, scope = 'tray' } = await req.json()

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const jwtSecret = Deno.env.get('SUPABASE_JWT_SECRET')!

    const supabase = createClient(supabaseUrl, serviceKey)

    // Verify device exists and get connector info
    const { data: device, error } = await supabase
      .from('safenet_devices')
      .select('id, connector_key, user_id, hostname, status')
      .eq('id', device_id)
      .single()

    if (error || !device) {
      return new Response(JSON.stringify({ error: 'Device not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Create JWT payload for tray access
    const expiresInSeconds = 300 // 5 minutes
    const now = Math.floor(Date.now() / 1000)
    
    const payload = {
      sub: device_id,
      role: 'device_tray',
      device_id: device_id,
      connector_key: device.connector_key,
      user_id: device.user_id,
      hostname: device.hostname,
      scope: scope,
      iat: now,
      exp: now + expiresInSeconds,
      aud: 'tray-access'
    }

    // Create the JWT
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(jwtSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const token = await create({ alg: 'HS256', typ: 'JWT' }, payload, key)

    return new Response(JSON.stringify({ 
      token, 
      expires_in: expiresInSeconds,
      device: {
        id: device.id,
        hostname: device.hostname,
        status: device.status
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error issuing tray token:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { device_id } = await req.json();

    if (!device_id) {
      return new Response(JSON.stringify({ error: 'device_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: device } = await supabase
      .from('devices')
      .select('status, last_checkin')
      .eq('id', device_id)
      .single();

    if (!device) {
      return new Response(JSON.stringify({ 
        State: 'Gray',
        Message: 'Device not found',
        Online: false,
        HasCriticalAlert: false,
        HasHighAlert: false
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const isOnline = device.last_checkin && 
      (new Date().getTime() - new Date(device.last_checkin).getTime()) < 10 * 60 * 1000;

    return new Response(JSON.stringify({
      State: isOnline ? 'Green' : 'Red',
      Message: isOnline ? 'Online and healthy' : 'Offline',
      Online: isOnline,
      HasCriticalAlert: false,
      HasHighAlert: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      State: 'Red',
      Message: 'Service error',
      Online: false,
      HasCriticalAlert: false,
      HasHighAlert: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
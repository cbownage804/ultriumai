import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  console.log('SafeNet Connector: Request received');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse request body
    const body = await req.text();
    console.log('Received body length:', body.length);
    
    const scanData = JSON.parse(body);
    console.log('Parsed scan data for connector:', scanData.connector_key);

    // Validate connector key
    const { data: connectorData, error: connectorError } = await supabase
      .rpc('validate_connector_key', { p_connector_key: scanData.connector_key });

    if (connectorError) {
      console.error('Connector validation error:', connectorError);
      return new Response(
        JSON.stringify({ error: 'Connector validation failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!connectorData || connectorData.length === 0) {
      console.log('Invalid connector key');
      return new Response(
        JSON.stringify({ error: 'Invalid connector key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { connector_id, user_id } = connectorData[0];
    console.log('Valid connector found:', connector_id, 'for user:', user_id);

    // Store scan results
    const { error: insertError } = await supabase
      .from('safenet_scans')
      .insert({
        user_id: user_id,
        connector_id: connector_id,
        scan_data: scanData,
        devices_found: scanData.summary?.devices_found || 0,
        networks_scanned: scanData.summary?.networks_scanned || 0,
        total_ports: scanData.summary?.total_ports || 0,
        scan_duration: scanData.summary?.scan_duration || 0,
        system_info: scanData.system_info || {},
        vulnerabilities: scanData.vulnerabilities || [],
        risk_score: scanData.risk_assessment?.overall_score || 0
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store scan results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scan results stored successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Scan results processed successfully',
        devices_found: scanData.summary?.devices_found || 0
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error processing scan:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
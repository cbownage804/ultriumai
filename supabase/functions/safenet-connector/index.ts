import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req: Request) => {
  try {
    console.log('SafeNet Connector: Request received', new Date().toISOString());

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    console.log('Environment check...');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating Supabase client...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Reading request body...');
    const body = await req.text();
    console.log('Body length:', body.length);
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Empty request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing JSON...');
    let scanData;
    try {
      scanData = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Validating connector key:', scanData.connector_key);
    
    let connectorData, connectorError;
    try {
      const result = await supabase.rpc('validate_connector_key', { 
        p_connector_key: scanData.connector_key 
      });
      connectorData = result.data;
      connectorError = result.error;
    } catch (rpcError) {
      console.error('RPC call error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Database validation failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
    console.log('Valid connector found:', connector_id);

    // Prepare minimal scan record
    const scanRecord = {
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
    };

    console.log('Inserting scan results...');
    let insertError;
    try {
      const result = await supabase.from('safenet_scans').insert(scanRecord);
      insertError = result.error;
    } catch (dbError) {
      console.error('Database insert error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store scan results', details: dbError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (insertError) {
      console.error('Insert error details:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to store scan results', details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scan results stored successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Scan results processed successfully',
        devices_found: scanData.summary?.devices_found || 0,
        connector_id: connector_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unhandled error:', error);
    console.error('Error stack:', error?.stack);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error?.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
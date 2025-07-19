import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const url = new URL(req.url);
    const clientCode = url.searchParams.get('client');

    if (!clientCode) {
      return new Response(
        JSON.stringify({ error: 'Client code required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Mock client configurations - in production, this would query Supabase
    const clientConfigs = {
      'ACME01': {
        ConnectorKey: 'sk-client-ACME01-x8k9m2n4',
        ClientCode: 'ACME01',
        ClientName: 'Acme Corporation',
        ApiUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1',
        StorageUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-agents',
        MSIPath: 'acme01/UltriumRMMAgent.msi',
        ContactEmail: 'admin@acme.com',
        Settings: {
          CheckinInterval: 300,
          MetricsInterval: 60,
          EnableRemoteCommands: true,
          AutoUpdate: true
        }
      },
      'TECH02': {
        ConnectorKey: 'sk-client-TECH02-p7q3r5t8',
        ClientCode: 'TECH02',
        ClientName: 'Tech Solutions LLC',
        ApiUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1',
        StorageUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-agents',
        MSIPath: 'tech02/UltriumRMMAgent.msi',
        ContactEmail: 'it@techsolutions.com',
        Settings: {
          CheckinInterval: 600,
          MetricsInterval: 120,
          EnableRemoteCommands: false,
          AutoUpdate: true
        }
      },
      'GLOBAL03': {
        ConnectorKey: 'sk-client-GLOBAL03-w2e5r8t1',
        ClientCode: 'GLOBAL03',
        ClientName: 'Global Services Inc',
        ApiUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/functions/v1',
        StorageUrl: 'https://nsyobmjpdpvesjwdphlh.supabase.co/storage/v1/object/public/rmm-agents',
        MSIPath: 'global03/UltriumRMMAgent.msi',
        ContactEmail: 'support@globalservices.com',
        Settings: {
          CheckinInterval: 180,
          MetricsInterval: 30,
          EnableRemoteCommands: true,
          AutoUpdate: false
        }
      }
    };

    const config = clientConfigs[clientCode.toUpperCase()];

    if (!config) {
      return new Response(
        JSON.stringify({ error: 'Client configuration not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CLIENT-CONFIG] Configuration requested for client: ${clientCode}`);

    return new Response(
      JSON.stringify(config),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CLIENT-CONFIG] Error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
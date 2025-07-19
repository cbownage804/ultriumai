import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClientConfigRequest {
  connectorKey: string;
  clientCode?: string;
}

interface ClientConfigResponse {
  success: boolean;
  config?: {
    ConnectorKey: string;
    ClientCode: string;
    ClientName: string;
    MSPName: string;
    ApiUrl: string;
    StorageUrl: string;
    ContactEmail?: string;
    Settings: {
      CheckinInterval: number;
      MetricsInterval: number;
      EnableRemoteCommands: boolean;
      AutoUpdate: boolean;
    };
  };
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`[CLIENT-CONFIG] ${req.method} request: ${req.url}`);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let connectorKey: string | null = null;
    let clientCode: string | null = null;

    if (req.method === 'GET') {
      // Legacy support: GET with client code parameter
      const url = new URL(req.url);
      clientCode = url.searchParams.get('client');
      connectorKey = url.searchParams.get('connectorKey');

      // If only client code provided, fall back to mock data for backward compatibility
      if (clientCode && !connectorKey) {
        return handleLegacyClientCodeRequest(clientCode);
      }
    } else if (req.method === 'POST') {
      // New approach: POST with connector key validation
      const body: ClientConfigRequest = await req.json();
      connectorKey = body.connectorKey;
      clientCode = body.clientCode;
    }

    if (!connectorKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Connector key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`[CLIENT-CONFIG] Validating connector key: ${connectorKey.substring(0, 15)}...`);

    // Validate the connector key using the existing function
    const { data: validationData, error: validationError } = await supabase
      .rpc('validate_connector_key', { p_connector_key: connectorKey });

    if (validationError) {
      console.error('[CLIENT-CONFIG] Error validating connector key:', validationError);
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid connector key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!validationData || validationData.length === 0) {
      console.log('[CLIENT-CONFIG] Connector key not found or inactive');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid or inactive connector key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const connectorInfo = validationData[0];
    console.log(`[CLIENT-CONFIG] Found valid connector for user: ${connectorInfo.user_id}`);

    // Get the connector details with client information
    const { data: connectorData, error: connectorError } = await supabase
      .from('safenet_connectors')
      .select(`
        id,
        connector_key,
        client_code,
        msp_clients!inner (
          id,
          company_name,
          contact_email,
          msps!inner (
            id,
            organization_name,
            user_id
          )
        )
      `)
      .eq('connector_key', connectorKey)
      .eq('status', 'active')
      .single();

    if (connectorError || !connectorData) {
      console.error('[CLIENT-CONFIG] Error fetching connector details:', connectorError);
      return new Response(
        JSON.stringify({ success: false, error: 'Connector configuration not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate client code if provided
    if (clientCode && connectorData.client_code !== clientCode) {
      console.log(`[CLIENT-CONFIG] Client code mismatch: provided ${clientCode}, expected ${connectorData.client_code}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Client code does not match connector key' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const client = connectorData.msp_clients;
    const msp = client.msps;

    // Build the configuration response
    const config: ClientConfigResponse = {
      success: true,
      config: {
        ConnectorKey: connectorData.connector_key,
        ClientCode: connectorData.client_code,
        ClientName: client.company_name,
        MSPName: msp.organization_name,
        ApiUrl: `${supabaseUrl}/functions/v1`,
        StorageUrl: `${supabaseUrl}/storage/v1/object/public/rmm-agents`,
        ContactEmail: client.contact_email,
        Settings: {
          CheckinInterval: 300, // 5 minutes
          MetricsInterval: 60,  // 1 minute
          EnableRemoteCommands: true,
          AutoUpdate: true
        }
      }
    };

    console.log(`[CLIENT-CONFIG] Successfully generated config for: ${client.company_name} (${connectorData.client_code})`);

    return new Response(
      JSON.stringify(config),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[CLIENT-CONFIG] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Legacy function for backward compatibility
function handleLegacyClientCodeRequest(clientCode: string): Response {
  console.log(`[CLIENT-CONFIG] Legacy request for client: ${clientCode}`);
  
  // Mock client configurations for backward compatibility
  const clientConfigs: Record<string, any> = {
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

  return new Response(
    JSON.stringify(config),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}
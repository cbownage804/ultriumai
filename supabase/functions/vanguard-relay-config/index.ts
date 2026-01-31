// =============================================================================
// Vanguard Relay Configuration Endpoint
// Returns RustDesk relay server configuration for agents
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get relay configuration from environment or defaults
    const relayServer = Deno.env.get('RUSTDESK_RELAY_SERVER') || '';
    const publicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY') || '';
    const apiServer = Deno.env.get('RUSTDESK_API_SERVER') || '';

    const config = {
      relay_server: relayServer,
      public_key: publicKey,
      api_server: apiServer,
      auto_install: true,
      rustdesk_version: '1.2.6',
      timestamp: new Date().toISOString(),
    };

    // Log config request (without sensitive data)
    console.log(`[Relay Config] Request from agent, relay configured: ${Boolean(relayServer)}`);

    return new Response(
      JSON.stringify(config),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('[Relay Config] Error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to get relay configuration',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});

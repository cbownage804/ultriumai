// =============================================================================
// Vanguard Relay Configuration Endpoint
// Returns RustDesk relay server configuration for agents (dual-relay failover)
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
    // Primary relay server (required)
    const primaryRelayServer = Deno.env.get('RUSTDESK_RELAY_SERVER') || '';
    const primaryPublicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY') || '';
    
    // Secondary relay server (optional - for failover)
    const secondaryRelayServer = Deno.env.get('RUSTDESK_RELAY_SERVER_2') || '';
    const secondaryPublicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY_2') || '';
    
    // API server (Pro only)
    const apiServer = Deno.env.get('RUSTDESK_API_SERVER') || '';

    // Build relay servers array
    const relayServers = [];
    
    if (primaryRelayServer) {
      relayServers.push({
        server: primaryRelayServer,
        public_key: primaryPublicKey,
        priority: 1,
        region: Deno.env.get('RUSTDESK_RELAY_REGION') || 'primary',
      });
    }
    
    if (secondaryRelayServer) {
      relayServers.push({
        server: secondaryRelayServer,
        public_key: secondaryPublicKey || primaryPublicKey, // Fallback to primary key if same key pair
        priority: 2,
        region: Deno.env.get('RUSTDESK_RELAY_REGION_2') || 'secondary',
      });
    }

    const config = {
      // Legacy single-server format (for backwards compatibility)
      relay_server: primaryRelayServer,
      public_key: primaryPublicKey,
      api_server: apiServer,
      
      // New dual-relay format
      relay_servers: relayServers,
      failover_enabled: relayServers.length > 1,
      
      // Metadata
      auto_install: true,
      rustdesk_version: '1.2.6',
      timestamp: new Date().toISOString(),
    };

    // Log config request (without sensitive data)
    console.log(`[Relay Config] Request from agent, relays configured: ${relayServers.length}, failover: ${relayServers.length > 1}`);

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

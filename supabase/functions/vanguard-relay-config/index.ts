// =============================================================================
// Vanguard Relay Configuration Endpoint
// Returns RustDesk relay server configuration for agents (dual-relay failover)
// Also generates unique unattended access password per device
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-vanguard-key, x-device-id',
};

/**
 * Generate a cryptographically secure random password
 */
function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

/**
 * Simple XOR-based encryption for RustDesk passwords
 * Note: For production, consider using a proper encryption library
 */
function encryptPassword(password: string, key: string): string {
  const keyBytes = new TextEncoder().encode(key);
  const passwordBytes = new TextEncoder().encode(password);
  const encrypted = new Uint8Array(passwordBytes.length);
  
  for (let i = 0; i < passwordBytes.length; i++) {
    encrypted[i] = passwordBytes[i] ^ keyBytes[i % keyBytes.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get device ID from headers (for password generation/retrieval)
    const deviceId = req.headers.get('x-device-id');
    const vanguardKey = req.headers.get('x-vanguard-key');
    
    // Primary relay server (required)
    const primaryRelayServer = Deno.env.get('RUSTDESK_RELAY_SERVER') || '';
    const primaryPublicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY') || '';
    
    // Secondary relay server (optional - for failover)
    const secondaryRelayServer = Deno.env.get('RUSTDESK_RELAY_SERVER_2') || '';
    const secondaryPublicKey = Deno.env.get('RUSTDESK_PUBLIC_KEY_2') || '';
    
    // API server (Pro only)
    const apiServer = Deno.env.get('RUSTDESK_API_SERVER') || '';
    
    // Encryption key for passwords
    const encryptionKey = Deno.env.get('VANGUARD_AGENT_SECRET') || 'default-key';

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
        public_key: secondaryPublicKey || primaryPublicKey,
        priority: 2,
        region: Deno.env.get('RUSTDESK_RELAY_REGION_2') || 'secondary',
      });
    }

    // Generate or retrieve unattended password for this device
    let unattendedPassword: string | null = null;
    
    if (deviceId && vanguardKey) {
      // Verify the agent key
      const expectedKey = Deno.env.get('VANGUARD_AGENT_SECRET');
      if (vanguardKey === expectedKey) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        
        // Check if device already has a password
        const { data: agent } = await supabase
          .from('vanguard_agents')
          .select('rustdesk_password_encrypted')
          .eq('id', deviceId)
          .single();
        
        if (agent?.rustdesk_password_encrypted) {
          // Device already has a password - don't return it (security)
          // Agent should already have it stored locally
          console.log(`[Relay Config] Device ${deviceId} already has password configured`);
        } else {
          // Generate new password for this device
          unattendedPassword = generateSecurePassword(16);
          const encryptedPassword = encryptPassword(unattendedPassword, encryptionKey);
          
          // Store encrypted password in database
          const { error } = await supabase
            .from('vanguard_agents')
            .update({ rustdesk_password_encrypted: encryptedPassword })
            .eq('id', deviceId);
          
          if (error) {
            console.error(`[Relay Config] Failed to store password for ${deviceId}:`, error);
          } else {
            console.log(`[Relay Config] Generated new password for device ${deviceId}`);
          }
        }
      } else {
        console.warn(`[Relay Config] Invalid vanguard key from device ${deviceId}`);
      }
    }

    const config = {
      // Legacy single-server format (for backwards compatibility)
      relay_server: primaryRelayServer,
      public_key: primaryPublicKey,
      api_server: apiServer,
      
      // New dual-relay format
      relay_servers: relayServers,
      failover_enabled: relayServers.length > 1,
      
      // Unattended access password (only returned on first request)
      unattended_password: unattendedPassword,
      
      // Metadata
      auto_install: true,
      rustdesk_version: '1.2.6',
      timestamp: new Date().toISOString(),
    };

    // Log config request (without sensitive data)
    console.log(`[Relay Config] Request from ${deviceId || 'unknown'}, relays: ${relayServers.length}, failover: ${relayServers.length > 1}, password: ${unattendedPassword ? 'generated' : 'none'}`);

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

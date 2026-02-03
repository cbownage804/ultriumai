// =============================================================================
// Agent Provisioning Token API
// Enables 1-click MSI deployment with auto-credential fetching
// =============================================================================

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Generate a cryptographically secure token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ==========================================================================
    // ACTION: create - Generate a new provisioning token (requires auth)
    // ==========================================================================
    if (action === 'create') {
      // Verify authentication
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Authorization required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Parse request body
      const body = await req.json().catch(() => ({}));
      const { 
        client_id, 
        client_name, 
        device_name_prefix,
        enable_tray = true,
        max_uses = 1,
        expires_in_days = 7
      } = body;

      // Generate unique token
      const provisioningToken = `vgd_pt_${generateToken()}`;
      
      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expires_in_days);

      // Insert token into database
      const { data: insertedToken, error: insertError } = await supabase
        .from('agent_provisioning_tokens')
        .insert({
          token: provisioningToken,
          user_id: user.id,
          client_id,
          client_name,
          device_name_prefix,
          enable_tray,
          max_uses,
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[agent-provision] Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Failed to create provisioning token' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[agent-provision] Token created for user ${user.id}, client: ${client_name || 'direct'}`);

      return new Response(
        JSON.stringify({
          token: provisioningToken,
          expires_at: expiresAt.toISOString(),
          max_uses,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================================
    // ACTION: redeem - Agent redeems token to get credentials (no auth required)
    // ==========================================================================
    if (action === 'redeem') {
      const body = await req.json().catch(() => ({}));
      const { token, device_id } = body;

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Look up the token
      const { data: tokenRecord, error: lookupError } = await supabase
        .from('agent_provisioning_tokens')
        .select('*')
        .eq('token', token)
        .eq('is_active', true)
        .single();

      if (lookupError || !tokenRecord) {
        console.warn(`[agent-provision] Invalid token attempted: ${token.substring(0, 20)}...`);
        return new Response(
          JSON.stringify({ error: 'Invalid or expired token' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check expiry
      if (new Date(tokenRecord.expires_at) < new Date()) {
        console.warn(`[agent-provision] Expired token: ${token.substring(0, 20)}...`);
        return new Response(
          JSON.stringify({ error: 'Token has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check usage limits
      if (tokenRecord.use_count >= tokenRecord.max_uses) {
        console.warn(`[agent-provision] Token usage limit reached: ${token.substring(0, 20)}...`);
        return new Response(
          JSON.stringify({ error: 'Token usage limit reached' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get the agent secret
      const agentSecret = Deno.env.get('VANGUARD_AGENT_SECRET');
      if (!agentSecret) {
        console.error('[agent-provision] VANGUARD_AGENT_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'Server configuration error' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update token usage
      const updateData: Record<string, unknown> = {
        use_count: tokenRecord.use_count + 1,
      };
      
      // If single-use token, mark as redeemed
      if (tokenRecord.max_uses === 1) {
        updateData.redeemed_at = new Date().toISOString();
        updateData.redeemed_by_device_id = device_id || null;
        updateData.is_active = false;
      }

      await supabase
        .from('agent_provisioning_tokens')
        .update(updateData)
        .eq('id', tokenRecord.id);

      console.log(`[agent-provision] Token redeemed for user ${tokenRecord.user_id}, device: ${device_id || 'unknown'}`);

      // Return credentials
      return new Response(
        JSON.stringify({
          user_id: tokenRecord.user_id,
          secret_key: agentSecret,
          api_endpoint: `${supabaseUrl}/functions/v1/vanguard-agent-api`,
          client_id: tokenRecord.client_id,
          client_name: tokenRecord.client_name,
          device_name_prefix: tokenRecord.device_name_prefix,
          enable_tray: tokenRecord.enable_tray,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ==========================================================================
    // ACTION: validate - Check if a token is valid (no auth required)
    // ==========================================================================
    if (action === 'validate') {
      const tokenParam = url.searchParams.get('token');

      if (!tokenParam) {
        return new Response(
          JSON.stringify({ error: 'Token required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: tokenRecord } = await supabase
        .from('agent_provisioning_tokens')
        .select('id, expires_at, use_count, max_uses, is_active, client_name')
        .eq('token', tokenParam)
        .single();

      if (!tokenRecord) {
        return new Response(
          JSON.stringify({ valid: false, reason: 'not_found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const isExpired = new Date(tokenRecord.expires_at) < new Date();
      const isUsedUp = tokenRecord.use_count >= tokenRecord.max_uses;
      const isValid = tokenRecord.is_active && !isExpired && !isUsedUp;

      return new Response(
        JSON.stringify({
          valid: isValid,
          reason: !tokenRecord.is_active ? 'inactive' : isExpired ? 'expired' : isUsedUp ? 'used_up' : 'valid',
          client_name: tokenRecord.client_name,
          remaining_uses: Math.max(0, tokenRecord.max_uses - tokenRecord.use_count),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: create, redeem, or validate' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[agent-provision] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

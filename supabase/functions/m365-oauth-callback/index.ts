import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[M365-OAUTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, code, state, tenantName, clientId, clientSecret, tenantId: azureTenantId, mspClientId } = await req.json();

    if (action === 'get_auth_url') {
      // Generate OAuth authorization URL
      const clientId = Deno.env.get('M365_CLIENT_ID');
      const redirectUri = Deno.env.get('M365_REDIRECT_URI') || 
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/m365-oauth-callback`;
      
      if (!clientId) {
        throw new Error('M365_CLIENT_ID not configured');
      }

      const scopes = [
        'https://graph.microsoft.com/.default'
      ].join(' ');

      const authUrl = new URL('https://login.microsoftonline.com/common/adminconsent');
      authUrl.searchParams.set('client_id', clientId);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state || crypto.randomUUID());

      logStep('Generated auth URL', { url: authUrl.toString() });

      return new Response(JSON.stringify({ authUrl: authUrl.toString() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'register_tenant') {
      // Manual tenant registration with app credentials
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) throw new Error('Not authenticated');

      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData.user) throw new Error('Authentication failed');

      logStep('Registering tenant', { tenantName, azureTenantId });

      // Validate credentials by fetching a token
      const tokenUrl = `https://login.microsoftonline.com/${azureTenantId}/oauth2/v2.0/token`;
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        logStep('Token validation failed', { error: errorText });
        throw new Error('Invalid credentials - could not authenticate with Microsoft');
      }

      const tokenData = await tokenResponse.json();
      logStep('Token validated successfully');

      // Get tenant info from Graph
      const graphResponse = await fetch('https://graph.microsoft.com/v1.0/organization', {
        headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
      });

      let tenantDomain = azureTenantId;
      if (graphResponse.ok) {
        const orgData = await graphResponse.json();
        if (orgData.value?.[0]?.verifiedDomains) {
          const primaryDomain = orgData.value[0].verifiedDomains.find((d: any) => d.isDefault);
          if (primaryDomain) {
            tenantDomain = primaryDomain.name;
          }
        }
      }

      // Store tenant in database
      const { data: newTenant, error: insertError } = await supabase
        .from('vanguard_m365_tenants')
        .insert({
          user_id: userData.user.id,
          msp_client_id: mspClientId || null,
          tenant_id: azureTenantId,
          tenant_name: tenantName,
          tenant_domain: tenantDomain,
          client_id: clientId,
          client_secret: clientSecret, // In production, encrypt this
          is_active: true,
          sync_status: 'pending',
          monitor_risky_signins: true,
          monitor_conditional_access: true,
          monitor_mfa_status: true,
          monitor_mailbox_rules: true
        })
        .select()
        .single();

      if (insertError) {
        logStep('Insert error', { error: insertError });
        throw new Error('Failed to save tenant: ' + insertError.message);
      }

      logStep('Tenant registered', { id: newTenant.id });

      return new Response(JSON.stringify({ 
        success: true, 
        tenant: {
          id: newTenant.id,
          tenantName: newTenant.tenant_name,
          tenantDomain: newTenant.tenant_domain
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (action === 'handle_callback') {
      // Handle OAuth callback
      if (!code) {
        throw new Error('No authorization code provided');
      }

      const clientId = Deno.env.get('M365_CLIENT_ID');
      const clientSecret = Deno.env.get('M365_CLIENT_SECRET');
      const redirectUri = Deno.env.get('M365_REDIRECT_URI');

      if (!clientId || !clientSecret) {
        throw new Error('M365 credentials not configured');
      }

      // Exchange code for tokens
      const tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri || '',
        grant_type: 'authorization_code',
        scope: 'https://graph.microsoft.com/.default'
      });

      const tokenResponse = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token exchange failed: ${errorText}`);
      }

      const tokenData = await tokenResponse.json();
      logStep('Tokens received', { hasAccessToken: !!tokenData.access_token });

      return new Response(JSON.stringify({ 
        success: true,
        message: 'OAuth completed successfully'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logStep('ERROR', { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSOConfig {
  provider: 'saml' | 'oauth' | 'oidc';
  provider_name: string;
  metadata_url?: string;
  entity_id?: string;
  sso_url?: string;
  certificate?: string;
  client_id?: string;
  client_secret?: string;
  authorization_url?: string;
  token_url?: string;
  userinfo_url?: string;
  scopes?: string[];
}

interface SSOSession {
  id: string;
  user_id: string;
  provider: string;
  session_token: string;
  expires_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action, ...params } = await req.json();
    console.log(`[sso-integration] Action: ${action}`);

    switch (action) {
      case 'configure_saml': {
        const { org_id, user_id, config } = params;
        
        // Store SAML configuration
        const { data, error } = await supabase
          .from('atlas_configurations')
          .upsert({
            user_id,
            organization_id: org_id,
            name: `SAML SSO - ${config.provider_name}`,
            configuration_type: 'sso_saml',
            configuration_data: {
              provider: 'saml',
              provider_name: config.provider_name,
              metadata_url: config.metadata_url,
              entity_id: config.entity_id,
              sso_url: config.sso_url,
              certificate: config.certificate,
              attribute_mapping: config.attribute_mapping || {
                email: 'email',
                first_name: 'firstName',
                last_name: 'lastName'
              },
              enabled: true
            },
            is_active: true
          }, { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;

        // Generate SP metadata for customer to add to their IdP
        const spMetadata = generateSPMetadata(supabaseUrl, org_id);

        return new Response(JSON.stringify({ 
          success: true,
          config_id: data.id,
          sp_metadata: spMetadata,
          sp_entity_id: `${supabaseUrl}/sso/saml/${org_id}`,
          sp_acs_url: `${supabaseUrl}/functions/v1/sso-integration/saml/acs`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'configure_oauth': {
        const { org_id, user_id, config } = params;
        
        const { data, error } = await supabase
          .from('atlas_configurations')
          .upsert({
            user_id,
            organization_id: org_id,
            name: `OAuth SSO - ${config.provider_name}`,
            configuration_type: 'sso_oauth',
            configuration_data: {
              provider: 'oauth',
              provider_name: config.provider_name,
              client_id: config.client_id,
              client_secret: config.client_secret,
              authorization_url: config.authorization_url,
              token_url: config.token_url,
              userinfo_url: config.userinfo_url,
              scopes: config.scopes || ['openid', 'email', 'profile'],
              enabled: true
            },
            is_active: true
          }, { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;

        // Generate redirect URI for customer
        const redirectUri = `${supabaseUrl}/functions/v1/sso-integration/oauth/callback`;

        return new Response(JSON.stringify({ 
          success: true,
          config_id: data.id,
          redirect_uri: redirectUri
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'configure_oidc': {
        const { org_id, user_id, config } = params;
        
        // For OIDC, we can auto-discover endpoints from well-known config
        let discoveredConfig = {};
        if (config.issuer_url) {
          try {
            const wellKnownUrl = `${config.issuer_url}/.well-known/openid-configuration`;
            const response = await fetch(wellKnownUrl);
            if (response.ok) {
              discoveredConfig = await response.json();
              console.log('[sso-integration] OIDC discovery successful');
            }
          } catch (e) {
            console.log('[sso-integration] OIDC discovery failed, using manual config');
          }
        }

        const { data, error } = await supabase
          .from('atlas_configurations')
          .upsert({
            user_id,
            organization_id: org_id,
            name: `OIDC SSO - ${config.provider_name}`,
            configuration_type: 'sso_oidc',
            configuration_data: {
              provider: 'oidc',
              provider_name: config.provider_name,
              issuer_url: config.issuer_url,
              client_id: config.client_id,
              client_secret: config.client_secret,
              authorization_endpoint: config.authorization_url || (discoveredConfig as any).authorization_endpoint,
              token_endpoint: config.token_url || (discoveredConfig as any).token_endpoint,
              userinfo_endpoint: config.userinfo_url || (discoveredConfig as any).userinfo_endpoint,
              jwks_uri: (discoveredConfig as any).jwks_uri,
              scopes: config.scopes || ['openid', 'email', 'profile'],
              enabled: true
            },
            is_active: true
          }, { onConflict: 'id' })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true,
          config_id: data.id,
          redirect_uri: `${supabaseUrl}/functions/v1/sso-integration/oidc/callback`,
          discovered: Object.keys(discoveredConfig).length > 0
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_sso_configs': {
        const { org_id, user_id } = params;
        
        const { data: configs } = await supabase
          .from('atlas_configurations')
          .select('*')
          .eq('user_id', user_id)
          .in('configuration_type', ['sso_saml', 'sso_oauth', 'sso_oidc'])
          .order('created_at', { ascending: false });

        const ssoConfigs = (configs || []).map(c => ({
          id: c.id,
          type: c.configuration_type.replace('sso_', ''),
          name: (c.configuration_data as any)?.provider_name || c.name,
          enabled: (c.configuration_data as any)?.enabled || false,
          org_id: c.organization_id,
          created_at: c.created_at
        }));

        return new Response(JSON.stringify({ 
          success: true,
          configs: ssoConfigs
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'initiate_sso': {
        const { org_id, provider_type, redirect_url } = params;
        
        // Get SSO config for org
        const { data: config } = await supabase
          .from('atlas_configurations')
          .select('*')
          .eq('organization_id', org_id)
          .eq('configuration_type', `sso_${provider_type}`)
          .eq('is_active', true)
          .single();

        if (!config) {
          throw new Error('SSO not configured for this organization');
        }

        const configData = config.configuration_data as any;
        
        // Generate state token for CSRF protection
        const state = crypto.randomUUID();
        
        // Store state for verification
        await supabase
          .from('audit_logs')
          .insert({
            action: 'sso_initiated',
            resource_type: 'sso_session',
            resource_id: state,
            details: {
              org_id,
              provider_type,
              redirect_url,
              expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
            }
          });

        let loginUrl: string;
        
        if (provider_type === 'saml') {
          // For SAML, redirect to IdP with SAMLRequest
          loginUrl = `${configData.sso_url}?SAMLRequest=${encodeURIComponent(generateSAMLRequest(supabaseUrl, org_id))}&RelayState=${state}`;
        } else {
          // For OAuth/OIDC
          const authUrl = configData.authorization_endpoint || configData.authorization_url;
          const scopes = (configData.scopes || ['openid', 'email', 'profile']).join(' ');
          loginUrl = `${authUrl}?client_id=${configData.client_id}&response_type=code&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(`${supabaseUrl}/functions/v1/sso-integration/${provider_type}/callback`)}&state=${state}`;
        }

        return new Response(JSON.stringify({ 
          success: true,
          login_url: loginUrl,
          state
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'toggle_sso': {
        const { config_id, enabled, user_id } = params;
        
        const { data: config } = await supabase
          .from('atlas_configurations')
          .select('configuration_data')
          .eq('id', config_id)
          .eq('user_id', user_id)
          .single();

        if (!config) throw new Error('Config not found');

        const updatedData = { ...(config.configuration_data as any), enabled };
        
        const { error } = await supabase
          .from('atlas_configurations')
          .update({ 
            configuration_data: updatedData,
            is_active: enabled 
          })
          .eq('id', config_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'delete_sso': {
        const { config_id, user_id } = params;
        
        const { error } = await supabase
          .from('atlas_configurations')
          .delete()
          .eq('id', config_id)
          .eq('user_id', user_id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'test_connection': {
        const { config_id, user_id } = params;
        
        const { data: config } = await supabase
          .from('atlas_configurations')
          .select('*')
          .eq('id', config_id)
          .eq('user_id', user_id)
          .single();

        if (!config) throw new Error('Config not found');

        const configData = config.configuration_data as any;
        let testResult = { success: false, message: '' };

        try {
          if (config.configuration_type === 'sso_saml') {
            // Test SAML by fetching metadata
            if (configData.metadata_url) {
              const response = await fetch(configData.metadata_url);
              testResult = { 
                success: response.ok, 
                message: response.ok ? 'SAML metadata accessible' : 'Failed to fetch metadata' 
              };
            } else {
              testResult = { success: true, message: 'Manual configuration (no metadata URL)' };
            }
          } else {
            // Test OAuth/OIDC by checking token endpoint
            const tokenUrl = configData.token_endpoint || configData.token_url;
            if (tokenUrl) {
              const response = await fetch(tokenUrl, { method: 'HEAD' });
              testResult = { 
                success: response.status !== 404, 
                message: 'Token endpoint reachable' 
              };
            }
          }
        } catch (e) {
          testResult = { success: false, message: `Connection failed: ${e.message}` };
        }

        return new Response(JSON.stringify({ 
          success: true,
          test_result: testResult
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[sso-integration] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateSPMetadata(supabaseUrl: string, orgId: string): string {
  return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${supabaseUrl}/sso/saml/${orgId}">
  <SPSSODescriptor AuthnRequestsSigned="false" WantAssertionsSigned="true" protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${supabaseUrl}/functions/v1/sso-integration/saml/acs" index="0"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
}

function generateSAMLRequest(supabaseUrl: string, orgId: string): string {
  const id = `_${crypto.randomUUID()}`;
  const issueInstant = new Date().toISOString();
  const acsUrl = `${supabaseUrl}/functions/v1/sso-integration/saml/acs`;
  
  const request = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="${id}" Version="2.0" IssueInstant="${issueInstant}" AssertionConsumerServiceURL="${acsUrl}">
    <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${supabaseUrl}/sso/saml/${orgId}</saml:Issuer>
  </samlp:AuthnRequest>`;
  
  // In production, this would be deflated and base64 encoded
  return btoa(request);
}

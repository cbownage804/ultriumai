import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhiteLabelConfig {
  branding: {
    company_name: string;
    logo_url?: string;
    favicon_url?: string;
    primary_color: string;
    secondary_color: string;
    accent_color: string;
  };
  domain?: {
    custom_domain?: string;
    subdomain?: string;
  };
  email?: {
    from_name: string;
    from_email: string;
    reply_to?: string;
    footer_text?: string;
  };
  portal?: {
    welcome_message?: string;
    support_phone?: string;
    support_email?: string;
    enable_chat?: boolean;
  };
  features?: {
    hide_powered_by: boolean;
    custom_css?: string;
    custom_js?: string;
  };
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
    console.log(`[white-label-config] Action: ${action}`);

    switch (action) {
      case 'get_config': {
        const { org_id, user_id } = params;
        
        // Get existing config
        const { data: existingConfig } = await supabase
          .from('atlas_configurations')
          .select('*')
          .eq('configuration_type', 'white_label')
          .eq('organization_id', org_id)
          .eq('user_id', user_id)
          .single();

        if (existingConfig) {
          return new Response(JSON.stringify({ 
            success: true, 
            config: existingConfig.configuration_data as WhiteLabelConfig,
            config_id: existingConfig.id
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Return default config
        const defaultConfig: WhiteLabelConfig = {
          branding: {
            company_name: 'Vanguard',
            primary_color: '#0891b2',
            secondary_color: '#7c3aed',
            accent_color: '#10b981'
          },
          email: {
            from_name: 'Vanguard Support',
            from_email: 'support@vanguard.io'
          },
          portal: {
            welcome_message: 'Welcome to your support portal',
            enable_chat: true
          },
          features: {
            hide_powered_by: false
          }
        };

        return new Response(JSON.stringify({ 
          success: true, 
          config: defaultConfig,
          config_id: null
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'save_config': {
        const { org_id, user_id, config } = params;
        
        // Check for existing config
        const { data: existing } = await supabase
          .from('atlas_configurations')
          .select('id')
          .eq('configuration_type', 'white_label')
          .eq('organization_id', org_id)
          .eq('user_id', user_id)
          .single();

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('atlas_configurations')
            .update({
              configuration_data: config,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id);

          if (error) throw error;

          return new Response(JSON.stringify({ 
            success: true, 
            config_id: existing.id 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Create new config
        const { data: newConfig, error } = await supabase
          .from('atlas_configurations')
          .insert({
            user_id,
            organization_id: org_id,
            name: 'White Label Configuration',
            configuration_type: 'white_label',
            configuration_data: config,
            is_active: true
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          config_id: newConfig.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'upload_logo': {
        const { org_id, user_id, logo_base64, logo_type } = params;
        
        // Store logo reference in config (actual upload would go to storage bucket)
        const logoUrl = `data:image/${logo_type};base64,${logo_base64}`;
        
        // Get current config
        const { data: existing } = await supabase
          .from('atlas_configurations')
          .select('*')
          .eq('configuration_type', 'white_label')
          .eq('organization_id', org_id)
          .eq('user_id', user_id)
          .single();

        const currentConfig = (existing?.configuration_data as WhiteLabelConfig) || {
          branding: {
            company_name: 'Vanguard',
            primary_color: '#0891b2',
            secondary_color: '#7c3aed',
            accent_color: '#10b981'
          }
        };

        currentConfig.branding.logo_url = logoUrl;

        if (existing) {
          await supabase
            .from('atlas_configurations')
            .update({ configuration_data: currentConfig })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('atlas_configurations')
            .insert({
              user_id,
              organization_id: org_id,
              name: 'White Label Configuration',
              configuration_type: 'white_label',
              configuration_data: currentConfig,
              is_active: true
            });
        }

        return new Response(JSON.stringify({ 
          success: true, 
          logo_url: logoUrl 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'preview_portal': {
        const { config } = params;
        
        // Generate preview HTML
        const previewHtml = generatePortalPreview(config);

        return new Response(JSON.stringify({ 
          success: true, 
          preview_html: previewHtml 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'generate_css': {
        const { config } = params;
        
        const css = generateCustomCSS(config);

        return new Response(JSON.stringify({ 
          success: true, 
          css 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[white-label-config] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

function generateCustomCSS(config: WhiteLabelConfig): string {
  const { branding } = config;
  return `
:root {
  --wl-primary: ${branding.primary_color};
  --wl-secondary: ${branding.secondary_color};
  --wl-accent: ${branding.accent_color};
}

.wl-brand-primary {
  color: var(--wl-primary);
}

.wl-brand-bg {
  background: linear-gradient(135deg, var(--wl-primary), var(--wl-secondary));
}

.wl-brand-button {
  background-color: var(--wl-primary);
  color: white;
  transition: all 0.2s;
}

.wl-brand-button:hover {
  background-color: var(--wl-secondary);
}
${config.features?.custom_css || ''}
  `.trim();
}

function generatePortalPreview(config: WhiteLabelConfig): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    ${generateCustomCSS(config)}
    body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
    .header { padding: 20px; background: linear-gradient(135deg, ${config.branding.primary_color}, ${config.branding.secondary_color}); color: white; border-radius: 8px; }
    .logo { font-size: 24px; font-weight: bold; }
    .welcome { margin-top: 20px; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .button { display: inline-block; padding: 10px 20px; background: ${config.branding.primary_color}; color: white; border-radius: 6px; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">${config.branding.company_name}</div>
  </div>
  <div class="welcome">
    <h2>${config.portal?.welcome_message || 'Welcome to your support portal'}</h2>
    <p>Submit tickets, track progress, and access your resources.</p>
    <a href="#" class="button">Create Ticket</a>
  </div>
</body>
</html>
  `.trim();
}

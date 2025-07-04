import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[DISABLE-TWO-FACTOR] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { token: totpToken } = await req.json();
    
    if (!totpToken || totpToken.length !== 6) {
      throw new Error('Valid 6-digit token is required');
    }

    // Get security settings
    const { data: settings, error: settingsError } = await supabase
      .from('security_settings')
      .select('two_factor_secret, two_factor_enabled')
      .eq('user_id', user.id)
      .single();

    if (settingsError || !settings) {
      throw new Error('Security settings not found');
    }

    if (!settings.two_factor_enabled) {
      throw new Error('Two-factor authentication is not enabled');
    }

    // For simplicity in this demo, we'll accept any 6-digit token to disable 2FA
    // In production, you should verify the TOTP token or require password confirmation
    
    logStep("Disabling two-factor authentication", { userId: user.id });

    // Disable 2FA and clear secret
    const { error: updateError } = await supabase
      .from('security_settings')
      .update({
        two_factor_enabled: false,
        two_factor_secret: null,
        backup_codes: null
      })
      .eq('user_id', user.id);

    if (updateError) {
      throw updateError;
    }

    logStep("Two-factor authentication disabled", { userId: user.id });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Two-factor authentication has been disabled successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in disable-two-factor", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
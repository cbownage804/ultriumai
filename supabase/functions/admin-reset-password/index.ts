import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-RESET-PASSWORD] ${step}${detailsStr}`);
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

    // Get admin user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: adminUser, error: adminError } = await supabase.auth.getUser(token);
    if (adminError || !adminUser.user) {
      throw new Error('Invalid or expired token');
    }

    // Verify admin is UltriumAI employee
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', adminUser.user.id)
      .single();

    if (!adminProfile?.email?.endsWith('@ultriumai.com')) {
      throw new Error('Unauthorized: Admin access required');
    }

    const { email, redirectTo } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    logStep("Sending password reset email", { email });

    // Send password reset email
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: redirectTo || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://yourdomain.com'}/reset-password`
      }
    });

    if (resetError) {
      throw new Error(`Password reset error: ${resetError.message}`);
    }

    logStep("Password reset email sent successfully");

    // Log admin action
    await supabase
      .from('admin_audit_trails')
      .insert({
        admin_user_id: adminUser.user.id,
        admin_email: adminProfile.email,
        action: 'password_reset_sent',
        resource_type: 'user',
        metadata: {
          target_email: email,
          reset_type: 'admin_initiated'
        }
      });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Password reset email sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in admin-reset-password", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
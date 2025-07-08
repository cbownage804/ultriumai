import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-RESEND-WELCOME] ${step}${detailsStr}`);
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

    const { userId, email, name } = await req.json();

    if (!userId && !email) {
      throw new Error('Either userId or email is required');
    }

    let targetUser;
    if (userId) {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      targetUser = userData;
    } else {
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      targetUser = userData;
    }

    if (!targetUser) {
      throw new Error('User not found');
    }

    logStep("Sending welcome email to user", { email: targetUser.email });

    // Call the send-welcome-email function
    const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
      body: {
        email: targetUser.email,
        name: name || targetUser.full_name || targetUser.email,
        userId: targetUser.id
      }
    });

    if (emailError) {
      throw new Error(`Welcome email error: ${emailError.message}`);
    }

    logStep("Welcome email sent successfully");

    // Log admin action
    await supabase
      .from('admin_audit_trails')
      .insert({
        admin_user_id: adminUser.user.id,
        admin_email: adminProfile.email,
        action: 'welcome_email_resent',
        resource_type: 'user',
        resource_id: targetUser.id,
        metadata: {
          target_email: targetUser.email,
          target_user_name: targetUser.full_name
        }
      });

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Welcome email sent successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in admin-resend-welcome", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
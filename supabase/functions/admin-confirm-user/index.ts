import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-CONFIRM-USER] ${step}${detailsStr}`);
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

    const { email } = await req.json();

    if (!email) {
      throw new Error('Email is required');
    }

    logStep("Confirming user email", { email });

    // Get all users and find the one with the matching email
    const { data: listResult, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`);
    }

    const targetUser = listResult.users.find((user: any) => user.email === email);
    if (!targetUser) {
      throw new Error(`User with email ${email} not found`);
    }

    // Confirm the user's email
    const { data: updateResult, error: updateError } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { email_confirm: true }
    );

    if (updateError) {
      throw new Error(`User confirmation error: ${updateError.message}`);
    }

    logStep("User email confirmed successfully", { userId: targetUser.id });

    // Log admin action
    await supabase
      .from('admin_audit_trails')
      .insert({
        admin_user_id: adminUser.user.id,
        admin_email: adminProfile.email,
        action: 'user_email_confirmed',
        resource_type: 'user',
        resource_id: targetUser.id,
        metadata: {
          target_email: email,
          confirmation_method: 'admin_manual'
        }
      });

    return new Response(JSON.stringify({ 
      success: true,
      message: `User ${email} email confirmed successfully`,
      userId: targetUser.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in admin-confirm-user", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
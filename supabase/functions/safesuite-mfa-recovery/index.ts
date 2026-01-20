import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MFARecoveryRequest {
  action: 'request_reset' | 'complete_reset';
  email?: string;
  token?: string;
  redirectTo?: string;
}

const logStep = (step: string, details?: any) => {
  console.log(`[MFA-RECOVERY] ${step}`, details ? JSON.stringify(details) : '');
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const request: MFARecoveryRequest = await req.json();
    logStep('Request received', { action: request.action });

    switch (request.action) {
      case 'request_reset': {
        if (!request.email) {
          throw new Error('Email is required');
        }

        logStep('Processing MFA reset request', { email: request.email });

        // Find user by email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
        if (userError) throw userError;

        const targetUser = userData.users.find(u => u.email === request.email);
        if (!targetUser) {
          // Don't reveal if user exists - just say we sent an email
          logStep('User not found, returning success anyway for security');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'If an account exists with this email, you will receive recovery instructions.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if user has MFA enabled
        const { data: factors, error: factorError } = await supabaseAdmin.auth.admin.mfa.listFactors({
          userId: targetUser.id
        });

        if (factorError) {
          logStep('Error listing MFA factors', { error: factorError.message });
        }

        const hasActiveMFA = factors?.totp?.some(f => f.status === 'verified') || false;
        
        if (!hasActiveMFA) {
          logStep('User has no active MFA');
          return new Response(JSON.stringify({ 
            success: true, 
            message: 'If an account exists with this email, you will receive recovery instructions.' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Send a password recovery email - when user clicks it and is authenticated,
        // they can request MFA reset from settings
        // Alternatively, for immediate reset, we could reset MFA here
        // For security, we'll use the password recovery flow which verifies email ownership
        const { error: resetError } = await supabaseAdmin.auth.admin.generateLink({
          type: 'recovery',
          email: request.email,
          options: {
            redirectTo: request.redirectTo || `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://safesuite.ultriumai.com'}/auth/mfa-recovery-complete`
          }
        });

        if (resetError) {
          logStep('Error generating recovery link', { error: resetError.message });
          // Don't expose errors
        }

        // Log the MFA recovery request
        await supabaseAdmin.from('audit_logs').insert({
          action: 'mfa_recovery_requested',
          resource_type: 'user',
          resource_id: targetUser.id,
          details: {
            email: request.email,
            timestamp: new Date().toISOString()
          }
        });

        logStep('MFA recovery request processed');

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'If an account exists with this email, you will receive recovery instructions.' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'complete_reset': {
        // This action is called when user has verified their email and wants to reset MFA
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
          throw new Error('Authorization required');
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
        
        if (authError || !user) {
          throw new Error('Invalid session');
        }

        logStep('Completing MFA reset for user', { userId: user.id });

        // List and delete all MFA factors
        const { data: factors, error: factorError } = await supabaseAdmin.auth.admin.mfa.listFactors({
          userId: user.id
        });

        if (factorError) {
          throw new Error(`Failed to list MFA factors: ${factorError.message}`);
        }

        let deletedCount = 0;
        if (factors?.totp) {
          for (const factor of factors.totp) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
              userId: user.id,
              factorId: factor.id
            });
            if (!deleteError) {
              deletedCount++;
              logStep('Deleted MFA factor', { factorId: factor.id });
            }
          }
        }

        // Log the MFA reset
        await supabaseAdmin.from('audit_logs').insert({
          user_id: user.id,
          action: 'mfa_reset_self_service',
          resource_type: 'user',
          resource_id: user.id,
          details: {
            factors_deleted: deletedCount,
            timestamp: new Date().toISOString()
          }
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'MFA has been reset. You can now set up a new authenticator.',
          factorsDeleted: deletedCount
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

  } catch (error: any) {
    logStep('ERROR', { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

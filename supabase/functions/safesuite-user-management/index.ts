import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface UserManagementRequest {
  action: 'reset_mfa' | 'toggle_status' | 'resend_invite' | 'invite_user'
  userId?: string
  email?: string
  fullName?: string
  role?: string
  enabled?: boolean
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SAFESUITE-USER-MGMT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the request is from an authenticated user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      logStep("Authentication failed", { error: authError?.message });
      throw new Error('Unauthorized')
    }

    logStep("Authenticated user", { userId: user.id, email: user.email });

    const requestData: UserManagementRequest = await req.json()
    logStep("Request data", { action: requestData.action });

    switch (requestData.action) {
      case 'reset_mfa': {
        if (!requestData.userId) {
          throw new Error('User ID required for MFA reset')
        }

        logStep("Resetting MFA for user", { targetUserId: requestData.userId });

        // Get user factors (MFA enrollments)
        const { data: factorsData, error: factorsError } = await supabaseAdmin.auth.admin.mfa.listFactors({
          userId: requestData.userId
        })

        if (factorsError) {
          logStep("Error listing MFA factors", { error: factorsError.message });
          throw new Error(`Failed to list MFA factors: ${factorsError.message}`)
        }

        // Delete all MFA factors for the user
        if (factorsData?.factors && factorsData.factors.length > 0) {
          for (const factor of factorsData.factors) {
            const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
              userId: requestData.userId,
              factorId: factor.id
            })

            if (deleteError) {
              logStep("Error deleting factor", { factorId: factor.id, error: deleteError.message });
            } else {
              logStep("Deleted MFA factor", { factorId: factor.id });
            }
          }
        }

        // Update user metadata to clear MFA requirement if set
        await supabaseAdmin.auth.admin.updateUserById(requestData.userId, {
          user_metadata: {
            mfa_verified: false
          }
        })

        logStep("MFA reset complete");

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'MFA has been reset. User will need to set up MFA again.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'toggle_status': {
        if (!requestData.userId) {
          throw new Error('User ID required for status toggle')
        }

        const newStatus = requestData.enabled ?? false;
        logStep("Toggling user status", { targetUserId: requestData.userId, enabled: newStatus });

        if (newStatus) {
          // Unban user
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            requestData.userId,
            { ban_duration: 'none' }
          )

          if (updateError) {
            throw new Error(`Failed to activate user: ${updateError.message}`)
          }
        } else {
          // Ban user (effectively deactivate)
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            requestData.userId,
            { ban_duration: '87600h' } // Ban for 10 years (effectively permanent)
          )

          if (updateError) {
            throw new Error(`Failed to deactivate user: ${updateError.message}`)
          }
        }

        logStep("Status toggle complete", { enabled: newStatus });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `User ${newStatus ? 'activated' : 'deactivated'} successfully`
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'resend_invite': {
        if (!requestData.email) {
          throw new Error('Email required for resending invite')
        }

        logStep("Resending invite", { email: requestData.email });

        const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          requestData.email,
          {
            redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/auth/callback`
          }
        )

        if (inviteError) {
          logStep("Invite error", { error: inviteError.message });
          throw new Error(`Failed to send invitation: ${inviteError.message}`)
        }

        logStep("Invite sent successfully");

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'Invitation email sent successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'invite_user': {
        if (!requestData.email || !requestData.fullName) {
          throw new Error('Email and full name required for inviting user')
        }

        logStep("Inviting new user", { email: requestData.email, fullName: requestData.fullName });

        // Create user with invite
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
          requestData.email,
          {
            data: {
              full_name: requestData.fullName,
              role: requestData.role || 'user'
            },
            redirectTo: `${supabaseUrl.replace('.supabase.co', '')}/auth/callback`
          }
        )

        if (createError) {
          logStep("Create user error", { error: createError.message });
          throw new Error(`Failed to invite user: ${createError.message}`)
        }

        logStep("User invited successfully", { userId: newUser?.user?.id });

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User invitation sent successfully',
            user: newUser?.user ? {
              id: newUser.user.id,
              email: newUser.user.email
            } : null
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    logStep("Error", { message: error.message });
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

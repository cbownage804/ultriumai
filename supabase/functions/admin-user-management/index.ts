import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CreateUserRequest {
  action: 'create_user' | 'reset_password' | 'toggle_mfa' | 'update_user_status'
  clientId: string
  email?: string
  fullName?: string
  role?: 'client_admin' | 'client_staff' | 'client_viewer'
  requireMfa?: boolean
  sendInvite?: boolean
  userId?: string
  enabled?: boolean
}

serve(async (req) => {
  console.log('Admin user management function called')

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Verify the request is from an authenticated MSP user
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    console.log('Authenticated user:', user.id)

    const requestData: CreateUserRequest = await req.json()
    console.log('Request data:', requestData)

    // Verify the user is an MSP owner for the specified client
    const { data: mspData, error: mspError } = await supabaseAdmin
      .from('msp_clients')
      .select(`
        id,
        msp_id,
        msps!inner(user_id)
      `)
      .eq('id', requestData.clientId)
      .eq('msps.user_id', user.id)
      .single()

    if (mspError || !mspData) {
      console.error('MSP verification failed:', mspError)
      throw new Error('Client not found or access denied')
    }

    console.log('MSP verification successful')

    switch (requestData.action) {
      case 'create_user': {
        if (!requestData.email || !requestData.fullName || !requestData.role) {
          throw new Error('Missing required fields for user creation')
        }

        console.log('Creating new user:', requestData.email)

        // Create user in auth system
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: requestData.email,
          email_confirm: !requestData.sendInvite, // Auto-confirm if not sending invite
          user_metadata: {
            full_name: requestData.fullName,
            client_id: requestData.clientId,
            role: requestData.role,
            mfa_required: requestData.requireMfa || false
          }
        })

        if (createError) {
          console.error('User creation failed:', createError)
          throw new Error(`Failed to create user: ${createError.message}`)
        }

        console.log('User created successfully:', newUser.user?.id)

        // Add user to client_users table
        const { error: clientUserError } = await supabaseAdmin
          .from('client_users')
          .insert({
            user_id: newUser.user!.id,
            client_id: requestData.clientId,
            role: requestData.role,
            is_active: true
          })

        if (clientUserError) {
          console.error('Failed to create client_users record:', clientUserError)
          // Cleanup - delete the auth user if client_users creation failed
          await supabaseAdmin.auth.admin.deleteUser(newUser.user!.id)
          throw new Error('Failed to create client user record')
        }

        // Send invitation email if requested
        if (requestData.sendInvite) {
          const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
            requestData.email,
            {
              redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
            }
          )

          if (inviteError) {
            console.error('Failed to send invitation:', inviteError)
            // Don't fail the entire operation for invite errors
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            user: {
              id: newUser.user!.id,
              email: newUser.user!.email,
              full_name: requestData.fullName,
              role: requestData.role
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'reset_password': {
        if (!requestData.userId) {
          throw new Error('User ID required for password reset')
        }

        console.log('Sending password reset for user:', requestData.userId)

        // Get user email
        const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(requestData.userId)
        
        if (userError || !userData.user) {
          throw new Error('User not found')
        }

        // Send password reset email
        const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(
          userData.user.email!,
          {
            redirectTo: `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify`
          }
        )

        if (resetError) {
          throw new Error(`Failed to send password reset: ${resetError.message}`)
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Password reset email sent' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'toggle_mfa': {
        if (!requestData.userId) {
          throw new Error('User ID required for MFA toggle')
        }

        console.log('Toggling MFA for user:', requestData.userId)

        // Update user metadata to require/not require MFA
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          requestData.userId,
          {
            user_metadata: {
              mfa_required: requestData.requireMfa
            }
          }
        )

        if (updateError) {
          throw new Error(`Failed to update MFA settings: ${updateError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `MFA ${requestData.requireMfa ? 'enabled' : 'disabled'}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'update_user_status': {
        if (!requestData.userId) {
          throw new Error('User ID required for status update')
        }

        console.log('Updating user status:', requestData.userId, requestData.enabled)

        // Update client_users record
        const { error: updateError } = await supabaseAdmin
          .from('client_users')
          .update({ is_active: requestData.enabled })
          .eq('user_id', requestData.userId)

        if (updateError) {
          throw new Error(`Failed to update user status: ${updateError.message}`)
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `User ${requestData.enabled ? 'enabled' : 'disabled'}` 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }

  } catch (error) {
    console.error('Error in admin-user-management function:', error)
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
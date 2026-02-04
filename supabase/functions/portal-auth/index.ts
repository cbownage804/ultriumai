import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-portal-session",
};

interface LoginRequest {
  email: string;
  password: string;
}

interface ChangePasswordRequest {
  portalUserId: string;
  currentPassword: string;
  newPassword: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

interface RequestResetRequest {
  email: string;
}

interface UpdateProfileRequest {
  portalUserId: string;
  fullName?: string;
  phone?: string;
  preferences?: {
    emailNotifications?: boolean;
    ticketUpdates?: boolean;
    maintenanceAlerts?: boolean;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PORTAL-AUTH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'login';
    logStep(`Action: ${action}`);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const body = await req.json();
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip');
    const userAgent = req.headers.get('user-agent');

    switch (action) {
      case 'login':
        return await handleLogin(supabaseClient, body as LoginRequest, clientIp, userAgent);
      case 'change-password':
        return await handleChangePassword(supabaseClient, body as ChangePasswordRequest);
      case 'request-reset':
        return await handleRequestReset(supabaseClient, body as RequestResetRequest);
      case 'reset-password':
        return await handleResetPassword(supabaseClient, body as ResetPasswordRequest);
      case 'validate-session':
        return await handleValidateSession(supabaseClient, body.sessionToken);
      case 'agent-login':
        return await handleAgentLogin(supabaseClient, body, clientIp, userAgent);
      case 'update-profile':
        return await handleUpdateProfile(supabaseClient, body as UpdateProfileRequest);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleLogin(
  supabase: any, 
  { email, password }: LoginRequest,
  clientIp: string | null,
  userAgent: string | null
) {
  logStep("Login attempt", { email });

  // Find portal user
  const { data: portalUser, error: userError } = await supabase
    .from('client_portal_users')
    .select('*, client_contacts!inner(portal_role, can_view_all_company_tickets, client_id)')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  if (userError || !portalUser) {
    logStep("User not found or inactive", { email });
    return new Response(JSON.stringify({ error: "Invalid email or password" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // Check if account is locked
  if (portalUser.locked_until && new Date(portalUser.locked_until) > new Date()) {
    const lockedUntil = new Date(portalUser.locked_until);
    return new Response(JSON.stringify({ 
      error: `Account locked. Try again after ${lockedUntil.toLocaleTimeString()}` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 423,
    });
  }

  // Check password (temporary or hashed)
  let isValidPassword = false;
  
  if (portalUser.temporary_password && password === portalUser.temporary_password) {
    isValidPassword = true;
  } else if (portalUser.password_hash) {
    isValidPassword = await bcrypt.compare(password, portalUser.password_hash);
  }

  if (!isValidPassword) {
    // Increment failed attempts
    const failedAttempts = (portalUser.failed_login_attempts || 0) + 1;
    const updates: any = { failed_login_attempts: failedAttempts };
    
    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      updates.locked_until = lockUntil.toISOString();
    }

    await supabase
      .from('client_portal_users')
      .update(updates)
      .eq('id', portalUser.id);

    logStep("Invalid password", { email, failedAttempts });
    return new Response(JSON.stringify({ error: "Invalid email or password" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  // Generate session token
  const sessionToken = crypto.randomUUID() + '-' + crypto.randomUUID() + '-' + Date.now();

  // Update login stats
  await supabase
    .from('client_portal_users')
    .update({
      last_login_at: new Date().toISOString(),
      login_count: (portalUser.login_count || 0) + 1,
      failed_login_attempts: 0,
      locked_until: null
    })
    .eq('id', portalUser.id);

  // Log activity
  await supabase.rpc('log_portal_activity', {
    p_portal_user_id: portalUser.id,
    p_activity_type: 'login',
    p_activity_details: { method: 'password' },
    p_ip_address: clientIp,
    p_user_agent: userAgent
  });

  // Get SafeSuite settings for the company
  const { data: safeSuiteSettings } = await supabase
    .from('company_safesuite_settings')
    .select('*')
    .eq('client_id', portalUser.client_contacts.client_id)
    .single();

  logStep("Login successful", { portalUserId: portalUser.id });

  return new Response(JSON.stringify({
    success: true,
    sessionToken,
    user: {
      id: portalUser.id,
      email: portalUser.email,
      fullName: portalUser.full_name,
      role: portalUser.client_contacts.portal_role || 'user',
      canViewAllTickets: portalUser.client_contacts.can_view_all_company_tickets,
      clientId: portalUser.client_id,
      mustChangePassword: portalUser.must_change_password
    },
    safeSuiteAccess: safeSuiteSettings || {
      safepass_enabled: false,
      safescan_enabled: false,
      safeweb_enabled: false,
      safetrack_enabled: false
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleChangePassword(
  supabase: any,
  { portalUserId, currentPassword, newPassword }: ChangePasswordRequest
) {
  logStep("Change password", { portalUserId });

  const { data: portalUser, error } = await supabase
    .from('client_portal_users')
    .select('*')
    .eq('id', portalUserId)
    .single();

  if (error || !portalUser) {
    throw new Error("User not found");
  }

  // Verify current password
  let isValidPassword = false;
  if (portalUser.temporary_password && currentPassword === portalUser.temporary_password) {
    isValidPassword = true;
  } else if (portalUser.password_hash) {
    isValidPassword = await bcrypt.compare(currentPassword, portalUser.password_hash);
  }

  if (!isValidPassword) {
    return new Response(JSON.stringify({ error: "Current password is incorrect" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Validate new password strength
  if (newPassword.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword);

  // Update password
  await supabase
    .from('client_portal_users')
    .update({
      password_hash: passwordHash,
      temporary_password: null,
      must_change_password: false
    })
    .eq('id', portalUserId);

  logStep("Password changed successfully", { portalUserId });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleRequestReset(supabase: any, { email }: RequestResetRequest) {
  logStep("Password reset requested", { email });

  const { data: portalUser } = await supabase
    .from('client_portal_users')
    .select('id, full_name, email')
    .eq('email', email.toLowerCase())
    .eq('is_active', true)
    .single();

  // Always return success to prevent email enumeration
  if (!portalUser) {
    logStep("User not found for reset", { email });
    return new Response(JSON.stringify({ 
      success: true, 
      message: "If an account exists with that email, a reset link will be sent." 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  // Generate reset token
  const resetToken = crypto.randomUUID() + '-' + crypto.randomUUID();
  const tokenHash = await hashToken(resetToken);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  // Store token
  await supabase
    .from('portal_password_reset_tokens')
    .insert({
      portal_user_id: portalUser.id,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString()
    });

  // Send reset email using Resend
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const resetUrl = `https://ultriumai.com/customer-portal/reset-password?token=${resetToken}`;
      
      await resend.emails.send({
        from: 'Ultrium Support <hello@send.ultriumai.com>',
        to: [portalUser.email],
        subject: 'Reset Your Password',
        html: generateResetEmail(portalUser.full_name, resetUrl, expiresAt)
      });
      
      logStep("Reset email sent", { portalUserId: portalUser.id });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }
  }

  logStep("Reset token generated", { portalUserId: portalUser.id });

  return new Response(JSON.stringify({ 
    success: true, 
    message: "If an account exists with that email, a reset link will be sent."
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleResetPassword(supabase: any, { token, newPassword }: ResetPasswordRequest) {
  logStep("Resetting password with token");

  const tokenHash = await hashToken(token);

  // Find valid token
  const { data: resetToken, error } = await supabase
    .from('portal_password_reset_tokens')
    .select('*, client_portal_users(id)')
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !resetToken) {
    return new Response(JSON.stringify({ error: "Invalid or expired reset token" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Hash and update password
  const passwordHash = await bcrypt.hash(newPassword);
  
  await supabase
    .from('client_portal_users')
    .update({
      password_hash: passwordHash,
      temporary_password: null,
      must_change_password: false
    })
    .eq('id', resetToken.portal_user_id);

  // Mark token as used
  await supabase
    .from('portal_password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', resetToken.id);

  logStep("Password reset successful", { portalUserId: resetToken.portal_user_id });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleValidateSession(supabase: any, sessionToken: string) {
  // In production, you'd validate against a sessions table
  // For now, return basic validation
  if (!sessionToken) {
    return new Response(JSON.stringify({ valid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 401,
    });
  }

  return new Response(JSON.stringify({ valid: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Agent login - for Windows/Mac tray app
async function handleAgentLogin(
  supabase: any,
  body: { email: string; password: string; deviceInfo?: any },
  clientIp: string | null,
  userAgent: string | null
) {
  logStep("Agent login attempt", { email: body.email });
  const email = body.email?.toLowerCase().trim();
  
  // First, check if this is an MSP admin account (exists in auth.users)
  const { data: authUser } = await supabase.auth.admin.getUserByEmail(email);
  
  if (authUser?.user) {
    // This is an MSP admin - they should use the main dashboard
    logStep("MSP admin attempted portal login", { email });
    return new Response(JSON.stringify({ 
      error: "MSP_ADMIN_ACCOUNT",
      message: "This is an MSP administrator account. Please use the Vanguard dashboard at ultriumai.com/vanguard to manage your clients. The Customer Portal is for end-user clients only."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }
  
  // Not an admin, proceed with portal login
  const loginResult = await handleLogin(supabase, { email: body.email, password: body.password }, clientIp, userAgent);
  const loginData = await loginResult.json();
  
  if (loginResult.status !== 200) {
    return new Response(JSON.stringify(loginData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: loginResult.status,
    });
  }
  
  // Return additional data for agent
  return new Response(JSON.stringify({
    ...loginData,
    agentConfig: {
      portalUrl: "https://ultriumai.com/customer-portal",
      refreshInterval: 3600, // 1 hour
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function handleUpdateProfile(
  supabase: any,
  { portalUserId, fullName, phone, preferences }: UpdateProfileRequest
) {
  logStep("Update profile", { portalUserId });

  if (!portalUserId) {
    return new Response(JSON.stringify({ error: "Portal user ID required" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Build update object
  const updates: Record<string, any> = {};
  if (fullName !== undefined) updates.full_name = fullName;
  if (phone !== undefined) updates.phone = phone;
  if (preferences !== undefined) updates.notification_preferences = preferences;

  if (Object.keys(updates).length === 0) {
    return new Response(JSON.stringify({ success: true, message: "No changes" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }

  const { error } = await supabase
    .from('client_portal_users')
    .update(updates)
    .eq('id', portalUserId);

  if (error) {
    logStep("Profile update failed", { error: error.message });
    return new Response(JSON.stringify({ error: "Failed to update profile" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  // Also update the linked client_contacts record if fullName changed
  if (fullName) {
    const { data: portalUser } = await supabase
      .from('client_portal_users')
      .select('contact_id')
      .eq('id', portalUserId)
      .single();

    if (portalUser?.contact_id) {
      await supabase
        .from('client_contacts')
        .update({ name: fullName })
        .eq('id', portalUser.contact_id);
    }
  }

  logStep("Profile updated successfully", { portalUserId });

  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

function generateResetEmail(name: string, resetUrl: string, expiresAt: Date): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #0891b2; margin-bottom: 10px;">Reset Your Password</h1>
        </div>

        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        
        <p>We received a request to reset your password. Click the button below to set a new password:</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #0891b2, #9333ea); color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
            Reset Password →
          </a>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            ⏰ This link expires on ${expiresAt.toLocaleDateString()} at ${expiresAt.toLocaleTimeString()}.
          </p>
        </div>

        <p style="color: #666; font-size: 14px; margin-top: 25px;">
          If you didn't request this password reset, you can safely ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; color: #999; font-size: 13px;">
          <p>Ultrium Vanguard • Secure Customer Portal</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

interface ResetRequest {
  action: "check_mfa" | "request" | "verify" | "reset";
  email?: string;
  mfaCode?: string;
  token?: string;
  newPassword?: string;
}

// TOTP verification utilities
const hmacSha1 = async (key: Uint8Array, data: Uint8Array): Promise<Uint8Array> => {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return new Uint8Array(signature);
};

const base32Decode = (encoded: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of encoded.toUpperCase()) {
    const index = alphabet.indexOf(char);
    if (index === -1) continue;
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) {
      bytes.push(parseInt(byte, 2));
    }
  }
  return new Uint8Array(bytes);
};

const verifyTOTP = async (secret: string, token: string): Promise<boolean> => {
  const timeStep = 30;
  const currentTime = Math.floor(Date.now() / 1000 / timeStep);
  
  for (let i = -1; i <= 1; i++) {
    const timeBytes = new Uint8Array(8);
    let time = currentTime + i;
    for (let j = 7; j >= 0; j--) {
      timeBytes[j] = time & 0xff;
      time = Math.floor(time / 256);
    }
    const secretBytes = base32Decode(secret);
    const hash = await hmacSha1(secretBytes, timeBytes);
    const offset = hash[hash.length - 1] & 0xf;
    const code = (
      ((hash[offset] & 0x7f) << 24) |
      ((hash[offset + 1] & 0xff) << 16) |
      ((hash[offset + 2] & 0xff) << 8) |
      (hash[offset + 3] & 0xff)
    ) % 1000000;
    if (code.toString().padStart(6, '0') === token) {
      return true;
    }
  }
  return false;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { action, email, mfaCode, token, newPassword }: ResetRequest = await req.json();

    // Check if MFA is enabled for a user (before full reset request)
    if (action === "check_mfa") {
      if (!email) {
        throw new Error("Email is required");
      }

      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) throw userError;
      
      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Don't reveal if user exists - but require MFA anyway for security
        return new Response(
          JSON.stringify({ mfaRequired: true, mfaEnabled: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has MFA enabled
      const { data: securitySettings } = await supabaseAdmin
        .from('security_settings')
        .select('two_factor_enabled, two_factor_secret')
        .eq('user_id', user.id)
        .single();

      const mfaEnabled = securitySettings?.two_factor_enabled === true && !!securitySettings?.two_factor_secret;

      return new Response(
        JSON.stringify({ mfaRequired: true, mfaEnabled }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "request") {
      // Request a password reset - REQUIRES MFA verification
      if (!email) {
        throw new Error("Email is required");
      }

      if (!mfaCode || mfaCode.length !== 6) {
        throw new Error("Valid 6-digit MFA code is required");
      }

      // Find user by email
      const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
      if (userError) throw userError;
      
      const user = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!user) {
        // Don't reveal if user exists
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists with MFA enabled, a reset email has been sent." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check if user has a master password
      const { data: masterPwd } = await supabaseAdmin
        .from('safepass_master_passwords')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!masterPwd) {
        return new Response(
          JSON.stringify({ success: true, message: "If an account exists with MFA enabled, a reset email has been sent." }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // CRITICAL: Verify MFA code before proceeding
      const { data: securitySettings } = await supabaseAdmin
        .from('security_settings')
        .select('two_factor_enabled, two_factor_secret')
        .eq('user_id', user.id)
        .single();

      if (!securitySettings?.two_factor_enabled || !securitySettings?.two_factor_secret) {
        // User MUST have MFA enabled to reset master password
        throw new Error("MFA is not enabled on this account. All accounts require MFA for master password reset.");
      }

      // Verify the MFA code
      const isMfaValid = await verifyTOTP(securitySettings.two_factor_secret, mfaCode);
      if (!isMfaValid) {
        throw new Error("Invalid MFA code. Please check your authenticator app.");
      }

      // MFA verified - generate secure token
      const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
      const resetToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token
      await supabaseAdmin
        .from('safepass_master_passwords')
        .update({
          reset_token: resetToken,
          reset_token_expires_at: expiresAt.toISOString()
        })
        .eq('user_id', user.id);

      // Send email
      const origin = req.headers.get("origin") || "https://safesuite.ultriumai.com";
      const resetUrl = `${origin}/pass/reset-master-password?token=${resetToken}`;

      await resend.emails.send({
        from: "SafePass Security <noreply@ultriumai.com>",
        to: [email],
        subject: "Reset Your SafePass Master Password",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b;">SafePass Master Password Reset</h1>
            <p>You requested to reset your SafePass master password.</p>
            <p style="color: #10b981;"><strong>✓ MFA verification completed successfully</strong></p>
            
            <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
              <strong>⚠️ Important Warning</strong>
              <p style="margin: 8px 0 0 0;">Resetting your master password will <strong>permanently delete all your encrypted vault data</strong>. This includes all saved passwords, cards, notes, and identities.</p>
              <p style="margin: 8px 0 0 0;">This action cannot be undone because SafePass uses zero-knowledge encryption.</p>
            </div>
            
            <p><a href="${resetUrl}" style="display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Reset Master Password</a></p>
            
            <p style="color: #666; font-size: 14px;">This link expires in 1 hour.</p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, please check your account security immediately.</p>
          </div>
        `,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Reset email sent. Check your inbox." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify") {
      // Verify token is valid
      if (!token) {
        throw new Error("Token is required");
      }

      const { data: pwdData, error } = await supabaseAdmin
        .from('safepass_master_passwords')
        .select('user_id, reset_token_expires_at')
        .eq('reset_token', token)
        .single();

      if (error || !pwdData) {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid or expired token" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      if (new Date(pwdData.reset_token_expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: "Token has expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      return new Response(
        JSON.stringify({ valid: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "reset") {
      // Execute the reset
      if (!token || !newPassword) {
        throw new Error("Token and new password are required");
      }

      // Verify token again
      const { data: pwdData, error } = await supabaseAdmin
        .from('safepass_master_passwords')
        .select('user_id, reset_token_expires_at')
        .eq('reset_token', token)
        .single();

      if (error || !pwdData) {
        throw new Error("Invalid or expired token");
      }

      if (new Date(pwdData.reset_token_expires_at) < new Date()) {
        throw new Error("Token has expired");
      }

      const userId = pwdData.user_id;

      // Generate new salt
      const saltBytes = crypto.getRandomValues(new Uint8Array(32));
      const newSalt = btoa(String.fromCharCode(...saltBytes));

      // Hash the new password with PBKDF2
      const encoder = new TextEncoder();
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(newPassword),
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const hashBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: 600000, hash: 'SHA-256' },
        keyMaterial,
        256
      );
      const newHash = btoa(String.fromCharCode(...new Uint8Array(hashBits)));

      // Delete all encrypted vault data (zero-knowledge = unrecoverable)
      await supabaseAdmin.from('safepass_entries').delete().eq('user_id', userId);
      await supabaseAdmin.from('safepass_cards').delete().eq('user_id', userId);
      await supabaseAdmin.from('safepass_notes').delete().eq('user_id', userId);
      await supabaseAdmin.from('safepass_identities').delete().eq('user_id', userId);
      await supabaseAdmin.from('safepass_totp_codes').delete().eq('user_id', userId);

      // Update master password with new hash/salt
      await supabaseAdmin
        .from('safepass_master_passwords')
        .update({
          password_hash: newHash,
          salt: newSalt,
          reset_token: null,
          reset_token_expires_at: null
        })
        .eq('user_id', userId);

      // Clear unlock attempts
      await supabaseAdmin
        .from('safepass_unlock_attempts')
        .delete()
        .eq('user_id', userId);

      return new Response(
        JSON.stringify({ success: true, message: "Master password has been reset. Your vault is now empty." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Error in safepass-reset-master-password:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
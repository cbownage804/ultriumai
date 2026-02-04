import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  client_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'user' | 'readonly';
  permissions?: Record<string, boolean>;
}

interface ResendInviteRequest {
  invitation_id: string;
}

interface ResetMFARequest {
  portal_user_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Verify caller is authenticated
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // =========================================
    // ACTION: Create new invitation
    // =========================================
    if (action === "invite") {
      const body: InviteRequest = await req.json();
      const { client_id, email, full_name, role, permissions } = body;

      if (!client_id || !email || !full_name || !role) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user has access to this client
      const { data: clientData, error: clientError } = await supabase
        .from("msp_clients")
        .select("id, company_name, msp:msps!inner(user_id)")
        .eq("id", client_id)
        .single();

      if (clientError || !clientData) {
        return new Response(JSON.stringify({ error: "Client not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user owns this MSP or is admin
      const mspUserId = (clientData.msp as any)?.user_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();
      
      const isAdmin = profile?.email?.endsWith("@ultriumai.com");
      if (mspUserId !== user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from("client_portal_users")
        .select("id")
        .eq("client_id", client_id)
        .eq("email", email.toLowerCase())
        .single();

      if (existingUser) {
        return new Response(JSON.stringify({ error: "User already exists for this company" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check for pending invitation
      const { data: existingInvite } = await supabase
        .from("portal_user_invitations")
        .select("id")
        .eq("client_id", client_id)
        .eq("email", email.toLowerCase())
        .eq("status", "pending")
        .single();

      if (existingInvite) {
        return new Response(JSON.stringify({ error: "Pending invitation already exists" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate invitation token
      const inviteToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Create invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("portal_user_invitations")
        .insert({
          client_id,
          email: email.toLowerCase(),
          full_name,
          role,
          invite_token: inviteToken,
          invited_by: user.id,
          expires_at: expiresAt.toISOString(),
          permissions: permissions || {},
        })
        .select()
        .single();

      if (inviteError) {
        console.error("Failed to create invitation:", inviteError);
        return new Response(JSON.stringify({ error: "Failed to create invitation" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Send invitation email if Resend is configured
      let emailSent = false;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const inviteUrl = `https://ultriumai.com/portal/accept-invite?token=${inviteToken}`;
          
          await resend.emails.send({
            from: "Vanguard Portal <noreply@ultriumai.com>",
            to: [email],
            subject: `You're invited to join ${clientData.company_name} on Vanguard`,
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
              </head>
              <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px;">
                <div style="max-width: 560px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16162a 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(139, 92, 246, 0.2);">
                  <div style="text-align: center; margin-bottom: 32px;">
                    <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">Vanguard Portal</h1>
                    <p style="color: #94a3b8; margin-top: 8px;">Secure IT Management</p>
                  </div>
                  
                  <h2 style="color: #ffffff; margin-bottom: 16px;">You're Invited!</h2>
                  <p style="color: #cbd5e1; line-height: 1.6;">
                    Hi ${full_name},
                  </p>
                  <p style="color: #cbd5e1; line-height: 1.6;">
                    You've been invited to join <strong style="color: #22d3ee;">${clientData.company_name}</strong> on the Vanguard customer portal.
                  </p>
                  <p style="color: #cbd5e1; line-height: 1.6;">
                    As a <strong style="color: #a78bfa;">${role}</strong>, you'll have access to:
                  </p>
                  <ul style="color: #cbd5e1; line-height: 1.8;">
                    <li>Submit and track support tickets</li>
                    <li>View your organization's devices</li>
                    <li>Access security tools and reports</li>
                  </ul>
                  
                  <div style="text-align: center; margin: 32px 0;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
                      Accept Invitation
                    </a>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; text-align: center;">
                    This invitation expires in 7 days.
                  </p>
                  
                  <hr style="border: none; border-top: 1px solid rgba(139, 92, 246, 0.2); margin: 32px 0;">
                  
                  <p style="color: #64748b; font-size: 12px; text-align: center;">
                    If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                </div>
              </body>
              </html>
            `,
          });
          emailSent = true;
        } catch (emailError) {
          console.error("Failed to send invite email:", emailError);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        invitation_id: invitation.id,
        email_sent: emailSent,
        expires_at: expiresAt.toISOString(),
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================
    // ACTION: Resend invitation
    // =========================================
    if (action === "resend") {
      const body: ResendInviteRequest = await req.json();
      const { invitation_id } = body;

      const { data: invitation, error: fetchError } = await supabase
        .from("portal_user_invitations")
        .select("*, client:msp_clients(company_name)")
        .eq("id", invitation_id)
        .eq("status", "pending")
        .single();

      if (fetchError || !invitation) {
        return new Response(JSON.stringify({ error: "Invitation not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate new token and extend expiry
      const newToken = crypto.randomUUID() + "-" + crypto.randomUUID();
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await supabase
        .from("portal_user_invitations")
        .update({
          invite_token: newToken,
          expires_at: newExpiry.toISOString(),
        })
        .eq("id", invitation_id);

      // Resend email
      let emailSent = false;
      if (resendApiKey) {
        try {
          const resend = new Resend(resendApiKey);
          const inviteUrl = `https://ultriumai.com/portal/accept-invite?token=${newToken}`;
          
          await resend.emails.send({
            from: "Vanguard Portal <noreply@ultriumai.com>",
            to: [invitation.email],
            subject: `Reminder: You're invited to join ${(invitation.client as any).company_name} on Vanguard`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Invitation Reminder</h2>
                <p>Hi ${invitation.full_name},</p>
                <p>This is a reminder that you've been invited to join ${(invitation.client as any).company_name} on the Vanguard portal.</p>
                <p><a href="${inviteUrl}" style="background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none;">Accept Invitation</a></p>
                <p style="color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
              </div>
            `,
          });
          emailSent = true;
        } catch (emailError) {
          console.error("Failed to resend invite email:", emailError);
        }
      }

      return new Response(JSON.stringify({ success: true, email_sent: emailSent }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================
    // ACTION: Reset MFA for a user
    // =========================================
    if (action === "reset-mfa") {
      const body: ResetMFARequest = await req.json();
      const { portal_user_id } = body;

      // Verify the user being reset belongs to a client the caller manages
      const { data: portalUser, error: userError } = await supabase
        .from("client_portal_users")
        .select("id, email, client:msp_clients!inner(msp:msps!inner(user_id))")
        .eq("id", portal_user_id)
        .single();

      if (userError || !portalUser) {
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const mspUserId = ((portalUser.client as any)?.msp as any)?.user_id;
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", user.id)
        .single();
      
      const isAdmin = profile?.email?.endsWith("@ultriumai.com");
      if (mspUserId !== user.id && !isAdmin) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Reset MFA
      const { error: resetError } = await supabase
        .from("client_portal_users")
        .update({
          mfa_enabled: false,
          mfa_secret: null,
          mfa_backup_codes: null,
          mfa_verified_at: null,
        })
        .eq("id", portal_user_id);

      if (resetError) {
        return new Response(JSON.stringify({ error: "Failed to reset MFA" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================================
    // ACTION: Accept invitation (public)
    // =========================================
    if (action === "accept") {
      const body = await req.json();
      const { token, password } = body;

      if (!token || !password) {
        return new Response(JSON.stringify({ error: "Missing token or password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (password.length < 8) {
        return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the invitation
      const { data: invitation, error: inviteError } = await supabase
        .from("portal_user_invitations")
        .select("*")
        .eq("invite_token", token)
        .eq("status", "pending")
        .single();

      if (inviteError || !invitation) {
        return new Response(JSON.stringify({ error: "Invalid or expired invitation" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check expiry
      if (new Date(invitation.expires_at) < new Date()) {
        await supabase
          .from("portal_user_invitations")
          .update({ status: "expired" })
          .eq("id", invitation.id);
        
        return new Response(JSON.stringify({ error: "Invitation has expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Hash the password (simple bcrypt-style hash for demo - in production use proper bcrypt)
      const encoder = new TextEncoder();
      const data = encoder.encode(password + invitation.email);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Create the portal user
      const { data: newUser, error: createError } = await supabase
        .from("client_portal_users")
        .insert({
          client_id: invitation.client_id,
          email: invitation.email,
          full_name: invitation.full_name,
          role: invitation.role,
          password_hash: passwordHash,
          is_active: true,
          invited_by: invitation.invited_by,
          invited_at: invitation.invited_at,
        })
        .select()
        .single();

      if (createError) {
        console.error("Failed to create user:", createError);
        return new Response(JSON.stringify({ error: "Failed to create account" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Apply custom permissions if provided
      if (invitation.permissions && Object.keys(invitation.permissions).length > 0) {
        await supabase
          .from("portal_user_permissions")
          .update(invitation.permissions)
          .eq("portal_user_id", newUser.id);
      }

      // Mark invitation as accepted
      await supabase
        .from("portal_user_invitations")
        .update({
          status: "accepted",
          accepted_at: new Date().toISOString(),
        })
        .eq("id", invitation.id);

      return new Response(JSON.stringify({
        success: true,
        user_id: newUser.id,
        message: "Account created successfully. You can now log in.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Portal user invite error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

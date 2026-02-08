import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // Authenticate caller
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const user = userData.user;
    if (!user) throw new Error("Not authenticated");

    const { email, organizationId, role } = await req.json();
    if (!email || !organizationId) throw new Error("Missing email or organizationId");

    // Verify caller is admin/owner of this org
    const { data: callerMember } = await supabase
      .from("org_team_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"])
      .single();

    if (!callerMember) throw new Error("You don't have permission to invite members");

    // Get org name
    const { data: org } = await supabase
      .from("org_teams")
      .select("name")
      .eq("id", organizationId)
      .single();

    const orgName = org?.name || "your organization";

    // Generate invite token
    const inviteToken = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Check if member row already exists (pending)
    const { data: existing } = await supabase
      .from("org_team_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("email", email)
      .single();

    if (existing) {
      // Update with token
      await supabase
        .from("org_team_members")
        .update({
          invite_token: inviteToken,
          token_expires_at: expiresAt.toISOString(),
          status: "pending",
        })
        .eq("id", existing.id);
    } else {
      // Insert new pending member with token
      await supabase.from("org_team_members").insert({
        organization_id: organizationId,
        email,
        role: role || "member",
        status: "pending",
        invited_by: user.id,
        invite_token: inviteToken,
        token_expires_at: expiresAt.toISOString(),
      });
    }

    // Send invite email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);
    const inviteUrl = `https://ultriumai.lovable.app/org/accept-invite?token=${inviteToken}`;

    await resend.emails.send({
      from: "UltriumAI <hello@send.ultriumai.com>",
      to: [email],
      subject: `You've been invited to join ${orgName} on UltriumAI`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">You're invited!</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            <strong>${user.email}</strong> has invited you to join <strong>${orgName}</strong> on UltriumAI as a <strong>${role || "member"}</strong>.
          </p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            Click the button below to accept the invitation and set up your account.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Accept Invitation
            </a>
          </div>
          <p style="font-size: 13px; color: #9CA3AF;">
            This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
          </p>
        </div>
      `,
    });

    console.log(`[org-invite-send] Invite sent to ${email} for org ${organizationId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[org-invite-send] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

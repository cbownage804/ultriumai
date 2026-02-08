import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type NotificationType = 'suspended' | 'reactivated' | 'removed' | 'role_changed';

interface NotificationPayload {
  type: NotificationType;
  memberEmail: string;
  organizationId: string;
  newRole?: string;
}

const SUBJECTS: Record<NotificationType, string> = {
  suspended: 'Your account has been suspended',
  reactivated: 'Your account has been reactivated',
  removed: 'You have been removed from the organization',
  role_changed: 'Your role has been updated',
};

const buildBody = (type: NotificationType, orgName: string, newRole?: string): string => {
  switch (type) {
    case 'suspended':
      return `Your access to <strong>${orgName}</strong> on UltriumAI has been suspended by an administrator. Your license assignments are preserved but inactive. Contact your organization admin for more information.`;
    case 'reactivated':
      return `Your access to <strong>${orgName}</strong> on UltriumAI has been reactivated. You can now log in and use your assigned licenses.`;
    case 'removed':
      return `You have been removed from <strong>${orgName}</strong> on UltriumAI. All license assignments have been revoked. If you believe this was a mistake, contact your organization admin.`;
    case 'role_changed':
      return `Your role in <strong>${orgName}</strong> on UltriumAI has been updated to <strong>${newRole}</strong>.`;
  }
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
    if (!userData.user) throw new Error("Not authenticated");

    const { type, memberEmail, organizationId, newRole } = await req.json() as NotificationPayload;
    if (!type || !memberEmail || !organizationId) throw new Error("Missing required fields");

    // Verify caller is admin/owner
    const { data: callerMember } = await supabase
      .from("org_team_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userData.user.id)
      .in("role", ["owner", "admin"])
      .single();

    if (!callerMember) throw new Error("Permission denied");

    // Get org name
    const { data: org } = await supabase
      .from("org_teams")
      .select("name")
      .eq("id", organizationId)
      .single();

    const orgName = org?.name || "your organization";

    // Send email
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);
    await resend.emails.send({
      from: "UltriumAI <hello@send.ultriumai.com>",
      to: [memberEmail],
      subject: `${SUBJECTS[type]} — ${orgName}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 16px;">${SUBJECTS[type]}</h1>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">${buildBody(type, orgName, newRole)}</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="https://ultriumai.lovable.app/organization" style="display: inline-block; background-color: #2563EB; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Go to Dashboard
            </a>
          </div>
          <p style="font-size: 13px; color: #9CA3AF;">This is an automated notification from UltriumAI.</p>
        </div>
      `,
    });

    console.log(`[org-member-notify] ${type} notification sent to ${memberEmail}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[org-member-notify] Error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

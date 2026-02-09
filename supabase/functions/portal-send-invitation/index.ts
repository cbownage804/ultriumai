import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  contactId: string;
  welcomeMessage?: string;
  mspBranding?: {
    companyName?: string;
    logoUrl?: string;
    primaryColor?: string;
  };
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PORTAL-INVITATION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const mspUser = userData.user;
    if (!mspUser) throw new Error("User not authenticated");
    logStep("MSP user authenticated", { userId: mspUser.id });

    const { contactId, welcomeMessage, mspBranding }: InvitationRequest = await req.json();
    if (!contactId) throw new Error("Contact ID is required");

    // Get contact details
    const { data: contact, error: contactError } = await supabaseClient
      .from('client_contacts')
      .select('*, rmm_customers!inner(company_name, user_id)')
      .eq('id', contactId)
      .single();

    if (contactError || !contact) {
      throw new Error("Contact not found");
    }

    // Verify MSP owns this customer
    if ((contact as any).rmm_customers.user_id !== mspUser.id) {
      throw new Error("Unauthorized access to contact");
    }

    logStep("Contact found", { email: contact.email, name: contact.contact_name });

    // Generate secure invitation token
    const invitationToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    // Generate temporary password
    const tempPassword = generateSecurePassword();

    // Create or get portal user
    let portalUserId: string;
    const { data: existingPortalUser } = await supabaseClient
      .from('client_portal_users')
      .select('id')
      .eq('contact_id', contactId)
      .single();

    if (existingPortalUser) {
      portalUserId = existingPortalUser.id;
      // Update with new temp password
      await supabaseClient
        .from('client_portal_users')
        .update({
          temporary_password: tempPassword,
          must_change_password: true,
          is_active: true
        })
        .eq('id', portalUserId);
    } else {
      // Create new portal user
      const { data: newPortalUser, error: createError } = await supabaseClient
        .from('client_portal_users')
        .insert({
          contact_id: contactId,
          client_id: contact.client_id,
          email: contact.email,
          full_name: contact.contact_name,
          role: contact.portal_role || 'user',
          temporary_password: tempPassword,
          must_change_password: true,
          is_active: true
        })
        .select('id')
        .single();

      if (createError) throw createError;
      portalUserId = newPortalUser!.id;
    }

    // Create invitation record
    const { data: invitation, error: inviteError } = await supabaseClient
      .from('portal_invitations')
      .insert({
        contact_id: contactId,
        portal_user_id: portalUserId,
        client_id: contact.client_id,
        msp_user_id: mspUser.id,
        invitation_token: invitationToken,
        email: contact.email,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
        welcome_message: welcomeMessage
      })
      .select()
      .single();

    if (inviteError) throw inviteError;
    logStep("Invitation created", { invitationId: invitation.id });

    // Send invitation email
    const resend = new Resend(resendApiKey);
    const portalUrl = `https://ultriumai.app/customer-portal/accept-invitation?token=${invitationToken}`;
    const companyName = mspBranding?.companyName || 'Your IT Provider';
    const primaryColor = mspBranding?.primaryColor || '#0891b2';

    const emailResponse = await resend.emails.send({
      from: `${companyName} <hello@send.ultriumai.com>`,
      to: [contact.email],
      subject: `Welcome to the ${companyName} Customer Portal`,
      html: generateInvitationEmail({
        recipientName: contact.contact_name,
        companyName,
        customerCompany: (contact as any).rmm_customers.company_name,
        portalUrl,
        tempPassword,
        welcomeMessage,
        primaryColor,
        expiresAt
      })
    });

    logStep("Email sent", { emailId: emailResponse.data?.id });

    // Update invitation status
    await supabaseClient
      .from('portal_invitations')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', invitation.id);

    // Update contact portal_enabled flag
    await supabaseClient
      .from('client_contacts')
      .update({ portal_enabled: true })
      .eq('id', contactId);

    return new Response(JSON.stringify({ 
      success: true, 
      invitationId: invitation.id,
      message: `Invitation sent to ${contact.email}`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  const array = new Uint8Array(12);
  crypto.getRandomValues(array);
  for (let i = 0; i < 12; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

interface EmailParams {
  recipientName: string;
  companyName: string;
  customerCompany: string;
  portalUrl: string;
  tempPassword: string;
  welcomeMessage?: string;
  primaryColor: string;
  expiresAt: Date;
}

function generateInvitationEmail(params: EmailParams): string {
  const { recipientName, companyName, customerCompany, portalUrl, tempPassword, welcomeMessage, primaryColor, expiresAt } = params;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Portal Invitation</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
      <div style="background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${primaryColor}; margin-bottom: 10px;">Welcome to Your Customer Portal! 🎉</h1>
          <p style="font-size: 16px; color: #666;">Access support, tickets, and security tools</p>
        </div>

        <p style="font-size: 16px;">Hi <strong>${recipientName}</strong>,</p>
        
        <p>You've been invited to access the <strong>${companyName}</strong> customer portal for <strong>${customerCompany}</strong>.</p>
        
        ${welcomeMessage ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${primaryColor};"><p style="margin: 0; color: #555;">${welcomeMessage}</p></div>` : ''}

        <div style="background: linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05); padding: 25px; border-radius: 10px; margin: 25px 0;">
          <h3 style="margin-top: 0; color: ${primaryColor};">Your Login Credentials</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${params.recipientName.includes('@') ? params.recipientName : 'Use your email address'}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: white; padding: 3px 8px; border-radius: 4px; font-size: 14px;">${tempPassword}</code></p>
          <p style="font-size: 13px; color: #666; margin-top: 15px;">⚠️ You'll be asked to change this password on your first login.</p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}" style="background: ${primaryColor}; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
            Access Your Portal →
          </a>
        </div>

        <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin-top: 25px;">
          <p style="margin: 0; font-size: 14px; color: #856404;">
            🔒 <strong>Security Notice:</strong> This invitation expires on ${expiresAt.toLocaleDateString()}. 
            Keep your credentials secure and don't share them with anyone.
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

        <div style="text-align: center; color: #999; font-size: 13px;">
          <p>Need help? Contact <a href="mailto:support@ultriumai.com" style="color: ${primaryColor};">support@ultriumai.com</a></p>
          <p>${companyName} • Powered by Ultrium Vanguard</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

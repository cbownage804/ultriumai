import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  type: "confirmation" | "password_reset" | "magic_link" | "email_change" | "welcome";
  email: string;
  name?: string;
  redirectUrl?: string;
  token?: string;
  newEmail?: string;
}

const getEmailTemplate = (type: string, data: { name?: string; actionUrl: string; newEmail?: string }) => {
  const year = new Date().getFullYear();
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0a0a; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a; }
      .logo { text-align: center; margin-bottom: 30px; }
      .logo-text { font-size: 28px; font-weight: bold; background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      h1 { color: #ffffff; font-size: 24px; margin: 0 0 16px 0; }
      p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 24px 0; }
      .button:hover { opacity: 0.9; }
      .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #2a2a4a; }
      .footer p { color: #71717a; font-size: 12px; }
      .highlight { color: #8b5cf6; }
      .warning { background: #422006; border: 1px solid #854d0e; border-radius: 8px; padding: 16px; margin: 16px 0; }
      .warning p { color: #fbbf24; margin: 0; font-size: 14px; }
    </style>
  `;

  const templates: Record<string, { subject: string; html: string }> = {
    confirmation: {
      subject: "Confirm your SafeSuite account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <span class="logo-text">🛡️ SafeSuite</span>
              </div>
              <h1>Welcome${data.name ? `, ${data.name}` : ''}!</h1>
              <p>Thanks for signing up for SafeSuite. To get started, please confirm your email address by clicking the button below.</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Confirm Email Address</a>
              </div>
              <div class="warning">
                <p>⚠️ This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
                <p>This email was sent to you because you signed up for SafeSuite.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    password_reset: {
      subject: "Reset your SafeSuite password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <span class="logo-text">🛡️ SafeSuite</span>
              </div>
              <h1>Password Reset Request</h1>
              <p>We received a request to reset the password for your SafeSuite account. Click the button below to set a new password.</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Reset Password</a>
              </div>
              <div class="warning">
                <p>⚠️ This link expires in 1 hour. If you didn't request this, please ignore this email or contact support if you have concerns.</p>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
                <p>Need help? Contact us at support@ultriumai.com</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    magic_link: {
      subject: "Your SafeSuite login link",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <span class="logo-text">🛡️ SafeSuite</span>
              </div>
              <h1>Sign in to SafeSuite</h1>
              <p>Click the button below to securely sign in to your SafeSuite account. No password needed!</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Sign In to SafeSuite</a>
              </div>
              <div class="warning">
                <p>⚠️ This link expires in 1 hour and can only be used once.</p>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    email_change: {
      subject: "Confirm your new email address",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <span class="logo-text">🛡️ SafeSuite</span>
              </div>
              <h1>Confirm Email Change</h1>
              <p>You requested to change your email address to <span class="highlight">${data.newEmail || 'a new address'}</span>. Click the button below to confirm this change.</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Confirm New Email</a>
              </div>
              <div class="warning">
                <p>⚠️ If you didn't request this change, please contact support immediately.</p>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    welcome: {
      subject: "Welcome to SafeSuite! 🛡️",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <span class="logo-text">🛡️ SafeSuite</span>
              </div>
              <h1>Welcome to SafeSuite${data.name ? `, ${data.name}` : ''}!</h1>
              <p>Your account is now active. You now have access to enterprise-grade security tools:</p>
              <ul style="color: #a1a1aa; padding-left: 20px;">
                <li style="margin-bottom: 8px;"><strong style="color: #fbbf24;">SafePass</strong> - Zero-knowledge password vault</li>
                <li style="margin-bottom: 8px;"><strong style="color: #ef4444;">SafeScan</strong> - Email, URL & document scanner</li>
                <li style="margin-bottom: 8px;"><strong style="color: #8b5cf6;">SafeWeb</strong> - Dark web breach monitoring</li>
                <li style="margin-bottom: 8px;"><strong style="color: #10b981;">SafeTrack</strong> - IT asset management</li>
              </ul>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Go to Dashboard</a>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
                <p>Questions? Reply to this email or visit our help center.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
  };

  return templates[type] || templates.welcome;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, email, name, redirectUrl, token, newEmail }: AuthEmailRequest = await req.json();

    if (!email || !type) {
      throw new Error("Missing required fields: email and type");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    let actionUrl = redirectUrl || "https://safesuite.ultriumai.com/dashboard";

    // For confirmation and password reset, generate proper auth links
    if (type === "confirmation" || type === "password_reset" || type === "magic_link") {
      const linkType = type === "confirmation" ? "signup" : type === "password_reset" ? "recovery" : "magiclink";
      const redirect = redirectUrl || "https://safesuite.ultriumai.com/dashboard";
      
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: linkType,
        email: email,
        options: { redirectTo: redirect },
      });

      if (linkError) {
        console.error("Error generating auth link:", linkError);
        // Fall back to a generic URL if link generation fails
        actionUrl = redirect;
      } else if (linkData?.properties?.action_link) {
        actionUrl = linkData.properties.action_link;
      }
    }

    const template = getEmailTemplate(type, { name, actionUrl, newEmail });

    console.log(`Sending ${type} email to ${email}`);

    const emailResponse = await resend.emails.send({
      from: "UltriumAI Support <support@ultriumai.com>",
      to: [email],
      subject: template.subject,
      html: template.html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending auth email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

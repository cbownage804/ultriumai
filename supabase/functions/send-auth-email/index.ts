import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Map Supabase Auth Hook email types to our types
const mapEmailType = (supabaseType: string): string => {
  const typeMap: Record<string, string> = {
    'signup': 'confirmation',
    'recovery': 'password_reset',
    'magiclink': 'magic_link',
    'email_change': 'email_change',
    'invite': 'welcome',
  };
  return typeMap[supabaseType] || supabaseType;
};

const getEmailTemplate = (type: string, data: { name?: string; actionUrl: string; newEmail?: string }) => {
  const year = new Date().getFullYear();
  const logoUrl = "https://ultriumai.lovable.app/lovable-uploads/c622085b-3688-49a3-a53e-cd4d7330f920.png";
  const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #0a0a0a; }
      .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
      .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #2a2a4a; }
      .logo { text-align: center; margin-bottom: 30px; }
      .logo img { height: 48px; width: auto; }
      .brand-name { color: #ffffff; font-size: 20px; font-weight: 700; margin-top: 12px; }
      .brand-tagline { color: #71717a; font-size: 12px; margin-top: 4px; }
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
      subject: "Confirm your UltriumAI account",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" alt="UltriumAI" />
                <div class="brand-name">UltriumAI</div>
                <div class="brand-tagline">Your gateway to AI Studio, SafeSuite & Vanguard</div>
              </div>
              <h1>Welcome${data.name ? `, ${data.name}` : ''}!</h1>
              <p>Thanks for creating your UltriumAI account. To get started, please confirm your email address by clicking the button below.</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Confirm Email Address</a>
              </div>
              <div class="warning">
                <p>⚠️ This link expires in 24 hours. If you didn't create this account, you can safely ignore this email.</p>
              </div>
              <div class="footer">
                <p>© ${year} UltriumAI. All rights reserved.</p>
                <p>This email was sent because you signed up for an UltriumAI account.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    },
    password_reset: {
      subject: "Reset your UltriumAI password",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" alt="UltriumAI" />
                <div class="brand-name">UltriumAI</div>
                <div class="brand-tagline">Your gateway to AI Studio, SafeSuite & Vanguard</div>
              </div>
              <h1>Password Reset Request</h1>
              <p>We received a request to reset the password for your UltriumAI account. Click the button below to set a new password.</p>
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
      subject: "Your UltriumAI login link",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" alt="UltriumAI" />
                <div class="brand-name">UltriumAI</div>
                <div class="brand-tagline">Your gateway to AI Studio, SafeSuite & Vanguard</div>
              </div>
              <h1>Sign in to UltriumAI</h1>
              <p>Click the button below to securely sign in to your UltriumAI account. No password needed!</p>
              <div style="text-align: center;">
                <a href="${data.actionUrl}" class="button">Sign In to UltriumAI</a>
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
      subject: "Confirm your new email address - UltriumAI",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" alt="UltriumAI" />
                <div class="brand-name">UltriumAI</div>
                <div class="brand-tagline">Your gateway to AI Studio, SafeSuite & Vanguard</div>
              </div>
              <h1>Confirm Email Change</h1>
              <p>You requested to change your UltriumAI account email to <span class="highlight">${data.newEmail || 'a new address'}</span>. Click the button below to confirm this change.</p>
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
      subject: "Welcome to UltriumAI! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">
                <img src="${logoUrl}" alt="UltriumAI" />
                <div class="brand-name">UltriumAI</div>
                <div class="brand-tagline">Your gateway to AI Studio, SafeSuite & Vanguard</div>
              </div>
              <h1>Welcome${data.name ? `, ${data.name}` : ''}!</h1>
              <p>Your UltriumAI account is now active. You have access to our complete product suite:</p>
              <div style="margin: 20px 0;">
                <div style="margin-bottom: 12px;">
                  <span style="background: #3b82f620; color: #60a5fa; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">AI Studio</span>
                  <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Build custom GPTs and AI agents</span>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="background: #8b5cf620; color: #a78bfa; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">SafeSuite</span>
                  <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Enterprise security tools & password vault</span>
                </div>
                <div style="margin-bottom: 12px;">
                  <span style="background: #10b98120; color: #34d399; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 500;">Vanguard</span>
                  <span style="color: #a1a1aa; font-size: 14px; margin-left: 8px;">Endpoint security & compliance monitoring</span>
                </div>
              </div>
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
    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    let email: string;
    let emailType: string;
    let actionUrl: string;
    let userName: string | undefined;
    let newEmail: string | undefined;

    // Check if this is a Supabase Auth Hook payload
    if (payload.user && payload.email_data) {
      // Auth Hook format from Supabase
      const { user, email_data } = payload;
      
      email = user.email;
      emailType = mapEmailType(email_data.email_action_type);
      userName = user.user_metadata?.full_name || user.user_metadata?.name;
      newEmail = user.new_email;

      // Build the confirmation URL - route directly through ultriumai.app
      // This avoids supabase.co URLs in emails (which trigger spam filters)
      const tokenHash = email_data.token_hash;
      const type = email_data.email_action_type;
      
      // Determine the final redirect destination after verification
      const redirectTo = email_data.redirect_to || "https://ultriumai.app/auth/callback";
      
      // Route through our own domain - Supabase JS client will verify the token client-side
      actionUrl = `https://ultriumai.app/auth/confirm?token_hash=${tokenHash}&type=${type}&redirect_to=${encodeURIComponent(redirectTo)}`;
      
      console.log("Auth Hook - Email type:", emailType, "Email:", email, "Action URL:", actionUrl);
    } else {
      // Direct API call format (legacy)
      email = payload.email;
      emailType = payload.type;
      actionUrl = payload.redirectUrl || "https://ultriumai.app/safesuite/dashboard";
      userName = payload.name;
      newEmail = payload.newEmail;

      if (!email || !emailType) {
        throw new Error("Missing required fields: email and type");
      }
    }

    const template = getEmailTemplate(emailType, { name: userName, actionUrl, newEmail });

    console.log(`Sending ${emailType} email to ${email} from UltriumAI Security <security@send.ultriumai.com>`);

    const emailResponse = await resend.emails.send({
      from: "UltriumAI Security <security@send.ultriumai.com>",
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

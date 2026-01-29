import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIAL-REMINDER] ${step}${detailsStr}`);
};

interface TrialReminderRequest {
  email: string;
  name?: string;
  daysRemaining: number;
  product: string;
  trialEndDate: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, name, daysRemaining, product, trialEndDate }: TrialReminderRequest = await req.json();
    
    logStep("Sending trial reminder", { email, daysRemaining, product });

    const urgencyText = daysRemaining <= 1 
      ? "⚠️ Your trial expires tomorrow!" 
      : daysRemaining <= 3 
        ? `⏰ Only ${daysRemaining} days left in your trial`
        : `📅 ${daysRemaining} days remaining in your trial`;

    const emailResponse = await resend.emails.send({
      from: "UltriumAI <hello@send.ultriumai.com>",
      to: [email],
      subject: `${urgencyText} - ${product}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">${urgencyText}</h1>
          </div>

          <div style="background: ${daysRemaining <= 1 ? '#fef2f2' : daysRemaining <= 3 ? '#fffbeb' : '#f0fdf4'}; padding: 25px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid ${daysRemaining <= 1 ? '#ef4444' : daysRemaining <= 3 ? '#f59e0b' : '#22c55e'};">
            <h2 style="margin-top: 0; color: #1e293b;">Hi ${name || 'there'},</h2>
            <p>Your <strong>${product}</strong> trial is ending on <strong>${new Date(trialEndDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
            <p>Don't lose access to the powerful features you've been using!</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #1e293b;">🎯 What you'll keep with a subscription:</h3>
            <ul style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">All your saved configurations and data</li>
              <li style="margin-bottom: 8px;">Continued protection and monitoring</li>
              <li style="margin-bottom: 8px;">Priority support access</li>
              <li style="margin-bottom: 8px;">All premium features unlocked</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="https://ultriumai.lovable.app/pricing" 
               style="background: #2563eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Upgrade Now →
            </a>
            <p style="font-size: 14px; color: #666; margin-top: 12px;">
              Lock in our best pricing before your trial ends
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666;">
            <p style="font-size: 14px;">
              Questions? Reply to this email or contact <a href="mailto:support@ultriumai.com" style="color: #2563eb;">support@ultriumai.com</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    logStep("Email sent successfully", { id: emailResponse.id });

    return new Response(JSON.stringify({ success: true, id: emailResponse.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});

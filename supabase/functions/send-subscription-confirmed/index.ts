import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SUBSCRIPTION-CONFIRMED] ${step}${detailsStr}`);
};

interface SubscriptionConfirmedRequest {
  email: string;
  name?: string;
  product: string;
  plan: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, name, product, plan, amount, currency, billingCycle, nextBillingDate }: SubscriptionConfirmedRequest = await req.json();
    
    logStep("Sending subscription confirmation", { email, product, plan });

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);

    const billingText = billingCycle === 'yearly' ? 'per year' : 'per month';

    const emailResponse = await resend.emails.send({
      from: "UltriumAI <hello@send.ultriumai.com>",
      to: [email],
      subject: `🎉 Welcome to ${product} ${plan}!`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #22c55e; margin-bottom: 10px;">🎉 Subscription Confirmed!</h1>
            <p style="font-size: 18px; color: #666;">Welcome to ${product} ${plan}</p>
          </div>

          <div style="background: #f0fdf4; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #bbf7d0;">
            <h2 style="margin-top: 0; color: #1e293b;">Hi ${name || 'there'}! 👋</h2>
            <p>Thank you for subscribing! Your payment has been processed successfully.</p>
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #1e293b;">📋 Subscription Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Product</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${product}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Plan</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${plan}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formattedAmount} ${billingText}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Next billing</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${new Date(nextBillingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</td>
              </tr>
            </table>
          </div>

          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #bfdbfe;">
            <h3 style="margin-top: 0; color: #1e293b;">🚀 What's Next?</h3>
            <ul style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 8px;">Access all premium features immediately</li>
              <li style="margin-bottom: 8px;">Set up your preferences and configurations</li>
              <li style="margin-bottom: 8px;">Explore our documentation and guides</li>
              <li style="margin-bottom: 8px;">Reach out to support if you need any help</li>
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="https://ultriumai.lovable.app/dashboard" 
               style="background: #2563eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Go to Dashboard →
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666;">
            <p style="font-size: 14px;">
              Manage your subscription anytime at <a href="https://ultriumai.lovable.app/dashboard/billing" style="color: #2563eb;">Dashboard → Billing</a>
            </p>
            <p style="font-size: 14px;">
              Questions? Contact <a href="mailto:support@ultriumai.com" style="color: #2563eb;">support@ultriumai.com</a>
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

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PAYMENT-FAILED] ${step}${detailsStr}`);
};

interface PaymentFailedRequest {
  email: string;
  name?: string;
  product: string;
  amount: number;
  currency: string;
  failureReason?: string;
  retryDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, name, product, amount, currency, failureReason, retryDate }: PaymentFailedRequest = await req.json();
    
    logStep("Sending payment failed notification", { email, product, amount });

    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);

    const emailResponse = await resend.emails.send({
      from: "UltriumAI Billing <billing@send.ultriumai.com>",
      to: [email],
      subject: `⚠️ Payment Failed - Action Required for ${product}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #ef4444; margin-bottom: 10px;">⚠️ Payment Failed</h1>
            <p style="font-size: 18px; color: #666;">Action required to maintain your subscription</p>
          </div>

          <div style="background: #fef2f2; padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fecaca;">
            <h2 style="margin-top: 0; color: #1e293b;">Hi ${name || 'there'},</h2>
            <p>We couldn't process your payment of <strong>${formattedAmount}</strong> for <strong>${product}</strong>.</p>
            ${failureReason ? `<p style="color: #dc2626;"><strong>Reason:</strong> ${failureReason}</p>` : ''}
          </div>

          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h3 style="margin-top: 0; color: #1e293b;">🔧 How to fix this:</h3>
            <ol style="padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 10px;">Check that your card details are up to date</li>
              <li style="margin-bottom: 10px;">Ensure sufficient funds are available</li>
              <li style="margin-bottom: 10px;">Contact your bank if the issue persists</li>
              <li style="margin-bottom: 10px;">Update your payment method below</li>
            </ol>
          </div>

          ${retryDate ? `
          <div style="background: #fffbeb; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fed7aa;">
            <p style="margin: 0; color: #92400e;">
              <strong>⏰ Next retry:</strong> We'll automatically retry on ${new Date(retryDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-bottom: 25px;">
            <a href="https://ultriumai.lovable.app/dashboard/billing" 
               style="background: #2563eb; color: white; padding: 14px 35px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Update Payment Method →
            </a>
          </div>

          <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fef08a;">
            <p style="margin: 0; font-size: 14px; color: #713f12;">
              <strong>⚠️ Important:</strong> If payment isn't resolved within 7 days, your subscription may be canceled and you'll lose access to premium features.
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666;">
            <p style="font-size: 14px;">
              Need help? Contact <a href="mailto:billing@ultriumai.com" style="color: #2563eb;">billing@ultriumai.com</a>
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

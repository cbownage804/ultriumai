import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  hardwareTier: string;
  subscriptionTier: string;
  hardwarePrice: number;
  subscriptionPrice: number;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  notifyAdmin?: boolean;
}

const HARDWARE_NAMES: Record<string, string> = {
  lite: "Vanguard Recon Lite",
  pro: "Vanguard Recon Pro",
};

const SUBSCRIPTION_NAMES: Record<string, string> = {
  essential: "Essential",
  professional: "Professional",
  enterprise: "Enterprise",
};

const formatPrice = (cents: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
};

const generateCustomerEmail = (data: OrderNotificationRequest): string => {
  const hardwareName = HARDWARE_NAMES[data.hardwareTier] || data.hardwareTier;
  const subscriptionName = SUBSCRIPTION_NAMES[data.subscriptionTier] || data.subscriptionTier;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0891b2 0%, #0ea5e9 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">🛡️ Vanguard Recon</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Order Confirmation</p>
  </div>
  
  <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0; border-top: none;">
    <h2 style="color: #0f172a; margin-top: 0;">Thank you for your order, ${data.customerName}!</h2>
    
    <p>Your Vanguard Recon unit is being prepared for shipment. Here's a summary of your order:</p>
    
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0891b2;">Order Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Order ID:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-family: monospace; font-size: 12px;">${data.orderId.slice(0, 8)}...</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Hardware:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">${hardwareName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Subscription:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${subscriptionName} Plan</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;">Hardware Cost:</td>
          <td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; text-align: right;">${formatPrice(data.hardwarePrice)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">Monthly Subscription:</td>
          <td style="padding: 8px 0; text-align: right;">${formatPrice(data.subscriptionPrice)}/mo</td>
        </tr>
      </table>
    </div>
    
    <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0891b2;">Shipping Address</h3>
      <p style="margin: 0;">
        ${data.shippingAddress.name}<br>
        ${data.shippingAddress.street}<br>
        ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}<br>
        ${data.shippingAddress.country}
      </p>
    </div>
    
    <div style="background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #0d9488;">What's Next?</h3>
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">We'll provision your unit with a unique activation key</li>
        <li style="margin-bottom: 8px;">Your Recon unit will ship within 2-3 business days</li>
        <li style="margin-bottom: 8px;">You'll receive tracking information via email</li>
        <li style="margin-bottom: 0;">Simply plug in your unit - it will auto-activate!</li>
      </ol>
    </div>
    
    <p style="color: #64748b; font-size: 14px;">
      Questions? Contact us at <a href="mailto:support@ultriumai.com" style="color: #0891b2;">support@ultriumai.com</a>
    </p>
  </div>
  
  <div style="background: #0f172a; padding: 20px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #94a3b8; margin: 0; font-size: 12px;">
      © ${new Date().getFullYear()} UltriumAI. All rights reserved.<br>
      <a href="https://ultriumai.lovable.app" style="color: #0891b2;">ultriumai.com</a>
    </p>
  </div>
</body>
</html>
`;
};

const generateAdminEmail = (data: OrderNotificationRequest): string => {
  const hardwareName = HARDWARE_NAMES[data.hardwareTier] || data.hardwareTier;
  const subscriptionName = SUBSCRIPTION_NAMES[data.subscriptionTier] || data.subscriptionTier;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Recon Order</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #fbbf24; padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #0f172a; margin: 0;">🚨 New Recon Unit Order!</h1>
  </div>
  
  <div style="background: #fffbeb; padding: 20px; border: 1px solid #fcd34d; border-top: none; border-radius: 0 0 8px 8px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Customer:</td>
        <td style="padding: 8px 0;">${data.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${data.customerEmail}">${data.customerEmail}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Order ID:</td>
        <td style="padding: 8px 0; font-family: monospace;">${data.orderId}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Hardware:</td>
        <td style="padding: 8px 0;">${hardwareName} (${formatPrice(data.hardwarePrice)})</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Subscription:</td>
        <td style="padding: 8px 0;">${subscriptionName} (${formatPrice(data.subscriptionPrice)}/mo)</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; font-weight: 600;">Ship To:</td>
        <td style="padding: 8px 0;">
          ${data.shippingAddress.name}<br>
          ${data.shippingAddress.street}<br>
          ${data.shippingAddress.city}, ${data.shippingAddress.state} ${data.shippingAddress.zip}
        </td>
      </tr>
    </table>
    
    <div style="margin-top: 20px; text-align: center;">
      <a href="https://ultriumai.lovable.app/admin/recon-provisioning" 
         style="display: inline-block; background: #0891b2; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
        Go to Provisioning Portal →
      </a>
    </div>
  </div>
</body>
</html>
`;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: OrderNotificationRequest = await req.json();
    console.log("[RECON-ORDER-EMAIL] Processing order notification:", data.orderId);

    const results = [];

    // Send customer confirmation email
    const customerEmail = await resend.emails.send({
      from: "Vanguard Recon <support@ultriumai.com>",
      to: [data.customerEmail],
      subject: `Order Confirmed: ${HARDWARE_NAMES[data.hardwareTier] || "Vanguard Recon"}`,
      html: generateCustomerEmail(data),
    });
    console.log("[RECON-ORDER-EMAIL] Customer email sent:", customerEmail);
    results.push({ type: "customer", ...customerEmail });

    // Send admin notification
    if (data.notifyAdmin !== false) {
      const adminEmail = await resend.emails.send({
        from: "Vanguard Orders <support@ultriumai.com>",
        to: ["admin@ultriumai.com"], // Replace with your admin email
        subject: `🚨 New Recon Order: ${data.customerName} - ${HARDWARE_NAMES[data.hardwareTier]}`,
        html: generateAdminEmail(data),
      });
      console.log("[RECON-ORDER-EMAIL] Admin email sent:", adminEmail);
      results.push({ type: "admin", ...adminEmail });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[RECON-ORDER-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

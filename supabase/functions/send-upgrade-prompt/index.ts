import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[UPGRADE-PROMPT] ${step}${detailsStr}`);
};

interface UpgradePromptRequest {
  email: string;
  name?: string;
  product: string;
  usageHighlights?: {
    activeFeatures?: string[];
    usageCount?: number;
  };
}

// Product-specific upgrade benefits
const PRODUCT_BENEFITS: Record<string, { name: string; color: string; benefits: string[]; price: string; priceUrl: string }> = {
  safesuite: {
    name: 'SafeSuite',
    color: '#10b981',
    benefits: [
      'Unlimited password storage (vs 25 limit)',
      '100+ monthly threat scans (vs 5)',
      'Priority dark web monitoring',
      'Secure file storage (1GB)',
      '2FA authentication',
    ],
    price: '$9.99',
    priceUrl: 'https://ultriumai.lovable.app/pricing/safesuite',
  },
  ai_studio: {
    name: 'AI Studio',
    color: '#8b5cf6',
    benefits: [
      'Create up to 10 Custom GPTs (vs 1)',
      'Expanded AI capacity',
      'Knowledge base uploads',
      'Team collaboration',
      'Priority support',
    ],
    price: '$49',
    priceUrl: 'https://ultriumai.lovable.app/pricing/ai-studio',
  },
  vanguard: {
    name: 'Vanguard',
    color: '#f97316',
    benefits: [
      'Monitor up to 25 endpoints',
      'AI-powered threat detection',
      'Compliance reporting',
      'Real-time alerting',
      'SIEM integrations',
    ],
    price: '$199',
    priceUrl: 'https://ultriumai.lovable.app/pricing/vanguard',
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    const { email, name, product, usageHighlights }: UpgradePromptRequest = await req.json();
    
    logStep("Sending upgrade prompt", { email, product });

    const productInfo = PRODUCT_BENEFITS[product] || PRODUCT_BENEFITS.safesuite;

    const emailResponse = await resend.emails.send({
      from: "UltriumAI <hello@send.ultriumai.com>",
      to: [email],
      subject: `🚀 Unlock more with ${productInfo.name} Pro`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: ${productInfo.color}; margin-bottom: 10px;">You're Getting Value from ${productInfo.name}! 🎉</h1>
            <p style="font-size: 18px; color: #666;">Ready to unlock its full potential?</p>
          </div>

          <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="margin-top: 0; color: #1e293b;">Hi ${name || 'there'}! 👋</h2>
            <p>We've noticed you've been actively using ${productInfo.name}. That's great!</p>
            <p>But did you know you're only using a fraction of what's available?</p>
          </div>

          ${usageHighlights?.activeFeatures ? `
          <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #bfdbfe;">
            <h3 style="margin-top: 0; color: #1e293b;">📊 Your Recent Activity</h3>
            <p>You've been using: <strong>${usageHighlights.activeFeatures.join(', ')}</strong></p>
            <p style="margin-bottom: 0;">Upgrade to unlock even more powerful features!</p>
          </div>
          ` : ''}

          <div style="background: linear-gradient(135deg, ${productInfo.color}15, ${productInfo.color}05); padding: 25px; border-radius: 8px; margin-bottom: 25px; border: 1px solid ${productInfo.color}30;">
            <h3 style="margin-top: 0; color: #1e293b;">✨ What you'll get with Pro:</h3>
            <ul style="padding-left: 20px; margin: 0;">
              ${productInfo.benefits.map(b => `<li style="margin-bottom: 10px; color: #374151;">${b}</li>`).join('')}
            </ul>
          </div>

          <div style="text-align: center; margin-bottom: 25px;">
            <p style="font-size: 24px; font-weight: bold; color: ${productInfo.color}; margin-bottom: 5px;">
              Starting at just ${productInfo.price}/month
            </p>
            <a href="${productInfo.priceUrl}" 
               style="background: ${productInfo.color}; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px; margin-top: 15px;">
              View Plans & Upgrade →
            </a>
          </div>

          <div style="background: #fefce8; padding: 15px; border-radius: 8px; margin-bottom: 25px; border: 1px solid #fef08a; text-align: center;">
            <p style="margin: 0; font-size: 14px; color: #713f12;">
              <strong>💡 Pro tip:</strong> Annual plans save you 20% compared to monthly!
            </p>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666;">
            <p style="font-size: 14px;">
              Questions? Reply to this email or contact <a href="mailto:support@ultriumai.com" style="color: ${productInfo.color};">support@ultriumai.com</a>
            </p>
            <p style="font-size: 12px; color: #94a3b8; margin-top: 15px;">
              You're receiving this because you're an active ${productInfo.name} user.<br>
              <a href="https://ultriumai.lovable.app/settings/notifications" style="color: #94a3b8;">Manage email preferences</a>
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

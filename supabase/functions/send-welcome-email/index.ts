import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, userId }: WelcomeEmailRequest = await req.json();

    console.log('Sending welcome email to:', email);

    const emailResponse = await resend.emails.send({
      from: "UltriumGPT <onboarding@ultriumai.com>",
      to: [email],
      subject: "Welcome to UltriumAI! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to UltriumGPT</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #2563eb; margin-bottom: 10px;">Welcome to UltriumGPT! 🎉</h1>
            <p style="font-size: 18px; color: #666;">Build powerful AI assistants tailored to your business</p>
          </div>

          <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
            <h2 style="color: #1e293b; margin-top: 0;">Hi ${name || 'there'}! 👋</h2>
            <p>Thank you for joining UltriumGPT! You're now part of a community building the future of AI-powered business solutions.</p>
            
            <h3 style="color: #1e293b; margin-top: 25px;">🚀 Get Started in Minutes:</h3>
            <ol style="padding-left: 20px;">
              <li style="margin-bottom: 10px;"><strong>Complete your profile</strong> - Add your details and preferences</li>
              <li style="margin-bottom: 10px;"><strong>Create your first GPT</strong> - Build an AI assistant for your specific needs</li>
              <li style="margin-bottom: 10px;"><strong>Test and refine</strong> - Chat with your GPT and improve its responses</li>
              <li style="margin-bottom: 10px;"><strong>Deploy and share</strong> - Make your GPT available to your team or customers</li>
            </ol>
          </div>

          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://yourdomain.com'}/onboarding" 
               style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; font-size: 16px;">
              Start Your Journey →
            </a>
          </div>

          <div style="background: #fefefe; border: 1px solid #e2e8f0; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
            <h3 style="color: #1e293b; margin-top: 0;">💡 What You Can Build:</h3>
            <ul style="padding-left: 20px;">
              <li>Customer support chatbots</li>
              <li>Internal knowledge assistants</li>
              <li>Sales and lead qualification bots</li>
              <li>Content creation helpers</li>
              <li>Technical support advisors</li>
            </ul>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center; color: #666;">
            <p>Need help? Reply to this email or contact us at <a href="mailto:support@ultriumai.com" style="color: #2563eb;">support@ultriumai.com</a></p>
            <p style="font-size: 14px; margin-top: 20px;">
              UltriumAI, Inc. • (804) 821-1410<br>
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://yourdomain.com'}/terms" style="color: #666;">Terms</a> • 
              <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '') || 'https://yourdomain.com'}/privacy" style="color: #666;">Privacy</a>
            </p>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
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
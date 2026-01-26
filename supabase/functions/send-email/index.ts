import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-EMAIL] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error('Invalid or expired token');
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    const { templateId, to, variables, subject, htmlContent, textContent } = await req.json();

    let emailData = {
      from: 'UltriumAI <hello@send.ultriumai.com>',
      to: to || user.email,
      subject: '',
      html: '',
      text: ''
    };

    if (templateId) {
      // Load template from database
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .eq('user_id', user.id)
        .single();

      if (templateError || !template) {
        throw new Error('Template not found or access denied');
      }

      if (!template.is_active) {
        throw new Error('Template is not active');
      }

      // Replace variables in template
      let processedSubject = template.subject;
      let processedHtml = template.body_html;
      let processedText = template.body_text;

      if (variables) {
        for (const [key, value] of Object.entries(variables)) {
          const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
          processedSubject = processedSubject.replace(regex, String(value));
          processedHtml = processedHtml.replace(regex, String(value));
          processedText = processedText.replace(regex, String(value));
        }
      }

      emailData.subject = processedSubject;
      emailData.html = processedHtml;
      emailData.text = processedText;
    } else {
      // Direct email content
      emailData.subject = subject || 'Notification from UltriumGPT';
      emailData.html = htmlContent || '';
      emailData.text = textContent || '';
    }

    logStep("Sending email", { to: emailData.to, subject: emailData.subject });

    // Send email via Resend
    const emailResponse = await resend.emails.send(emailData);

    if (emailResponse.error) {
      throw new Error(`Resend error: ${emailResponse.error.message}`);
    }

    logStep("Email sent successfully", { emailId: emailResponse.data?.id });

    // Log email activity
    await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'email',
        title: 'Email Sent',
        message: `Email sent to ${emailData.to}: ${emailData.subject}`,
        metadata: {
          email_id: emailResponse.data?.id,
          template_id: templateId,
          recipient: emailData.to
        }
      });

    return new Response(JSON.stringify({ 
      success: true, 
      emailId: emailResponse.data?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    logStep("ERROR in send-email", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);
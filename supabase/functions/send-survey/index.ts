import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface SendSurveyRequest {
  ticketId: string;
  ticketTitle: string;
  clientName: string;
  clientEmail: string;
  technicianName?: string;
  templateId?: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const request: SendSurveyRequest = await req.json();

    const { ticketId, ticketTitle, clientName, clientEmail, technicianName, templateId, userId } = request;

    if (!ticketId || !clientEmail || !userId) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate unique token
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    
    // Token expires in 7 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create survey token
    const { data: tokenData, error: tokenError } = await supabase
      .from('vanguard_survey_tokens')
      .insert({
        user_id: userId,
        template_id: templateId,
        ticket_id: ticketId,
        ticket_title: ticketTitle,
        client_name: clientName,
        client_email: clientEmail,
        technician_name: technicianName,
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (tokenError) {
      console.error('Token creation error:', tokenError);
      throw tokenError;
    }

    // Construct survey URL - using the deployed app URL
    const appUrl = Deno.env.get('APP_URL') || 'https://ultriumai.lovable.app';
    const surveyUrl = `${appUrl}/survey?token=${token}`;

    console.log('Survey token created:', {
      tokenId: tokenData.id,
      ticketId,
      clientEmail,
      surveyUrl,
    });

    // Note: Email sending would be handled by a separate email service (Resend)
    // This function creates the token and returns the survey URL
    // The calling code should handle the actual email delivery

    return new Response(JSON.stringify({
      success: true,
      surveyUrl,
      token: tokenData.id,
      expiresAt: expiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error creating survey:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

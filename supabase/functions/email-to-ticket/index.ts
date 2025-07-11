import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse incoming email webhook data (format depends on email service)
    const emailData = await req.json();
    console.log('Received email webhook:', emailData);

    const {
      to_email,
      from_email,
      from_name,
      subject,
      text_content,
      html_content,
      message_id
    } = emailData;

    // Find MSP email settings based on recipient email
    const { data: emailSettings, error: settingsError } = await supabase
      .from('msp_email_settings')
      .select(`
        *,
        msps (
          id,
          user_id,
          company_name
        )
      `)
      .eq('ingestion_email', to_email)
      .eq('is_active', true)
      .single();

    if (settingsError || !emailSettings) {
      console.error('Email settings not found for:', to_email);
      return new Response(JSON.stringify({ error: 'Email settings not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate AI summary of the email content
    let aiSummary = '';
    if (openAIApiKey && text_content) {
      try {
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: 'You are an AI assistant that creates concise summaries of support tickets. Extract the key issue, urgency level, and any relevant technical details. Keep it under 150 words.'
              },
              {
                role: 'user',
                content: `Subject: ${subject}\n\nContent: ${text_content}`
              }
            ],
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiSummary = aiData.choices[0]?.message?.content || '';
        }
      } catch (error) {
        console.error('AI summary generation failed:', error);
      }
    }

    // Determine priority based on subject keywords
    const urgentKeywords = ['urgent', 'critical', 'emergency', 'down', 'outage'];
    const highKeywords = ['high', 'important', 'asap', 'priority'];
    
    let priority = emailSettings.default_priority;
    const subjectLower = subject.toLowerCase();
    
    if (urgentKeywords.some(keyword => subjectLower.includes(keyword))) {
      priority = 'critical';
    } else if (highKeywords.some(keyword => subjectLower.includes(keyword))) {
      priority = 'high';
    }

    // Create support ticket
    const ticketData = {
      user_id: emailSettings.msps.user_id,
      msp_id: emailSettings.msp_id,
      title: subject,
      description: text_content || html_content || subject,
      priority,
      category: emailSettings.default_category,
      status: 'open',
      requester_name: from_name,
      requester_email: from_email,
      email_thread_id: message_id,
      source_type: 'email',
      ai_summary: aiSummary,
      assigned_to: emailSettings.auto_assign_to,
      last_activity_at: new Date().toISOString(),
    };

    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .insert(ticketData)
      .select()
      .single();

    if (ticketError) {
      throw ticketError;
    }

    console.log('Created ticket:', ticket.id);

    // Send notification if configured
    if (emailSettings.auto_assign_to) {
      await supabase.functions.invoke('send-email', {
        body: {
          templateId: null,
          to: from_email,
          subject: `Ticket Created: ${subject} [#${ticket.id.slice(-8)}]`,
          htmlContent: `
            <h2>Your Support Ticket Has Been Created</h2>
            <p>Thank you for contacting ${emailSettings.business_name}. We have received your request and created ticket #${ticket.id.slice(-8)}.</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Priority:</strong> ${priority}</p>
            ${aiSummary ? `<p><strong>Summary:</strong> ${aiSummary}</p>` : ''}
            <p>We will respond to your request shortly.</p>
            ${emailSettings.email_signature || ''}
          `,
          textContent: `Your support ticket #${ticket.id.slice(-8)} has been created for: ${subject}`
        }
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      ticket_id: ticket.id,
      ticket_number: ticket.id.slice(-8)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing email:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
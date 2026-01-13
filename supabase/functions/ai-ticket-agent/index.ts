import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TIER1_CONFIDENCE_THRESHOLD = 85; // Auto-respond if confidence >= 85%

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-TICKET-AGENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, ticketId, ticketData, techAction, editedSolution, feedbackType } = await req.json();
    logStep("Request parsed", { action, ticketId });

    switch (action) {
      case 'process_new_ticket':
        return await processNewTicket(supabase, ticketId, ticketData, LOVABLE_API_KEY, RESEND_API_KEY);
      
      case 'tech_review_action':
        return await handleTechAction(supabase, ticketId, techAction, editedSolution, RESEND_API_KEY);
      
      case 'user_feedback':
        return await handleUserFeedback(supabase, ticketId, feedbackType);
      
      case 'escalate_to_tech':
        return await escalateToTech(supabase, ticketId);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function processNewTicket(
  supabase: ReturnType<typeof createClient>,
  ticketId: string,
  ticketData: Record<string, unknown>,
  apiKey: string,
  resendKey: string | undefined
) {
  logStep("Processing new ticket", { ticketId, title: ticketData.title });

  // Update status to processing
  await supabase
    .from('vanguard_service_tickets')
    .update({ ai_processing_status: 'processing' })
    .eq('id', ticketId);

  // Generate AI analysis
  const analysis = await analyzeTicket(ticketData, apiKey);
  logStep("AI analysis complete", { 
    confidence: analysis.confidence_score, 
    autoResolvable: analysis.auto_resolvable 
  });

  // Update ticket with AI analysis
  await supabase
    .from('vanguard_service_tickets')
    .update({
      ai_suggested_solution: analysis.solution,
      ai_confidence_score: analysis.confidence_score,
      ai_summary: analysis.summary,
      ai_processing_status: 'completed',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  // Determine tier and take action
  const isTier1 = analysis.confidence_score >= TIER1_CONFIDENCE_THRESHOLD && analysis.auto_resolvable;

  if (isTier1) {
    // TIER 1: Auto-respond to user
    logStep("Tier 1: Auto-responding to user", { confidence: analysis.confidence_score });
    
    // Send email to user with solution
    if (resendKey && ticketData.requester_email) {
      await sendTier1Email(
        resendKey,
        ticketData.requester_email as string,
        ticketData.requester_name as string || 'User',
        ticketData.title as string,
        ticketId,
        analysis.solution,
        analysis.summary
      );
    }

    // Update ticket as auto-responded
    await supabase
      .from('vanguard_service_tickets')
      .update({
        ai_auto_responded: true,
        ai_response_sent_at: new Date().toISOString(),
        status: 'pending_confirmation', // Waiting for user confirmation
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({
        success: true,
        tier: 1,
        action: 'auto_responded',
        message: 'AI solution sent to user for confirmation',
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } else {
    // TIER 2: Send to technician for review
    logStep("Tier 2: Escalating to technician", { confidence: analysis.confidence_score });

    await supabase
      .from('vanguard_service_tickets')
      .update({
        ai_auto_responded: false,
        status: 'pending_tech_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({
        success: true,
        tier: 2,
        action: 'escalated_to_tech',
        message: 'Ticket sent to technician for review with AI suggestions',
        analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function analyzeTicket(ticketData: Record<string, unknown>, apiKey: string) {
  const systemPrompt = `You are Ultrium AI Helpdesk, an expert IT support AI agent. You analyze support tickets and provide solutions.

IMPORTANT: You must determine if a ticket can be auto-resolved (sent directly to the user) or needs technician review.

Tickets suitable for auto-resolution (Tier 1):
- Password resets and account lockouts
- Basic software installation questions
- How-to questions for common software
- Simple connectivity issues with clear solutions
- FAQ-type questions

Tickets requiring technician review (Tier 2):
- Complex technical issues
- Security concerns
- Hardware failures
- Unclear or vague descriptions
- Issues requiring physical access
- Anything involving sensitive data or systems

Be conservative - only mark as auto_resolvable if you're highly confident the solution will work.`;

  const prompt = `Analyze this support ticket:

**Title:** ${ticketData.title}
**Description:** ${ticketData.description}
**Category:** ${ticketData.category || 'General'}
**Priority:** ${ticketData.priority || 'medium'}
**Requester:** ${ticketData.requester_name || 'Not specified'}

Provide your analysis using the analyze_ticket function.`;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'analyze_ticket',
          description: 'Provide structured analysis of the support ticket',
          parameters: {
            type: 'object',
            properties: {
              summary: {
                type: 'string',
                description: 'Brief 2-3 sentence summary of the issue'
              },
              solution: {
                type: 'string',
                description: 'Complete step-by-step solution. Write as if speaking directly to the end user.'
              },
              confidence_score: {
                type: 'integer',
                description: 'Confidence score 0-100. Use 85+ only for straightforward issues with clear solutions.'
              },
              auto_resolvable: {
                type: 'boolean',
                description: 'True ONLY if this is a routine issue with a clear solution that can be sent directly to the user'
              },
              category_suggestion: {
                type: 'string',
                description: 'Suggested category for this ticket'
              },
              priority_suggestion: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'Recommended priority based on impact and urgency'
              },
              tech_notes: {
                type: 'string',
                description: 'Notes for the technician if escalated (not shown to user)'
              }
            },
            required: ['summary', 'solution', 'confidence_score', 'auto_resolvable'],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_ticket' } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("AI API error", { status: response.status, error: errorText });
    throw new Error(`AI API error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

  if (toolCall?.function?.arguments) {
    return JSON.parse(toolCall.function.arguments);
  }

  // Fallback
  return {
    summary: 'Unable to analyze ticket automatically',
    solution: 'This ticket requires manual review by a technician.',
    confidence_score: 30,
    auto_resolvable: false,
    tech_notes: 'AI analysis failed - please review manually'
  };
}

async function sendTier1Email(
  resendKey: string,
  toEmail: string,
  userName: string,
  ticketTitle: string,
  ticketId: string,
  solution: string,
  summary: string
) {
  logStep("Sending Tier 1 email", { to: toEmail, ticketId });

  const baseUrl = 'https://ultriumai.lovable.app';
  const confirmUrl = `${baseUrl}/helpdesk/feedback?ticket=${ticketId}&action=resolved`;
  const needHelpUrl = `${baseUrl}/helpdesk/feedback?ticket=${ticketId}&action=need_help`;

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #06b6d4, #8b5cf6); padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { color: white; margin: 0; font-size: 24px; }
    .content { background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; }
    .solution-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 16px 0; }
    .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin: 8px 8px 8px 0; }
    .btn-success { background: #10b981; color: white; }
    .btn-help { background: #6b7280; color: white; }
    .footer { text-align: center; padding: 16px; color: #6b7280; font-size: 12px; }
    .ai-badge { background: #dbeafe; color: #1d4ed8; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🤖 Ultrium AI Helpdesk</h1>
    </div>
    <div class="content">
      <p>Hi ${userName},</p>
      <p>Our AI assistant has analyzed your support request and found a solution:</p>
      
      <p><strong>Your Issue:</strong> ${ticketTitle}</p>
      <p><em>${summary}</em></p>
      
      <div class="solution-box">
        <p><span class="ai-badge">AI Solution</span></p>
        <div style="white-space: pre-wrap;">${solution}</div>
      </div>
      
      <p><strong>Did this solve your problem?</strong></p>
      <a href="${confirmUrl}" class="btn btn-success">✓ Yes, Issue Resolved</a>
      <a href="${needHelpUrl}" class="btn btn-help">✗ I Still Need Help</a>
      
      <p style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        If this solution worked, click "Yes, Issue Resolved" and we'll close your ticket.
        If you still need help, click "I Still Need Help" and a technician will assist you.
      </p>
    </div>
    <div class="footer">
      <p>Powered by Ultrium AI Helpdesk™ | Ticket #${ticketId.slice(0, 8)}</p>
    </div>
  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Ultrium AI Helpdesk <support@ultriumai.com>',
        to: [toEmail],
        subject: `[AI Solution] ${ticketTitle}`,
        html: emailHtml,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logStep("Email send failed", { error });
    } else {
      logStep("Email sent successfully");
    }
  } catch (error) {
    logStep("Email error", { error: String(error) });
  }
}

async function handleTechAction(
  supabase: ReturnType<typeof createClient>,
  ticketId: string,
  techAction: 'accept' | 'edit' | 'reject',
  editedSolution: string | undefined,
  resendKey: string | undefined
) {
  logStep("Tech action", { ticketId, action: techAction });

  // Get ticket data
  const { data: ticket, error } = await supabase
    .from('vanguard_service_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (error || !ticket) {
    throw new Error('Ticket not found');
  }

  const solutionToSend = techAction === 'edit' ? editedSolution : ticket.ai_suggested_solution;

  if (techAction === 'accept' || techAction === 'edit') {
    // Send solution to user
    if (resendKey && ticket.requester_email) {
      await sendTier1Email(
        resendKey,
        ticket.requester_email,
        ticket.requester_name || 'User',
        ticket.title,
        ticketId,
        solutionToSend,
        ticket.ai_summary || ''
      );
    }

    await supabase
      .from('vanguard_service_tickets')
      .update({
        tech_action: techAction,
        ai_suggested_solution: solutionToSend,
        ai_response_sent_at: new Date().toISOString(),
        status: 'pending_confirmation',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({ success: true, message: 'Solution sent to user' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } else if (techAction === 'reject') {
    // Tech will handle manually
    await supabase
      .from('vanguard_service_tickets')
      .update({
        tech_action: 'reject',
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({ success: true, message: 'AI solution rejected - handling manually' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  throw new Error('Invalid tech action');
}

async function handleUserFeedback(
  supabase: ReturnType<typeof createClient>,
  ticketId: string,
  feedbackType: 'resolved' | 'need_help'
) {
  logStep("User feedback", { ticketId, feedback: feedbackType });

  if (feedbackType === 'resolved') {
    await supabase
      .from('vanguard_service_tickets')
      .update({
        user_feedback: 'resolved',
        status: 'resolved',
        auto_resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_notes: 'Auto-resolved by AI with user confirmation',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({ success: true, message: 'Ticket marked as resolved' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } else {
    // Escalate to technician
    await supabase
      .from('vanguard_service_tickets')
      .update({
        user_feedback: 'need_help',
        status: 'escalated',
        ai_auto_responded: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    return new Response(
      JSON.stringify({ success: true, message: 'Ticket escalated to technician' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function escalateToTech(
  supabase: ReturnType<typeof createClient>,
  ticketId: string
) {
  logStep("Escalating to tech", { ticketId });

  await supabase
    .from('vanguard_service_tickets')
    .update({
      status: 'escalated',
      ai_auto_responded: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  return new Response(
    JSON.stringify({ success: true, message: 'Ticket escalated to technician' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

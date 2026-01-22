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

  // Fetch technicians and KB articles for smart routing
  const [techResult, kbResult] = await Promise.all([
    supabase.from('helpdesk_technicians').select('*').eq('is_active', true),
    supabase.from('helpdesk_kb_articles').select('*').eq('is_published', true)
  ]);

  const technicians = techResult.data || [];
  const kbArticles = kbResult.data || [];

  // Generate comprehensive AI analysis with routing
  const analysis = await analyzeTicketWithRouting(ticketData, technicians, kbArticles, apiKey);
  logStep("AI analysis complete", { 
    confidence: analysis.confidence_score, 
    autoResolvable: analysis.auto_resolvable,
    recommendedTech: analysis.recommended_technician_id,
    suggestedArticles: analysis.suggested_kb_articles?.length || 0
  });

  // Update ticket with comprehensive AI analysis including routing
  await supabase
    .from('vanguard_service_tickets')
    .update({
      ai_suggested_solution: analysis.solution,
      ai_confidence_score: analysis.confidence_score,
      ai_summary: analysis.summary,
      ai_processing_status: 'completed',
      // Classification fields
      ai_detected_category: analysis.detected_category,
      ai_category_confidence: analysis.category_confidence,
      ai_sub_category: analysis.sub_category,
      // Sentiment analysis
      ai_user_sentiment: analysis.user_sentiment,
      ai_sentiment_indicators: analysis.sentiment_indicators,
      ai_frustration_level: analysis.frustration_level,
      // Priority detection
      ai_detected_priority: analysis.detected_priority,
      ai_priority_factors: analysis.priority_factors,
      ai_business_impact: analysis.business_impact,
      ai_users_affected: analysis.users_affected,
      // Additional insights
      ai_keywords: analysis.keywords,
      ai_requires_escalation: analysis.requires_escalation,
      ai_escalation_reason: analysis.escalation_reason,
      ai_estimated_resolution_time: analysis.estimated_resolution_time,
      ai_tech_notes: analysis.tech_notes,
      ai_similar_issues_hint: analysis.similar_issues_hint,
      // Smart routing
      ai_recommended_technician_id: analysis.recommended_technician_id,
      ai_routing_reason: analysis.routing_reason,
      ai_routing_confidence: analysis.routing_confidence,
      // KB article suggestions
      ai_suggested_kb_articles: analysis.suggested_kb_articles,
      ai_kb_article_relevance: analysis.kb_article_relevance,
      // SLA prediction
      ai_predicted_sla_hours: analysis.predicted_sla_hours,
      ai_sla_confidence: analysis.sla_confidence,
      ai_sla_factors: analysis.sla_factors,
      ai_complexity_score: analysis.complexity_score,
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
  const systemPrompt = `You are SafeDesk AI, an expert IT support AI agent. You analyze support tickets and provide solutions.

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

Be conservative - only mark as auto_resolvable if you're highly confident the solution will work.

CLASSIFICATION: Categorize tickets accurately into one of these types:
- hardware: Physical equipment issues
- software: Application problems, installation, updates
- network: Connectivity, VPN, internet issues
- security: Password resets, access control, threats
- email: Outlook, email delivery, calendar
- printer: Print jobs, drivers, connectivity
- mobile: Phones, tablets, mobile apps
- account: User accounts, permissions, AD
- data: File recovery, backup, storage
- other: Miscellaneous issues

SENTIMENT ANALYSIS: Detect the user's emotional state:
- frustrated: Angry tone, multiple attempts mentioned, urgency
- urgent: Business impact, deadline pressure
- confused: Unclear descriptions, asking basic questions
- neutral: Straightforward requests
- appreciative: Positive tone, thank you messages

PRIORITY DETECTION: Assess true priority based on:
- Business impact (affects many users = higher)
- Security implications (security issue = higher)
- Time sensitivity (deadline mentioned = higher)
- User role (executive = consider higher)`;

  const prompt = `Analyze this support ticket comprehensively:

**Title:** ${ticketData.title}
**Description:** ${ticketData.description}
**Category:** ${ticketData.category || 'General'}
**Priority:** ${ticketData.priority || 'medium'}
**Requester:** ${ticketData.requester_name || 'Not specified'}
**Requester Email:** ${ticketData.requester_email || 'Not specified'}

Provide your complete analysis using the analyze_ticket function. Include classification, sentiment, and priority assessment.`;

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
          description: 'Provide structured analysis of the support ticket including classification, sentiment, and priority',
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
              // Classification fields
              detected_category: {
                type: 'string',
                enum: ['hardware', 'software', 'network', 'security', 'email', 'printer', 'mobile', 'account', 'data', 'other'],
                description: 'AI-detected category for the ticket'
              },
              category_confidence: {
                type: 'integer',
                description: 'Confidence in category detection 0-100'
              },
              sub_category: {
                type: 'string',
                description: 'More specific sub-category (e.g., "password_reset" within "security")'
              },
              // Sentiment analysis
              user_sentiment: {
                type: 'string',
                enum: ['frustrated', 'urgent', 'confused', 'neutral', 'appreciative'],
                description: 'Detected emotional state of the user'
              },
              sentiment_indicators: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key phrases that indicate the sentiment'
              },
              frustration_level: {
                type: 'integer',
                description: 'Frustration level 0-10 (10 = extremely frustrated)'
              },
              // Priority detection
              detected_priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical'],
                description: 'AI-recommended priority based on impact and urgency'
              },
              priority_factors: {
                type: 'array',
                items: { type: 'string' },
                description: 'Reasons for the priority recommendation'
              },
              business_impact: {
                type: 'string',
                enum: ['minimal', 'moderate', 'significant', 'severe'],
                description: 'Estimated business impact'
              },
              users_affected: {
                type: 'string',
                enum: ['single', 'team', 'department', 'organization'],
                description: 'Scope of affected users'
              },
              // Additional insights
              keywords: {
                type: 'array',
                items: { type: 'string' },
                description: 'Key technical terms extracted from the ticket'
              },
              requires_escalation: {
                type: 'boolean',
                description: 'Whether this needs immediate escalation regardless of AI confidence'
              },
              escalation_reason: {
                type: 'string',
                description: 'Reason for immediate escalation if applicable'
              },
              estimated_resolution_time: {
                type: 'string',
                description: 'Estimated time to resolve (e.g., "15 minutes", "1 hour", "4 hours")'
              },
              tech_notes: {
                type: 'string',
                description: 'Notes for the technician if escalated (not shown to user)'
              },
              similar_issues_hint: {
                type: 'string',
                description: 'Hint about similar past issues or known problems'
              }
            },
            required: ['summary', 'solution', 'confidence_score', 'auto_resolvable', 'detected_category', 'user_sentiment', 'detected_priority'],
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
    detected_category: 'other',
    user_sentiment: 'neutral',
    detected_priority: 'medium',
    tech_notes: 'AI analysis failed - please review manually'
  };
}

async function analyzeTicketWithRouting(
  ticketData: Record<string, unknown>,
  technicians: Array<Record<string, unknown>>,
  kbArticles: Array<Record<string, unknown>>,
  apiKey: string
) {
  // Format technician info for AI
  const techInfo = technicians.map(t => ({
    id: t.id,
    name: t.display_name,
    specializations: t.specializations,
    skill_levels: t.skill_levels,
    current_load: t.current_ticket_count,
    max_load: t.max_concurrent_tickets,
    availability: t.availability_status,
    avg_resolution_time: t.avg_resolution_time_minutes
  }));

  // Format KB articles for AI
  const kbInfo = kbArticles.map(a => ({
    id: a.id,
    title: a.title,
    category: a.category,
    subcategory: a.subcategory,
    tags: a.tags,
    keywords: a.keywords,
    excerpt: a.excerpt
  }));

  const systemPrompt = `You are SafeDesk AI, an expert IT support AI agent with smart routing capabilities.

Your tasks:
1. Analyze the ticket and provide a solution
2. Recommend the BEST technician based on their skills and current workload
3. Suggest relevant knowledge base articles
4. Predict SLA/resolution time

TECHNICIAN ROUTING RULES:
- Match ticket category to technician specializations
- Consider skill levels (1-5 scale)
- Prefer technicians with lower current workload
- Only route to "available" technicians
- High frustration tickets need senior techs (higher skill levels)

SLA PREDICTION FACTORS:
- Ticket complexity (1-10)
- Required expertise level
- Similar historical patterns
- Current workload of assigned tech

Available Technicians:
${JSON.stringify(techInfo, null, 2)}

Available KB Articles:
${JSON.stringify(kbInfo, null, 2)}`;

  const prompt = `Analyze this support ticket and provide routing recommendations:

**Title:** ${ticketData.title}
**Description:** ${ticketData.description}
**Category:** ${ticketData.category || 'General'}
**Priority:** ${ticketData.priority || 'medium'}
**Requester:** ${ticketData.requester_name || 'Not specified'}
**Requester Email:** ${ticketData.requester_email || 'Not specified'}

Provide complete analysis with technician routing and KB article suggestions.`;

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
          name: 'analyze_ticket_with_routing',
          description: 'Analyze ticket with smart routing, KB suggestions, and SLA prediction',
          parameters: {
            type: 'object',
            properties: {
              // Core analysis
              summary: { type: 'string', description: 'Brief 2-3 sentence summary' },
              solution: { type: 'string', description: 'Step-by-step solution for the user' },
              confidence_score: { type: 'integer', description: 'Confidence 0-100' },
              auto_resolvable: { type: 'boolean', description: 'Can be auto-resolved' },
              
              // Classification
              detected_category: {
                type: 'string',
                enum: ['hardware', 'software', 'network', 'security', 'email', 'printer', 'mobile', 'account', 'data', 'other']
              },
              category_confidence: { type: 'integer' },
              sub_category: { type: 'string' },
              
              // Sentiment
              user_sentiment: {
                type: 'string',
                enum: ['frustrated', 'urgent', 'confused', 'neutral', 'appreciative']
              },
              sentiment_indicators: { type: 'array', items: { type: 'string' } },
              frustration_level: { type: 'integer', description: '0-10' },
              
              // Priority
              detected_priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'critical']
              },
              priority_factors: { type: 'array', items: { type: 'string' } },
              business_impact: {
                type: 'string',
                enum: ['minimal', 'moderate', 'significant', 'severe']
              },
              users_affected: {
                type: 'string',
                enum: ['single', 'team', 'department', 'organization']
              },
              
              // Insights
              keywords: { type: 'array', items: { type: 'string' } },
              requires_escalation: { type: 'boolean' },
              escalation_reason: { type: 'string' },
              estimated_resolution_time: { type: 'string' },
              tech_notes: { type: 'string' },
              similar_issues_hint: { type: 'string' },
              
              // SMART ROUTING
              recommended_technician_id: {
                type: 'string',
                description: 'UUID of the best technician to handle this ticket'
              },
              routing_reason: {
                type: 'string',
                description: 'Why this technician was selected'
              },
              routing_confidence: {
                type: 'integer',
                description: 'Confidence in routing decision 0-100'
              },
              
              // KB ARTICLE SUGGESTIONS
              suggested_kb_articles: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of KB article UUIDs that may help'
              },
              kb_article_relevance: {
                type: 'object',
                description: 'Map of article_id to relevance score (0-100)'
              },
              
              // SLA PREDICTION
              predicted_sla_hours: {
                type: 'number',
                description: 'Predicted hours to resolution'
              },
              sla_confidence: {
                type: 'integer',
                description: 'Confidence in SLA prediction 0-100'
              },
              sla_factors: {
                type: 'array',
                items: { type: 'string' },
                description: 'Factors affecting SLA prediction'
              },
              complexity_score: {
                type: 'integer',
                description: 'Ticket complexity 1-10'
              }
            },
            required: ['summary', 'solution', 'confidence_score', 'auto_resolvable', 'detected_category', 'user_sentiment', 'detected_priority'],
            additionalProperties: false
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'analyze_ticket_with_routing' } }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logStep("AI API error in routing", { status: response.status, error: errorText });
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
    detected_category: 'other',
    user_sentiment: 'neutral',
    detected_priority: 'medium',
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
      <h1>🤖 SafeDesk AI</h1>
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
      <p>Powered by SafeDesk™ | Ticket #${ticketId.slice(0, 8)}</p>
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
        from: 'SafeDesk AI <support@ultriumai.com>',
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

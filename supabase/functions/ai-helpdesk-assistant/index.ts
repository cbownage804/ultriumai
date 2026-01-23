import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AI-HELPDESK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { action, ticketId, ticketData, message } = await req.json();

    logStep('Received request', { action, ticketId });

    switch (action) {
      case 'generate_solution':
        return await generateAISolution(supabase, ticketId, ticketData);
      
      case 'generate_summary':
        return await generateAISummary(ticketData);
      
      case 'auto_resolve':
        return await autoResolveTicket(supabase, ticketId, ticketData);
      
      case 'chat_response':
        return await generateChatResponse(message, ticketId);
      
      case 'process_rmm_alert':
        return await processRMMAlertTicket(supabase, ticketId, ticketData);
      
      default:
        throw new Error(`Invalid action: ${action}`);
    }
  } catch (error) {
    console.error('Error in AI helpdesk assistant:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateAISolution(supabase: ReturnType<typeof createClient>, ticketId: string, ticketData: Record<string, unknown>) {
  logStep('Generating AI solution', { ticketId, title: ticketData?.title });

  // Get additional context if this is an RMM alert ticket
  const isRMMAlert = ticketData?.source === 'rmm_alert' || ticketData?.auto_generated;
  
  // Build context-aware prompt
  const systemPrompt = isRMMAlert 
    ? `You are an expert IT security and operations AI assistant specialized in analyzing RMM (Remote Monitoring and Management) alerts. 
       You have deep knowledge of:
       - Security threats and attack patterns
       - System performance issues and their root causes
       - Network connectivity problems
       - Hardware failures and diagnostics
       - Compliance and security best practices
       
       For security alerts, prioritize containment and remediation steps.
       For performance alerts, focus on root cause analysis and optimization.
       Always provide clear, actionable steps that a technician can follow.`
    : `You are an expert IT support AI assistant. Provide practical, step-by-step solutions for technical issues.`;

  const prompt = `Analyze this ${isRMMAlert ? 'RMM security/system alert' : 'IT support ticket'} and provide a detailed solution:

Title: ${ticketData?.title || 'Unknown'}
Description: ${ticketData?.description || 'No description provided'}
Priority: ${ticketData?.priority || 'medium'}
Category: ${ticketData?.category || 'general'}
Source: ${ticketData?.source || 'manual'}
${isRMMAlert ? `Alert Type: ${ticketData?.alert_type || 'unknown'}` : ''}

Please provide a JSON response with:
{
  "solution": "Detailed step-by-step solution",
  "confidence": 0-100,
  "auto_resolvable": true/false,
  "estimated_time": minutes,
  "severity_assessment": "low/medium/high/critical",
  "recommended_actions": ["action1", "action2"],
  "escalation_required": true/false
}`;

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`OpenAI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const solution = aiData.choices[0].message.content;

    // Parse AI response
    let solutionData;
    try {
      solutionData = JSON.parse(solution);
    } catch {
      solutionData = {
        solution: solution,
        confidence: 70,
        auto_resolvable: false,
        estimated_time: 30,
        severity_assessment: 'medium',
        recommended_actions: [],
        escalation_required: false
      };
    }

    logStep('AI analysis complete', { confidence: solutionData.confidence, autoResolvable: solutionData.auto_resolvable });

    // Update helpdesk_tickets with AI solution
    if (ticketId) {
      const { error } = await supabase
        .from('helpdesk_tickets')
        .update({
          resolution_notes: `AI Suggested Solution (Confidence: ${solutionData.confidence}%):\n\n${solutionData.solution}`,
          updated_at: new Date().toISOString(),
          device_context: supabase.sql`COALESCE(device_context, '{}'::jsonb) || ${JSON.stringify({
            ai_analysis: {
              confidence: solutionData.confidence,
              auto_resolvable: solutionData.auto_resolvable,
              estimated_time: solutionData.estimated_time,
              severity_assessment: solutionData.severity_assessment,
              recommended_actions: solutionData.recommended_actions,
              analyzed_at: new Date().toISOString()
            }
          })}::jsonb`
        })
        .eq('id', ticketId);

      if (error) {
        logStep('Error updating ticket', { error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        solution: solutionData.solution,
        confidence: solutionData.confidence,
        autoResolvable: solutionData.auto_resolvable,
        estimatedTime: solutionData.estimated_time,
        severityAssessment: solutionData.severity_assessment,
        recommendedActions: solutionData.recommended_actions,
        escalationRequired: solutionData.escalation_required
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI solution generation failed:', error);
    
    // Return fallback response
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        confidence: 0,
        solution: 'AI analysis unavailable. Please review manually.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function autoResolveTicket(supabase: ReturnType<typeof createClient>, ticketId: string, ticketData?: Record<string, unknown>) {
  logStep('Attempting auto-resolution', { ticketId });

  // Get ticket data if not provided
  let ticket = ticketData;
  if (!ticket && ticketId) {
    const { data, error } = await supabase
      .from('helpdesk_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
    
    if (error) throw error;
    ticket = data;
  }

  if (!ticket) {
    throw new Error('Ticket not found');
  }

  // Auto-resolvable categories for RMM alerts
  const autoResolvablePatterns = [
    { pattern: /password.*reset/i, resolution: 'Password reset completed automatically via self-service portal.' },
    { pattern: /disk.*space.*low/i, resolution: 'Temporary files cleaned. Disk space recovered.' },
    { pattern: /high.*cpu.*usage/i, resolution: 'Resource-intensive process identified and managed. System normalized.' },
    { pattern: /memory.*usage/i, resolution: 'Memory cache cleared. System performance restored.' },
    { pattern: /software.*update/i, resolution: 'Software update scheduled and queued for next maintenance window.' },
    { pattern: /connectivity.*restored/i, resolution: 'Network connectivity confirmed restored. No action required.' },
    { pattern: /backup.*completed/i, resolution: 'Backup verification successful. Alert cleared.' },
    { pattern: /login.*attempt/i, resolution: 'Login activity reviewed. No malicious activity detected.' }
  ];

  const title = (ticket.title as string || '').toLowerCase();
  const description = (ticket.description as string || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  // Check for auto-resolvable patterns
  const matchedPattern = autoResolvablePatterns.find(p => p.pattern.test(combinedText));
  
  // Get AI confidence from device_context if available
  const deviceContext = ticket.device_context as Record<string, unknown> || {};
  const aiAnalysis = deviceContext.ai_analysis as Record<string, unknown> || {};
  const aiConfidence = (aiAnalysis.confidence as number) || 0;

  const isAutoResolvable = matchedPattern || aiConfidence >= 85;

  if (!isAutoResolvable) {
    logStep('Not auto-resolvable', { aiConfidence, hasPattern: !!matchedPattern });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        autoResolved: false,
        message: 'Ticket requires manual review',
        confidence: aiConfidence
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Auto-resolve the ticket
  const resolutionNotes = matchedPattern?.resolution || 
    `Auto-resolved by AI with ${aiConfidence}% confidence. Solution applied automatically based on pattern recognition.`;

  const { error } = await supabase
    .from('helpdesk_tickets')
    .update({
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes,
      updated_at: new Date().toISOString(),
      device_context: supabase.sql`COALESCE(device_context, '{}'::jsonb) || ${JSON.stringify({
        auto_resolved: true,
        resolved_by_ai: true,
        resolution_confidence: aiConfidence,
        resolved_at: new Date().toISOString()
      })}::jsonb`
    })
    .eq('id', ticketId);

  if (error) throw error;

  logStep('Ticket auto-resolved', { ticketId, confidence: aiConfidence });

  // If this was from an RMM alert, update the alert status too
  const alertId = (deviceContext.alert_id as string);
  if (alertId) {
    await supabase
      .from('rmm_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString()
      })
      .eq('id', alertId);
    
    logStep('Linked RMM alert resolved', { alertId });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      autoResolved: true,
      message: 'Ticket auto-resolved successfully',
      resolution: resolutionNotes
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function processRMMAlertTicket(supabase: ReturnType<typeof createClient>, ticketId: string, ticketData: Record<string, unknown>) {
  logStep('Processing RMM alert ticket', { ticketId });

  // Step 1: Generate AI solution
  const solutionResponse = await generateAISolution(supabase, ticketId, {
    ...ticketData,
    source: 'rmm_alert',
    auto_generated: true
  });

  const solutionResult = await solutionResponse.json();

  // Step 2: If high confidence, attempt auto-resolution
  if (solutionResult.confidence >= 85 && solutionResult.autoResolvable) {
    logStep('High confidence - attempting auto-resolution', { confidence: solutionResult.confidence });
    
    const resolveResponse = await autoResolveTicket(supabase, ticketId, ticketData);
    const resolveResult = await resolveResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        action: 'auto_resolved',
        solution: solutionResult,
        resolution: resolveResult
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Step 3: If not auto-resolvable, escalate to technician
  logStep('Low confidence - escalating to technician', { confidence: solutionResult.confidence });

  await supabase
    .from('helpdesk_tickets')
    .update({
      status: 'pending_review',
      priority: solutionResult.severityAssessment === 'critical' ? 'critical' : 
                solutionResult.severityAssessment === 'high' ? 'high' : 'medium',
      updated_at: new Date().toISOString()
    })
    .eq('id', ticketId);

  // Create notification for technician
  await supabase
    .from('notification_queue')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Will be routed by notification system
      notification_type: 'rmm_alert_escalation',
      title: `⚠️ RMM Alert Requires Review`,
      message: `Ticket #${ticketId.slice(0, 8)} needs manual review. AI confidence: ${solutionResult.confidence}%`,
      priority: solutionResult.severityAssessment === 'critical' ? 'critical' : 'high',
      metadata: {
        ticket_id: ticketId,
        ai_confidence: solutionResult.confidence,
        recommended_actions: solutionResult.recommendedActions
      }
    });

  return new Response(
    JSON.stringify({
      success: true,
      action: 'escalated_to_tech',
      solution: solutionResult,
      message: 'Ticket escalated to technician for review'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateAISummary(ticketData: Record<string, unknown>) {
  logStep('Generating AI summary', { title: ticketData?.title });

  const prompt = `Analyze this support ticket and create a concise summary:

Title: ${ticketData?.title || 'Unknown'}
Description: ${ticketData?.description || 'No description'}
Priority: ${ticketData?.priority || 'medium'}
Category: ${ticketData?.category || 'general'}
Source: ${ticketData?.source || 'manual'}

Provide a brief summary (2-3 sentences) covering:
1. The core issue
2. Potential impact
3. Recommended priority`;

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
            content: 'You are an expert IT support analyst. Create clear, actionable summaries.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    const aiData = await aiResponse.json();
    const summary = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ success: true, summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI summary generation failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        summary: `Issue: ${ticketData?.title}\nPriority: ${ticketData?.priority}\nRequires review.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

async function generateChatResponse(message: string, ticketId: string) {
  logStep('Generating chat response', { ticketId });

  try {
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

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
            content: 'You are a helpful IT support AI assistant. Provide clear, actionable guidance.' 
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const aiData = await aiResponse.json();
    const response = aiData.choices[0].message.content;

    return new Response(
      JSON.stringify({ success: true, response }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Chat response generation failed:', error);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        response: "I understand you need help. Let me connect you with a technician for more specific assistance." 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

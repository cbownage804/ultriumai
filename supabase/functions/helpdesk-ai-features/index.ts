import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, ...params } = await req.json();
    console.log(`[HELPDESK-AI] Action: ${action}`);

    switch (action) {
      case 'chat':
        return await handleChat(supabase, params, LOVABLE_API_KEY);
      case 'detect_duplicates':
        return await detectDuplicates(supabase, params, LOVABLE_API_KEY);
      case 'predict_escalation':
        return await predictEscalation(supabase, params, LOVABLE_API_KEY);
      case 'suggest_responses':
        return await suggestResponses(supabase, params, LOVABLE_API_KEY);
      case 'translate_ticket':
        return await translateTicket(supabase, params, LOVABLE_API_KEY);
      case 'detect_patterns':
        return await detectPatterns(supabase, params, LOVABLE_API_KEY);
      case 'generate_handoff':
        return await generateHandoffSummary(supabase, params, LOVABLE_API_KEY);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[HELPDESK-AI] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// AI Chat Handler - Streaming
async function handleChat(supabase: any, params: any, apiKey: string) {
  const { conversationId, sessionId, message, userName, userEmail } = params;
  
  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const { data: conv } = await supabase.from('helpdesk_chat_conversations').insert({
      session_id: sessionId || crypto.randomUUID(),
      user_name: userName,
      user_email: userEmail,
    }).select().single();
    convId = conv.id;
  }

  // Save user message
  await supabase.from('helpdesk_chat_messages').insert({
    conversation_id: convId,
    role: 'user',
    content: message
  });

  // Get conversation history
  const { data: history } = await supabase
    .from('helpdesk_chat_messages')
    .select('role, content')
    .eq('conversation_id', convId)
    .order('created_at', { ascending: true });

  // Fetch KB articles for context
  const { data: kbArticles } = await supabase
    .from('helpdesk_kb_articles')
    .select('title, excerpt, category')
    .eq('is_published', true)
    .limit(10);

  const systemPrompt = `You are Ultrium AI Helpdesk Assistant, a friendly and knowledgeable IT support chatbot.

Your goals:
1. Help users resolve their IT issues through conversation
2. Provide clear, step-by-step solutions when possible
3. Know when to escalate to a human technician
4. Be empathetic and professional

Guidelines:
- Ask clarifying questions if the issue is unclear
- Provide solutions in numbered steps
- If you can't solve the issue after 3-4 exchanges, offer to create a ticket
- Never make up solutions - if unsure, escalate

Available Knowledge Base Articles:
${kbArticles?.map(a => `- ${a.title} (${a.category}): ${a.excerpt}`).join('\n')}

When you can fully resolve an issue, end with: "[RESOLVED]"
When the user needs a ticket created, end with: "[CREATE_TICKET]"`;

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
        ...history.map((m: any) => ({ role: m.role, content: m.content }))
      ],
      stream: true
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[CHAT] AI error:', err);
    throw new Error('AI service error');
  }

  // Return streaming response
  return new Response(response.body, {
    headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' }
  });
}

// Duplicate Detection
async function detectDuplicates(supabase: any, params: any, apiKey: string) {
  const { ticketId, title, description } = params;

  // Get recent open tickets
  const { data: recentTickets } = await supabase
    .from('vanguard_service_tickets')
    .select('id, title, description, created_at, status')
    .neq('id', ticketId || '')
    .in('status', ['open', 'in_progress', 'pending_tech_review'])
    .order('created_at', { ascending: false })
    .limit(20);

  if (!recentTickets?.length) {
    return new Response(JSON.stringify({ duplicates: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a duplicate ticket detection AI. Analyze tickets and identify potential duplicates.' },
        { role: 'user', content: `New Ticket:\nTitle: ${title}\nDescription: ${description}\n\nExisting Tickets:\n${recentTickets.map((t: any) => `ID: ${t.id}\nTitle: ${t.title}\nDescription: ${t.description}\n---`).join('\n')}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'detect_duplicates',
          parameters: {
            type: 'object',
            properties: {
              duplicates: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    ticket_id: { type: 'string' },
                    confidence: { type: 'integer', description: '0-100' },
                    reason: { type: 'string' }
                  }
                }
              }
            },
            required: ['duplicates']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'detect_duplicates' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{"duplicates":[]}');

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Escalation Prediction
async function predictEscalation(supabase: any, params: any, apiKey: string) {
  const { ticketId } = params;

  const { data: ticket } = await supabase
    .from('vanguard_service_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) throw new Error('Ticket not found');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are an escalation prediction AI. Analyze tickets and predict likelihood of escalation based on complexity, user sentiment, and issue type.' },
        { role: 'user', content: `Ticket:\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nCategory: ${ticket.ai_detected_category || ticket.category}\nSentiment: ${ticket.ai_user_sentiment}\nFrustration: ${ticket.ai_frustration_level}/10\nPriority: ${ticket.ai_detected_priority || ticket.priority}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'predict_escalation',
          parameters: {
            type: 'object',
            properties: {
              probability: { type: 'integer', description: 'Escalation probability 0-100' },
              factors: { type: 'array', items: { type: 'string' } },
              recommended_action: { type: 'string' },
              risk_level: { type: 'string', enum: ['low', 'medium', 'high'] }
            },
            required: ['probability', 'factors', 'risk_level']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'predict_escalation' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}');

  // Update ticket
  await supabase.from('vanguard_service_tickets').update({
    ai_escalation_probability: result.probability,
    ai_escalation_factors: result.factors
  }).eq('id', ticketId);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Canned Response Suggestions
async function suggestResponses(supabase: any, params: any, apiKey: string) {
  const { ticketId, ticketTitle, ticketDescription, category } = params;

  // Get canned responses
  const { data: responses } = await supabase
    .from('helpdesk_canned_responses')
    .select('*')
    .eq('is_active', true);

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a response suggestion AI. Match tickets to the most relevant canned responses.' },
        { role: 'user', content: `Ticket:\nTitle: ${ticketTitle}\nDescription: ${ticketDescription}\nCategory: ${category}\n\nAvailable Responses:\n${responses?.map((r: any) => `ID: ${r.id}\nTitle: ${r.title}\nCategory: ${r.category}\nKeywords: ${r.keywords?.join(', ')}`).join('\n---\n')}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'suggest_responses',
          parameters: {
            type: 'object',
            properties: {
              suggestions: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    response_id: { type: 'string' },
                    relevance: { type: 'integer' },
                    customization_hint: { type: 'string' }
                  }
                }
              }
            },
            required: ['suggestions']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'suggest_responses' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{"suggestions":[]}');

  // Enrich with full response content
  const enriched = result.suggestions?.map((s: any) => {
    const full = responses?.find((r: any) => r.id === s.response_id);
    return { ...s, response: full };
  });

  return new Response(JSON.stringify({ suggestions: enriched }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Multi-language Translation
async function translateTicket(supabase: any, params: any, apiKey: string) {
  const { ticketId, title, description } = params;

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a translation AI. Detect the language and translate to English if needed.' },
        { role: 'user', content: `Detect language and translate if not English:\n\nTitle: ${title}\n\nDescription: ${description}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'translate',
          parameters: {
            type: 'object',
            properties: {
              detected_language: { type: 'string' },
              is_english: { type: 'boolean' },
              translated_title: { type: 'string' },
              translated_description: { type: 'string' }
            },
            required: ['detected_language', 'is_english']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'translate' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}');

  if (ticketId && !result.is_english) {
    await supabase.from('vanguard_service_tickets').update({
      original_language: result.detected_language,
      translated_title: result.translated_title,
      translated_description: result.translated_description
    }).eq('id', ticketId);
  }

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Proactive Issue Detection
async function detectPatterns(supabase: any, params: any, apiKey: string) {
  const { timeRange = '24h' } = params;

  // Get recent tickets
  const hoursAgo = timeRange === '24h' ? 24 : timeRange === '7d' ? 168 : 24;
  const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString();

  const { data: recentTickets } = await supabase
    .from('vanguard_service_tickets')
    .select('title, description, ai_detected_category, ai_keywords, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  if (!recentTickets?.length) {
    return new Response(JSON.stringify({ patterns: [], alerts: [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a pattern detection AI. Analyze recent tickets to identify emerging issues, outages, or trends that may affect multiple users.' },
        { role: 'user', content: `Analyze these ${recentTickets.length} tickets from the last ${timeRange}:\n${recentTickets.map((t: any) => `- ${t.title} (${t.ai_detected_category}): ${t.description?.substring(0, 100)}`).join('\n')}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'detect_patterns',
          parameters: {
            type: 'object',
            properties: {
              patterns: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string' },
                    affected_category: { type: 'string' },
                    ticket_count: { type: 'integer' },
                    severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                    recommended_action: { type: 'string' }
                  }
                }
              },
              alerts: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    message: { type: 'string' },
                    severity: { type: 'string' }
                  }
                }
              }
            },
            required: ['patterns', 'alerts']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'detect_patterns' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{"patterns":[],"alerts":[]}');

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

// Generate Handoff Summary
async function generateHandoffSummary(supabase: any, params: any, apiKey: string) {
  const { ticketId, fromTechId, toTechId } = params;

  // Get ticket with full history
  const { data: ticket } = await supabase
    .from('vanguard_service_tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (!ticket) throw new Error('Ticket not found');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'You are a handoff summary AI. Create concise summaries for ticket transfers between technicians.' },
        { role: 'user', content: `Generate a handoff summary for:\n\nTicket: ${ticket.title}\nDescription: ${ticket.description}\nCategory: ${ticket.ai_detected_category}\nPriority: ${ticket.ai_detected_priority}\nSentiment: ${ticket.ai_user_sentiment}\nAI Notes: ${ticket.ai_tech_notes}\nCurrent Status: ${ticket.status}` }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'generate_handoff',
          parameters: {
            type: 'object',
            properties: {
              summary: { type: 'string', description: 'Concise 2-3 sentence summary' },
              key_points: { type: 'array', items: { type: 'string' } },
              attempted_solutions: { type: 'array', items: { type: 'string' } },
              next_steps: { type: 'array', items: { type: 'string' } },
              user_context: { type: 'string' }
            },
            required: ['summary', 'key_points', 'next_steps']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'generate_handoff' } }
    }),
  });

  const data = await response.json();
  const result = JSON.parse(data.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments || '{}');

  // Save handoff record
  await supabase.from('helpdesk_ticket_handoffs').insert({
    ticket_id: ticketId,
    from_technician_id: fromTechId,
    to_technician_id: toTechId,
    ai_generated_summary: result.summary
  });

  // Update ticket
  await supabase.from('vanguard_service_tickets').update({
    ai_handoff_summary: result.summary
  }).eq('id', ticketId);

  return new Response(JSON.stringify(result), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      ticketContext, 
      deviceInfo, 
      kbArticles,
      previousTickets,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Technician Copilot for an MSP helpdesk platform. Your role is to assist technicians in troubleshooting and resolving IT issues efficiently.

You have access to:
- The current ticket/issue context
- Device information and history
- Relevant KB articles
- Similar past tickets and their resolutions

Your responses should:
1. Analyze the issue and identify potential root causes
2. Suggest step-by-step troubleshooting procedures
3. Reference relevant KB articles when applicable
4. Provide command snippets or scripts if helpful
5. Suggest escalation paths if needed
6. Be concise but thorough

Format your response as JSON with:
{
  "analysis": "Brief analysis of the issue",
  "rootCauses": ["Possible cause 1", "Possible cause 2"],
  "troubleshootingSteps": [
    {"step": 1, "action": "Description", "commands": ["optional commands"]},
    ...
  ],
  "relevantKBArticles": [{"title": "...", "relevance": "why it's relevant"}],
  "suggestedResolution": "Most likely fix",
  "escalationAdvice": "When to escalate and to whom",
  "confidenceLevel": "high|medium|low",
  "estimatedTimeMinutes": 15
}`;

    const userMessage = `
Technician Query: ${query}

${ticketContext ? `Current Ticket Context:
${JSON.stringify(ticketContext, null, 2)}` : ''}

${deviceInfo ? `Device Information:
${JSON.stringify(deviceInfo, null, 2)}` : ''}

${kbArticles?.length > 0 ? `Available KB Articles:
${kbArticles.map((kb: any) => `- ${kb.title}: ${kb.summary}`).join('\n')}` : ''}

${previousTickets?.length > 0 ? `Similar Past Tickets:
${previousTickets.map((t: any) => `- ${t.title} (${t.status}): ${t.resolution || 'No resolution noted'}`).join('\n')}` : ''}

Please analyze this issue and provide troubleshooting guidance.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let guidance;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        guidance = JSON.parse(jsonMatch[0]);
      } else {
        guidance = {
          analysis: content,
          troubleshootingSteps: [],
          suggestedResolution: 'See analysis above',
          confidenceLevel: 'medium'
        };
      }
    } catch {
      guidance = {
        analysis: content,
        troubleshootingSteps: [],
        suggestedResolution: 'See analysis above',
        confidenceLevel: 'medium'
      };
    }

    return new Response(JSON.stringify({
      success: true,
      guidance,
      query,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-technician-copilot:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

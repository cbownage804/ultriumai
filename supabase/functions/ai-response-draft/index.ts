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
      ticketTitle,
      ticketDescription,
      ticketHistory,
      customerName,
      tone,
      includeKBSuggestions,
      kbArticles,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const toneDescriptions: Record<string, string> = {
      professional: 'Professional, formal, and courteous',
      friendly: 'Warm, approachable, and helpful',
      technical: 'Detailed, technical, and precise',
      concise: 'Brief, to-the-point, and efficient',
      empathetic: 'Understanding, supportive, and patient'
    };

    const systemPrompt = `You are an AI assistant helping MSP technicians draft professional responses to support tickets. Generate helpful, accurate, and appropriately toned responses.

Guidelines:
1. Address the customer by name when provided
2. Acknowledge their issue clearly
3. Provide actionable next steps or solutions
4. Maintain the requested tone throughout
5. Keep responses clear and well-structured
6. Include relevant KB article references when provided
7. End with appropriate follow-up or closing

Tone: ${toneDescriptions[tone] || toneDescriptions.professional}

Format your response as JSON:
{
  "draftResponse": "The complete response text ready to send",
  "responseType": "resolution|update|clarification|escalation",
  "suggestedSubject": "Email subject line if applicable",
  "keyPoints": ["Main point 1", "Main point 2"],
  "followUpActions": ["Action for technician to take"],
  "alternativeResponses": [
    {"tone": "different tone", "snippet": "First sentence of alternative"}
  ],
  "confidenceLevel": "high|medium|low"
}`;

    const userMessage = `Generate a response draft for this support ticket:

Customer: ${customerName || 'Customer'}

Ticket Title: ${ticketTitle}

Ticket Description:
${ticketDescription}

${ticketHistory ? `Previous Communications:
${ticketHistory}` : ''}

${includeKBSuggestions && kbArticles?.length > 0 ? `Relevant KB Articles to Reference:
${kbArticles.map((kb: any) => `- ${kb.title}: ${kb.summary}`).join('\n')}` : ''}

Please generate a ${tone || 'professional'} response that addresses the customer's issue.`;

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
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    let draft;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      draft = jsonMatch ? JSON.parse(jsonMatch[0]) : { draftResponse: content };
    } catch {
      draft = { draftResponse: content };
    }

    return new Response(JSON.stringify({
      success: true,
      draft,
      generatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
      kbArticles,
      resolvedTickets,
      runbooks,
      includeExternalSearch,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Knowledge Search assistant for an MSP helpdesk. Help technicians find relevant information to solve issues.

Your role:
1. Search through KB articles, resolved tickets, and runbooks
2. Synthesize information from multiple sources
3. Provide step-by-step solutions
4. Suggest related resources
5. Identify knowledge gaps

Format response as JSON:
{
  "answer": "Synthesized answer to the query",
  "confidence": 0-100,
  "sources": [
    {
      "type": "kb_article|ticket|runbook",
      "id": "source ID",
      "title": "Source title",
      "relevanceScore": 0-100,
      "excerpt": "Relevant excerpt",
      "url": "link if available"
    }
  ],
  "stepByStepSolution": [
    {"step": 1, "instruction": "Step description", "notes": "Additional info"}
  ],
  "relatedResources": [
    {"type": "type", "title": "title", "reason": "Why it's related"}
  ],
  "knowledgeGaps": ["Topics that need KB articles"],
  "suggestedKBArticle": {
    "shouldCreate": true|false,
    "suggestedTitle": "Proposed title",
    "suggestedContent": "Brief content outline"
  }
}`;

    const userMessage = `Search query: "${query}"

${kbArticles?.length > 0 ? `KB Articles:
${JSON.stringify(kbArticles, null, 2)}` : ''}

${resolvedTickets?.length > 0 ? `Resolved Tickets:
${JSON.stringify(resolvedTickets, null, 2)}` : ''}

${runbooks?.length > 0 ? `Runbooks:
${JSON.stringify(runbooks, null, 2)}` : ''}

Find the most relevant information and provide a comprehensive answer.`;

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

    let searchResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      searchResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { answer: content, sources: [] };
    } catch {
      searchResult = { answer: content, sources: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      query,
      ...searchResult,
      searchedAt: new Date().toISOString()
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

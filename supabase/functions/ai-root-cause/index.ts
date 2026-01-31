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
      incidents,
      relatedTickets,
      deviceData,
      timeRange,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Root Cause Analyzer for an MSP platform. Analyze recurring issues, incidents, and tickets to identify underlying root causes and patterns.

Your analysis should:
1. Identify patterns across multiple incidents
2. Correlate issues with device/system data
3. Determine root causes vs symptoms
4. Suggest preventive measures
5. Prioritize by impact and frequency

Format your response as JSON:
{
  "rootCauses": [
    {
      "id": "RC-001",
      "title": "Brief descriptive title",
      "description": "Detailed explanation",
      "confidence": 0-100,
      "severity": "critical|high|medium|low",
      "affectedSystems": ["system1", "system2"],
      "affectedTickets": ["TKT-001", "TKT-002"],
      "frequency": "Number of occurrences",
      "firstSeen": "Date first observed",
      "lastSeen": "Most recent occurrence",
      "symptoms": ["Symptom 1", "Symptom 2"],
      "technicalDetails": "Technical explanation",
      "preventiveMeasures": [
        {"action": "What to do", "effort": "low|medium|high", "impact": "high|medium|low"}
      ],
      "immediateRemediation": "Quick fix steps",
      "permanentFix": "Long-term solution"
    }
  ],
  "patterns": [
    {"pattern": "Description", "occurrences": 5, "trend": "increasing|stable|decreasing"}
  ],
  "correlations": [
    {"factor1": "...", "factor2": "...", "strength": "strong|moderate|weak"}
  ],
  "recommendations": [
    {"priority": 1, "action": "What to do", "expectedImpact": "Expected outcome"}
  ],
  "summary": "Executive summary of findings"
}`;

    const userMessage = `Analyze these incidents and tickets to identify root causes:

${incidents ? `Incidents/Events:
${JSON.stringify(incidents, null, 2)}` : ''}

${relatedTickets ? `Related Tickets:
${JSON.stringify(relatedTickets, null, 2)}` : ''}

${deviceData ? `Device/System Data:
${JSON.stringify(deviceData, null, 2)}` : ''}

Time Range: ${timeRange || 'Last 30 days'}

Identify root causes, patterns, and provide recommendations.`;

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
        temperature: 0.2,
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

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, rootCauses: [] };
    } catch {
      analysis = { summary: content, rootCauses: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      ...analysis,
      analyzedAt: new Date().toISOString()
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

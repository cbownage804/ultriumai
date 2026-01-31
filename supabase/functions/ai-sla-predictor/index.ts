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
      tickets,
      slaPolicy,
      historicalData,
      technicianWorkload,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI SLA Predictor for an MSP helpdesk. Analyze tickets and predict which ones are at risk of breaching their SLA targets.

Consider these factors:
1. Time remaining until SLA deadline
2. Ticket complexity and priority
3. Current technician workload
4. Historical resolution patterns
5. Similar ticket resolution times
6. Current queue depth

Format your response as JSON:
{
  "predictions": [
    {
      "ticketId": "ticket ID",
      "ticketTitle": "title",
      "slaDeadline": "ISO timestamp",
      "breachRisk": "high|medium|low",
      "breachProbability": 0-100,
      "predictedResolutionTime": "estimated hours",
      "timeRemaining": "hours until deadline",
      "riskFactors": ["factor1", "factor2"],
      "recommendedActions": ["action1", "action2"],
      "suggestedReassignment": "technician name or null"
    }
  ],
  "summary": {
    "totalTicketsAnalyzed": 0,
    "highRiskCount": 0,
    "mediumRiskCount": 0,
    "lowRiskCount": 0,
    "predictedBreaches": 0,
    "overallHealthScore": 0-100
  },
  "immediateActions": ["Priority action 1", "Priority action 2"],
  "capacityRecommendations": ["Capacity suggestion"]
}`;

    const userMessage = `Analyze these tickets for SLA breach risk:

Tickets:
${JSON.stringify(tickets, null, 2)}

${slaPolicy ? `SLA Policy:
${JSON.stringify(slaPolicy, null, 2)}` : ''}

${technicianWorkload ? `Current Technician Workload:
${JSON.stringify(technicianWorkload, null, 2)}` : ''}

${historicalData ? `Historical Resolution Data:
${JSON.stringify(historicalData, null, 2)}` : ''}

Predict which tickets are at risk of breaching their SLA and provide recommendations.`;

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

    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, predictions: [] };
    } catch {
      prediction = { summary: content, predictions: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      ...prediction,
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

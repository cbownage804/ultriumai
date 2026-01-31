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
      technicians,
      openTickets,
      historicalPerformance,
      scheduledTasks,
      timeRange,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Workload Optimizer for an MSP helpdesk. Analyze technician workloads and provide optimal ticket assignments.

Consider:
1. Current ticket load per technician
2. Skill sets and expertise areas
3. Historical resolution times by ticket type
4. Availability and scheduled tasks
5. Priority and SLA requirements
6. Balanced workload distribution

Format response as JSON:
{
  "recommendations": [
    {
      "ticketId": "ticket ID",
      "suggestedTechnician": "technician name",
      "reason": "Why this assignment",
      "confidenceScore": 0-100,
      "alternativeTechnicians": ["name1", "name2"],
      "estimatedResolutionTime": "hours"
    }
  ],
  "workloadAnalysis": [
    {
      "technicianId": "id",
      "technicianName": "name",
      "currentLoad": "number of tickets",
      "capacityUtilization": 0-100,
      "recommendedAction": "take more/reduce/maintain",
      "skillMatch": ["skill1", "skill2"]
    }
  ],
  "balancingActions": [
    {"action": "Reassign ticket X from Y to Z", "impact": "Expected improvement"}
  ],
  "summary": {
    "totalOpenTickets": 0,
    "averageLoadPerTech": 0,
    "overloadedTechnicians": 0,
    "underutilizedTechnicians": 0,
    "optimalDistributionScore": 0-100
  }
}`;

    const userMessage = `Optimize workload distribution:

Technicians:
${JSON.stringify(technicians, null, 2)}

Open Tickets:
${JSON.stringify(openTickets, null, 2)}

${historicalPerformance ? `Historical Performance:
${JSON.stringify(historicalPerformance, null, 2)}` : ''}

${scheduledTasks ? `Scheduled Tasks:
${JSON.stringify(scheduledTasks, null, 2)}` : ''}

Time Range: ${timeRange || 'Current week'}

Provide optimal ticket assignments and workload balancing recommendations.`;

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

    let optimization;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      optimization = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, recommendations: [] };
    } catch {
      optimization = { summary: content, recommendations: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      ...optimization,
      optimizedAt: new Date().toISOString()
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

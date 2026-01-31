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
      tasks,
      existingAppointments,
      constraints,
      preferences,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Smart Scheduler for an MSP. Optimize task and appointment scheduling.

Consider:
1. Technician availability and skills
2. Task priorities and SLA deadlines
3. Travel time between on-site appointments
4. Customer preferences
5. Workload balance
6. Buffer times for unexpected issues

Format response as JSON:
{
  "schedule": [
    {
      "taskId": "task ID",
      "taskTitle": "title",
      "assignedTo": "technician name",
      "scheduledStart": "ISO datetime",
      "scheduledEnd": "ISO datetime",
      "priority": "critical|high|medium|low",
      "location": "on-site|remote",
      "reason": "Why this time slot",
      "conflictsResolved": ["conflict1"]
    }
  ],
  "conflicts": [
    {
      "type": "overlap|unavailable|travel_time",
      "description": "Conflict description",
      "resolution": "How it was resolved",
      "affectedTasks": ["task1", "task2"]
    }
  ],
  "optimization": {
    "totalTravelTime": "X hours",
    "scheduleUtilization": 0-100,
    "slaCompliance": 0-100,
    "balanceScore": 0-100
  },
  "suggestions": [
    {"suggestion": "Schedule improvement idea", "impact": "Expected benefit"}
  ],
  "unscheduledTasks": [
    {"taskId": "id", "reason": "Why couldn't be scheduled", "alternatives": ["option1"]}
  ]
}`;

    const userMessage = `Optimize scheduling:

Technicians:
${JSON.stringify(technicians, null, 2)}

Tasks to Schedule:
${JSON.stringify(tasks, null, 2)}

${existingAppointments ? `Existing Appointments:
${JSON.stringify(existingAppointments, null, 2)}` : ''}

${constraints ? `Constraints:
${JSON.stringify(constraints, null, 2)}` : ''}

${preferences ? `Preferences:
${JSON.stringify(preferences, null, 2)}` : ''}

Create an optimized schedule that maximizes efficiency and SLA compliance.`;

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

    let scheduleResult;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      scheduleResult = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: content, schedule: [] };
    } catch {
      scheduleResult = { summary: content, schedule: [] };
    }

    return new Response(JSON.stringify({
      success: true,
      ...scheduleResult,
      scheduledAt: new Date().toISOString()
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

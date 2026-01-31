import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ticket, technicians, workloadData } = await req.json();

    const prompt = `You are an intelligent ticket routing system for an MSP helpdesk. Analyze this ticket and recommend the best technician assignment based on skills, workload, and availability.

TICKET DETAILS:
- Subject: ${ticket.subject}
- Description: ${ticket.description}
- Priority: ${ticket.priority}
- Category: ${ticket.category || 'General'}
- Client: ${ticket.client || 'Unknown'}
- SLA Target: ${ticket.sla_hours || 24} hours

AVAILABLE TECHNICIANS:
${JSON.stringify(technicians, null, 2)}

CURRENT WORKLOAD DATA:
${JSON.stringify(workloadData, null, 2)}

Analyze and provide a JSON response with:
{
  "recommended_technician": {
    "id": "technician_id",
    "name": "technician_name",
    "confidence": 0.95,
    "reasons": ["reason1", "reason2"]
  },
  "alternative_technicians": [
    {"id": "tech_id", "name": "name", "confidence": 0.8, "reason": "backup reason"}
  ],
  "skill_match_score": 0.9,
  "workload_score": 0.85,
  "urgency_factor": 0.7,
  "routing_notes": "Brief explanation of the routing decision",
  "auto_assign_recommended": true,
  "escalation_risk": "low|medium|high"
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('AI_GATEWAY_API_KEY') || Deno.env.get('LOVABLE_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const routingResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      recommended_technician: null,
      routing_notes: content,
      auto_assign_recommended: false
    };

    return new Response(JSON.stringify({
      success: true,
      routing: routingResult,
      processed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Ticket Router Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

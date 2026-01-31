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
    const { ticket, escalationRules, ticketHistory } = await req.json();

    const prompt = `You are an intelligent escalation engine for an MSP helpdesk. Analyze this ticket and determine if escalation is needed based on the rules and history.

TICKET DETAILS:
- ID: ${ticket.id}
- Subject: ${ticket.subject}
- Status: ${ticket.status}
- Priority: ${ticket.priority}
- Created: ${ticket.created_at}
- Last Updated: ${ticket.updated_at}
- Assigned To: ${ticket.assigned_to || 'Unassigned'}
- Response Count: ${ticket.response_count || 0}
- SLA Breach Risk: ${ticket.sla_breach_risk || 'unknown'}

ESCALATION RULES:
${JSON.stringify(escalationRules, null, 2)}

TICKET HISTORY:
${JSON.stringify(ticketHistory, null, 2)}

Analyze and provide a JSON response:
{
  "escalation_required": true/false,
  "escalation_level": 1-4,
  "escalation_type": "time_based|priority_based|customer_request|sla_breach|pattern_detected",
  "triggered_rules": ["rule1", "rule2"],
  "urgency_score": 0.0-1.0,
  "recommended_actions": [
    {
      "action": "notify_manager|reassign|priority_boost|customer_callback|executive_escalation",
      "target": "target_person_or_team",
      "reason": "why this action"
    }
  ],
  "notification_channels": ["email", "sms", "slack"],
  "escalation_notes": "Brief explanation",
  "auto_execute": true/false,
  "time_to_breach_minutes": 120
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
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const escalationResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      escalation_required: false,
      escalation_notes: content
    };

    return new Response(JSON.stringify({
      success: true,
      escalation: escalationResult,
      processed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI Escalation Engine Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

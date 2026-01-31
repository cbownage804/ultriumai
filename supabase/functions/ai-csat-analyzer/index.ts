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
    const { surveyResponses, ticketData, historicalCSAT } = await req.json();

    const prompt = `You are a customer satisfaction (CSAT) analysis AI for an MSP. Analyze the survey responses and provide actionable insights.

RECENT SURVEY RESPONSES:
${JSON.stringify(surveyResponses, null, 2)}

RELATED TICKET DATA:
${JSON.stringify(ticketData, null, 2)}

HISTORICAL CSAT TRENDS:
${JSON.stringify(historicalCSAT, null, 2)}

Analyze and provide a JSON response:
{
  "overall_score": 4.2,
  "score_trend": "improving|declining|stable",
  "trend_percentage": 5.2,
  "satisfaction_breakdown": {
    "very_satisfied": 45,
    "satisfied": 30,
    "neutral": 15,
    "dissatisfied": 7,
    "very_dissatisfied": 3
  },
  "key_themes": [
    {
      "theme": "Response Time",
      "sentiment": "positive|negative|neutral",
      "frequency": 25,
      "impact_score": 0.8
    }
  ],
  "improvement_areas": [
    {
      "area": "Communication",
      "priority": "high|medium|low",
      "current_score": 3.5,
      "target_score": 4.5,
      "recommendations": ["specific action 1", "specific action 2"]
    }
  ],
  "top_performers": [
    {"technician": "John Smith", "score": 4.8, "feedback_count": 15}
  ],
  "at_risk_customers": [
    {"customer": "Acme Corp", "risk_level": "high", "last_score": 2.5, "reason": "Multiple low ratings"}
  ],
  "nps_score": 45,
  "nps_category": "promoters|passives|detractors",
  "executive_summary": "Brief 2-3 sentence summary of CSAT status and key actions needed"
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
        max_tokens: 2500,
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const csatResult = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      overall_score: 0,
      executive_summary: content
    };

    return new Response(JSON.stringify({
      success: true,
      analysis: csatResult,
      processed_at: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI CSAT Analyzer Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

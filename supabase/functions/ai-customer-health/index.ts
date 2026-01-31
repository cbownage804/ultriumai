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
      customerId,
      customerName,
      ticketHistory,
      sentimentData,
      csatScores,
      contractDetails,
      engagementMetrics,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Customer Health Score calculator for an MSP. Analyze customer data to determine their health score and churn risk.

Consider these factors:
1. Ticket volume and trends (increasing tickets = potential issues)
2. Sentiment from communications
3. CSAT/NPS scores
4. Response times and resolution satisfaction
5. Contract status and renewal timeline
6. Engagement patterns
7. Escalation frequency

Format your response as JSON:
{
  "healthScore": 0-100,
  "healthStatus": "healthy|at-risk|critical",
  "churnRisk": "low|medium|high",
  "churnProbability": 0-100,
  "scoringFactors": [
    {"factor": "Ticket Volume", "score": 0-100, "weight": 0.2, "trend": "improving|stable|declining", "impact": "positive|neutral|negative"}
  ],
  "sentimentAnalysis": {
    "overallSentiment": "positive|neutral|negative",
    "recentTrend": "improving|stable|declining",
    "keyEmotions": ["emotion1", "emotion2"]
  },
  "engagementLevel": "high|medium|low",
  "relationshipStrength": "strong|moderate|weak",
  "riskIndicators": [
    {"indicator": "Description", "severity": "high|medium|low", "recommendation": "What to do"}
  ],
  "positiveIndicators": ["Positive factor 1", "Positive factor 2"],
  "recommendations": [
    {"priority": 1, "action": "Recommended action", "expectedImpact": "Expected outcome", "urgency": "immediate|soon|planned"}
  ],
  "nextBestActions": ["Action 1", "Action 2"],
  "executiveSummary": "Brief summary for account manager"
}`;

    const userMessage = `Calculate the health score for this customer:

Customer: ${customerName || customerId}

${ticketHistory ? `Ticket History:
${JSON.stringify(ticketHistory, null, 2)}` : ''}

${sentimentData ? `Sentiment Data:
${JSON.stringify(sentimentData, null, 2)}` : ''}

${csatScores ? `CSAT/NPS Scores:
${JSON.stringify(csatScores, null, 2)}` : ''}

${contractDetails ? `Contract Details:
${JSON.stringify(contractDetails, null, 2)}` : ''}

${engagementMetrics ? `Engagement Metrics:
${JSON.stringify(engagementMetrics, null, 2)}` : ''}

Calculate a comprehensive health score and provide actionable recommendations.`;

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

    let healthData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      healthData = jsonMatch ? JSON.parse(jsonMatch[0]) : { healthScore: 50, executiveSummary: content };
    } catch {
      healthData = { healthScore: 50, executiveSummary: content };
    }

    return new Response(JSON.stringify({
      success: true,
      customerId,
      customerName,
      ...healthData,
      calculatedAt: new Date().toISOString()
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

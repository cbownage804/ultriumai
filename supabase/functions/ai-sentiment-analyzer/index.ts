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
      texts,
      ticketId,
      conversationType,
      includeRecommendations,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Sentiment Analyzer for an MSP helpdesk platform. Analyze customer communications to identify sentiment, urgency, and satisfaction levels.

For each text/message, analyze:
1. Overall sentiment (positive/neutral/negative/mixed)
2. Emotional indicators (frustrated, satisfied, confused, angry, appreciative, etc.)
3. Urgency level (critical/high/medium/low)
4. Customer satisfaction indicators
5. Escalation risk (likelihood the customer may escalate)
6. Key concerns or pain points
7. Positive feedback elements

Format your response as JSON:
{
  "overallSentiment": "positive|neutral|negative|mixed",
  "sentimentScore": -100 to 100 (negative to positive),
  "urgencyLevel": "critical|high|medium|low",
  "escalationRisk": "high|medium|low",
  "escalationRiskScore": 0-100,
  "satisfactionIndicators": {
    "currentSatisfaction": "satisfied|neutral|dissatisfied",
    "satisfactionTrend": "improving|stable|declining",
    "csatPrediction": 1-5
  },
  "emotionalIndicators": [
    {"emotion": "frustrated", "intensity": "high|medium|low", "evidence": "quote from text"}
  ],
  "keyIssues": [
    {"issue": "description", "severity": "high|medium|low", "sentiment": "negative"}
  ],
  "positiveElements": ["element1", "element2"],
  "languageAnalysis": {
    "tone": "formal|informal|aggressive|polite",
    "clarity": "clear|ambiguous",
    "technicalLevel": "high|medium|low"
  },
  "recommendations": [
    {"action": "what to do", "priority": "high|medium|low", "reason": "why"}
  ],
  "summary": "Brief summary of the sentiment analysis"
}`;

    const textsToAnalyze = Array.isArray(texts) ? texts : [texts];
    
    const userMessage = `Analyze the sentiment of the following ${conversationType || 'support'} communication(s):

${textsToAnalyze.map((text: string, i: number) => `--- Message ${i + 1} ---
${text}`).join('\n\n')}

${ticketId ? `This is related to ticket: ${ticketId}` : ''}

Please provide a comprehensive sentiment analysis${includeRecommendations !== false ? ' with recommendations for response handling' : ''}.`;

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
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Parse the JSON response
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        analysis = {
          overallSentiment: 'neutral',
          sentimentScore: 0,
          summary: content
        };
      }
    } catch {
      analysis = {
        overallSentiment: 'neutral',
        sentimentScore: 0,
        summary: content
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      textsAnalyzed: textsToAnalyze.length,
      ticketId,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-sentiment-analyzer:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

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
      dataType,
      metrics,
      securityEvents,
      networkTraffic,
      timeRange,
      baselineData,
      userId 
    } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an AI Anomaly Detection system for an MSP monitoring platform. Your role is to analyze metrics, security events, and network traffic to identify unusual patterns that may indicate issues.

Analyze the provided data and identify:
1. Statistical anomalies (values outside normal ranges)
2. Behavioral anomalies (unusual patterns or sequences)
3. Security anomalies (potential threats or attacks)
4. Performance anomalies (degradation trends)
5. Correlation anomalies (unusual relationships between metrics)

For each anomaly found, provide:
- Severity (critical/high/medium/low)
- Confidence score (0-100)
- Description of the anomaly
- Potential impact
- Recommended actions

Format your response as JSON:
{
  "anomaliesDetected": true/false,
  "summary": "Brief overview",
  "anomalies": [
    {
      "id": "ANM-001",
      "type": "metric|security|network|behavioral",
      "severity": "critical|high|medium|low",
      "confidence": 85,
      "title": "Brief title",
      "description": "Detailed description",
      "affectedResources": ["resource1", "resource2"],
      "detectedAt": "timestamp or time range",
      "baselineValue": "expected value/range",
      "observedValue": "actual value",
      "potentialCauses": ["cause1", "cause2"],
      "potentialImpact": "What could happen if ignored",
      "recommendedActions": ["action1", "action2"],
      "relatedAnomalies": ["ANM-002"]
    }
  ],
  "overallRiskScore": 0-100,
  "trendsIdentified": ["trend1", "trend2"],
  "monitoringRecommendations": ["recommendation1"]
}`;

    let dataDescription = '';
    
    if (dataType === 'metrics' && metrics) {
      dataDescription = `Device/System Metrics:
${JSON.stringify(metrics, null, 2)}`;
    } else if (dataType === 'security' && securityEvents) {
      dataDescription = `Security Events:
${JSON.stringify(securityEvents, null, 2)}`;
    } else if (dataType === 'network' && networkTraffic) {
      dataDescription = `Network Traffic Data:
${JSON.stringify(networkTraffic, null, 2)}`;
    } else {
      dataDescription = `Mixed Data:
Metrics: ${metrics ? JSON.stringify(metrics) : 'N/A'}
Security Events: ${securityEvents ? JSON.stringify(securityEvents) : 'N/A'}
Network Traffic: ${networkTraffic ? JSON.stringify(networkTraffic) : 'N/A'}`;
    }

    const userMessage = `Analyze the following ${dataType || 'monitoring'} data for anomalies.

Time Range: ${timeRange || 'Last 24 hours'}

${dataDescription}

${baselineData ? `Baseline/Normal Data for Comparison:
${JSON.stringify(baselineData, null, 2)}` : ''}

Identify any anomalies, unusual patterns, or potential issues in this data.`;

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
          anomaliesDetected: false,
          summary: content,
          anomalies: [],
          overallRiskScore: 0
        };
      }
    } catch {
      analysis = {
        anomaliesDetected: false,
        summary: content,
        anomalies: [],
        overallRiskScore: 0
      };
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
      dataType,
      timeRange,
      analyzedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-anomaly-detection:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

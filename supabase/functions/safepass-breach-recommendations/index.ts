import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BreachFinding {
  title: string;
  username?: string;
  issues: string[];
  severity: string;
  emailBreaches?: {
    name: string;
    breachDate: string;
    dataClasses: string[];
  }[];
  passwordBreachCount?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { finding } = await req.json() as { finding: BreachFinding };
    
    if (!finding) {
      return new Response(
        JSON.stringify({ error: 'Finding data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context for AI
    const breachContext = [];
    
    if (finding.passwordBreachCount && finding.passwordBreachCount > 0) {
      breachContext.push(`Password exposed in ${finding.passwordBreachCount.toLocaleString()} data breaches`);
    }
    
    if (finding.emailBreaches && finding.emailBreaches.length > 0) {
      const breachNames = finding.emailBreaches.map(b => `${b.name} (${b.breachDate})`).join(', ');
      const exposedData = [...new Set(finding.emailBreaches.flatMap(b => b.dataClasses))].join(', ');
      breachContext.push(`Email/username found in breaches: ${breachNames}`);
      breachContext.push(`Exposed data types: ${exposedData}`);
    }

    finding.issues.forEach(issue => {
      if (!issue.includes('data breaches')) {
        breachContext.push(issue);
      }
    });

    const systemPrompt = `You are a cybersecurity expert providing personalized recommendations for credential security issues. Be concise, actionable, and prioritize the most critical steps. Format your response with clear sections using markdown.

Your response should include:
1. **Risk Assessment** - Brief explanation of the severity and potential impact
2. **Immediate Actions** - 2-3 specific steps to take right now
3. **Password Recommendation** - If password is compromised, suggest creating a strong one
4. **Additional Protection** - Optional steps for enhanced security (2FA, monitoring, etc.)

Keep the total response under 300 words.`;

    const userPrompt = `Analyze this security finding for the account "${finding.title}" and provide recommendations:

Security Issues Found:
${breachContext.map(c => `- ${c}`).join('\n')}

Severity: ${finding.severity.toUpperCase()}

Provide specific, actionable recommendations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content || "Unable to generate recommendations.";

    return new Response(
      JSON.stringify({ recommendation }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Recommendation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate recommendations' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

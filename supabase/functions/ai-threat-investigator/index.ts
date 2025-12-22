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
    const { threat } = await req.json();
    
    if (!threat) {
      return new Response(
        JSON.stringify({ error: 'Threat data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('[ai-threat-investigator] Analyzing threat:', threat.title);

    const systemPrompt = `You are an elite cybersecurity analyst AI. Your role is to investigate security threats and provide actionable remediation guidance.

For each threat, provide:
1. **Threat Assessment** - Explain what this threat means and its potential impact
2. **Root Cause Analysis** - Identify likely causes and attack vectors
3. **Immediate Actions** - List 3-5 specific steps to take right now
4. **Remediation Steps** - Detailed technical steps to resolve the issue
5. **Prevention Measures** - How to prevent this in the future
6. **Risk Score** - Rate the risk 1-10 with justification

Be specific, technical, and actionable. Format your response clearly with headers.`;

    const userPrompt = `Investigate this security threat and provide comprehensive analysis:

**Threat Type:** ${threat.type}
**Severity:** ${threat.severity}
**Title:** ${threat.title}
**Description:** ${threat.description}
**Source:** ${threat.source}
**Detected At:** ${threat.timestamp}
**Current Status:** ${threat.status}

Provide a detailed investigation report with remediation recommendations.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('[ai-threat-investigator] AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || 'Unable to generate analysis';

    console.log('[ai-threat-investigator] Analysis complete for:', threat.title);

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ai-threat-investigator] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Investigation failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

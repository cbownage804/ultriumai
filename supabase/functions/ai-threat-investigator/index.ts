import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid credentials' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { threat } = await req.json();
    
    if (!threat) {
      return new Response(
        JSON.stringify({ error: 'Threat data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize threat fields
    const sanitize = (val: unknown, maxLen = 500): string => {
      if (typeof val !== 'string') return '';
      return val.replace(/<[^>]*>/g, '').substring(0, maxLen);
    };

    const safeThreat = {
      type: sanitize(threat.type, 50),
      severity: sanitize(threat.severity, 20),
      title: sanitize(threat.title, 200),
      description: sanitize(threat.description, 2000),
      source: sanitize(threat.source, 100),
      timestamp: sanitize(threat.timestamp, 50),
      status: sanitize(threat.status, 30),
    };

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`[ai-threat-investigator] User ${user.id} analyzing threat: ${safeThreat.title}`);

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

**Threat Type:** ${safeThreat.type}
**Severity:** ${safeThreat.severity}
**Title:** ${safeThreat.title}
**Description:** ${safeThreat.description}
**Source:** ${safeThreat.source}
**Detected At:** ${safeThreat.timestamp}
**Current Status:** ${safeThreat.status}

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

    console.log('[ai-threat-investigator] Analysis complete for:', safeThreat.title);

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

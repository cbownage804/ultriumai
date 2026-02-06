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
    const { events, mode } = await req.json();

    if (!events || !Array.isArray(events) || events.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Events array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = mode === 'report'
      ? `You are an elite cybersecurity SOC analyst generating a formal threat report. Analyze the provided EDR telemetry events and produce a comprehensive, structured report with:

1. **Executive Summary** - One paragraph overview of the threat landscape during this period
2. **Key Findings** - Bullet list of the most significant events, grouped by severity
3. **MITRE ATT&CK Coverage** - Which tactics/techniques were observed, with counts
4. **Attack Timeline** - Chronological narrative of suspicious activity chains
5. **Risk Assessment** - Overall risk level (Critical/High/Medium/Low) with justification
6. **Recommendations** - Prioritized remediation steps

Be specific, reference actual process names, command lines, and MITRE IDs from the data. Use markdown formatting.`
      : `You are an elite cybersecurity SOC analyst specializing in EDR timeline analysis and threat storytelling. Given a sequence of endpoint detection events, construct the FULL STORY of what happened:

1. **Incident Narrative** - Tell the complete attack story in chronological order, explaining what the attacker did and why each step matters. Reference specific processes, command lines, and MITRE techniques.
2. **Kill Chain Stage** - Map the events to the Cyber Kill Chain (Reconnaissance → Weaponization → Delivery → Exploitation → Installation → C2 → Actions on Objectives)
3. **MITRE ATT&CK Mapping** - List every technique observed with the tactic category
4. **Severity Assessment** - Rate the overall threat level and explain why
5. **Recommended Actions** - What a SOC analyst should do RIGHT NOW

Write in a clear, professional security analyst voice. Reference specific event details (PIDs, paths, timestamps). Use markdown.`;

    const eventSummary = events.slice(0, 50).map((e: any, i: number) => 
      `[${i + 1}] ${e.timestamp} | ${e.device_name} | ${e.event_type} | ${e.process_name} (PID:${e.process_id}) → parent: ${e.parent_process} (PID:${e.parent_pid}) | cmd: ${e.command_line} | severity: ${e.severity} | MITRE: ${e.mitre_technique || 'N/A'} (${e.mitre_tactic || 'N/A'}) | suspicious: ${e.is_suspicious}`
    ).join('\n');

    const userPrompt = mode === 'report'
      ? `Generate a formal threat report for the following ${events.length} EDR events collected during this monitoring period:\n\n${eventSummary}`
      : `Analyze these ${events.length} EDR timeline events and tell me the FULL STORY of what happened. Connect the dots between events and explain the attack chain:\n\n${eventSummary}`;

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
          { role: 'user', content: userPrompt },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again shortly.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits in workspace settings.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const text = await response.text();
      console.error('AI gateway error:', response.status, text);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (e) {
    console.error('edr-ai-timeline error:', e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RAY-WATCH] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { threat } = await req.json();
    
    if (!threat) {
      return new Response(
        JSON.stringify({ error: "Threat data is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Generating recommendation for threat", { title: threat.title, severity: threat.severity });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build context about the threat
    const threatContext = `
Threat Details:
- Title: ${threat.title}
- Type: ${threat.threat_type}
- Severity: ${threat.severity}
- Source: ${threat.source_name}
- Description: ${threat.description || 'No description available'}
- Exposed Data Types: ${threat.threat_indicators?.exposed_data_types?.join(', ') || 'Unknown'}
- Has Password Exposed: ${threat.threat_indicators?.has_password ? 'YES - CRITICAL' : 'No'}
- Has Hashed Password: ${threat.threat_indicators?.has_hashed_password ? 'Yes' : 'No'}
- Breach Date: ${threat.threat_indicators?.breach_date || 'Unknown'}
- Compromised Accounts: ${threat.threat_indicators?.compromised_accounts || 'Unknown'}
`;

    const systemPrompt = `You are a cybersecurity expert assistant for Wrayth Watch, guided by Ray. Your job is to analyze data breach threats and provide clear, actionable recommendations to help users protect themselves.

**CRITICAL RULES - MUST FOLLOW:**
- **NEVER recommend competitor products** including: LastPass, 1Password, Dashlane, Bitwarden, Norton, McAfee, Malwarebytes, VirusTotal, HaveIBeenPwned, KeePass, NordPass, Keeper, RoboForm, Proton Pass, or any other third-party security tools
- When users need password management → recommend **Vault**
- When users need ongoing breach monitoring → recommend **Watch**
- When users need URL/email/document scanning → recommend **Scan**
- Do not recommend asset tracking; Wrayth no longer includes that module

**Wrayth capabilities (recommend ONLY these):**
- **Vault** — zero-knowledge password vault
- **Scan** — email, URL, and file analysis
- **Watch** — identity and dark web protection
- **Ray** — AI intelligence that powers Wrayth everywhere

Keep recommendations concise, practical, and prioritized by urgency. Use bullet points for actions. Be empathetic but direct about the severity.

Format your response as:
1. **Risk Assessment** (1-2 sentences about what this breach means)
2. **Immediate Actions** (3-5 bullet points of urgent steps - always recommend Vault for password management)
3. **Long-term Protection** (2-3 bullet points for ongoing security using Wrayth)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this data breach and provide specific recommendations:\n\n${threatContext}` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      logStep("AI gateway error", { status: response.status, error: errorText });
      throw new Error("AI service unavailable");
    }

    const data = await response.json();
    const recommendation = data.choices?.[0]?.message?.content;

    if (!recommendation) {
      throw new Error("No recommendation generated");
    }

    logStep("Recommendation generated successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendation,
        threat_id: threat.id 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    logStep("Error generating recommendation", { error: error instanceof Error ? error.message : String(error) });
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) || "Failed to generate recommendation" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

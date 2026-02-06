import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { workflowId, steps } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const results: any[] = [];
    let currentData: any = null;

    for (const step of steps) {
      const stepResult: any = { stepId: step.id, name: step.name, type: step.type, status: 'success' };

      try {
        if (step.type === 'trigger') {
          // Triggers produce initial data
          stepResult.output = { triggered: true, timestamp: new Date().toISOString() };
          currentData = stepResult.output;
        } else if (step.type === 'ai_transform') {
          const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: step.config.model || "google/gemini-3-flash-preview",
              messages: [
                { role: "system", content: step.config.prompt || "Process the following data:" },
                { role: "user", content: JSON.stringify(currentData || {}) },
              ],
            }),
          });

          if (!response.ok) {
            if (response.status === 429) {
              stepResult.status = 'error';
              stepResult.error = 'Rate limited';
              results.push(stepResult);
              break;
            }
            if (response.status === 402) {
              stepResult.status = 'error';
              stepResult.error = 'Credits exhausted';
              results.push(stepResult);
              break;
            }
            throw new Error(`AI error: ${response.status}`);
          }

          const aiData = await response.json();
          const content = aiData.choices?.[0]?.message?.content || '';
          stepResult.output = content;
          currentData = content;
        } else if (step.type === 'filter') {
          // Simple pass-through filter (real implementation would evaluate conditions)
          stepResult.output = { passed: true, data: currentData };
        } else if (step.type === 'output') {
          // Output step records the final data
          stepResult.output = { delivered: true, data: currentData };
        }
      } catch (err) {
        stepResult.status = 'error';
        stepResult.error = err instanceof Error ? err.message : 'Unknown error';
      }

      results.push(stepResult);
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-workflow-execute error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

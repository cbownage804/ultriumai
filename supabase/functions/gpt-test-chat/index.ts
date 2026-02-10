import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function searchWeb(query: string): Promise<string | null> {
  const apiKey = Deno.env.get("PERPLEXITY_API_KEY");
  if (!apiKey) {
    console.warn("PERPLEXITY_API_KEY not configured, skipping web search");
    return null;
  }

  try {
    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: "Provide a concise, factual summary with sources. Keep it under 300 words." },
          { role: "user", content: query },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Perplexity error:", response.status, await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const citations = data.citations?.length
      ? "\n\nSources:\n" + data.citations.map((url: string, i: number) => `[${i + 1}] ${url}`).join("\n")
      : "";
    return content + citations;
  } catch (err) {
    console.error("Web search error:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, systemPrompt, enableWebSearch } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "System prompt is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If web search is enabled, search for context based on the last user message
    let searchContext = "";
    if (enableWebSearch) {
      const lastUserMsg = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUserMsg?.content) {
        const result = await searchWeb(lastUserMsg.content);
        if (result) {
          searchContext = `\n\n[Web Search Results for context — use these to ground your answer]\n${result}\n[End of Web Search Results]`;
        }
      }
    }

    const formattingInstruction = "\n\nIMPORTANT FORMATTING: Always format your responses using clean Markdown. Use **bold** for emphasis, ## headings for sections, numbered lists (1. 2. 3.) for steps, bullet points for lists, and proper paragraph breaks for readability. Never output raw unformatted walls of text.";

    const fullSystemPrompt = systemPrompt + formattingInstruction + (searchContext
      ? "\n\nYou have access to real-time web search. Use the search results provided below to give accurate, up-to-date answers. Cite sources when relevant." + searchContext
      : "");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: fullSystemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("gpt-test-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a GPT Builder AI assistant. Your job is to help users create custom AI assistants by configuring them through conversation.

When a user describes what they want, you should:
1. Understand their intent and suggest a configuration
2. Output a JSON config block with the GPT settings
3. Explain what you configured and why

ALWAYS output your configuration updates as a JSON code block like this:
\`\`\`json
{
  "name": "Customer Support Bot",
  "description": "A friendly AI assistant for customer support",
  "system_prompt": "You are a helpful customer support agent...",
  "welcome_message": "Hi! How can I help you today?",
  "starter_questions": ["How do I reset my password?", "What are your business hours?"],
  "theme_color": "#6366f1",
  "communication_style": "Professional and friendly",
  "expertise_areas": "Customer service, product knowledge",
  "category": "support",
  "enable_web_search": false,
  "placeholder_prompt": "Ask me anything about our products..."
}
\`\`\`

Rules:
- Only include fields that need to change in the JSON block
- Write detailed, high-quality system prompts (at least 2-3 sentences)
- Be conversational and helpful in your text response
- If the user asks to change something specific, only update that field
- Suggest improvements proactively
- For the system_prompt field, write it as instructions TO the GPT (e.g., "You are a...")
- Keep starter_questions to 2-4 items max
- Choose appropriate theme_color hex values that match the GPT's personality
- Always respond with both a natural language explanation AND the JSON config block

Available categories: general, business, creative, developer, education, support`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, currentConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemMessage = `${SYSTEM_PROMPT}\n\nCurrent GPT Configuration:\n${currentConfig}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemMessage },
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
    console.error("gpt-builder-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

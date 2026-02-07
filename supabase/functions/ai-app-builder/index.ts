import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are an expert web app builder AI. You generate multi-file web projects.

OUTPUT FORMAT:
You MUST output files using this exact delimiter format. No other text, no markdown, no explanations:

===FILE: index.html===
<!DOCTYPE html>
<html>...</html>

===FILE: styles.css===
body { ... }

===FILE: app.js===
// JavaScript code

RULES:
- Always start with ===FILE: index.html=== as the entry point
- Create separate files for CSS (styles.css), JavaScript (app.js), and components
- Use modern, polished design with clean typography
- System fonts: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
- Make everything fully responsive
- CSS Grid/Flexbox for layouts
- Smooth animations, transitions, hover effects
- Realistic placeholder/sample data
- NO external CDN links — everything inline
- CSS custom properties for theming
- Interactive JavaScript (tabs, modals, toggles, form validation)
- Professional, production-ready design
- Dark theme with accent colors by default unless told otherwise

When MODIFYING an existing project:
- Only output files that need changes using ===FILE: path=== format
- Preserve unchanged files (don't output them)
- Output COMPLETE content of changed files, not diffs`;

const SUPABASE_ADDON = `

SUPABASE INTEGRATION:
The supabase-js SDK is pre-loaded and a \`supabase\` client is initialized globally.
Available globals: \`supabase\`, \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`
Use for: auth, database queries, realtime, storage.
Do NOT include <script> tags for supabase — it's already injected.
`;

const STRIPE_ADDON = `

STRIPE INTEGRATION:
Stripe.js is pre-loaded and a \`stripe\` instance is initialized globally.
Available globals: \`stripe\`, \`STRIPE_PUBLISHABLE_KEY\`
Use for: Stripe Elements, payment forms, checkout redirects.
Do NOT include <script> tags for Stripe — it's already injected.
`;

// Dynamic service addons based on what's connected
const SERVICE_PROMPTS: Record<string, string> = {
  openai: `
OPENAI: Available via \`window.ENV.OPENAI_API_KEY\`.
Use fetch() to call https://api.openai.com/v1/chat/completions with Authorization: Bearer header.
Default model: gpt-4o-mini. Support streaming with SSE. Show typing indicators.`,

  anthropic: `
ANTHROPIC (Claude): Available via \`window.ENV.ANTHROPIC_API_KEY\`.
Use fetch() to call https://api.anthropic.com/v1/messages with x-api-key header and anthropic-version: 2023-06-01.
Default model: claude-3-5-sonnet-20241022. Support streaming.`,

  google_ai: `
GOOGLE AI (Gemini): Available via \`window.ENV.GOOGLE_AI_API_KEY\`.
Use fetch() to call https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=KEY.
Send { contents: [{ parts: [{ text: prompt }] }] }.`,

  perplexity: `
PERPLEXITY: Available via \`window.ENV.PERPLEXITY_API_KEY\`.
Use fetch() to call https://api.perplexity.ai/chat/completions with Authorization: Bearer header.
Model: sonar. Returns citations array alongside the response. Great for search-grounded AI.`,

  mistral: `
MISTRAL AI: Available via \`window.ENV.MISTRAL_API_KEY\`.
Use fetch() to call https://api.mistral.ai/v1/chat/completions with Authorization: Bearer header.
Default model: mistral-large-latest. OpenAI-compatible API format.`,

  cohere: `
COHERE: Available via \`window.ENV.COHERE_API_KEY\`.
Use fetch() to call https://api.cohere.ai/v2/chat with Authorization: Bearer header.
Good for RAG, search, and classification tasks.`,

  groq: `
GROQ: Available via \`window.ENV.GROQ_API_KEY\`.
Use fetch() to call https://api.groq.com/openai/v1/chat/completions with Authorization: Bearer header.
Ultra-fast inference. Default model: llama-3.3-70b-versatile. OpenAI-compatible API.`,

  elevenlabs: `
ELEVENLABS (Voice): Available via \`window.ENV.ELEVENLABS_API_KEY\`.
Text-to-speech: POST to https://api.elevenlabs.io/v1/text-to-speech/{voice_id} with xi-api-key header.
Returns audio/mpeg. Use Audio API to play it. Default voice_id: "21m00Tcm4TlvDq8ikWAM" (Rachel).
Speech-to-text: POST audio to https://api.elevenlabs.io/v1/speech-to-text with model_id: scribe_v2.`,

  deepgram: `
DEEPGRAM (Voice): Available via \`window.ENV.DEEPGRAM_API_KEY\`.
Speech-to-text: POST audio to https://api.deepgram.com/v1/listen with Authorization: Token header.
Supports real-time WebSocket transcription at wss://api.deepgram.com/v1/listen.`,

  assemblyai: `
ASSEMBLYAI (Voice): Available via \`window.ENV.ASSEMBLYAI_API_KEY\`.
Upload audio: POST to https://api.assemblyai.com/v2/upload, then POST to /v2/transcript.
Poll GET /v2/transcript/{id} until status is "completed". Use authorization header.`,

  replicate: `
REPLICATE: Available via \`window.ENV.REPLICATE_API_KEY\`.
Run models: POST to https://api.replicate.com/v1/predictions with Authorization: Bearer header.
Poll for completion. Great for image generation (Stable Diffusion, Flux).`,

  huggingface: `
HUGGING FACE: Available via \`window.ENV.HUGGINGFACE_API_KEY\`.
Inference: POST to https://api-inference.huggingface.co/models/{model_id} with Authorization: Bearer header.
Supports text generation, image classification, translation, and more.`,
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, stream = true, supabaseConfig, stripeConfig, activeServices = [] } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt with active integrations
    let systemPrompt = BASE_SYSTEM_PROMPT;
    if (supabaseConfig) systemPrompt += SUPABASE_ADDON;
    if (stripeConfig) systemPrompt += STRIPE_ADDON;

    // Add prompts for each active service
    for (const serviceId of activeServices) {
      if (SERVICE_PROMPTS[serviceId]) {
        systemPrompt += SERVICE_PROMPTS[serviceId];
      }
    }

    if (activeServices.length > 0) {
      systemPrompt += `\n\nIMPORTANT: All API keys are available via window.ENV.KEY_NAME. Do NOT hardcode keys. Always use window.ENV to access them. Note: browser-side API calls expose keys — acceptable for prototyping only.`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ content: data.choices?.[0]?.message?.content || "" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-app-builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

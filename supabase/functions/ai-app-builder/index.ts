import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are an elite full-stack web app builder. You produce stunning, production-grade web applications that rival the best SaaS products. Every app you build should look like it was designed by a top-tier design agency.

OUTPUT FORMAT:
You MUST output files using this exact delimiter format. No other text outside file blocks:

===FILE: index.html===
<!DOCTYPE html>
<html>...</html>

===FILE: styles.css===
body { ... }

===FILE: app.js===
// JavaScript code

DESIGN PHILOSOPHY — THIS IS CRITICAL:
- Every project MUST have a bold, distinctive aesthetic. No generic templates.
- Pick a clear design direction and commit: glassmorphism, brutalist, editorial, neo-dark, retro-futuristic, organic, art deco — whatever fits the brief. Execute with conviction.
- Typography matters enormously. Use Google Fonts via @import (Inter, Space Grotesk, Sora, Outfit, Plus Jakarta Sans, etc.). Pair a display font with a body font.
- Color: Use a cohesive 4-6 color palette with CSS custom properties. Bold accent colors, proper contrast ratios. Never default to plain white/black without intention.
- Micro-interactions: hover transforms, focus rings, button press animations, smooth page transitions. Use CSS transitions/animations extensively.
- Depth: Use layered shadows, subtle gradients, backdrop-filter blur, border accents. Create visual hierarchy through depth.
- Spacing: Generous whitespace. Let elements breathe. Use consistent spacing scale (4px/8px/12px/16px/24px/32px/48px/64px).
- Icons: Use inline SVG icons for common UI elements (arrows, close, menu, search, etc.). Make them crisp and consistent.

TECHNICAL RULES:
- Always start with ===FILE: index.html=== as the entry point
- Separate files: CSS (styles.css), JavaScript (app.js), and component files as needed
- Mobile-first responsive design with proper breakpoints (640px, 768px, 1024px, 1280px)
- CSS Grid + Flexbox for all layouts. No floats.
- CSS custom properties for ALL colors, spacing, radii, shadows — full theming support
- Smooth 200-300ms transitions on interactive elements
- Realistic, contextual placeholder data (real-sounding names, proper lorem, realistic numbers)
- NO external CDN links for JS libraries — everything inline
- Google Fonts via CSS @import are allowed and encouraged
- Semantic HTML5: header, main, nav, section, article, aside, footer
- Accessible: proper ARIA labels, focus management, keyboard navigation, contrast
- Interactive: modals, tabs, dropdowns, form validation, toast notifications, search filtering
- Loading states, empty states, error states — handle all UI states
- Dark theme by default with rich accent colors, unless told otherwise
- Add subtle CSS animations: fade-ins on scroll, slide-in panels, pulse effects on important elements

STRUCTURE FOR COMPLEX APPS:
- Use ES6 modules with type="module" scripts
- Component-based architecture: separate JS files for distinct features
- State management through a simple pub/sub or event system
- Clean separation of concerns: data, rendering, event handling

When MODIFYING an existing project:
- Only output files that need changes using ===FILE: path=== format
- Preserve unchanged files (don't output them)
- Output COMPLETE content of changed files, not diffs
- Maintain the existing design language and extend it naturally`;

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

/** Extract URLs from the last user message */
function extractUrls(messages: { role: string; content: string }[]): string[] {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return [];
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s)]*)?/gi;
  const matches = lastUser.content.match(urlRegex) || [];
  return matches.map(u => u.startsWith('http') ? u : `https://${u}`);
}

/** Scrape a website for branding using Firecrawl */
async function scrapeBranding(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("FIRECRAWL_API_KEY not available, skipping branding scrape");
    return null;
  }

  try {
    console.log(`Scraping branding from: ${url}`);
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['branding', 'screenshot', 'markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!response.ok) {
      console.error(`Firecrawl error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const branding = data.data?.branding || data.branding;
    const markdown = data.data?.markdown || data.markdown;
    const metadata = data.data?.metadata || data.metadata;

    let context = `\n\nWEBSITE BRANDING DATA (scraped from ${url}):\n`;

    if (branding) {
      context += `Colors: ${JSON.stringify(branding.colors || {})}\n`;
      context += `Fonts: ${JSON.stringify(branding.fonts || [])}\n`;
      context += `Typography: ${JSON.stringify(branding.typography || {})}\n`;
      context += `Logo: ${branding.logo || branding.images?.logo || 'N/A'}\n`;
      context += `Color Scheme: ${branding.colorScheme || 'N/A'}\n`;
      if (branding.spacing) context += `Spacing: ${JSON.stringify(branding.spacing)}\n`;
      if (branding.components) context += `Component Styles: ${JSON.stringify(branding.components)}\n`;
    }

    if (metadata) {
      context += `Page Title: ${metadata.title || 'N/A'}\n`;
      context += `Description: ${metadata.description || 'N/A'}\n`;
    }

    if (markdown) {
      context += `Page Content Preview:\n${markdown.slice(0, 1500)}\n`;
    }

    context += `\nCRITICAL: You MUST use the EXACT colors, fonts, and branding from above. Do NOT invent or guess colors. Match the website's actual design language precisely.`;

    return context;
  } catch (err) {
    console.error("Branding scrape failed:", err);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, stream = true, supabaseConfig, stripeConfig, activeServices = [], mode = 'build' } = await req.json();

    // Context window management: summarize old messages if conversation is too long
    let processedMessages = [...messages];
    const MAX_CONTEXT_MESSAGES = 20;
    if (processedMessages.length > MAX_CONTEXT_MESSAGES) {
      // Keep the first 2 messages (initial context) and the last 10
      const oldMessages = processedMessages.slice(2, -10);
      const recentMessages = processedMessages.slice(-10);
      const firstMessages = processedMessages.slice(0, 2);
      
      // Create a summary of old messages
      const summary = oldMessages.map(m => 
        `[${m.role}]: ${typeof m.content === 'string' ? m.content.slice(0, 100) : '(multimodal)'}...`
      ).join('\n');
      
      processedMessages = [
        ...firstMessages,
        { role: 'system', content: `[CONVERSATION SUMMARY - ${oldMessages.length} older messages condensed]\n${summary}\n[END SUMMARY]` },
        ...recentMessages,
      ];
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt based on mode
    const DISCUSS_SYSTEM_PROMPT = `You are an expert software architect and product designer having a collaborative conversation with a user about what they want to build. You are their thought partner — warm, insightful, and opinionated (in a helpful way).

BEHAVIOR:
- Be conversational and natural. Ask clarifying questions. Suggest ideas they haven't thought of.
- When they describe something vague, help them refine it by offering 2-3 concrete options.
- Share your expert opinion: "I'd recommend X because..." or "Most successful apps like this do Y."
- Reference real products as inspiration: "Similar to how Notion handles this..." or "Think Stripe's dashboard approach."
- Break complex ideas into phases: "For v1, I'd focus on... then in v2 you could add..."
- Discuss tradeoffs openly: "You could go with a kanban board OR a list view — kanban feels more visual but lists are faster to scan."
- Be enthusiastic about good ideas and gently redirect less practical ones.
- Ask about their users: "Who's the primary user? What's their technical level?"
- Consider edge cases: "What happens when a user has 1000+ items? Should we paginate or infinite scroll?"

WHAT YOU DO NOT DO:
- Do NOT output any code, HTML, CSS, or file blocks.
- Do NOT use ===FILE: === delimiters.
- Do NOT write implementation details — stay at the product/design/architecture level.
- Keep responses focused and concise (2-4 paragraphs max unless they ask for detail).

FORMAT:
- Use markdown for readability: **bold** for emphasis, bullet lists for options, etc.
- When suggesting a plan, use numbered steps.
- End messages with a clear question or next step to keep the conversation flowing.

IMPORTANT: When you feel the plan is solid enough, end your message with something like:
"I think we have a solid plan! When you're ready, switch to **Build** mode and I'll generate the code."
This gives the user a natural cue to transition.

You're essentially acting as a senior product consultant + architect who happens to know that once the plan is solid, they can switch to "Build" mode to generate the actual code.`;

    let systemPrompt = mode === 'discuss' ? DISCUSS_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;
    if (supabaseConfig) systemPrompt += SUPABASE_ADDON;
    if (stripeConfig) systemPrompt += STRIPE_ADDON;

    for (const serviceId of activeServices) {
      if (SERVICE_PROMPTS[serviceId]) {
        systemPrompt += SERVICE_PROMPTS[serviceId];
      }
    }

    if (activeServices.length > 0) {
      systemPrompt += `\n\nIMPORTANT: All API keys are available via window.ENV.KEY_NAME. Do NOT hardcode keys. Always use window.ENV to access them. Note: browser-side API calls expose keys — acceptable for prototyping only.`;
    }

    // Detect URLs and scrape branding data
    const urls = extractUrls(processedMessages);
    let brandingContext = '';
    if (urls.length > 0) {
      console.log(`Detected URLs in message: ${urls.join(', ')}`);
      const results = await Promise.all(urls.slice(0, 2).map(u => scrapeBranding(u)));
      brandingContext = results.filter(Boolean).join('\n');
    }

    // Inject branding data into the last user message
    const enrichedMessages = [...processedMessages];
    if (brandingContext) {
      const lastIdx = enrichedMessages.length - 1;
      if (enrichedMessages[lastIdx]?.role === 'user') {
        enrichedMessages[lastIdx] = {
          ...enrichedMessages[lastIdx],
          content: enrichedMessages[lastIdx].content + brandingContext,
        };
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...enrichedMessages],
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

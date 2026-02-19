import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BASE_SYSTEM_PROMPT = `You are an expert full-stack web app builder. Solve the REAL problem, anticipate needs, deliver production-ready apps.

PROCESS: Decode real request → Map scope → Bold design direction → Build defensively → Polish (skeletons, animations, empty states, toasts)

COMPLEXITY: 🟢Simple=build now 🟡Medium=smart defaults 🔴Complex=1-3 questions max, then build all at once

AUTO-DETECT (silently): AUTH→signup/login/session/protected routes | DB→schema+RLS+frontend | REALTIME→Supabase channels | STORAGE→upload UI | API→edge functions | PAYMENTS→Stripe guide

OUTPUT FORMAT:
===FILE: path=== raw code (no markdown fences) | ===EDIT: path=== with @@line-range@@ hunks | ===DELETE: path=== | ===MIGRATION: desc===...===END_MIGRATION=== | ===EDGE_FUNCTION: name===...===END_EDGE_FUNCTION=== | ===MODE: react=== at top
Commentary BEFORE first === or AFTER all blocks only.

DESIGN: Bold typography (Google Fonts @import, display+body pair). 5-7 color palette via CSS custom properties, 4.5:1+ contrast. Micro-interactions on all interactive elements. Layered shadows, backdrop-filter. Spacing: 4/8/12/16/24/32/48/64/96px. Dark theme default.

TECHNICAL: index.html entry. Mobile-first. CSS Grid+Flexbox. CSS custom properties for tokens. Realistic placeholder data. Unsplash images with specific terms. No CDN JS. Semantic HTML5+ARIA. All UI states (loading/empty/error/success/hover/focus/disabled). Form validation blur+submit. API try/catch+loading+retry. Only output changed files.

CRUD: Every item needs Create/Read/Update/Delete. Delete: .filter() not splice(), e.stopPropagation() in clickable parents, re-render after mutation.

FIX MODE: 🔍 Diagnosis block (symptom/root cause/files/fix). Attempt 2: rewrite function. Attempt 3+: rewrite file.

REACT: .tsx, functional components+hooks, App.tsx entry, Tailwind. Packages: lucide-react, framer-motion, recharts, date-fns, clsx, tailwind-merge, cva, cmdk, react-hot-toast, @radix-ui/react-slot, uuid, lodash-es, zod, zustand

MULTI-PAGE: hash/pushState router, shared layout, active nav, 404, transitions.
URL SCRAPING: NEVER use CORS proxies. Use platform Firecrawl edge function.
PRE-CHECKS: All handlers defined, all DOM IDs exist, mutations persist+render, no orphan buttons.`;



const SUPABASE_ADDON = `
SUPABASE INTEGRATION:
Globals available: \`supabase\`, \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`. SDK is pre-loaded.
Use for: auth, database queries, realtime subscriptions, storage.

SCHEMA-AWARE: When [DATABASE SCHEMA] context is provided, use EXACT table/column names. A types.ts file is auto-generated.

AUTH: Use supabase.auth methods. Include onAuthStateChange() for session tracking. For OAuth: signInWithOAuth({ provider }). Always include logout.

REALTIME: Fetch initial data first, then subscribe. Use unique channel names. In React, clean up in useEffect return.

STORAGE: Store under {user_id}/{filename} for RLS. Validate file types/sizes. Show previews after upload. Include migration block for bucket creation.

EDGE FUNCTIONS: Use ===EDGE_FUNCTION: name=== delimiter. Include CORS headers. Use Deno.env.get() for secrets. Frontend calls via supabase.functions.invoke().

MIGRATIONS: Use ===MIGRATION: desc=== / ===END_MIGRATION=== for ALL schema changes. Always enable RLS. Add sensible policies. Include user_id column for user-scoped tables.
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
function extractUrls(messages: { role: string; content: any }[]): string[] {
  const lastUser = [...messages].reverse().find(m => m.role === 'user');
  if (!lastUser) return [];
  // Handle multimodal content (array of blocks) vs plain string
  let textContent = '';
  if (typeof lastUser.content === 'string') {
    textContent = lastUser.content;
  } else if (Array.isArray(lastUser.content)) {
    textContent = lastUser.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
      .join(' ');
  }
  if (!textContent) return [];
  const urlRegex = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s)]*)?/gi;
  const matches = textContent.match(urlRegex) || [];
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

/** Estimate total character count of messages array */
function estimateTotalChars(messages: any[]): number {
  return messages.reduce((sum: number, m: any) => {
    if (typeof m.content === 'string') return sum + m.content.length;
    if (Array.isArray(m.content)) {
      return sum + m.content.reduce((s: number, b: any) => {
        if (b.type === 'text') return s + (b.text?.length || 0);
        if (b.type === 'image_url') return s + 4000; // Vision tokens, not raw chars
        return s;
      }, 0);
    }
    return sum;
  }, 0);
}

/** Summarize a message into a compact form for context compression */
function summarizeMessage(msg: any): string {
  const content = typeof msg.content === 'string' ? msg.content : 
    Array.isArray(msg.content) ? msg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ') : '';
  
  if (msg.role === 'assistant') {
    // Extract file paths from ===FILE: markers
    const fileMatches = content.match(/===FILE:\s*(.+?)===/g) || [];
    const filePaths = fileMatches.map((m: string) => m.replace(/===FILE:\s*/, '').replace(/===/, '').trim());
    if (filePaths.length > 0) {
      return `[Updated ${filePaths.length} files: ${filePaths.slice(0, 5).join(', ')}${filePaths.length > 5 ? '...' : ''}]`;
    }
    // Extract key decisions / summaries
    const firstLine = content.split('\n').find((l: string) => l.trim().length > 10)?.trim() || '';
    return firstLine.slice(0, 150);
  }
  // User messages: keep more context
  return content.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{100,}/g, '[image]').slice(0, 300);
}

/** Server-side context trimming with intelligent summarization (Lovable-grade) */
function trimMessagesToFit(messages: any[], maxChars: number): any[] {
  let result = [...messages];
  let total = estimateTotalChars(result);

  // Phase 1: Summarize old assistant messages (they contain huge file outputs)
  if (total > maxChars * 0.7) {
    result = result.map((m, i) => {
      // Keep first 2 and last 3 messages intact
      if (i < 2 || i >= result.length - 3) return m;
      if (m.role === 'assistant' && typeof m.content === 'string' && m.content.length > 500) {
        return { ...m, content: summarizeMessage(m) };
      }
      if (m.role === 'user' && typeof m.content === 'string' && m.content.length > 500) {
        return { ...m, content: summarizeMessage(m) };
      }
      return m;
    });
    total = estimateTotalChars(result);
  }

  // Phase 2: Remove middle messages, keeping summary context
  if (total > maxChars && result.length > 6) {
    const keep = [
      ...result.slice(0, 2),
      { role: 'system', content: `[CONVERSATION SUMMARY — ${result.length - 5} messages condensed]\n` +
        result.slice(2, -3).map((m: any) => `[${m.role}] ${summarizeMessage(m)}`).join('\n') +
        '\n[END SUMMARY]' },
      ...result.slice(-3),
    ];
    result = keep;
    total = estimateTotalChars(result);
  }

  // Phase 3: Remove all middle messages if still too large
  while (total > maxChars && result.length > 4) {
    const removeIdx = result.findIndex((_m: any, i: number) => i > 0 && i < result.length - 3);
    if (removeIdx === -1) break;
    total -= estimateTotalChars([result[removeIdx]]);
    result.splice(removeIdx, 1);
  }

  // Phase 4: Truncate the last user message's file content
  if (total > maxChars) {
    const last = result[result.length - 1];
    if (typeof last.content === 'string' && last.content.length > 200000) {
      last.content = last.content.slice(0, 200000) + '\n\n[Truncated server-side for token budget]';
    } else if (Array.isArray(last.content)) {
      last.content = last.content.map((block: any) => {
        if (block.type === 'text' && block.text?.length > 200000) {
          return { ...block, text: block.text.slice(0, 200000) + '\n[Truncated]' };
        }
        if (block.type === 'text' && block.text) {
          return { ...block, text: block.text.replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]{10000,}/g, '[image data stripped server-side]') };
        }
        return block;
      });
    }
  }

  return result;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Phase 90: Request size guard — reject payloads over 10MB
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 10_000_000) {
      return new Response(JSON.stringify({ error: "Request too large (max 10MB)" }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, stream = true, supabaseConfig, stripeConfig, activeServices = [], mode = 'build', model } = await req.json();

    // Context window management: summarize old messages if conversation is too long
    let processedMessages = [...messages];
    const MAX_CONTEXT_MESSAGES = 40;
    if (processedMessages.length > MAX_CONTEXT_MESSAGES) {
      const oldMessages = processedMessages.slice(2, -10);
      const recentMessages = processedMessages.slice(-10);
      const firstMessages = processedMessages.slice(0, 2);
      
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
    const DISCUSS_SYSTEM_PROMPT = `You are an expert software architect and product designer having a fast-paced, opinionated conversation about what to build. Think senior tech lead pair-programming — not a slow consultant.

CORE BEHAVIOR:
- Be direct and opinionated: "I'd go with X" not "you could consider X or Y or Z"
- When they describe something vague, offer YOUR recommended approach + one alternative: "I'd build this as [A]. Another option is [B], but [A] is better because..."
- Reference real products naturally: "Like Notion's sidebar" or "Stripe's dashboard style"
- Break big ideas into phases unprompted: "For v1, let's nail [core]. V2 can add [nice-to-have]."
- Keep responses SHORT (2-3 paragraphs). Don't over-explain.
- Always end with a clear next step or question to keep momentum

SMART DEFAULTS:
- If they haven't specified a design style, recommend one that fits their app type
- If they mention "users", assume they need auth and mention it
- If they describe data, sketch the data model briefly
- Anticipate what they'll need next and mention it

DO NOT:
- Output any code, HTML, CSS, or ===FILE:=== blocks
- Ask more than 2 questions at once
- Be wishy-washy — have opinions
- Write walls of text

TRANSITION CUE: When the plan feels solid, say something like:
"I think we've got a solid plan! Switch to **Build** mode and I'll generate everything we discussed."

SETUP AWARENESS: If the discussed features need backend services, mention it naturally:
"You'll want Supabase connected before we build — we'll need it for [auth/database/etc]."`;

    let systemPrompt = mode === 'discuss' ? DISCUSS_SYSTEM_PROMPT : BASE_SYSTEM_PROMPT;
    console.log(`System prompt (base): ${systemPrompt.length} chars`);
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

    // Detect URLs and scrape branding data — ONLY for clone/replicate intent
    const urls = extractUrls(processedMessages);
    let brandingContext = '';
    if (urls.length > 0) {
      // Check for clone-intent keywords to avoid blocking scrape on every URL mention
      const lastUserContent = processedMessages.filter((m: any) => m.role === 'user').pop()?.content || '';
      const textContent = typeof lastUserContent === 'string' ? lastUserContent : 
        Array.isArray(lastUserContent) ? lastUserContent.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ') : '';
      const cloneKeywords = /\b(clone|replicate|copy|recreate|rebuild|reproduce|match|mimic|look like|looks like|similar to|based on|inspired by|style of)\b/i;
      const isCloneIntent = cloneKeywords.test(textContent);
      
      if (isCloneIntent) {
        console.log(`Clone intent detected — scraping URLs: ${urls.join(', ')}`);
        const results = await Promise.all(urls.slice(0, 2).map(u => scrapeBranding(u)));
        brandingContext = results.filter(Boolean).join('\n');
      } else {
        console.log(`URLs detected but no clone intent — skipping scrape for speed`);
      }
    }

    // Inject branding data into the last user message
    const enrichedMessages = [...processedMessages];
    if (brandingContext) {
      const lastIdx = enrichedMessages.length - 1;
      if (enrichedMessages[lastIdx]?.role === 'user') {
        const lastContent = enrichedMessages[lastIdx].content;
        // Handle both string and multimodal array content
        if (typeof lastContent === 'string') {
          enrichedMessages[lastIdx] = {
            ...enrichedMessages[lastIdx],
            content: lastContent + brandingContext,
          };
        } else if (Array.isArray(lastContent)) {
          // Find the text block and append branding context to it
          const enrichedContent = lastContent.map((block: any) => {
            if (block.type === 'text') {
              return { ...block, text: block.text + brandingContext };
            }
            return block;
          });
          enrichedMessages[lastIdx] = {
            ...enrichedMessages[lastIdx],
            content: enrichedContent,
          };
        }
      }
    }

    // Sanitize messages: convert unsupported image types (SVG) to text descriptions
    const sanitizedMessages = enrichedMessages.map((msg: any) => {
      if (!Array.isArray(msg.content)) return msg;
      const sanitizedContent = msg.content.map((block: any) => {
        if (block.type === 'image_url' && block.image_url?.url) {
          const url = block.image_url.url;
          // Check for SVG mime type in data URLs
          if (url.startsWith('data:image/svg+xml')) {
            // Convert SVG data URL to text block so the AI can still understand it
            try {
              const base64Part = url.split(',')[1];
              const svgText = atob(base64Part);
              return { type: 'text', text: `[User attached an SVG image. SVG source:\n${svgText.slice(0, 2000)}]` };
            } catch {
              return { type: 'text', text: '[User attached an SVG image that could not be decoded]' };
            }
          }
          // Also check URL extension
          if (url.endsWith('.svg') || url.includes('.svg?')) {
            return { type: 'text', text: `[User attached an SVG image from URL: ${url}]` };
          }
        }
        return block;
      });
      return { ...msg, content: sanitizedContent };
    });

    // Server-side safety: trim messages to fit within gateway token limits
    // System prompt is ~100K tokens (~400K chars). Gemini limit is 1M tokens (~4M chars).
    // Budget ~2M chars for messages to leave headroom for system prompt + response.
    const MAX_MESSAGE_CHARS = 2_000_000;
    const finalMessages = trimMessagesToFit(sanitizedMessages, MAX_MESSAGE_CHARS);

    // ── Gateway call with timeout (Lovable-grade) ──
    const GATEWAY_TIMEOUT_MS = 120_000; // 2 minutes
    const gatewayController = new AbortController();
    const gatewayTimer = setTimeout(() => gatewayController.abort(), GATEWAY_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
      body: JSON.stringify({
          model: model || "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
          stream,
        }),
        signal: gatewayController.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(gatewayTimer);
      if (fetchErr.name === 'AbortError') {
        console.error("AI gateway timed out after", GATEWAY_TIMEOUT_MS, "ms");
        return new Response(JSON.stringify({ error: "AI gateway timed out. Try a shorter prompt." }), {
          status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw fetchErr;
    }
    clearTimeout(gatewayTimer);

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
      if (response.status === 400) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        let parsedMsg = 'Request too large';
        try { parsedMsg = JSON.parse(errorText).error?.message || parsedMsg; } catch {}

        // Auto-retry with aggressively reduced context if token limit exceeded
        if (/token|exceeds|maximum/i.test(parsedMsg)) {
          console.log("Token limit exceeded — retrying with reduced context (400K chars)");
          const reducedMessages = trimMessagesToFit(sanitizedMessages, 400_000);
          try {
            const retryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: model || "google/gemini-3-flash-preview",
                messages: [{ role: "system", content: systemPrompt }, ...reducedMessages],
                stream,
              }),
            });
            if (retryResp.ok) {
              console.log("Retry with reduced context succeeded");
              if (stream) {
                return new Response(retryResp.body, {
                  headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                });
              }
              const retryData = await retryResp.json();
              return new Response(JSON.stringify({ content: retryData.choices?.[0]?.message?.content || "" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
          } catch (retryErr) {
            console.error("Retry failed:", retryErr);
          }
        }

        return new Response(JSON.stringify({ error: parsedMsg }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
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

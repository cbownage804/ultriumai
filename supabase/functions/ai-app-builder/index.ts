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

IMPORTS: Always use ESM (import/export). Always destructure React hooks: import { useState, useEffect } from 'react'. Never use require(). Never mix import and require in the same project.

NAMING: Each file must export a uniquely named component matching its filename. App.tsx exports App, Header.tsx exports Header. Never duplicate export names across files.

CRITICAL: EVERY .map() that returns JSX MUST have a unique key prop. Use item.id or index as fallback. Missing keys cause React warnings that break the preview.

TAILWIND: Only use default Tailwind utility classes. Do NOT invent custom classes like 'text-primary-500'. Use exact values: text-blue-500, bg-gray-100, etc. For custom colors, define them in a <style> block using CSS custom properties.

ASYNC: Every async event handler MUST have try/catch. Show error feedback on failure (alert, console.error, or toast). Never leave async operations uncaught.

HANDLERS: Every onClick, onChange, onSubmit handler MUST reference a function defined earlier in the same component. Before outputting a JSX element with an event handler, verify the handler function exists. If it doesn't, define it as a const arrow function above the return statement.

RESPONSIVE: ALWAYS use responsive Tailwind classes: grid-cols-1 sm:grid-cols-2 lg:grid-cols-3. NEVER use fixed pixel widths for containers. Use max-w-7xl mx-auto for page width. Sidebars must collapse on mobile (hidden md:block). Test: the app must look correct at 375px width.

STATE: ALL data displayed in lists, tables, or cards MUST come from useState (or Supabase queries). NEVER hardcode data in JSX. Initialize state with 2-3 sample items. All CRUD operations must modify state using setState with immutable patterns (.filter, .map, spread operator).

LOADING: Show a centered spinner (CSS animation, no dependencies) during ALL async operations. Use a simple isLoading state: const [isLoading, setIsLoading] = useState(true). Wrap data-fetching in useEffect that sets isLoading=false after data arrives. The spinner must be visible IMMEDIATELY — no delayed renders.

EMPTY STATES: Every list, table, or data grid MUST check if data.length === 0 and show a friendly empty state: an icon, a message ('No items yet'), and a CTA button ('Add your first item'). Never render an empty container.

RESILIENCE: Every fetch/API call must have: 1) try/catch, 2) a user-visible error message (not just console.error), 3) a retry button. For Supabase queries, check both 'error' and 'data' before rendering. Show 'Something went wrong. Try again.' with a retry button on failure.

FORMS: Every form MUST have: 1) 'required' attribute on mandatory fields, 2) type='email' for email fields, 3) minLength for text fields, 4) a disabled submit button until form is valid, 5) onSubmit with e.preventDefault(). Show inline validation errors on blur. Never allow empty form submission.

MULTI-PAGE: ROUTING: For multi-page apps, use a hash-based router (window.location.hash) with a central renderPage() function. Each 'page' is a function that returns HTML. The nav links must use '#/page' format. Include a hashchange listener that re-renders on navigation. Test: clicking every nav link must show different content.

URL SCRAPING: NEVER use CORS proxies. Use platform Firecrawl edge function.
PRE-CHECKS: All handlers defined, all DOM IDs exist, mutations persist+render, no orphan buttons.

CHUNKING: Output the MOST IMPORTANT files first (index.html, then main app file, then styles).
LENGTH: If your response will exceed 4000 lines, use ===CONTINUE=== to signal you need more rounds.
NEVER leave a file half-written. Finish the current file completely before moving to the next.
If you run out of space, end your response with ===CONTINUE=== on its own line — the system will
automatically send a follow-up request for remaining files. Do NOT rush or truncate files
to fit everything in one response. Quality over completeness.`;



const SUPABASE_ADDON = `
SUPABASE INTEGRATION:
Globals available: \`supabase\`, \`SUPABASE_URL\`, \`SUPABASE_ANON_KEY\`. SDK is pre-loaded.
Use for: auth, database queries, realtime subscriptions, storage.

UX: Every data-fetching component MUST have a loading state (spinner or skeleton). Initialize data as empty array [], not undefined. Show error state if query fails. Never render raw undefined data.

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

/** Scrape a website for branding using Firecrawl — Phase 5: with 5s timeout */
async function scrapeBranding(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("FIRECRAWL_API_KEY not available, skipping branding scrape");
    return null;
  }

  try {
    console.log(`Scraping branding from: ${url}`);
    // Phase 5: 5s AbortController timeout to prevent starving the AI gateway call
    const scrapeController = new AbortController();
    const scrapeTimeout = setTimeout(() => scrapeController.abort(), 5000);
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
      signal: scrapeController.signal,
    });
    clearTimeout(scrapeTimeout);

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

  // Phase 103: Smart truncation of last user message — preserve instruction, trim file context
  if (total > maxChars) {
    const last = result[result.length - 1];
    if (typeof last.content === 'string' && last.content.length > 200000) {
      // Detect the boundary between user instruction and file context
      const userRequestMarker = last.content.indexOf('User request:');
      const projectFilesMarker = last.content.indexOf('[PROJECT FILES]');
      if (userRequestMarker >= 0 && projectFilesMarker >= 0) {
        // Preserve first 5000 chars of user instruction + truncated file context
        const instructionEnd = Math.min(userRequestMarker + 5000, projectFilesMarker);
        const instruction = last.content.slice(0, instructionEnd);
        const fileContext = last.content.slice(projectFilesMarker);
        const maxFileContext = 200000 - instruction.length;
        last.content = instruction + fileContext.slice(0, maxFileContext) + '\n\n[File context truncated server-side for token budget]';
      } else {
        last.content = last.content.slice(0, 200000) + '\n\n[Truncated server-side for token budget]';
      }
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

/** Phase 71: Auto-detect truncated output and append ===CONTINUE=== */
function detectTruncatedOutput(content: string): boolean {
  if (!content || content.length < 100) return false;
  const lastLines = content.trim().split('\n').slice(-5);
  const lastLine = lastLines[lastLines.length - 1]?.trim() || '';
  // Check if we're inside an unclosed code block (no matching ===FILE: with content after it)
  const fileMarkers = content.match(/===FILE:\s*.+?===/g) || [];
  if (fileMarkers.length === 0) return false;
  // If the last non-empty line looks like code (not a closing tag/brace) and we have open markers
  const looksLikeCode = /^[\s]*[a-zA-Z<{\/\[\]()@#.;:=!&|+\-*%?~`\\]/.test(lastLine) && !lastLine.includes('===');
  const hasUnclosedBraces = (content.match(/{/g) || []).length > (content.match(/}/g) || []).length + 2;
  return looksLikeCode && hasUnclosedBraces;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Phase 100: Generate request ID for debugging
  const requestId = crypto.randomUUID();

  try {
    // Phase 90: Request size guard — reject payloads over 10MB
    const contentLength = parseInt(req.headers.get('content-length') || '0');
    if (contentLength > 10_000_000) {
      return new Response(JSON.stringify({ error: "Request too large (max 10MB)", requestId }), {
        status: 413, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
      });
    }

    const { messages, stream = true, supabaseConfig, stripeConfig, activeServices = [], mode = 'build', model } = await req.json();

    console.log(`[${requestId}] Mode: ${mode}, Messages: ${messages?.length}, Model: ${model || 'default'}`);

    // Phase 54: Validate message content types — filter malformed messages
    const validatedMessages = (messages as any[]).filter((m: any) => {
      if (!m || !m.role) return false;
      if (m.content === null || m.content === undefined) return false;
      if (typeof m.content === 'number') { m.content = String(m.content); return true; }
      if (typeof m.content === 'string') return true;
      if (Array.isArray(m.content)) {
        m.content = m.content.filter((block: any) => 
          block && (block.type === 'text' || block.type === 'image_url')
        );
        // Phase 99: Truncate oversized base64 images (>2MB)
        m.content = m.content.map((block: any) => {
          if (block.type === 'image_url' && block.image_url?.url) {
            const url = block.image_url.url;
            if (url.startsWith('data:') && url.length > 2_000_000) {
              console.log(`[${requestId}] Truncating oversized image block (${Math.round(url.length / 1024)}KB)`);
              return { ...block, image_url: { ...block.image_url, url: url.slice(0, 1_000_000) } };
            }
          }
          return block;
        });
        return m.content.length > 0;
      }
      return false;
    });

    // Phase 55: Validate model string
    const VALID_MODELS = new Set([
      'google/gemini-3-flash-preview',
      'google/gemini-2.5-flash',
      'google/gemini-2.0-flash',
      'anthropic/claude-sonnet-4',
      'anthropic/claude-3.5-sonnet',
    ]);
    const DEFAULT_MODEL = 'google/gemini-3-flash-preview';
    const selectedModel = (model && VALID_MODELS.has(model)) ? model : DEFAULT_MODEL;

    // Context window management: summarize old messages if conversation is too long
    let processedMessages = [...validatedMessages];
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

    if (!validatedMessages || !Array.isArray(validatedMessages) || validatedMessages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required", requestId }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
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
    console.log(`[${requestId}] System prompt (base): ${systemPrompt.length} chars`);
    if (supabaseConfig) systemPrompt += SUPABASE_ADDON;
    if (stripeConfig) systemPrompt += STRIPE_ADDON;

    // Phase 97: Cap system prompt — only include 2 most relevant service prompts
    const lastUserText = (() => {
      const last = processedMessages.filter((m: any) => m.role === 'user').pop();
      if (!last) return '';
      if (typeof last.content === 'string') return last.content;
      if (Array.isArray(last.content)) return last.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ');
      return '';
    })();

    // Score services by relevance to user's message
    const scoredServices = activeServices.map((serviceId: string) => {
      const keywords: Record<string, string[]> = {
        openai: ['gpt', 'openai', 'chatgpt', 'ai chat', 'completion'],
        anthropic: ['claude', 'anthropic'],
        google_ai: ['gemini', 'google ai'],
        elevenlabs: ['voice', 'speech', 'tts', 'text to speech', 'audio'],
        deepgram: ['transcribe', 'speech to text', 'stt', 'voice'],
        replicate: ['image generation', 'stable diffusion', 'flux', 'replicate'],
        groq: ['groq', 'llama', 'fast ai'],
      };
      const serviceKeywords = keywords[serviceId] || [serviceId];
      const score = serviceKeywords.some(kw => lastUserText.toLowerCase().includes(kw)) ? 10 : 0;
      return { serviceId, score };
    }).sort((a: any, b: any) => b.score - a.score);

    // Include top 2 relevant + any explicitly mentioned
    const MAX_SERVICE_ADDONS = 2;
    let addedServices = 0;
    for (const { serviceId } of scoredServices) {
      if (addedServices >= MAX_SERVICE_ADDONS && systemPrompt.length > 5000) break;
      if (SERVICE_PROMPTS[serviceId]) {
        systemPrompt += SERVICE_PROMPTS[serviceId];
        addedServices++;
      }
    }

    if (activeServices.length > 0) {
      systemPrompt += `\n\nIMPORTANT: All API keys are available via window.ENV.KEY_NAME. Do NOT hardcode keys. Always use window.ENV to access them. Note: browser-side API calls expose keys — acceptable for prototyping only.`;
    }

    // Phase 98: Tighten clone-intent detection — require URL proximity to keyword
    const urls = extractUrls(processedMessages);
    let brandingContext = '';
    if (urls.length > 0 && lastUserText.length >= 20) {
      // Check for clone-intent keywords NEAR a URL (within 80 chars)
      const cloneKeywords = /\b(clone|replicate|copy|recreate|rebuild|reproduce|match|mimic|similar to|based on|inspired by|style of)\b/i;
      const isCloneIntent = (() => {
        for (const url of urls) {
          const urlIdx = lastUserText.indexOf(url);
          if (urlIdx === -1) continue;
          const nearby = lastUserText.slice(Math.max(0, urlIdx - 80), urlIdx + url.length + 80);
          if (cloneKeywords.test(nearby)) return true;
        }
        // Also check if clone keyword appears before any URL
        const firstUrlIdx = Math.min(...urls.map(u => lastUserText.indexOf(u)).filter(i => i >= 0));
        if (firstUrlIdx > 0) {
          const before = lastUserText.slice(0, firstUrlIdx);
          if (cloneKeywords.test(before)) return true;
        }
        return false;
      })();
      
      if (isCloneIntent) {
        console.log(`[${requestId}] Clone intent detected — scraping URLs: ${urls.join(', ')}`);
        const results = await Promise.all(urls.slice(0, 2).map(u => scrapeBranding(u)));
        brandingContext = results.filter(Boolean).join('\n');
      } else {
        console.log(`[${requestId}] URLs detected but no clone intent — skipping scrape`);
      }
    }

    // Inject branding data into the last user message
    const enrichedMessages = [...processedMessages];
    if (brandingContext) {
      const lastIdx = enrichedMessages.length - 1;
      if (enrichedMessages[lastIdx]?.role === 'user') {
        const lastContent = enrichedMessages[lastIdx].content;
        if (typeof lastContent === 'string') {
          enrichedMessages[lastIdx] = { ...enrichedMessages[lastIdx], content: lastContent + brandingContext };
        } else if (Array.isArray(lastContent)) {
          const enrichedContent = lastContent.map((block: any) => {
            if (block.type === 'text') return { ...block, text: block.text + brandingContext };
            return block;
          });
          enrichedMessages[lastIdx] = { ...enrichedMessages[lastIdx], content: enrichedContent };
        }
      }
    }

    // Sanitize messages: convert unsupported image types (SVG) to text descriptions
    const sanitizedMessages = enrichedMessages.map((msg: any) => {
      if (!Array.isArray(msg.content)) return msg;
      const sanitizedContent = msg.content.map((block: any) => {
        if (block.type === 'image_url' && block.image_url?.url) {
          const url = block.image_url.url;
          if (url.startsWith('data:image/svg+xml')) {
            try {
              const base64Part = url.split(',')[1];
              const svgText = atob(base64Part);
              return { type: 'text', text: `[User attached an SVG image. SVG source:\n${svgText.slice(0, 2000)}]` };
            } catch {
              return { type: 'text', text: '[User attached an SVG image that could not be decoded]' };
            }
          }
          if (url.endsWith('.svg') || url.includes('.svg?')) {
            return { type: 'text', text: `[User attached an SVG image from URL: ${url}]` };
          }
        }
        return block;
      });
      return { ...msg, content: sanitizedContent };
    });

    // Server-side safety: trim messages to fit within gateway token limits
    const MAX_MESSAGE_CHARS = 2_000_000;
    const finalMessages = trimMessagesToFit(sanitizedMessages, MAX_MESSAGE_CHARS);

    // Phase 57: Log final payload size for debugging token errors
    const finalPayloadChars = estimateTotalChars([{ role: 'system', content: systemPrompt }, ...finalMessages]);
    console.log(`[${requestId}] Final payload: ${finalPayloadChars} chars (~${Math.round(finalPayloadChars / 4)} tokens), ${finalMessages.length} messages, system prompt: ${systemPrompt.length} chars`);

    // ── Gateway call with timeout (Lovable-grade) ──
    const GATEWAY_TIMEOUT_MS = 50_000;
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
          model: selectedModel,
          messages: [{ role: "system", content: systemPrompt }, ...finalMessages],
          stream,
        }),
        signal: gatewayController.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(gatewayTimer);
      if (fetchErr.name === 'AbortError') {
        console.error(`[${requestId}] AI gateway timed out after ${GATEWAY_TIMEOUT_MS}ms`);
        return new Response(JSON.stringify({ error: "AI gateway timed out. Try a shorter prompt.", requestId }), {
          status: 504, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
        });
      }
      throw fetchErr;
    }
    clearTimeout(gatewayTimer);

    if (!response.ok) {
      // Phase 96: Safely parse error response (handle HTML 502 pages)
      const parseErrorResponse = async (resp: Response): Promise<string> => {
        try {
          const text = await resp.text();
          try {
            const json = JSON.parse(text);
            return json.error?.message || json.error || text.slice(0, 500);
          } catch {
            // HTML error page or non-JSON — extract meaningful text
            const stripped = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            return stripped.slice(0, 500) || `HTTP ${resp.status}`;
          }
        } catch {
          return `HTTP ${resp.status} (response unreadable)`;
        }
      };

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait and try again.", requestId }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted.", requestId }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
        });
      }
      if (response.status === 400) {
        const parsedMsg = await parseErrorResponse(response);
        console.error(`[${requestId}] AI gateway 400:`, parsedMsg);

        // Auto-retry with reduced context if token limit exceeded
        const FALLBACK_MODEL = "google/gemini-2.5-flash";
        if (/token|exceeds|maximum/i.test(parsedMsg)) {
          console.log(`[${requestId}] Token limit exceeded — retrying with reduced context + fallback model`);
          const reducedMessages = trimMessagesToFit(sanitizedMessages, 400_000);
          const retryController = new AbortController();
          const retryTimer = setTimeout(() => retryController.abort(), 25_000);
          try {
            const retryResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
              body: JSON.stringify({
                model: FALLBACK_MODEL,
                messages: [{ role: "system", content: systemPrompt }, ...reducedMessages],
                stream,
              }),
              signal: retryController.signal,
            });
            if (retryResp.ok) {
              console.log(`[${requestId}] Retry with reduced context succeeded`);
              if (stream) {
                return new Response(retryResp.body, {
                  headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-Request-Id": requestId },
                });
              }
              const retryData = await retryResp.json();
              return new Response(JSON.stringify({ content: retryData.choices?.[0]?.message?.content || "", requestId }), {
                headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
              });
            }
          } catch (retryErr) {
            console.error(`[${requestId}] Retry failed:`, retryErr);
          } finally {
            clearTimeout(retryTimer);
          }
        }

        return new Response(JSON.stringify({ error: parsedMsg, requestId }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
        });
      }
      // Transient 500/502/503
      const errorMsg = await parseErrorResponse(response);
      console.error(`[${requestId}] AI gateway ${response.status}:`, errorMsg);
      return new Response(JSON.stringify({ error: "AI service is temporarily unavailable. Please try again in a moment.", requestId }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "5", "X-Request-Id": requestId },
      });
    }

    if (stream) {
      // Phase 56: Wrap stream in TransformStream to ensure proper termination on abort
      // Fix 3: Hardened — always send [DONE] on any exit path including runtime shutdown
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const reader = response.body!.getReader();
      const encoder = new TextEncoder();
      let sentDone = false;

      const ensureDone = async () => {
        if (sentDone) return;
        sentDone = true;
        try { await writer.write(encoder.encode('data: [DONE]\n\n')); } catch {}
        try { await writer.close(); } catch {}
      };

      // Deno runtime shutdown signal — flush [DONE] before process exits
      const shutdownHandler = () => { ensureDone(); };
      globalThis.addEventListener?.('unload', shutdownHandler);
      // Also use abort signal from the incoming request
      req.signal?.addEventListener('abort', () => { ensureDone(); });

      (async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } catch (e) {
          // Stream aborted by upstream — still send termination signal
        } finally {
          await ensureDone();
          globalThis.removeEventListener?.('unload', shutdownHandler);
        }
      })();
      return new Response(readable, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream", "X-Request-Id": requestId },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify({ content: data.choices?.[0]?.message?.content || "", requestId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
    });
  } catch (e) {
    console.error(`[${requestId}] ai-app-builder error:`, e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error", requestId }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json", "X-Request-Id": requestId },
    });
  }
});

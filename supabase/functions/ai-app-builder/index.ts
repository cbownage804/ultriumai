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

===FILE: components/header.js===
// Component code

RULES:
- Always start with ===FILE: index.html=== as the entry point
- Create separate files for CSS (styles.css), JavaScript (app.js), and components
- The index.html should reference other files via <link> and <script> tags, but since we combine them, just structure the code logically
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

MULTI-FILE BEST PRACTICES:
- Put global styles in styles.css
- Put layout/structural CSS in layout.css for complex projects
- Put interactive logic in app.js
- Put reusable component logic in components/*.js
- Put utility functions in utils.js
- Keep each file focused and cohesive

When MODIFYING an existing project:
- The user will provide the current file contents
- Only output the files that need changes using the ===FILE: path=== format
- Preserve unchanged files (don't output them)
- If adding new files, include them
- Output the COMPLETE content of changed files, not diffs`;

const SUPABASE_ADDON = `

SUPABASE INTEGRATION:
The user has connected a Supabase project. The supabase-js SDK is pre-loaded and a \`supabase\` client is already initialized globally. You can use it directly in your JavaScript:

Available globals:
- \`supabase\` — a fully configured Supabase client
- \`SUPABASE_URL\` — the project URL
- \`SUPABASE_ANON_KEY\` — the anon/public key

Use these for:
- Authentication: \`supabase.auth.signInWithPassword()\`, \`supabase.auth.signUp()\`, \`supabase.auth.getSession()\`
- Database queries: \`supabase.from('table').select()\`, \`.insert()\`, \`.update()\`, \`.delete()\`
- Realtime: \`supabase.channel('name').on('postgres_changes', ...)\`
- Storage: \`supabase.storage.from('bucket').upload()\`

IMPORTANT:
- Do NOT include any <script> tag for supabase-js — it's already injected
- Do NOT create a supabase client — it's already available as \`supabase\`
- Always use async/await with try/catch for Supabase operations
- Show loading states and error messages to users
- When the user asks for auth, database, or realtime features, USE SUPABASE
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, stream = true, supabaseConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: BASE_SYSTEM_PROMPT + (supabaseConfig ? SUPABASE_ADDON : '') },
          ...messages,
        ],
        stream,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (stream) {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-app-builder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

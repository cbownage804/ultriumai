/**
 * ray-action — Natural language → structured Ray action.
 *
 * Ray listens to what the user says, decides whether it's a direct command
 * (navigate, run a scan, open a section) or a question that needs a
 * conversational answer, and returns a structured intent the client can
 * execute without a page change.
 *
 * Powered by Lovable AI Gateway (google/gemini-3-flash-preview).
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Routes Ray can navigate to without confirmation.
const ROUTES: Record<string, { path: string; label: string }> = {
  home:       { path: "/app/dashboard", label: "your briefing" },
  dashboard:  { path: "/app/dashboard", label: "your briefing" },
  passwords:  { path: "/app/pass",      label: "your passwords" },
  vault:      { path: "/app/pass",      label: "your passwords" },
  threats:    { path: "/app/scan",      label: "the threat scanner" },
  scan:       { path: "/app/scan",      label: "the threat scanner" },
  exposure:   { path: "/app/web",       label: "your exposure" },
  watch:      { path: "/app/web",       label: "your exposure" },
  timeline:   { path: "/app/timeline",  label: "the timeline" },
  settings:   { path: "/app/settings",  label: "settings" },
  ray:        { path: "/app/ray",       label: "Ray" },
};

const SYSTEM_PROMPT = `You are Ray's intent router for the Wrayth security platform.
Decode a single user utterance into ONE structured action. Reply with strict JSON, no prose.

Schema:
{
  "intent": "navigate" | "scan" | "ask",
  "target": string | null,   // for navigate: one of [home, passwords, threats, exposure, timeline, settings, ray]; for scan: a URL/domain/email if present, else null
  "say": string              // <= 90 chars, Ray's calm voice in first person ("On it.", "Opening your passwords.", "Let me check...")
}

Rules:
- "open/show/take me to/go to <X>" → intent=navigate with the closest target.
- "scan <url>" / "check this site" / "look up <domain>" → intent=scan.
- Everything else (questions, explanations, advice, "what should I fix") → intent=ask.
- Never invent a target outside the allowed list.
- "say" must sound like Ray: calm, confident, never robotic, no emoji.`;

interface RayAction {
  intent: "navigate" | "scan" | "ask";
  target: string | null;
  say: string;
  path?: string;       // resolved on server for navigate
  label?: string;      // resolved on server for navigate
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { message } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Ray brain unavailable" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text().catch(() => "");
      const status = aiRes.status === 429 ? 429 : aiRes.status === 402 ? 402 : 500;
      return new Response(JSON.stringify({ error: errText || "Ray brain failed" }), {
        status, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const raw = aiJson?.choices?.[0]?.message?.content ?? "{}";

    let action: RayAction;
    try {
      action = JSON.parse(raw);
    } catch {
      action = { intent: "ask", target: null, say: "Let me think on that." };
    }

    // Resolve navigate target on the server so client just navigates.
    if (action.intent === "navigate") {
      const key = (action.target || "").toLowerCase().trim();
      const route = ROUTES[key];
      if (route) {
        action.path = route.path;
        action.label = route.label;
      } else {
        // Unrecognized target → fall back to ask.
        action.intent = "ask";
        action.say = action.say || "I'm not sure where you'd like to go. Tell me a bit more?";
      }
    }

    return new Response(JSON.stringify(action), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

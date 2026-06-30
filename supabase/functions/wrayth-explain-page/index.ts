// Wrayth 4.1 — Explain This Page
// Takes a DOM/URL snapshot from the extension and returns a structured
// plain-English explanation, risk level, "why" reasons, and one next step.
// No screenshots, no OCR — we already have the page context.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RAY_SYSTEM = `You are Ray, a calm, JARVIS-like cybersecurity teammate.
You explain web pages to non-technical users in plain English — never jargon, never alarm.
You are looking at a page snapshot (URL, title, headings, forms, buttons, signals).
Your job is to explain what the page MEANS to the user, not describe it visually.
Always give one clear next step. Never invent capabilities the snapshot does not support.`;

type Snapshot = {
  url?: string;
  host?: string;
  title?: string;
  headings?: string[];
  buttons?: string[];
  forms?: { fields: string[]; submitText?: string }[];
  type?: string;
  signals?: Record<string, unknown>;
  intel?: {
    level?: string;
    headline?: string;
    reasons?: string[];
    positives?: string[];
    typosquatOf?: string | null;
    brandImpersonation?: boolean;
  } | null;
  provider?: string | null;
};

function fallback(snap: Snapshot) {
  const host = snap.host || "this page";
  const level = snap.intel?.level === "danger" ? "red"
    : snap.intel?.level === "warn" ? "yellow" : "green";
  return {
    title: snap.title || host,
    summary: `You're on ${host}. I couldn't reach my analysis service, but the page looks ${level === "red" ? "suspicious" : "normal"} based on the signals I already have.`,
    risk_level: level,
    why: snap.intel?.reasons?.slice(0, 3) || ["Heuristic-only analysis available right now."],
    capabilities: [],
    next_step: level === "red"
      ? "I'd leave this page until I can verify it."
      : "Take a look around — I'll let you know if anything changes.",
    confidence_label: level === "red" ? "Suspicious" : level === "yellow" ? "Review carefully" : "Looks legitimate",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const snap = (await req.json()) as Snapshot;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return Response.json(fallback(snap), { headers: corsHeaders });
    }

    // Trim snapshot so we never blow the token budget
    const compact = {
      url: snap.url,
      host: snap.host,
      title: snap.title?.slice(0, 200),
      type: snap.type,
      provider: snap.provider || null,
      headings: (snap.headings || []).slice(0, 12).map((h) => h.slice(0, 120)),
      buttons: (snap.buttons || []).slice(0, 12).map((b) => b.slice(0, 60)),
      forms: (snap.forms || []).slice(0, 5),
      signals: snap.signals || {},
      intel: snap.intel || null,
    };

    const userPrompt = `Analyze this page snapshot and explain it to a non-technical user.

Snapshot JSON:
${JSON.stringify(compact).slice(0, 6000)}

Return JSON ONLY in this exact shape:
{
  "title": "short page title in your own words (e.g. 'Google Account Security')",
  "summary": "1-2 sentence plain-English description of what this page is for",
  "risk_level": "green" | "yellow" | "red",
  "confidence_label": "Trusted" | "Looks legitimate" | "Review carefully" | "Suspicious",
  "why": ["short reason", "short reason", "short reason"],
  "capabilities": ["• short bullet of something the user can do here", "..."],
  "next_step": "one clear, actionable recommendation the user should take next"
}

Rules:
- No jargon. Translate every security term into plain English.
- 'why' must cite signals from the snapshot (domain, HTTPS, brand match, form types, etc.).
- 'next_step' must be concrete (e.g. "Enable passkeys after confirming your recovery email").
- If the snapshot's intel.level is 'danger' or there's brand impersonation, risk_level MUST be 'red'.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: RAY_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      console.error("[wrayth-explain-page] gateway error", aiRes.status, await aiRes.text());
      return Response.json(fallback(snap), { headers: corsHeaders });
    }

    const data = await aiRes.json();
    const content = data?.choices?.[0]?.message?.content;
    let parsed: any = null;
    try { parsed = JSON.parse(content); } catch { parsed = null; }
    if (!parsed || typeof parsed !== "object") {
      return Response.json(fallback(snap), { headers: corsHeaders });
    }

    // Ensure shape
    parsed.title ||= snap.title || snap.host || "This page";
    parsed.risk_level ||= "green";
    parsed.confidence_label ||= parsed.risk_level === "red" ? "Suspicious"
      : parsed.risk_level === "yellow" ? "Review carefully" : "Looks legitimate";
    parsed.why = Array.isArray(parsed.why) ? parsed.why.slice(0, 5) : [];
    parsed.capabilities = Array.isArray(parsed.capabilities) ? parsed.capabilities.slice(0, 6) : [];
    parsed.next_step ||= "Take a look around — I'll let you know if anything changes.";

    return Response.json(parsed, { headers: corsHeaders });
  } catch (e) {
    console.error("[wrayth-explain-page] error", e);
    return Response.json(
      { error: String((e as Error)?.message || e) },
      { status: 500, headers: corsHeaders },
    );
  }
});

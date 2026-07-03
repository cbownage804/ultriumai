/**
 * ray-investigate-followup — Generate a follow-up output from an existing
 * Deep Threat Investigation. One investigation, many outputs:
 *   - executive_report     (2 RC)  board-ready one-pager
 *   - management_explanation (1 RC) plain-English "explain to my boss"
 *   - incident_report      (2 RC)  compliance-flavored incident write-up
 *   - question             (1 RC)  free-form Q&A grounded in the investigation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const MODEL = "google/gemini-2.5-flash";

type FollowupType = "executive_report" | "management_explanation" | "incident_report" | "question";

const COST: Record<FollowupType, number> = {
  executive_report: 2,
  management_explanation: 1,
  incident_report: 2,
  question: 1,
};

const TITLES: Record<FollowupType, string> = {
  executive_report: "Executive report",
  management_explanation: "Explain to management",
  incident_report: "Incident report",
  question: "Ray's answer",
};

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You write additional outputs based on a completed investigation. Voice: calm,
precise, first person ("I found", "I recommend"), never alarmist. Ground every
claim in the investigation record — never invent IOCs, MITRE IDs, CVEs, or
attribution. Return well-formed Markdown, no code fences.`;

function buildPrompt(type: FollowupType, inv: Record<string, unknown>, question?: string): string {
  const base = `Investigation record:
"""
${JSON.stringify({
  input_type: inv.input_type,
  input_label: inv.input_label,
  verdict: inv.verdict,
  confidence: inv.confidence,
  summary: inv.summary,
  executive_summary: inv.executive_summary,
  technical_findings: inv.technical_findings,
  mitre: inv.mitre,
  iocs: inv.iocs,
  recommended_response: inv.recommended_response,
  timeline: inv.timeline,
}, null, 2)}
"""`;

  switch (type) {
    case "executive_report":
      return `${base}

Write a one-page executive report suitable for a board or leadership team.
Structure with Markdown headings:
## Bottom line
(2 sentences — verdict, confidence, business impact.)
## What happened
(2-4 sentences in plain English, no jargon.)
## What we're doing about it
(3-5 bullet points describing response actions.)
## What leadership should know
(1-3 short bullets on residual risk and follow-through.)

Do not include a title. Do not include IOC tables — save those for the technical view.`;

    case "management_explanation":
      return `${base}

Write 3-5 short paragraphs that explain this investigation to a non-technical
manager. No jargon, no MITRE IDs. Answer: what did I look at, is it dangerous,
what am I doing about it, what should they do (if anything).`;

    case "incident_report":
      return `${base}

Write a compliance-style incident report. Use these Markdown sections:
## Summary
## Detection
## Scope & impact
## Timeline
(bulleted, one line per event)
## Response actions
(bulleted)
## Indicators of compromise
(bulleted, each as \`type — value\`)
## MITRE ATT&CK
(bulleted, each as \`ID — Name — why applicable\`)
## Recommendations
## Status
(one line: Open / Contained / Resolved / Monitoring)

Keep it factual and suitable to attach to a compliance record. Do not include a title.`;

    case "question":
      return `${base}

The user asks: "${question ?? ""}"

Answer in 1-3 short paragraphs, grounded in the investigation record above.
If the record does not contain enough information to answer, say so plainly
and describe what additional data would be needed.`;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: ud, error: uerr } = await userClient.auth.getUser();
  if (uerr || !ud?.user) {
    return new Response(JSON.stringify({ error: "unauthenticated" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = ud.user.id;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const investigation_id = String(body.investigation_id ?? "");
  const type = String(body.followup_type ?? "") as FollowupType;
  const question = body.question ? String(body.question).slice(0, 1000) : null;

  if (!COST[type]) {
    return new Response(JSON.stringify({ error: "invalid_followup_type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (type === "question" && !question) {
    return new Response(JSON.stringify({ error: "question_required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: inv } = await admin
    .from("ray_investigations")
    .select("*")
    .eq("id", investigation_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!inv) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "ai_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const title = type === "question" ? (question!.slice(0, 120)) : TITLES[type];
  const cost = COST[type];

  let content: string | null = null;
  let aiError: string | null = null;

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: RAY_SYSTEM },
          { role: "user", content: buildPrompt(type, inv as Record<string, unknown>, question ?? undefined) },
        ],
      }),
    });
    if (aiRes.status === 429) aiError = "rate_limited";
    else if (aiRes.status === 402) aiError = "credits_exhausted";
    else if (!aiRes.ok) aiError = `ai_${aiRes.status}`;
    else {
      const j = await aiRes.json();
      content = j?.choices?.[0]?.message?.content ?? null;
      if (!content) aiError = "empty_response";
    }
  } catch (e) {
    aiError = (e as Error).message?.slice(0, 200) ?? "ai_unknown";
  }

  const { data: row, error: insErr } = await admin
    .from("ray_investigation_followups")
    .insert({
      investigation_id,
      user_id: userId,
      followup_type: type,
      question,
      title,
      content,
      cost_ray_compute: cost,
      status: aiError ? "failed" : "complete",
      error: aiError,
      model: MODEL,
    })
    .select("*")
    .single();

  if (insErr) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: !aiError, followup: row, error: aiError }), {
    status: aiError ? 502 : 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

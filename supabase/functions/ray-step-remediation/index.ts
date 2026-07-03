/**
 * ray-step-remediation — one-click, per-step remediation planning.
 *
 * Given an attack_path_id + step_index, Ray produces a tailored, priority-sorted
 * action list scoped to that specific step (its phase, entities, reasoning) —
 * not the whole chain. Returned inline; not persisted (cheap, re-runnable).
 * Costs 2 Credits.
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
const COST = 2;
const MODEL = "google/gemini-2.5-flash";

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You are producing a tailored remediation plan for a SINGLE step of an attack
path — not the whole chain. Ground every action in the step's phase, entities,
and evidence. Do not invent devices, users, or infrastructure that weren't in
the input. Return STRICT JSON. No prose outside the JSON.`;

const SCHEMA_HINT = `{
  "summary": "1-2 sentence plain-English summary of how to close this specific step.",
  "actions": [
    {
      "priority": 1,
      "title": "Short imperative action title (<=80 chars).",
      "detail": "Concrete step-by-step guidance grounded in this step's context.",
      "owner": "user | it | soc | leadership",
      "difficulty": "low | medium | high",
      "effort": "minutes | hours | days",
      "kind": "preventative | detective | corrective | compensating",
      "closes": "How this action breaks or blunts THIS attack step.",
      "targets": ["Specific entity names from the step this action applies to. Empty if not entity-specific."],
      "verification": "How to verify the fix worked."
    }
  ],
  "quick_wins": ["Titles of 1-3 actions the user can do TODAY, echoing action titles."],
  "long_term": ["Titles of actions that need change management or budget."]
}

Guidance:
- 3-7 actions typical, priority 1 = highest impact for THIS step.
- Prefer actions that address the earliest cause (identity, config, patch) over reactive alerting.
- If the step has entities, reference them by their exact name in "targets".
- Skip generic advice like "train users" unless the step is specifically about human factors.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
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

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const attack_path_id = typeof body.attack_path_id === "string" ? body.attack_path_id : null;
  const step_index = typeof body.step_index === "number" ? body.step_index : -1;

  if (!attack_path_id || step_index < 0) {
    return new Response(JSON.stringify({ error: "attack_path_id and step_index required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load path via RLS-safe user client
  const { data: pathRow, error: pErr } = await userClient
    .from("ray_attack_paths")
    .select("id, title, severity, summary, steps, blast_radius, scenario")
    .eq("id", attack_path_id)
    .maybeSingle();
  if (pErr || !pathRow) {
    return new Response(JSON.stringify({ error: "path_not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const steps = Array.isArray((pathRow as { steps: unknown[] }).steps) ? (pathRow as { steps: Record<string, unknown>[] }).steps : [];
  const step = steps[step_index];
  if (!step) {
    return new Response(JSON.stringify({ error: "step_index_out_of_range" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "ai_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const p = pathRow as Record<string, unknown>;
  const userPrompt = `Produce a tailored remediation plan for a SINGLE step of an attack path.

ATTACK PATH CONTEXT
Title: ${String(p.title ?? "")}
Severity: ${String(p.severity ?? "unknown")}
Summary: ${String(p.summary ?? "-")}
Scenario: ${String(p.scenario ?? "-")}

THE STEP TO REMEDIATE (step ${step_index + 1} of ${steps.length}):
${JSON.stringify(step).slice(0, 4000)}

ADJACENT CONTEXT (for chain awareness — do NOT plan for these steps):
Previous: ${step_index > 0 ? JSON.stringify(steps[step_index - 1]).slice(0, 800) : "(none — this is initial access)"}
Next: ${step_index < steps.length - 1 ? JSON.stringify(steps[step_index + 1]).slice(0, 800) : "(none — this is final impact)"}

Return STRICT JSON matching this schema:
${SCHEMA_HINT}`;

  let parsed: Record<string, unknown> | null = null;
  let aiError: string | null = null;

  try {
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: RAY_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (aiRes.status === 429) aiError = "rate_limited";
    else if (aiRes.status === 402) aiError = "credits_exhausted";
    else if (!aiRes.ok) aiError = `ai_${aiRes.status}`;
    else {
      const j = await aiRes.json();
      const content = j?.choices?.[0]?.message?.content ?? "{}";
      try { parsed = JSON.parse(content); } catch { aiError = "parse_failed"; }
    }
  } catch (e) {
    aiError = (e as Error).message?.slice(0, 200) ?? "ai_unknown";
  }

  if (!parsed || aiError) {
    return new Response(JSON.stringify({ error: aiError ?? "unknown" }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Best-effort ledger — never blocks the response.
  admin.from("ai_credit_ledger").insert({
    user_id: ud.user.id,
    credits_used: COST * 1000,
    usage_type: "step_remediation",
    description: `Step ${step_index + 1} remediation — ${String((step as Record<string, unknown>).title ?? "").slice(0, 80)}`,
  }).then(() => {}).catch(() => {});

  const asArr = (v: unknown) => Array.isArray(v) ? v : [];

  return new Response(JSON.stringify({
    ok: true,
    plan: {
      summary: typeof parsed.summary === "string" ? parsed.summary : null,
      actions: asArr(parsed.actions),
      quick_wins: asArr(parsed.quick_wins),
      long_term: asArr(parsed.long_term),
      cost_credits: COST,
      duration_ms: Date.now() - started,
      model: MODEL,
    },
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

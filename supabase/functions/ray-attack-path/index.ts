/**
 * ray-attack-path — attack path reasoning.
 *
 * Takes either an existing investigation_id or a free-form scenario and asks
 * Ray to reconstruct the plausible attack path (initial access → execution →
 * persistence → escalation → impact), estimate blast radius, and produce a
 * prioritised remediation plan. Costs 4 Ray Compute.
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
const COST = 4;
const MODEL = "google/gemini-2.5-flash";

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You reason about how a threat could unfold across an environment. You produce
grounded, evidence-based attack path reconstructions — never invent devices,
users, credentials, or infrastructure you were not told about. Where you
must make an assumption, state it under "assumptions".

Return STRICT JSON. No prose outside the JSON.`;

const SCHEMA_HINT = `{
  "title": "Short case title, 4-8 words.",
  "severity": "low | medium | high | critical",
  "summary": "2-4 plain-English sentences explaining the attack path.",
  "steps": [
    {
      "phase": "initial_access | execution | persistence | privilege_escalation | defense_evasion | credential_access | discovery | lateral_movement | collection | exfiltration | impact",
      "title": "Short step title",
      "detail": "What happens in this step, grounded in the artifact.",
      "mitre_id": "T-code if applicable, otherwise omit",
      "likelihood": "low | medium | high",
      "if_successful": "What the attacker gains from this step.",
      "entities": [
        {
          "kind": "user | device | account | service | app | network | data",
          "name": "Exact identifier from the input (email, hostname, UPN, IP, app name). Do NOT invent — omit the entity if you have no name.",
          "role": "actor | target | pivot | credential | witness",
          "why": "One short sentence: why this entity is involved in THIS step."
        }
      ]
    }
  ],
  "blast_radius": {
    "users_affected": "Description of which users could be impacted (roles, groups).",
    "devices_affected": "Description of which devices/systems could be impacted.",
    "data_at_risk": "What data, systems, or services could be reached.",
    "business_impact": "Plain-English impact on the business."
  },
  "remediation": [
    {
      "priority": 1,
      "action": "Concrete step to take.",
      "phase_addressed": "Which attack step this closes.",
      "owner": "user | it | soc",
      "difficulty": "low | medium | high"
    }
  ],
  "assumptions": "Anything Ray had to assume because the input didn't specify it."
}

Guidance:
- 3-6 steps typical.
- Prioritise remediation by which step closes the earliest link in the chain.
- Never fabricate specific device names, IPs, or user identities that were not in the input.
- For "entities": only list users, devices, accounts, apps, services, networks, or data stores whose identifiers appear in the source investigation or scenario. If none are known for a step, return an empty array — do not invent placeholders like "user@example.com" or "PC-01".`;

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
  const userId = ud.user.id;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty */ }
  const investigation_id = typeof body.investigation_id === "string" ? body.investigation_id : null;
  const scenario = typeof body.scenario === "string" ? body.scenario.trim().slice(0, 8_000) : "";

  if (!investigation_id && !scenario) {
    return new Response(JSON.stringify({ error: "investigation_id or scenario required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Load source investigation, if any (RLS-safe via user client)
  let invContext = "";
  let sourceTitle = "";
  if (investigation_id) {
    const { data: inv } = await userClient
      .from("ray_investigations")
      .select("input_type, input_label, input_payload, verdict, summary, executive_summary, technical_findings, mitre, iocs")
      .eq("id", investigation_id).maybeSingle();
    if (!inv) {
      return new Response(JSON.stringify({ error: "investigation_not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const i = inv as Record<string, unknown>;
    sourceTitle = String(i.input_label ?? i.input_type ?? "Investigation");
    invContext = `SOURCE INVESTIGATION
Type: ${i.input_type}
Label: ${i.input_label ?? "(none)"}
Verdict: ${i.verdict ?? "unknown"}
Summary: ${i.summary ?? "-"}
Executive: ${i.executive_summary ?? "-"}
Findings: ${JSON.stringify(i.technical_findings ?? []).slice(0, 3000)}
MITRE: ${JSON.stringify(i.mitre ?? []).slice(0, 1500)}
IOCs: ${JSON.stringify(i.iocs ?? []).slice(0, 1500)}
Artifact (truncated): ${String(i.input_payload ?? "").slice(0, 3000)}`;
  }

  // Resolve org
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id").eq("user_id", userId).limit(1).maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  const { data: pending, error: insErr } = await admin
    .from("ray_attack_paths")
    .insert({
      user_id: userId, org_id: orgId,
      investigation_id: investigation_id ?? null,
      title: sourceTitle ? `Attack Path — ${sourceTitle}` : "Attack Path",
      scenario: scenario || null,
      status: "running",
      cost_ray_compute: COST,
    })
    .select("id").single();
  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const pathId = (pending as { id: string }).id;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    await admin.from("ray_attack_paths").update({ status: "failed", error: "LOVABLE_API_KEY missing" }).eq("id", pathId);
    return new Response(JSON.stringify({ error: "ai_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userPrompt = `Reason about the plausible attack path.
${invContext ? invContext + "\n\n" : ""}${scenario ? `SCENARIO / ADDITIONAL CONTEXT:\n${scenario}\n\n` : ""}
Return STRICT JSON matching this schema (all keys present, arrays may be empty):
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
    await admin.from("ray_attack_paths").update({
      status: "failed", error: aiError ?? "unknown", model: MODEL,
      duration_ms: Date.now() - started,
    }).eq("id", pathId);
    return new Response(JSON.stringify({ error: aiError ?? "unknown", id: pathId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const asArr = (v: unknown) => Array.isArray(v) ? v : [];
  const asObj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};

  const patch = {
    status: "complete" as const,
    title: typeof parsed.title === "string" && parsed.title.trim()
      ? parsed.title.trim().slice(0, 120)
      : (sourceTitle ? `Attack Path — ${sourceTitle}` : "Attack Path"),
    severity: typeof parsed.severity === "string" ? parsed.severity : null,
    summary: typeof parsed.summary === "string" ? parsed.summary : null,
    steps: asArr(parsed.steps),
    blast_radius: asObj(parsed.blast_radius),
    remediation: asArr(parsed.remediation),
    assumptions: typeof parsed.assumptions === "string" ? parsed.assumptions : null,
    model: MODEL,
    duration_ms: Date.now() - started,
    completed_at: new Date().toISOString(),
  };

  const { data: finalRow, error: updErr } = await admin
    .from("ray_attack_paths").update(patch).eq("id", pathId).select("*").single();
  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, attack_path: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

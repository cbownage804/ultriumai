/**
 * ray-investigate — Deep Threat Investigation.
 *
 * Flagship Wrayth Intelligence capability. Accepts one of several input
 * types (URL, email, headers, IP, domain, file hash, PowerShell, event log,
 * Defender/M365 alert) and asks Lovable AI to produce a structured
 * investigation: plain-English summary, technical findings, MITRE ATT&CK
 * techniques, IOCs, recommended response, executive summary, timeline, and
 * evidence. Costs 3 Ray Compute per run.
 *
 * JWT-authenticated. Result is persisted to public.ray_investigations so the
 * user can revisit prior investigations.
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

const COST_RAY_COMPUTE = 3;

const INPUT_LABELS: Record<string, string> = {
  url: "URL",
  email: "Email body",
  email_headers: "Email headers",
  ip: "IP address",
  domain: "Domain",
  file_hash: "File hash",
  powershell: "PowerShell script",
  event_log: "Windows event log",
  defender_alert: "Microsoft Defender alert",
  m365_alert: "Microsoft 365 alert",
};

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You investigate suspicious artifacts and produce structured intelligence reports.
Voice: calm, precise, first-person ("I looked at", "I recommend"), never alarmist,
never marketing. Ground every claim in the artifact — never invent IOCs, MITRE IDs,
CVEs, WHOIS data, or breach history you cannot infer from the input. When the input
is benign, say so plainly.

Return STRICT JSON matching the requested schema. No prose outside the JSON.`;

const SCHEMA_HINT = `{
  "verdict": "benign | suspicious | malicious | inconclusive",
  "confidence": "low | medium | high",
  "confidence_score": 0-100,
  "summary": "2-4 plain-English sentences a non-technical owner can read.",
  "executive_summary": "1-2 sentence board-level takeaway.",
  "reasoning": {
    "points": [
      { "point": "One concrete, evidence-based reason grounded in the artifact — no chain-of-thought, no restating the artifact.", "weight": "supporting | strong | decisive | mitigating" }
    ],
    "caveats": "Optional: what would change the verdict, or what Ray could not determine from the artifact alone."
  },
  "technical_findings": [
    { "title": "Short title", "detail": "Technical detail grounded in the input.", "severity": "info | low | medium | high | critical" }
  ],
  "mitre": [
    { "id": "T1566.002", "name": "Spearphishing Link", "why": "Why this technique applies to the artifact." }
  ],
  "iocs": [
    { "type": "url | domain | ip | hash | email | file", "value": "the indicator", "note": "context" }
  ],
  "recommended_response": [
    { "priority": 1, "action": "What Ray recommends the user do next.", "owner": "user | it | soc" }
  ],
  "timeline": [
    { "step": "Observation or action", "detail": "Optional detail" }
  ],
  "evidence": { "notes": "Free-form structured evidence — parsed headers, url decomposition, sender reputation notes, etc." }
}

Guidance for "reasoning.points": produce 3–6 short, standalone bullets that a user could read to understand *why* you reached the verdict. Each bullet is one observable fact or inference tied to the artifact — not internal deliberation, not a restatement of the finding titles. Prefer concrete details (domain age if inferable, header mismatches, suspicious language, encoding patterns, known-bad structure) over generic statements.`;

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
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const userId = ud.user.id;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const input_type = String(body.input_type ?? "").trim();
  const input_payload = String(body.input_payload ?? "").trim();
  const input_label = body.input_label ? String(body.input_label).slice(0, 200) : null;

  if (!INPUT_LABELS[input_type]) {
    return new Response(JSON.stringify({ error: "invalid_input_type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!input_payload || input_payload.length > 20_000) {
    return new Response(JSON.stringify({ error: "invalid_input_payload" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Resolve org
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  // Create pending row
  const { data: pending, error: insErr } = await admin
    .from("ray_investigations")
    .insert({
      user_id: userId,
      org_id: orgId,
      input_type,
      input_label,
      input_payload,
      status: "running",
      cost_ray_compute: COST_RAY_COMPUTE,
    })
    .select("id")
    .single();

  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const investigationId = (pending as { id: string }).id;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    await admin.from("ray_investigations").update({
      status: "failed", error: "LOVABLE_API_KEY missing",
    }).eq("id", investigationId);
    return new Response(JSON.stringify({ error: "ai_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const userPrompt = `Investigate the following ${INPUT_LABELS[input_type]}. Be grounded — do not invent IOCs, WHOIS data, MITRE IDs, breach history, or reputation you cannot infer from the raw artifact. If more data would be needed for a definitive verdict, say so and set confidence accordingly.

INPUT_TYPE: ${input_type}
${input_label ? `LABEL: ${input_label}\n` : ""}ARTIFACT:
"""
${input_payload}
"""

Return STRICT JSON matching this schema exactly (all keys present, arrays may be empty):
${SCHEMA_HINT}`;

  const MODEL = "google/gemini-2.5-flash";
  let parsed: Record<string, unknown> | null = null;
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
      try {
        parsed = JSON.parse(content);
      } catch {
        aiError = "parse_failed";
      }
    }
  } catch (e) {
    aiError = (e as Error).message?.slice(0, 200) ?? "ai_unknown";
  }

  if (!parsed || aiError) {
    await admin.from("ray_investigations").update({
      status: "failed",
      error: aiError ?? "unknown",
      duration_ms: Date.now() - started,
      model: MODEL,
    }).eq("id", investigationId);
    return new Response(JSON.stringify({ error: aiError ?? "unknown", id: investigationId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const asArray = (v: unknown) => (Array.isArray(v) ? v : []);
  const asObj = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {});

  const patch = {
    status: "complete" as const,
    verdict: typeof parsed.verdict === "string" ? parsed.verdict : null,
    confidence: typeof parsed.confidence === "string" ? parsed.confidence : null,
    confidence_score: typeof parsed.confidence_score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.confidence_score))) : null,
    summary: typeof parsed.summary === "string" ? parsed.summary : null,
    executive_summary: typeof parsed.executive_summary === "string" ? parsed.executive_summary : null,
    reasoning: asObj(parsed.reasoning),
    technical_findings: asArray(parsed.technical_findings),
    mitre: asArray(parsed.mitre),
    iocs: asArray(parsed.iocs),
    recommended_response: asArray(parsed.recommended_response),
    timeline: asArray(parsed.timeline),
    evidence: asObj(parsed.evidence),
    duration_ms: Date.now() - started,
    model: MODEL,
    completed_at: new Date().toISOString(),
  };

  const { data: finalRow, error: updErr } = await admin
    .from("ray_investigations")
    .update(patch)
    .eq("id", investigationId)
    .select("*")
    .single();

  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Best-effort IOC index upsert — never block the investigation on this.
  try {
    const iocs = patch.iocs as Array<{ type?: string; value?: string; note?: string }>;
    const verdict = patch.verdict;
    const nowIso = new Date().toISOString();
    for (const ioc of iocs) {
      const type = typeof ioc.type === "string" ? ioc.type.toLowerCase().trim() : "";
      const value = typeof ioc.value === "string" ? ioc.value.trim() : "";
      if (!type || !value) continue;
      const norm = value.toLowerCase();
      // Try to update existing
      const { data: existing } = await admin
        .from("ray_ioc_index")
        .select("id, occurrence_count, investigation_ids")
        .eq("user_id", userId)
        .eq("ioc_type", type)
        .eq("ioc_value_norm", norm)
        .maybeSingle();
      if (existing) {
        const row = existing as { id: string; occurrence_count: number; investigation_ids: string[] };
        const ids = Array.from(new Set([...(row.investigation_ids ?? []), investigationId])).slice(-25);
        await admin.from("ray_ioc_index").update({
          last_seen_at: nowIso,
          occurrence_count: (row.occurrence_count ?? 0) + 1,
          investigation_ids: ids,
          last_verdict: verdict,
          last_note: ioc.note ?? null,
          updated_at: nowIso,
        }).eq("id", row.id);
      } else {
        await admin.from("ray_ioc_index").insert({
          user_id: userId, org_id: orgId,
          ioc_type: type, ioc_value: value, ioc_value_norm: norm,
          first_seen_at: nowIso, last_seen_at: nowIso,
          occurrence_count: 1,
          investigation_ids: [investigationId],
          last_verdict: verdict,
          last_note: ioc.note ?? null,
        });
      }
    }
  } catch (e) {
    console.error("ioc_index_upsert_failed", (e as Error).message);
  }

  return new Response(JSON.stringify({ ok: true, investigation: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

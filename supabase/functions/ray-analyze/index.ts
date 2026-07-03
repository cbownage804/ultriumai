/**
 * ray-analyze — Script + Malware Analysis (v0.6, Sprint B).
 *
 * Two modes, one pipeline:
 *   - mode: "script"  → PowerShell, Bash, Python, JavaScript, Batch source code.
 *   - mode: "malware" → suspicious binary artifact: hash, uploaded strings dump,
 *     script-like binary payloads, or a submitted PE strings blob.
 *
 * Both share the ray-pipeline shared primitives: aiCall, extractIocs,
 * upsertIocIndex. Persists to public.ray_code_analyses.
 *
 * Costs: script = 2 credits, malware = 4 credits (RAY_COMPUTE_COSTS).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import {
  aiCall,
  extractIocs,
  upsertIocIndex,
  RAY_COMPUTE_COSTS,
  DEFAULT_MODEL,
  asArr,
  asObj,
  asStr,
} from "../_shared/ray-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

type Mode = "script" | "malware";

const LANGUAGES = new Set([
  "powershell", "bash", "python", "javascript", "batch", "vbscript",
  "hash", "strings", "unknown",
]);

const SCRIPT_SYSTEM = `You are Ray, an AI security analyst inside Wrayth.
You statically analyze scripts to determine intent and risk.
Voice: calm, precise, first-person. Ground every claim in the code shown.
Never invent behavior not visible in the artifact. If a section is obfuscated,
call it out and reason about what the obfuscation is hiding.

Return STRICT JSON matching the requested schema. No prose outside the JSON.`;

const MALWARE_SYSTEM = `You are Ray, an AI security analyst inside Wrayth.
You perform static behavioral analysis on suspicious binaries, hashes, or
extracted strings dumps.
Voice: calm, precise, first-person. Reason from what is actually shown — do
NOT invent WHOIS data, sandbox reports, VT scores, CVE numbers, or observed
network callbacks unless they appear in the input. If a definitive verdict
requires a sandbox detonation you cannot perform, say so and set confidence
accordingly.

When analyzing malware, always explicitly assess these canonical behaviors and
include one entry per observed behavior in the "behaviors" array (skip only
if there is zero evidence): downloads_payload, disables_defender,
persistence, credential_theft, c2_attempts, lateral_movement, exfiltration,
impact. Use the category names above verbatim so the UI can group them.
Every recommended_response item should be an actionable checklist step
(isolate host, kill process, rotate credentials, block IOC, submit to
sandbox, etc.) with a numeric priority (1 = do first).

Return STRICT JSON matching the requested schema. No prose outside the JSON.`;

const SCHEMA = `{
  "verdict": "benign | suspicious | malicious | inconclusive",
  "confidence": "low | medium | high",
  "confidence_score": 0-100,
  "intent": "1 sentence: what the artifact appears designed to do.",
  "risk_summary": "1-2 sentences: why the reader should or shouldn't worry.",
  "summary": "2-4 plain-English sentences a non-technical owner can read.",
  "executive_summary": "1 sentence board-level takeaway.",
  "reasoning": {
    "points": [
      { "point": "One evidence-based observation grounded in the artifact.", "weight": "supporting | strong | decisive | mitigating" }
    ],
    "caveats": "What would change the verdict, or what could not be determined."
  },
  "technical_findings": [
    { "title": "Short title", "detail": "Technical detail tied to a code region or string.", "severity": "info | low | medium | high | critical" }
  ],
  "behaviors": [
    { "category": "downloads_payload | disables_defender | persistence | credential_theft | c2_attempts | lateral_movement | exfiltration | impact | discovery | defense_evasion | credential_access | execution | c2 | collection | other", "detail": "What Ray observed.", "evidence": "Optional: a short quoted excerpt or line reference from the artifact." }
  ],
  "mitre": [
    { "id": "T1059.001", "name": "PowerShell", "why": "Why this technique applies to the artifact." }
  ],
  "iocs": [
    { "type": "url | domain | ip | hash | email | file | registry | mutex", "value": "the indicator", "note": "context" }
  ],
  "recommended_response": [
    { "priority": 1, "action": "What Ray recommends the user do next.", "owner": "user | it | soc" }
  ],
  "timeline": [
    { "step": "Observation or action", "detail": "Optional detail" }
  ],
  "evidence": { "notes": "Free-form structured evidence — decoded strings, deobfuscated snippets, entropy notes, PE header notes, etc." }
}`;

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
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const mode = String(body.mode ?? "").trim() as Mode;
  if (mode !== "script" && mode !== "malware") {
    return new Response(JSON.stringify({ error: "invalid_mode" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const language = LANGUAGES.has(String(body.language ?? "")) ? String(body.language) : "unknown";
  const input_label = body.input_label ? String(body.input_label).slice(0, 200) : null;
  const input_payload = String(body.input_payload ?? "").trim();

  if (!input_payload || input_payload.length > 60_000) {
    return new Response(JSON.stringify({ error: "invalid_input_payload" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cost = mode === "script" ? RAY_COMPUTE_COSTS.script : RAY_COMPUTE_COSTS.malware;

  // Resolve org
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  const { data: pending, error: insErr } = await admin
    .from("ray_code_analyses")
    .insert({
      user_id: userId, org_id: orgId, mode, language,
      input_label, input_payload,
      status: "running", cost_ray_compute: cost,
    })
    .select("id").single();

  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const analysisId = (pending as { id: string }).id;

  const modeLabel = mode === "script" ? `${language} script` : "suspected malware artifact";
  const userPrompt = `Analyze the following ${modeLabel}. Ground every observation in the artifact — do not invent behavior, IOCs, or MITRE IDs you cannot infer from the input.

MODE: ${mode}
LANGUAGE: ${language}
${input_label ? `LABEL: ${input_label}\n` : ""}ARTIFACT:
"""
${input_payload}
"""

Return STRICT JSON matching this schema exactly (all keys present, arrays may be empty):
${SCHEMA}`;

  const result = await aiCall<Record<string, unknown>>({
    system: mode === "script" ? SCRIPT_SYSTEM : MALWARE_SYSTEM,
    user: userPrompt,
    model: DEFAULT_MODEL,
    jsonMode: true,
  });

  if (!result.ok || !result.parsed) {
    await admin.from("ray_code_analyses").update({
      status: "failed",
      error: result.error ?? "unknown",
      duration_ms: Date.now() - started,
      model: result.model,
    }).eq("id", analysisId);
    return new Response(JSON.stringify({ error: result.error ?? "unknown", id: analysisId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = result.parsed;
  const scoreRaw = parsed.confidence_score;
  const patch = {
    status: "complete" as const,
    verdict: asStr(parsed.verdict, 40),
    confidence: asStr(parsed.confidence, 20),
    confidence_score: typeof scoreRaw === "number" ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : null,
    intent: asStr(parsed.intent, 400),
    risk_summary: asStr(parsed.risk_summary, 800),
    summary: asStr(parsed.summary, 2000),
    executive_summary: asStr(parsed.executive_summary, 600),
    reasoning: asObj(parsed.reasoning),
    technical_findings: asArr(parsed.technical_findings),
    behaviors: asArr(parsed.behaviors),
    mitre: asArr(parsed.mitre),
    iocs: asArr(parsed.iocs),
    recommended_response: asArr(parsed.recommended_response),
    timeline: asArr(parsed.timeline),
    evidence: asObj(parsed.evidence),
    duration_ms: Date.now() - started,
    model: result.model,
    completed_at: new Date().toISOString(),
  };

  const { data: finalRow, error: updErr } = await admin
    .from("ray_code_analyses")
    .update(patch).eq("id", analysisId)
    .select("*").single();

  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Seed org memory with both regex-extracted IOCs and AI-declared IOCs.
  const aiIocs = (patch.iocs as Array<{ type?: string; value?: string }>).flatMap(x => {
    const t = typeof x.type === "string" ? x.type.toLowerCase() : "";
    const v = typeof x.value === "string" ? x.value.trim() : "";
    if (!t || !v) return [];
    return [{ type: t, value: v, value_norm: v.toLowerCase() }];
  });
  const regexIocs = extractIocs(input_payload);
  const dedup = new Map<string, { type: string; value: string; value_norm: string }>();
  for (const i of [...regexIocs, ...aiIocs]) dedup.set(`${i.type}:${i.value_norm}`, i);
  await upsertIocIndex(admin, {
    userId, orgId, iocs: [...dedup.values()],
    investigationId: analysisId, verdict: patch.verdict,
  });

  return new Response(JSON.stringify({ ok: true, analysis: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

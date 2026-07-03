/**
 * ray-policy-generate — Policy Generator (v0.6, Sprint D).
 *
 * Generates editable, framework-aware security policies (password, IR, DR,
 * AUP, BYOD, access control, data classification, remote work, vendor risk,
 * SDLC). Persists to public.ray_policies. Cost: 10 credits.
 *
 * DOCX export is client-side (docx npm package) — this function returns
 * structured JSON only.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import {
  aiCall,
  RAY_COMPUTE_COSTS,
  DEEP_MODEL,
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

const POLICY_TYPES = new Set([
  "password", "acceptable_use", "incident_response", "disaster_recovery",
  "byod", "access_control", "data_classification", "remote_work",
  "vendor_risk", "sdlc", "backup", "email_security", "mfa",
  "incident_runbook", "detection_runbook", "response_playbook",
]);

const RUNBOOK_TYPES = new Set(["incident_runbook", "detection_runbook", "response_playbook"]);

type SourceRef = { kind: "investigation" | "log_analysis" | "code_analysis"; id: string };

const SYSTEM = `You are Ray, an AI security policy author inside Wrayth.
You draft clear, enforceable organizational security policies that map to
recognized frameworks (CIS Controls v8, NIST CSF 2.0, NIST 800-53, ISO 27001,
SOC 2, HIPAA, PCI DSS, GDPR).

Voice: professional, concise, plain-English. Assume the reader is a small-to-
mid-size business owner or IT lead — avoid legalese where policy language will
do. Never fabricate certifications, laws, or clause numbers you're unsure of;
if you cite a control, cite one that genuinely exists in that framework.

Return STRICT JSON. No prose outside the JSON.`;

const SCHEMA = `{
  "title": "Formal policy title.",
  "policy_type": "same as request",
  "version": "1.0",
  "effective_date": "YYYY-MM-DD",
  "review_cycle": "annual | biannual | quarterly",
  "executive_summary": "2-3 sentences a non-technical owner can read.",
  "scope": "Who and what this policy applies to.",
  "roles": [
    { "role": "e.g. IT Administrator", "responsibility": "What this role must do." }
  ],
  "sections": [
    {
      "heading": "Section title (e.g. Password Complexity)",
      "clauses": [
        { "id": "1.1", "text": "Enforceable clause written in policy voice." }
      ],
      "controls": [
        { "framework": "CIS v8 | NIST CSF 2.0 | ISO 27001 | SOC 2 | HIPAA | PCI DSS", "id": "e.g. CIS 5.2", "why": "Why this control maps." }
      ]
    }
  ],
  "enforcement": "How violations are handled.",
  "exceptions": "How exceptions are requested and approved.",
  "definitions": [ { "term": "Term", "definition": "Definition." } ],
  "revision_history": [ { "version": "1.0", "date": "YYYY-MM-DD", "note": "Initial draft." } ]
}`;

const RUNBOOK_SYSTEM = `You are Ray, an AI incident response author inside Wrayth.
You draft actionable, step-by-step runbooks and playbooks that a small IT or
SOC team can follow under pressure. Ground every step in the findings shown —
do NOT invent alert names, systems, or IOCs that were not observed.

Voice: calm, procedural, imperative ("Isolate the host", "Rotate credentials").
Every step should say who does it, what to do, and how to verify success.
Cite MITRE ATT&CK IDs when they map to a step.

Return STRICT JSON. No prose outside the JSON.`;

const RUNBOOK_SCHEMA = `{
  "title": "Runbook title.",
  "policy_type": "same as request",
  "version": "1.0",
  "effective_date": "YYYY-MM-DD",
  "review_cycle": "annual | biannual | quarterly",
  "executive_summary": "2-3 sentences: what this runbook responds to and when to invoke it.",
  "scope": "When to trigger this runbook and what systems it covers.",
  "roles": [
    { "role": "Incident Commander | Responder | Escalation", "responsibility": "What this role does during execution." }
  ],
  "sections": [
    {
      "heading": "Phase title (Detection | Triage | Contain | Eradicate | Recover | Lessons Learned)",
      "clauses": [
        { "id": "1.1", "text": "Imperative step. Include the actor (SOC, IT, User), the command/tool if any, and the verification check." }
      ],
      "controls": [
        { "framework": "MITRE ATT&CK | NIST 800-61 | CIS v8", "id": "e.g. T1078 | IR-4", "why": "Why this technique/control applies to this step." }
      ]
    }
  ],
  "enforcement": "Escalation criteria — when to page the on-call, when to involve legal.",
  "exceptions": "Conditions under which steps may be skipped or altered.",
  "definitions": [ { "term": "Term (e.g. LSASS)", "definition": "Definition." } ],
  "revision_history": [ { "version": "1.0", "date": "YYYY-MM-DD", "note": "Drafted from findings." } ]
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

  const policyType = String(body.policy_type ?? "").trim();
  if (!POLICY_TYPES.has(policyType)) {
    return new Response(JSON.stringify({ error: "invalid_policy_type" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const orgName = body.organization_name ? String(body.organization_name).slice(0, 200) : null;
  const jurisdiction = body.jurisdiction ? String(body.jurisdiction).slice(0, 120) : null;
  const frameworksInput = Array.isArray(body.frameworks) ? body.frameworks : [];
  const frameworks = frameworksInput
    .filter((f) => typeof f === "string")
    .map((f) => (f as string).slice(0, 40))
    .slice(0, 8);
  const notes = body.notes ? String(body.notes).slice(0, 4000) : "";

  // Optional grounding: pull findings from the user's investigations / log /
  // code analyses so the draft is derived from real evidence.
  const rawRefs = Array.isArray(body.source_refs) ? body.source_refs : [];
  const sourceRefs: SourceRef[] = rawRefs
    .filter((r): r is SourceRef =>
      !!r && typeof r === "object"
        && typeof (r as SourceRef).id === "string"
        && ((r as SourceRef).kind === "investigation"
          || (r as SourceRef).kind === "log_analysis"
          || (r as SourceRef).kind === "code_analysis"))
    .slice(0, 10);

  let sourceContext = "";
  const usedRefs: Array<SourceRef & { title: string }> = [];
  if (sourceRefs.length > 0) {
    const byKind = {
      investigation: sourceRefs.filter((r) => r.kind === "investigation").map((r) => r.id),
      log_analysis: sourceRefs.filter((r) => r.kind === "log_analysis").map((r) => r.id),
      code_analysis: sourceRefs.filter((r) => r.kind === "code_analysis").map((r) => r.id),
    };
    const [invRes, logRes, codeRes] = await Promise.all([
      byKind.investigation.length
        ? userClient.from("ray_investigations")
            .select("id, input_label, input_type, verdict, summary, technical_findings, mitre, iocs, recommended_response")
            .in("id", byKind.investigation)
        : Promise.resolve({ data: [], error: null }),
      byKind.log_analysis.length
        ? userClient.from("ray_log_analyses")
            .select("id, input_label, source_kind, summary, critical_findings, mitre, iocs, recommendations")
            .in("id", byKind.log_analysis)
        : Promise.resolve({ data: [], error: null }),
      byKind.code_analysis.length
        ? userClient.from("ray_code_analyses")
            .select("id, input_label, mode, language, verdict, summary, behaviors, mitre, iocs, recommended_response")
            .in("id", byKind.code_analysis)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const chunks: string[] = [];
    for (const r of (invRes.data ?? []) as Array<Record<string, unknown>>) {
      const label = (r.input_label as string) || (r.input_type as string) || "investigation";
      usedRefs.push({ kind: "investigation", id: String(r.id), title: label });
      chunks.push(`INVESTIGATION · ${label}
verdict: ${r.verdict ?? "unknown"}
summary: ${truncate(r.summary, 800)}
findings: ${jsonSlice(r.technical_findings, 8)}
mitre: ${jsonSlice(r.mitre, 12)}
iocs: ${jsonSlice(r.iocs, 12)}
recommended_response: ${jsonSlice(r.recommended_response, 8)}`);
    }
    for (const r of (logRes.data ?? []) as Array<Record<string, unknown>>) {
      const label = (r.input_label as string) || (r.source_kind as string) || "log";
      usedRefs.push({ kind: "log_analysis", id: String(r.id), title: label });
      chunks.push(`LOG ANALYSIS · ${label} (${r.source_kind})
summary: ${truncate(r.summary, 800)}
critical_findings: ${jsonSlice(r.critical_findings, 10)}
mitre: ${jsonSlice(r.mitre, 12)}
iocs: ${jsonSlice(r.iocs, 12)}
recommendations: ${jsonSlice(r.recommendations, 8)}`);
    }
    for (const r of (codeRes.data ?? []) as Array<Record<string, unknown>>) {
      const label = (r.input_label as string) || `${r.mode} · ${r.language}`;
      usedRefs.push({ kind: "code_analysis", id: String(r.id), title: label });
      chunks.push(`CODE / MALWARE · ${label}
verdict: ${r.verdict ?? "unknown"}
summary: ${truncate(r.summary, 800)}
behaviors: ${jsonSlice(r.behaviors, 12)}
mitre: ${jsonSlice(r.mitre, 12)}
iocs: ${jsonSlice(r.iocs, 12)}
recommended_response: ${jsonSlice(r.recommended_response, 8)}`);
    }
    if (chunks.length) {
      sourceContext = `\nGROUND YOUR DRAFT IN THESE FINDINGS. Do not invent details not shown here.\n\n${chunks.join("\n\n---\n\n").slice(0, 24000)}\n`;
    }
  }

  const cost = RAY_COMPUTE_COSTS.policy_generation;

  // Resolve org
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  const isRunbook = RUNBOOK_TYPES.has(policyType);
  const humanType = policyType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const provisionalTitle = isRunbook ? humanType : `${humanType} Policy`;

  const { data: pending, error: insErr } = await admin
    .from("ray_policies")
    .insert({
      user_id: userId,
      org_id: orgId,
      policy_type: policyType,
      title: provisionalTitle,
      organization_name: orgName,
      frameworks,
      jurisdiction,
      status: "generating",
      compute_credits: cost,
    })
    .select("id").single();

  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const policyId = (pending as { id: string }).id;

  const userPrompt = `Draft a ${isRunbook ? "response runbook" : "security policy"} with the following parameters. Return STRICT JSON matching the schema exactly (all keys present, arrays may be empty).

${isRunbook ? "RUNBOOK" : "POLICY"} TYPE: ${policyType}
${orgName ? `ORGANIZATION: ${orgName}\n` : ""}${jurisdiction ? `JURISDICTION: ${jurisdiction}\n` : ""}${frameworks.length ? `TARGET FRAMEWORKS: ${frameworks.join(", ")}\n` : ""}${notes ? `ADDITIONAL CONTEXT / NOTES:\n${notes}\n` : ""}${sourceContext}
${isRunbook
  ? "Write 5-8 phase sections (Detection, Triage, Contain, Eradicate, Recover, Lessons Learned as appropriate). Every clause must be an imperative step with actor + action + verification. Cite MITRE ATT&CK IDs where they map."
  : "Write 5-9 substantive sections. Every clause must be enforceable (\"must\", \"shall\", \"may not\") — no vague guidance. Map controls to the frameworks listed above; if none listed, map to CIS v8 and NIST CSF 2.0."} Use TODAY as effective_date.

SCHEMA:
${isRunbook ? RUNBOOK_SCHEMA : SCHEMA}`;

  const result = await aiCall<Record<string, unknown>>({
    system: isRunbook ? RUNBOOK_SYSTEM : SYSTEM,
    user: userPrompt,
    model: DEEP_MODEL,
    jsonMode: true,
  });

  if (!result.ok || !result.parsed) {
    await admin.from("ray_policies").update({
      status: "failed",
      error: result.error ?? "unknown",
      model: result.model,
    }).eq("id", policyId);
    return new Response(JSON.stringify({ error: result.error ?? "unknown", id: policyId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = result.parsed;
  const sections = asArr(parsed.sections);
  const patch = {
    status: "draft" as const,
    title: asStr(parsed.title, 300) ?? provisionalTitle,
    sections,
    metadata: {
      version: asStr(parsed.version, 20) ?? "1.0",
      effective_date: asStr(parsed.effective_date, 40),
      review_cycle: asStr(parsed.review_cycle, 40),
      executive_summary: asStr(parsed.executive_summary, 2000),
      scope: asStr(parsed.scope, 2000),
      roles: asArr(parsed.roles),
      enforcement: asStr(parsed.enforcement, 2000),
      exceptions: asStr(parsed.exceptions, 2000),
      definitions: asArr(parsed.definitions),
      revision_history: asArr(parsed.revision_history),
      duration_ms: Date.now() - started,
    },
    model: result.model,
  };

  const { data: finalRow, error: updErr } = await admin
    .from("ray_policies")
    .update(patch).eq("id", policyId)
    .select("*").single();

  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, policy: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

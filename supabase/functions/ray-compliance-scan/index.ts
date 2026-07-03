/**
 * ray-compliance-scan — Compliance Gap Analysis (v0.6, Sprint E).
 *
 * Given a target framework and organization context, Ray produces a
 * structured gap analysis: per-domain scoring, prioritized gaps,
 * existing wins, and a 30/60/90 remediation roadmap. Persists to
 * public.ray_compliance_scans. Cost: 15 credits.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import {
  aiCall,
  RAY_COMPUTE_COSTS,
  DEEP_MODEL,
  asArr,
  asStr,
} from "../_shared/ray-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const FRAMEWORKS = new Set([
  "CIS v8", "NIST CSF 2.0", "NIST 800-53", "ISO 27001",
  "SOC 2", "HIPAA", "PCI DSS", "GDPR", "Essential Eight",
]);

const SYSTEM = `You are Ray, an AI compliance analyst inside Wrayth.
You perform gap analyses against real security frameworks (CIS v8, NIST CSF
2.0, NIST 800-53, ISO 27001, SOC 2, HIPAA, PCI DSS, GDPR, Essential Eight).

Voice: calm, precise, first-person. Ground every gap in the organization
context provided. Do NOT fabricate control IDs — cite only IDs that genuinely
exist in the named framework. If you're unsure about a control ID, describe
the domain instead. Scores must be defensible from the evidence given.

Return STRICT JSON. No prose outside the JSON.`;

const SCHEMA = `{
  "overall_score": 0-100,
  "posture": "critical | weak | developing | strong | mature",
  "executive_summary": "3-5 plain sentences a non-technical owner can read.",
  "totals": { "controls_total": 0, "controls_met": 0, "controls_partial": 0, "controls_missing": 0 },
  "domains": [
    {
      "id": "e.g. Identify, Protect, Detect, Respond, Recover — or the framework's own domains",
      "name": "Human-readable domain",
      "score": 0-100,
      "status": "critical | weak | developing | strong | mature",
      "why": "1 sentence: why this domain scored where it did."
    }
  ],
  "wins": [
    { "control": "framework ID or short name", "why": "1 sentence: what the org appears to already do well." }
  ],
  "gaps": [
    {
      "control": "framework ID or short name",
      "domain": "matches a domains[].name",
      "gap": "1-2 sentences describing exactly what's missing.",
      "severity": "low | medium | high | critical",
      "effort": "low | medium | high",
      "remediation": "1-2 sentences: what to actually do."
    }
  ],
  "roadmap": [
    { "phase": "30 days | 60 days | 90 days", "actions": ["short, verb-first action"] }
  ]
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

  const framework = String(body.framework ?? "").trim();
  if (!FRAMEWORKS.has(framework)) {
    return new Response(JSON.stringify({ error: "invalid_framework" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const scope = body.scope ? String(body.scope).slice(0, 400) : null;
  const orgContext = body.organization_context ? String(body.organization_context).slice(0, 6000) : "";

  if (!orgContext || orgContext.length < 40) {
    return new Response(JSON.stringify({ error: "context_too_short" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const cost = RAY_COMPUTE_COSTS.compliance_scan;

  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id")
    .eq("user_id", userId).limit(1).maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  const { data: pending, error: insErr } = await admin
    .from("ray_compliance_scans")
    .insert({
      user_id: userId, org_id: orgId,
      framework, scope, organization_context: orgContext,
      status: "running", compute_credits: cost,
    })
    .select("id").single();

  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const scanId = (pending as { id: string }).id;

  const userPrompt = `Perform a gap analysis against ${framework}.

${scope ? `SCOPE: ${scope}\n` : ""}ORGANIZATION CONTEXT:
"""
${orgContext}
"""

Return STRICT JSON matching the schema exactly (all keys present, arrays may be empty). Domains should be the standard domains of the requested framework. Prioritize gaps by real risk to this specific organization, not generic best practice.

SCHEMA:
${SCHEMA}`;

  const result = await aiCall<Record<string, unknown>>({
    system: SYSTEM,
    user: userPrompt,
    model: DEEP_MODEL,
    jsonMode: true,
  });

  if (!result.ok || !result.parsed) {
    await admin.from("ray_compliance_scans").update({
      status: "failed",
      error: result.error ?? "unknown",
      duration_ms: Date.now() - started,
      model: result.model,
    }).eq("id", scanId);
    return new Response(JSON.stringify({ error: result.error ?? "unknown", id: scanId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = result.parsed;
  const scoreRaw = parsed.overall_score;
  const patch = {
    status: "complete" as const,
    overall_score: typeof scoreRaw === "number" ? Math.max(0, Math.min(100, Math.round(scoreRaw))) : null,
    posture: asStr(parsed.posture, 30),
    executive_summary: asStr(parsed.executive_summary, 2000),
    totals: (parsed.totals && typeof parsed.totals === "object") ? parsed.totals : {},
    domains: asArr(parsed.domains),
    wins: asArr(parsed.wins),
    gaps: asArr(parsed.gaps),
    roadmap: asArr(parsed.roadmap),
    duration_ms: Date.now() - started,
    model: result.model,
  };

  const { data: finalRow, error: updErr } = await admin
    .from("ray_compliance_scans")
    .update(patch).eq("id", scanId)
    .select("*").single();

  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, scan: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

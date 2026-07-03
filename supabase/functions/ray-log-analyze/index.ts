/**
 * ray-log-analyze — map/reduce log analysis (v0.6, Sprint C).
 *
 * Two modes:
 *   - "map":    summarize a single chunk of log lines.
 *   - "reduce": read all chunk summaries for an analysis, produce final
 *               executive summary + critical findings + MITRE + IOCs +
 *               recommendations + timeline.
 *
 * The client is responsible for creating the parent ray_log_analyses row
 * (RLS lets them), chunking the file, invoking "map" per chunk, then
 * invoking "reduce" once all chunks are complete. That keeps the edge
 * function simple and lets us stream progress into the UI cheaply.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import {
  aiCall, extractIocs, upsertIocIndex,
  DEFAULT_MODEL, asArr, asObj, asStr,
} from "../_shared/ray-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const MAP_SYSTEM = `You are Ray, an AI security analyst summarizing one chunk of a log file.
Your ONLY job is to condense this chunk. Extract signal, drop chatter.
Be terse and factual — do not invent events not present in the chunk.

Return STRICT JSON:
{
  "summary": "3-6 sentences: what this chunk contains, key event types, notable spikes, anomalies.",
  "findings": [
    { "title": "…", "detail": "…", "severity": "info|low|medium|high|critical", "line_hint": "optional line number or timestamp" }
  ],
  "iocs": [
    { "type": "ip|domain|url|hash|email|user|host", "value": "the indicator", "note": "context" }
  ]
}`;

const REDUCE_SYSTEM = `You are Ray, an AI security analyst. You are given per-chunk summaries of a large log file.
Produce ONE unified, evidence-based analysis. Do NOT invent findings that no chunk supports.
Voice: calm, precise, first-person.

Return STRICT JSON:
{
  "summary": "3-5 sentences plain-English overview a non-technical owner can read.",
  "executive_summary": "1-2 sentences board-level takeaway.",
  "critical_findings": [
    { "title": "…", "detail": "why this matters, tied to chunks that showed it", "severity": "info|low|medium|high|critical" }
  ],
  "mitre": [ { "id": "T1078", "name": "Valid Accounts", "why": "…" } ],
  "iocs":  [ { "type": "ip|domain|url|hash|email|user|host", "value": "…", "note": "…" } ],
  "recommendations": [ { "priority": 1, "action": "…", "owner": "user|it|soc" } ],
  "timeline": [ { "step": "…", "detail": "…" } ],
  "evidence": { "notes": "any structured context worth preserving" }
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

  const step = String(body.step ?? "");
  const analysisId = String(body.analysis_id ?? "");
  if (!analysisId) {
    return new Response(JSON.stringify({ error: "missing_analysis_id" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Confirm the analysis belongs to this user.
  const { data: parent } = await admin
    .from("ray_log_analyses")
    .select("id, user_id, org_id, source_kind, chunk_count")
    .eq("id", analysisId).maybeSingle();
  if (!parent || (parent as { user_id: string }).user_id !== userId) {
    return new Response(JSON.stringify({ error: "not_found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const p = parent as { id: string; user_id: string; org_id: string | null; source_kind: string; chunk_count: number };

  // ─── MAP ────────────────────────────────────────────────────────────────
  if (step === "map") {
    const chunkIndex = Number(body.chunk_index ?? -1);
    const lineStart = Number(body.line_start ?? 0);
    const lineEnd = Number(body.line_end ?? 0);
    const chunkText = String(body.chunk_text ?? "");
    if (!chunkText || chunkIndex < 0) {
      return new Response(JSON.stringify({ error: "invalid_chunk" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (chunkText.length > 80_000) {
      return new Response(JSON.stringify({ error: "chunk_too_large" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: chunkRow, error: cErr } = await admin
      .from("ray_log_chunks")
      .insert({
        analysis_id: analysisId, user_id: userId,
        chunk_index: chunkIndex, line_start: lineStart, line_end: lineEnd,
        status: "running",
      })
      .select("id").single();
    if (cErr || !chunkRow) {
      return new Response(JSON.stringify({ error: "chunk_insert_failed", detail: cErr?.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const chunkId = (chunkRow as { id: string }).id;

    const prompt = `SOURCE_KIND: ${p.source_kind}
CHUNK_INDEX: ${chunkIndex}
LINES: ${lineStart}-${lineEnd}
LOG_CHUNK:
"""
${chunkText}
"""

Return STRICT JSON per schema.`;

    const res = await aiCall<Record<string, unknown>>({
      system: MAP_SYSTEM, user: prompt, model: DEFAULT_MODEL, jsonMode: true,
    });
    if (!res.ok || !res.parsed) {
      await admin.from("ray_log_chunks").update({
        status: "failed", error: res.error ?? "unknown",
      }).eq("id", chunkId);
      return new Response(JSON.stringify({ error: res.error ?? "unknown" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const findings = asArr(res.parsed.findings);
    const iocsRaw = asArr(res.parsed.iocs);
    const summary = asStr(res.parsed.summary, 2000);

    await admin.from("ray_log_chunks").update({
      status: "complete", summary, findings, iocs: iocsRaw,
    }).eq("id", chunkId);

    // increment parent counter
    const { data: refreshed } = await admin
      .from("ray_log_analyses")
      .select("chunks_complete").eq("id", analysisId).maybeSingle();
    const nextCount = ((refreshed as { chunks_complete?: number } | null)?.chunks_complete ?? 0) + 1;
    await admin.from("ray_log_analyses").update({
      chunks_complete: nextCount,
      status: nextCount >= p.chunk_count ? "reducing" : "mapping",
    }).eq("id", analysisId);

    return new Response(JSON.stringify({ ok: true, chunk_id: chunkId, chunks_complete: nextCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ─── REDUCE ─────────────────────────────────────────────────────────────
  if (step === "reduce") {
    const { data: chunks } = await admin
      .from("ray_log_chunks")
      .select("chunk_index, line_start, line_end, summary, findings, iocs, status, error")
      .eq("analysis_id", analysisId)
      .order("chunk_index", { ascending: true });

    const rows = (chunks ?? []) as Array<{
      chunk_index: number; line_start: number; line_end: number;
      summary: string | null; findings: unknown[]; iocs: unknown[];
      status: string; error: string | null;
    }>;

    const digest = rows.map(r =>
      `--- CHUNK ${r.chunk_index} (lines ${r.line_start}-${r.line_end}, ${r.status}) ---
${r.summary ?? (r.error ? `[failed: ${r.error}]` : '[no summary]')}
FINDINGS: ${JSON.stringify(r.findings ?? []).slice(0, 4000)}
IOCS: ${JSON.stringify(r.iocs ?? []).slice(0, 2000)}`
    ).join("\n\n");

    const prompt = `SOURCE_KIND: ${p.source_kind}
CHUNK_SUMMARIES:
"""
${digest.slice(0, 60_000)}
"""

Return STRICT JSON per schema. Merge duplicate findings. Rank by severity. Ground every claim in the chunk summaries above.`;

    const res = await aiCall<Record<string, unknown>>({
      system: REDUCE_SYSTEM, user: prompt, model: DEFAULT_MODEL, jsonMode: true,
    });
    if (!res.ok || !res.parsed) {
      await admin.from("ray_log_analyses").update({
        status: "failed", error: res.error ?? "unknown",
        duration_ms: Date.now() - started, model: res.model,
      }).eq("id", analysisId);
      return new Response(JSON.stringify({ error: res.error ?? "unknown" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = res.parsed;
    const patch = {
      status: "complete" as const,
      summary: asStr(parsed.summary, 3000),
      executive_summary: asStr(parsed.executive_summary, 800),
      critical_findings: asArr(parsed.critical_findings),
      mitre: asArr(parsed.mitre),
      iocs: asArr(parsed.iocs),
      recommendations: asArr(parsed.recommendations),
      timeline: asArr(parsed.timeline),
      evidence: asObj(parsed.evidence),
      duration_ms: Date.now() - started,
      model: res.model,
      completed_at: new Date().toISOString(),
    };

    const { data: final, error: updErr } = await admin
      .from("ray_log_analyses").update(patch).eq("id", analysisId)
      .select("*").single();
    if (updErr) {
      return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Seed IOC memory from reduced IOCs + regex over chunk summaries.
    const aiIocs = (patch.iocs as Array<{ type?: string; value?: string }>).flatMap(x => {
      const t = typeof x.type === "string" ? x.type.toLowerCase() : "";
      const v = typeof x.value === "string" ? x.value.trim() : "";
      if (!t || !v) return [];
      return [{ type: t, value: v, value_norm: v.toLowerCase() }];
    });
    const regexIocs = extractIocs(digest);
    const dedup = new Map<string, { type: string; value: string; value_norm: string }>();
    for (const i of [...regexIocs, ...aiIocs]) dedup.set(`${i.type}:${i.value_norm}`, i);
    await upsertIocIndex(admin, {
      userId, orgId: p.org_id, iocs: [...dedup.values()],
      investigationId: analysisId, verdict: null,
    });

    return new Response(JSON.stringify({ ok: true, analysis: final }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "invalid_step" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

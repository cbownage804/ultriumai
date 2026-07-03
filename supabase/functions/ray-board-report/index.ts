/**
 * ray-board-report — cross-investigation executive digest.
 *
 * Pulls the user's completed investigations from the last N days (7 / 30 / 90)
 * and asks Ray to synthesise a board-level report: what happened, what it
 * means, what was done, what still needs attention. Costs 5 Ray Compute.
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
const COST = 8;
const MODEL = "google/gemini-2.5-flash";

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You are writing an executive-grade security report drawn from the full
knowledge graph: investigations, attack paths, compliance posture, open
recommendations, and the MITRE ATT&CK techniques Ray has observed. Voice:
calm, precise, first-person plural ("we investigated", "we recommend"),
plain English for the executive sections, technical for the appendix.
Never invent investigations, IOCs, scores, techniques, or verdicts that
are not in the input. If the period was quiet, say so plainly.

Return clean Markdown with these sections in order:
# Executive Report — <period label>
## Executive summary
3-5 sentences. Lead with the risk score and trajectory. Name the single
most important thing leadership should know this period.
## Risk posture
Current risk score, delta vs previous, compliance %, and a one-line
interpretation. If any are missing, say "not yet measured".
## By the numbers
Bulleted list: total investigations, verdict breakdown, attack paths
reasoned, open recommendations, high-severity items.
## Attack timeline
Chronological bullets (oldest → newest, dates in short form) of the most
significant events in the period. Skip if none.
## MITRE summary
Grouped bullets of the ATT&CK techniques observed and how often. Skip if
none were tagged.
## Open risks
The recommendations and gaps still outstanding, ranked by severity.
## What we did
Concrete response actions taken or investigations resolved.
## Recommendations for leadership
3-5 short, decision-oriented bullets tied to business impact.
## Technical appendix
Compact table-style bullets: notable IOCs, affected assets, and case IDs
for auditors. Keep under ~15 lines.

No preamble, no chain-of-thought, no code fences around the Markdown.`;

type Inv = {
  id: string;
  input_type: string;
  input_label: string | null;
  verdict: string | null;
  confidence: string | null;
  confidence_score: number | null;
  summary: string | null;
  executive_summary: string | null;
  mitre: unknown;
  created_at: string;
};

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
  const period_days = [7, 30, 90].includes(Number(body.period_days))
    ? Number(body.period_days) : 30;

  const since = new Date(Date.now() - period_days * 86_400_000).toISOString();
  const { data: invs } = await admin
    .from("ray_investigations")
    .select("id, input_type, input_label, verdict, confidence, confidence_score, summary, executive_summary, mitre, created_at")
    .eq("user_id", userId)
    .eq("status", "complete")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);

  const investigations = (invs ?? []) as Inv[];

  // Totals
  const totals = {
    total: investigations.length,
    malicious: investigations.filter(i => i.verdict === "malicious").length,
    suspicious: investigations.filter(i => i.verdict === "suspicious").length,
    benign: investigations.filter(i => i.verdict === "benign").length,
    inconclusive: investigations.filter(i => i.verdict === "inconclusive").length,
  };

  const periodLabel = period_days === 7 ? "Last 7 days"
    : period_days === 90 ? "Last 90 days" : "Last 30 days";

  // Broader knowledge-graph pull for the executive report.
  const [pathsRes, recsRes, scanRes, iocRes] = await Promise.all([
    admin.from("ray_attack_paths")
      .select("id, title, severity, summary, created_at")
      .eq("user_id", userId).eq("status", "complete")
      .gte("created_at", since)
      .order("created_at", { ascending: false }).limit(20),
    admin.from("ray_recommendations")
      .select("title, severity, priority, category, body, status, created_at")
      .eq("user_id", userId).eq("status", "open")
      .order("priority", { ascending: false, nullsFirst: false })
      .limit(20),
    admin.from("ray_compliance_scans")
      .select("overall_score, framework, created_at")
      .eq("user_id", userId).eq("status", "complete")
      .order("created_at", { ascending: false }).limit(2),
    admin.from("ray_ioc_index")
      .select("ioc_type, ioc_value, verdict, last_seen_at")
      .eq("user_id", userId)
      .gte("last_seen_at", since)
      .order("last_seen_at", { ascending: false }).limit(20),
  ]);

  const paths = (pathsRes.data ?? []) as Array<{ id: string; title: string | null; severity: string | null; summary: string | null; created_at: string }>;
  const recs = (recsRes.data ?? []) as Array<{ title: string; severity: string | null; priority: number | null; category: string | null; body: string | null; status: string; created_at: string }>;
  const scans = (scanRes.data ?? []) as Array<{ overall_score: number | null; framework: string | null; created_at: string }>;
  const iocs = (iocRes.data ?? []) as Array<{ ioc_type: string; ioc_value: string; verdict: string | null; last_seen_at: string }>;

  // Aggregate MITRE techniques across investigations.
  const mitreCount = new Map<string, number>();
  for (const inv of investigations) {
    const m = (inv as unknown as { mitre?: Array<{ technique?: string; id?: string; name?: string }> }).mitre;
    if (Array.isArray(m)) {
      for (const t of m) {
        const key = t?.technique || t?.id || t?.name;
        if (key) mitreCount.set(String(key), (mitreCount.get(String(key)) ?? 0) + 1);
      }
    }
  }
  const mitreList = Array.from(mitreCount.entries())
    .sort((a, b) => b[1] - a[1]).slice(0, 12)
    .map(([k, v]) => `${k} (×${v})`);

  const currentScore = scans[0]?.overall_score ?? null;
  const prevScore = scans[1]?.overall_score ?? null;
  const scoreDelta = currentScore != null && prevScore != null
    ? Math.round((currentScore - prevScore) * 10) / 10 : null;

  // Resolve org
  const { data: membership } = await admin
    .from("org_team_members")
    .select("organization_id").eq("user_id", userId).limit(1).maybeSingle();
  const orgId = (membership as { organization_id?: string } | null)?.organization_id ?? null;

  // Pending row
  const { data: pending, error: insErr } = await admin
    .from("ray_board_reports")
    .insert({
      user_id: userId, org_id: orgId, period_days,
      title: `Executive Report — ${periodLabel}`,
      status: "running", totals,
      investigation_ids: investigations.map(i => i.id),
      cost_ray_compute: COST,
    })
    .select("id").single();
  if (insErr || !pending) {
    return new Response(JSON.stringify({ error: "insert_failed", detail: insErr?.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const reportId = (pending as { id: string }).id;

  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    await admin.from("ray_board_reports").update({ status: "failed", error: "LOVABLE_API_KEY missing" }).eq("id", reportId);
    return new Response(JSON.stringify({ error: "ai_unavailable" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const caseList = investigations.map((i, idx) => {
    const d = new Date(i.created_at).toISOString().slice(0, 10);
    return `${idx + 1}. [${d}] [${i.verdict ?? "unknown"}] (${i.input_type}) ${i.input_label ?? "(unlabelled)"}\n   Summary: ${i.summary ?? "-"}\n   Executive: ${i.executive_summary ?? "-"}\n   CaseID: ${i.id}`;
  }).join("\n\n");

  const pathList = paths.map((p, idx) =>
    `${idx + 1}. [${p.severity ?? "n/a"}] ${p.title ?? "Attack path"} — ${p.summary ?? "-"}`
  ).join("\n");

  const recList = recs.map((r, idx) =>
    `${idx + 1}. [${r.severity ?? "n/a"}${r.priority != null ? `/p${r.priority}` : ""}] ${r.title}${r.category ? ` (${r.category})` : ""}`
  ).join("\n");

  const iocList = iocs.map((i, idx) =>
    `${idx + 1}. ${i.ioc_type}: ${i.ioc_value}${i.verdict ? ` (${i.verdict})` : ""}`
  ).join("\n");

  const userPrompt = `Reporting period: ${periodLabel}
Cases in period: ${totals.total}
Verdict breakdown: malicious=${totals.malicious}, suspicious=${totals.suspicious}, benign=${totals.benign}, inconclusive=${totals.inconclusive}

RISK POSTURE:
${currentScore != null
  ? `Current risk/compliance score: ${currentScore}${scans[0]?.framework ? ` (${scans[0].framework})` : ""}${scoreDelta != null ? ` — delta ${scoreDelta >= 0 ? "+" : ""}${scoreDelta} vs previous scan` : " — no prior scan to compare"}`
  : "No compliance scan on file yet."}

ATTACK PATHS REASONED (${paths.length}):
${pathList || "(none)"}

OPEN RECOMMENDATIONS (${recs.length}):
${recList || "(none)"}

MITRE TECHNIQUES OBSERVED:
${mitreList.length ? mitreList.join(", ") : "(none tagged)"}

NOTABLE IOCS SEEN OR RESURFACED (${iocs.length}):
${iocList || "(none)"}

CASES:
${caseList || "(No investigations were run in this period.)"}

Write the executive report now.`;

  let content: string | null = null;
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

  if (aiError || !content) {
    await admin.from("ray_board_reports").update({
      status: "failed", error: aiError ?? "unknown", model: MODEL,
      duration_ms: Date.now() - started,
    }).eq("id", reportId);
    return new Response(JSON.stringify({ error: aiError ?? "unknown", id: reportId }), {
      status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: finalRow, error: updErr } = await admin
    .from("ray_board_reports")
    .update({
      status: "complete", content, model: MODEL,
      duration_ms: Date.now() - started,
      completed_at: new Date().toISOString(),
    })
    .eq("id", reportId).select("*").single();

  if (updErr) {
    return new Response(JSON.stringify({ error: "update_failed", detail: updErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, report: finalRow }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

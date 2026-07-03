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
const COST = 5;
const MODEL = "google/gemini-2.5-flash";

const RAY_SYSTEM = `You are Ray, the AI security analyst inside Wrayth.
You are writing a board-level report summarising the security investigations
run during a reporting period. Voice: calm, precise, first-person plural
("we investigated", "we recommend"), plain English, zero jargon unless
essential. Never invent investigations, IOCs, or verdicts beyond what the
input contains. If the period was quiet, say so plainly.

Return clean Markdown with these sections in order:
# Board Report — <period label>
## Executive summary
2-4 sentences.
## By the numbers
Bulleted list: total investigations, verdict breakdown, notable trends.
## Notable investigations
For each of up to 5 most significant cases: bold title, one-sentence what,
one-sentence why-it-matters.
## What we did
Concrete response actions taken or recommended.
## What still needs attention
Open items, follow-ups, or gaps.
## Recommendations for the board
3-5 short, decision-oriented bullets.

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
    .select("id, input_type, input_label, verdict, confidence, confidence_score, summary, executive_summary, created_at")
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
      title: `Board Report — ${periodLabel}`,
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
    return `${idx + 1}. [${i.verdict ?? "unknown"}] (${i.input_type}) ${i.input_label ?? "(unlabelled)"}\n   Summary: ${i.summary ?? "-"}\n   Executive: ${i.executive_summary ?? "-"}`;
  }).join("\n\n");

  const userPrompt = `Reporting period: ${periodLabel}
Cases in period: ${totals.total}
Verdict breakdown: malicious=${totals.malicious}, suspicious=${totals.suspicious}, benign=${totals.benign}, inconclusive=${totals.inconclusive}

CASES:
${caseList || "(No investigations were run in this period.)"}

Write the board report now.`;

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

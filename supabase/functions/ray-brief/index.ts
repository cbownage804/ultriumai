/**
 * ray-brief — Hybrid morning brief generator.
 *
 * Strategy:
 *   1. Resolve target user (JWT for end-users, body.user_id when invoked by the
 *      cron function with the service-role key).
 *   2. Build a fully structured snapshot from the user's real security data
 *      (passwords, threats, exposure, devices, timeline, recommendations,
 *      score delta vs the prior brief).
 *   3. Ask Lovable AI only for the conversational layer (greeting, 2-4
 *      bullets, short guidance). If AI fails, ship a deterministic fallback.
 *   4. Upsert into public.ray_briefs keyed by (user_id, brief_date) so the
 *      same calendar day is never duplicated.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAY_SYSTEM = `You are Ray, the cybersecurity intelligence inside Wrayth.
You speak like JARVIS from Iron Man: calm, concise, confident, never alarmist.
Speak in first person ("I checked", "I noticed", "I recommend").
You are giving a morning briefing — short sentences, no emoji, no marketing.
Return STRICT JSON only.`;

type Severity = "info" | "low" | "medium" | "high" | "critical";

interface Stats {
  passwords: { total: number; weak: number; reused: number; breached: number };
  threats: { open: number; critical: number; high: number };
  exposure: { monitored: number; new_breaches: number };
  devices: { total: number; unhealthy: number };
  timeline: { since_last_brief: number };
}

interface Recommendation {
  id?: string;
  title: string;
  body?: string | null;
  priority: number;
  page_context?: string | null;
}

function localDate(tz: string): string {
  try {
    const fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    return fmt.format(new Date()); // YYYY-MM-DD
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function buildStats(sb: SupabaseClient, userId: string, sinceISO: string | null): Promise<Stats> {
  const [pw, threats, exposure, devices, tl] = await Promise.all([
    sb.from("password_entries").select("password_strength,is_breached,is_reused").eq("user_id", userId),
    sb.from("ray_findings").select("severity").eq("user_id", userId).is("resolved_at", null),
    sb.from("safeweb_assets").select("id,status").eq("user_id", userId).eq("status", "active"),
    sb.from("ray_insights").select("id").eq("user_id", userId).eq("area", "devices").eq("status", "open"),
    sinceISO
      ? sb.from("ray_timeline").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("occurred_at", sinceISO)
      : Promise.resolve({ count: 0 } as any),
  ]);

  const pwRows = (pw.data ?? []) as Array<{ password_strength?: string; is_breached?: boolean; is_reused?: boolean }>;
  const thRows = (threats.data ?? []) as Array<{ severity?: string }>;

  return {
    passwords: {
      total: pwRows.length,
      weak: pwRows.filter((p) => p.password_strength === "weak").length,
      reused: pwRows.filter((p) => p.is_reused === true).length,
      breached: pwRows.filter((p) => p.is_breached === true).length,
    },
    threats: {
      open: thRows.length,
      critical: thRows.filter((t) => t.severity === "critical").length,
      high: thRows.filter((t) => t.severity === "high").length,
    },
    exposure: {
      monitored: exposure.data?.length ?? 0,
      new_breaches: 0,
    },
    devices: {
      total: 0,
      unhealthy: devices.data?.length ?? 0,
    },
    timeline: { since_last_brief: (tl as any)?.count ?? 0 },
  };
}

function computeScore(stats: Stats): number {
  let score = 100;
  score -= Math.min(25, stats.passwords.weak * 3);
  score -= Math.min(20, stats.passwords.reused * 2);
  score -= Math.min(25, stats.passwords.breached * 5);
  score -= Math.min(30, stats.threats.critical * 10 + stats.threats.high * 4);
  score -= Math.min(10, stats.devices.unhealthy * 2);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function deterministicSummary(firstName: string, stats: Stats, scoreDelta: number | null): {
  greeting: string; bullets: string[]; guidance: string;
} {
  const bullets: string[] = [];
  if (stats.timeline.since_last_brief > 0) {
    bullets.push(`I logged ${stats.timeline.since_last_brief} new events since we last spoke.`);
  } else {
    bullets.push("Nothing new in your timeline since we last spoke.");
  }
  if (stats.passwords.breached > 0) {
    bullets.push(`${stats.passwords.breached} of your passwords appeared in known breaches.`);
  } else if (stats.passwords.weak > 0) {
    bullets.push(`${stats.passwords.weak} passwords look weak — I can help you rotate them.`);
  } else if (stats.passwords.total > 0) {
    bullets.push("Your passwords look healthy.");
  }
  if (stats.threats.critical + stats.threats.high > 0) {
    bullets.push(`${stats.threats.critical + stats.threats.high} high-priority threats are open.`);
  }
  const guidance = stats.threats.critical > 0
    ? "Start with the critical threats — I'll walk you through each one."
    : stats.passwords.breached > 0
    ? "I'd rotate the breached passwords first. Should only take a few minutes."
    : "Nothing urgent right now. I'll keep watching.";
  const trend = scoreDelta === null ? "" : scoreDelta > 0 ? ` Your score is up ${scoreDelta}.` : scoreDelta < 0 ? ` Your score is down ${Math.abs(scoreDelta)}.` : "";
  return {
    greeting: `Good morning, ${firstName}.${trend}`,
    bullets,
    guidance,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({} as any));
    const requestedUserId: string | undefined = body?.user_id;
    const force: boolean = body?.force === true;
    const source: string = body?.source === "cron" ? "cron" : body?.source === "manual" ? "manual" : "lazy";

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });

    let userId: string | null = null;
    let userEmail: string | null = null;
    let userMeta: Record<string, unknown> = {};

    if (requestedUserId && authHeader.includes(SERVICE_ROLE)) {
      // Cron / server-side path
      userId = requestedUserId;
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
      const { data } = await admin.auth.admin.getUserById(userId);
      userEmail = data?.user?.email ?? null;
      userMeta = (data?.user?.user_metadata ?? {}) as Record<string, unknown>;
    } else {
      const { data: ud, error: uerr } = await userClient.auth.getUser();
      if (uerr || !ud?.user) {
        return new Response(JSON.stringify({ error: "unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      userId = ud.user.id;
      userEmail = ud.user.email ?? null;
      userMeta = (ud.user.user_metadata ?? {}) as Record<string, unknown>;
    }

    // Use service-role for reads/writes so cron path works identically.
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    const firstName = ((userMeta.full_name as string | undefined) ?? (userMeta.name as string | undefined) ?? userEmail?.split("@")[0] ?? "there").split(" ")[0];

    // Profile / timezone
    const { data: profile } = await sb.from("ray_profiles").select("*").eq("user_id", userId!).maybeSingle();
    const tz = (profile?.timezone as string | null) || "UTC";
    const today = localDate(tz);

    // Existing brief for today?
    const { data: existing } = await sb.from("ray_briefs").select("*").eq("user_id", userId!).eq("brief_date", today).maybeSingle();
    if (existing && !force) {
      return new Response(JSON.stringify({ brief: existing, reused: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Previous brief for score delta + "since last spoke"
    const { data: previous } = await sb
      .from("ray_briefs")
      .select("id, score, generated_at")
      .eq("user_id", userId!)
      .lt("brief_date", today)
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    const sinceISO = previous?.generated_at ?? (profile?.last_seen_at as string | null) ?? null;
    const startedAt = Date.now();

    // Structured data
    const stats = await buildStats(sb, userId!, sinceISO);
    const score = computeScore(stats);
    const scoreDelta = previous?.score != null ? score - previous.score : null;

    // Pull open recommendations (already curated upstream)
    const { data: recs } = await sb
      .from("ray_recommendations")
      .select("id,title,body,priority,page_context")
      .eq("user_id", userId!)
      .eq("status", "open")
      .order("priority", { ascending: false })
      .limit(5);
    const recommendations: Recommendation[] = (recs ?? []) as Recommendation[];

    // Conversational layer (AI). Fall back deterministically if anything fails.
    let greeting = "";
    let bullets: string[] = [];
    let guidance = "";
    let aiStatus: "ai" | "fallback" = "fallback";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      const userPrompt = `Write a short morning briefing for ${firstName}.
Use ONLY the data below — do not invent numbers. Keep it grounded and calm.
If everything is healthy, say so plainly.

DATA:
${JSON.stringify({
  first_name: firstName,
  local_date: today,
  timezone: tz,
  score,
  score_delta: scoreDelta,
  stats,
  top_recommendations: recommendations.slice(0, 3).map((r) => ({ title: r.title, priority: r.priority })),
})}

Return JSON exactly:
{ "greeting": "...", "bullets": ["...","..."], "guidance": "..." }
- greeting: one sentence with the user's first name, optionally mention score trend.
- bullets: 2-4 short observations grounded in DATA.
- guidance: one sentence on what I'd do first.`;
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "system", content: RAY_SYSTEM }, { role: "user", content: userPrompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          const parsed = JSON.parse(j?.choices?.[0]?.message?.content ?? "{}");
          greeting = String(parsed.greeting ?? "").slice(0, 240);
          bullets = Array.isArray(parsed.bullets) ? parsed.bullets.slice(0, 4).map((b: unknown) => String(b).slice(0, 240)) : [];
          guidance = String(parsed.guidance ?? "").slice(0, 280);
          if (greeting && bullets.length > 0) aiStatus = "ai";
        } else {
          console.warn("[ray-brief] AI gateway non-ok", aiRes.status);
        }
      } catch (e) {
        console.warn("[ray-brief] AI gateway threw", e);
      }
    }

    if (aiStatus === "fallback") {
      const fb = deterministicSummary(firstName, stats, scoreDelta);
      greeting = fb.greeting;
      bullets = fb.bullets;
      guidance = fb.guidance;
    }

    const upsertPayload = {
      user_id: userId!,
      brief_date: today,
      timezone: tz,
      source,
      stats,
      score,
      score_delta: scoreDelta,
      recommendations: recommendations as unknown as Record<string, unknown>[],
      greeting,
      summary: bullets.join(" "),
      bullets,
      guidance,
      ai_status: aiStatus,
      generation_ms: Date.now() - startedAt,
      generated_at: new Date().toISOString(),
    };

    const { data: saved, error: upErr } = await sb
      .from("ray_briefs")
      .upsert(upsertPayload, { onConflict: "user_id,brief_date" })
      .select()
      .single();
    if (upErr) {
      console.error("[ray-brief] upsert failed", upErr);
      return new Response(JSON.stringify({ error: upErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Bump last_seen_at so deltas anchor on this brief next time
    await sb.from("ray_profiles").update({ last_seen_at: new Date().toISOString() }).eq("user_id", userId!);

    return new Response(JSON.stringify({ brief: saved, reused: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ray-brief] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

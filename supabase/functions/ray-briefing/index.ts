/**
 * ray-briefing — generates Ray's morning briefing for the current user.
 *
 * Pulls profile + memory + recent timeline + active findings, asks Lovable AI
 * Gateway for a calm JARVIS-style briefing, persists it, and returns it.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RAY_SYSTEM = `You are Ray, the cybersecurity intelligence inside Wrayth.
You speak like JARVIS from Iron Man: calm, concise, confident, never alarmist.
You always speak in the first person ("I checked", "I noticed", "I recommend").
You are not a chatbot — you are the user's security teammate giving a morning briefing.
Tone: short sentences. No emoji. No hype. No marketing.
Output STRICT JSON only, matching the requested schema. Never add prose outside JSON.`;

type Bullet = string;

interface BriefingOutput {
  greeting: string;
  bullets: Bullet[];
  recommendations: Array<{
    title: string;
    body: string;
    priority: number; // 0-100
    estimated_fix_seconds: number;
    page_context: "passwords" | "threats" | "exposure" | "identity" | "devices" | "reports" | "home";
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;
    const firstName = (user.user_metadata?.full_name as string | undefined)?.split(" ")?.[0]
      ?? user.email?.split("@")[0]
      ?? "there";

    // Gather context in parallel
    const [profile, memory, timeline, findings, passwords, monitors, insights] = await Promise.all([
      supabase.from("ray_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ray_memory").select("key,value,source").eq("user_id", user.id).limit(50),
      supabase.from("ray_timeline").select("event_type,summary,severity,occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(15),
      supabase.from("ray_findings").select("kind,severity,details").eq("user_id", user.id).is("resolved_at", null).limit(25),
      supabase.from("password_entries").select("id,password_strength").eq("user_id", user.id),
      supabase.from("safeweb_assets").select("id,asset_type,status").eq("user_id", user.id).eq("status", "active"),
      supabase.from("ray_insights").select("kind,area,severity,title,observed_at,status").eq("user_id", user.id).eq("status", "open").order("observed_at", { ascending: false }).limit(50),
    ]);

    const passwordStats = {
      total: passwords.data?.length ?? 0,
      weak: passwords.data?.filter((p: any) => p.password_strength === "weak").length ?? 0,
    };

    // Overnight delta — what Ray observed since last_seen_at.
    const lastSeen = profile.data?.last_seen_at ? new Date(profile.data.last_seen_at) : null;
    let overnight: { since: string | null; by_area: Record<string, number>; new_critical: number; new_high: number; total_new: number } = {
      since: lastSeen?.toISOString() ?? null,
      by_area: {},
      new_critical: 0,
      new_high: 0,
      total_new: 0,
    };
    if (lastSeen) {
      const recent = (insights.data ?? []).filter((i: any) => new Date(i.observed_at) >= lastSeen);
      overnight.total_new = recent.length;
      for (const r of recent) {
        overnight.by_area[r.area] = (overnight.by_area[r.area] ?? 0) + 1;
        if (r.severity === "critical") overnight.new_critical += 1;
        if (r.severity === "high") overnight.new_high += 1;
      }
    }

    const contextPayload = {
      first_name: firstName,
      profile: profile.data ?? null,
      memory: memory.data ?? [],
      recent_timeline: timeline.data ?? [],
      open_findings: findings.data ?? [],
      open_insights: insights.data ?? [],
      overnight_delta: overnight,
      password_stats: passwordStats,
      monitored_count: monitors.data?.length ?? 0,
      now: new Date().toISOString(),
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "missing LOVABLE_API_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Generate a short, conversational morning briefing for ${firstName}.
Greeting must be 1 short sentence (e.g. "Good morning, ${firstName}.").
Bullets: 2-4 plain, calm observations grounded in the context.
Recommendations: 0-3 items. TITLES MUST BE OUTCOME-FOCUSED and written as something you (Ray) will do FOR the user.
GOOD titles: "Start protecting your passwords", "Let me monitor your dark-web exposure", "Turn on MFA for your Google account".
BAD titles: "Establish password monitoring", "Configure breach detection", "Setup 2FA".
The body explains what it actually does in 1 sentence.

Context JSON:
${JSON.stringify(contextPayload).slice(0, 8000)}

Return JSON ONLY in this exact shape:
{
  "greeting": "Good morning, <name>.",
  "bullets": ["short observation", "..."],
  "recommendations": [
    { "title": "outcome-focused action Ray will take", "body": "what it does", "priority": 0-100, "estimated_fix_seconds": <int>, "page_context": "passwords"|"threats"|"exposure"|"identity"|"devices"|"reports"|"home" }
  ]
}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: RAY_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("[ray-briefing] AI gateway error", aiRes.status, txt);
      // Fallback briefing so the UI never breaks.
      const fallback: BriefingOutput = {
        greeting: `Hello, ${firstName}.`,
        bullets: [
          "I checked your monitored accounts.",
          passwordStats.weak > 0
            ? `${passwordStats.weak} of your passwords look weak — I can help you rotate them.`
            : "Your passwords look healthy.",
          "Nothing urgent right now. I will keep watching.",
        ],
        recommendations: [],
      };
      const { data: saved } = await supabase
        .from("ray_briefings")
        .insert({
          user_id: user.id,
          greeting: fallback.greeting,
          bullets: fallback.bullets,
          recommendation_ids: [],
          expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
        })
        .select()
        .single();
      return new Response(JSON.stringify({ briefing: saved }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: BriefingOutput;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { greeting: `Hello, ${firstName}.`, bullets: [String(content).slice(0, 200)], recommendations: [] };
    }

    // Persist recommendations and collect their IDs.
    const recIds: string[] = [];
    if (Array.isArray(parsed.recommendations)) {
      for (const rec of parsed.recommendations.slice(0, 5)) {
        const { data: inserted } = await supabase
          .from("ray_recommendations")
          .insert({
            user_id: user.id,
            title: String(rec.title ?? "").slice(0, 200),
            body: String(rec.body ?? "").slice(0, 1000),
            priority: Math.max(0, Math.min(100, Number(rec.priority ?? 50))),
            status: "open",
            estimated_fix_seconds: Math.max(15, Math.min(3600, Number(rec.estimated_fix_seconds ?? 60))),
            page_context: typeof rec.page_context === "string" ? rec.page_context : "home",
          })
          .select("id")
          .single();
        if (inserted?.id) recIds.push(inserted.id);
      }
    }

    const { data: saved } = await supabase
      .from("ray_briefings")
      .insert({
        user_id: user.id,
        greeting: String(parsed.greeting ?? `Hello, ${firstName}.`).slice(0, 200),
        bullets: (parsed.bullets ?? []).slice(0, 6).map((b) => String(b).slice(0, 240)),
        recommendation_ids: recIds,
        expires_at: new Date(Date.now() + 6 * 3600_000).toISOString(),
      })
      .select()
      .single();

    return new Response(JSON.stringify({ briefing: saved }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ray-briefing] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

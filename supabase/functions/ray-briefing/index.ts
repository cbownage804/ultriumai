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
    const [profile, memory, timeline, findings, passwords, monitors, insights, openRecs, lastBriefing] = await Promise.all([
      supabase.from("ray_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("ray_memory").select("key,value,source").eq("user_id", user.id).limit(50),
      supabase.from("ray_timeline").select("event_type,summary,severity,occurred_at").eq("user_id", user.id).order("occurred_at", { ascending: false }).limit(15),
      supabase.from("ray_findings").select("kind,severity,details").eq("user_id", user.id).is("resolved_at", null).limit(25),
      supabase.from("password_entries").select("id,password_strength").eq("user_id", user.id),
      supabase.from("safeweb_assets").select("id,asset_type,status").eq("user_id", user.id).eq("status", "active"),
      supabase.from("ray_insights").select("kind,area,severity,title,observed_at,status").eq("user_id", user.id).eq("status", "open").order("observed_at", { ascending: false }).limit(50),
      supabase.from("ray_recommendations").select("id,title,body,priority,page_context,objective").eq("user_id", user.id).eq("status", "open").order("priority", { ascending: false }).limit(8),
      supabase.from("ray_briefings").select("id").eq("user_id", user.id).order("generated_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    // Detect first-run handoff from onboarding: no prior briefing AND the
    // profile was onboarded in the last 10 minutes. The first brief should
    // explicitly acknowledge what Ray learned during setup.
    const onboardedAt = profile.data?.onboarded_at ? new Date(profile.data.onboarded_at) : null;
    const isFirstRun =
      !lastBriefing.data &&
      !!onboardedAt &&
      Date.now() - onboardedAt.getTime() < 10 * 60 * 1000;
    const onboardingMemory = (memory.data ?? []).find((m: any) => m.key === "onboarding.summary")?.value ?? null;


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
      is_first_run: isFirstRun,
      onboarding_summary: onboardingMemory,
      profile: profile.data ?? null,
      memory: memory.data ?? [],
      recent_timeline: timeline.data ?? [],
      open_findings: findings.data ?? [],
      open_insights: insights.data ?? [],
      existing_open_recommendations: openRecs.data ?? [],
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

    const vaultEmpty = passwordStats.total === 0;

    const firstRunInstruction = isFirstRun
      ? `\nFIRST-RUN HANDOFF: This is the user's very first briefing — they just finished onboarding with you minutes ago. Acknowledge it warmly in the greeting (e.g. "Welcome in, ${firstName}. Here's where we stand."). In the bullets, reference what you found DURING SETUP using onboarding_summary (e.g. "I went through your ${onboardingMemory?.total ?? 0} credentials. ${onboardingMemory?.breached ?? 0} were in known breaches."). Prefer surfacing the recommendations already in existing_open_recommendations rather than inventing new ones — those were generated from the user's real data during setup. Do not say "good morning" or pretend time has passed.`
      : `\nReturning user — keep continuity with recent_timeline and prior memory. Reference the most recent meaningful event if it adds value.`;

    const lifecycleInstruction = vaultEmpty
      ? `\nLIFECYCLE: The user has NOT yet imported or saved any passwords. Wrayth's very first job is to become their password manager. Your ONE recommendation is already provided ("Protect your passwords with Wrayth"). DO NOT invent recommendations about password monitoring, breach detection, MFA, or dark-web exposure — those follow naturally once passwords are in the vault. Bullets should invite them to bring their passwords in, not report on things that don't exist yet. Return an EMPTY recommendations array — Ray will attach the correct one.`
      : "";

    const userPrompt = `Generate a short, conversational ${isFirstRun ? "first-run welcome" : "morning"} briefing for ${firstName}.
Greeting must be 1 short sentence.
Bullets: 2-4 plain, calm observations grounded in the context.
Recommendations: 0-3 items. TITLES MUST BE OUTCOME-FOCUSED and written as something you (Ray) will do FOR the user.
GOOD titles: "Start protecting your passwords", "Let me monitor your dark-web exposure", "Turn on MFA for your Google account".
BAD titles: "Establish password monitoring", "Configure breach detection", "Setup 2FA".
The body explains what it actually does in 1 sentence.${firstRunInstruction}${lifecycleInstruction}

Context JSON:
${JSON.stringify(contextPayload).slice(0, 8000)}

Return JSON ONLY in this exact shape:
{
  "greeting": "short sentence",
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

    // On first run, prefer the recommendations the onboarding pipeline
    // already created from real findings. Skip any AI-generated rec whose
    // title duplicates an existing open one.
    const existingTitles = new Set(
      (openRecs.data ?? []).map((r: any) => String(r.title ?? "").toLowerCase().trim()),
    );
    const recIds: string[] = isFirstRun
      ? (openRecs.data ?? []).slice(0, 5).map((r: any) => r.id)
      : [];

    // Lifecycle-aware: if the user's vault is empty, Ray's single, top
    // recommendation is "Protect your passwords with Wrayth" (objective
    // = import_passwords). Anything the AI tries to add about password
    // monitoring/breach detection is redundant until credentials exist.
    if (vaultEmpty) {
      const { data: existingImport } = await supabase
        .from("ray_recommendations")
        .select("id")
        .eq("user_id", user.id)
        .eq("objective", "import_passwords")
        .is("completed_at", null)
        .is("dismissed_at", null)
        .maybeSingle();
      let importRecId = existingImport?.id as string | undefined;
      if (!importRecId) {
        const { data: created } = await supabase
          .from("ray_recommendations")
          .insert({
            user_id: user.id,
            title: "Protect your passwords with Wrayth",
            body: "Import from your browser or password manager, or save your first password. Once your vault is set up, monitoring, breach detection, and Ray's guidance follow automatically.",
            priority: 1,
            status: "open",
            estimated_fix_seconds: 180,
            page_context: "passwords",
            objective: "import_passwords",
          })
          .select("id")
          .single();
        importRecId = created?.id;
      }
      if (importRecId && !recIds.includes(importRecId)) recIds.unshift(importRecId);
    }

    // Stateful dedup: every AI-generated rec is mapped to a stable objective
    // key (or falls back to a hash of its title). Ray never emits two active
    // recommendations with the same objective — enforced both here and by the
    // partial unique index on ray_recommendations(user_id, objective).
    const inferObjective = (title: string, body: string): string => {
      const t = `${title} ${body}`.toLowerCase();
      if (/\bbreach|pwned|compromised\b/.test(t)) return "rotate_breached";
      if (/\breus(e|ed|ing)|duplicate password/.test(t)) return "stop_password_reuse";
      if (/\bweak password|strengthen password/.test(t)) return "strengthen_weak_passwords";
      if (/\bmfa|2fa|two[- ]?factor|authenticator|2-step\b/.test(t)) return "enable_mfa";
      if (/\bdark[- ]?web|monitor.*(email|identity|exposure)/.test(t)) return "monitor_exposure";
      // Every "protect your passwords / establish password monitoring /
      // start protecting / import passwords / password manager" variant is
      // the same vault-onboarding job. Collapse to import_passwords so the
      // partial unique index keeps only one open row.
      if (
        /\bimport.*password|save.*first password|password manager\b/.test(t) ||
        /\bprotect(ing)?\s+your\s+passwords?\b/.test(t) ||
        /\bpassword\s+monitoring\b/.test(t) ||
        /\bestablish.*password|start.*protect.*password\b/.test(t)
      ) return "import_passwords";
      if (/\bextension|autofill|browser/.test(t)) return "install_extension";
      if (/\bpasskey/.test(t)) return "adopt_passkeys";
      // Deterministic fallback so repeated identical titles collapse.
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 60);
      return slug ? `ai_${slug}` : `ai_${Date.now()}`;
    };

    const seenObjectives = new Set<string>(
      (openRecs.data ?? []).map((r: any) => String(r.objective ?? "")).filter(Boolean),
    );

    if (Array.isArray(parsed.recommendations) && !vaultEmpty) {
      for (const rec of parsed.recommendations.slice(0, 5)) {
        const title = String(rec.title ?? "").slice(0, 200);
        if (!title) continue;
        if (existingTitles.has(title.toLowerCase().trim())) continue;
        const body = String(rec.body ?? "").slice(0, 1000);
        const objective = inferObjective(title, body);
        if (seenObjectives.has(objective)) continue;
        seenObjectives.add(objective);
        const { data: inserted, error: insertErr } = await supabase
          .from("ray_recommendations")
          .insert({
            user_id: user.id,
            title,
            body,
            priority: Math.max(0, Math.min(100, Number(rec.priority ?? 50))),
            status: "open",
            estimated_fix_seconds: Math.max(15, Math.min(3600, Number(rec.estimated_fix_seconds ?? 60))),
            page_context: typeof rec.page_context === "string" ? rec.page_context : "home",
            objective,
          })
          .select("id")
          .single();
        // Unique-index violations mean an open rec already exists for this
        // objective — that's the desired outcome, so we swallow it silently.
        if (insertErr && !String(insertErr.message ?? "").includes("duplicate")) {
          console.warn("[ray-briefing] rec insert failed", insertErr.message);
        }
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

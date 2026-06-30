/**
 * ray-brief-cron — invoked hourly by pg_cron.
 *
 * For every onboarded user whose local time is currently within the morning
 * window (default 07:00) and who does not yet have a brief for today, kicks
 * off ray-brief with source="cron". Runs serially to avoid hammering the AI
 * gateway; volume is low (one row per user per day).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TARGET_HOUR = 7;

function localHourAndDate(tz: string): { hour: number; date: string } {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false,
    }).formatToParts(new Date());
    const map: Record<string, string> = {};
    for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;
    return { hour: Number(map.hour ?? "0"), date: `${map.year}-${map.month}-${map.day}` };
  } catch {
    const d = new Date();
    return { hour: d.getUTCHours(), date: d.toISOString().slice(0, 10) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: profiles } = await sb
      .from("ray_profiles")
      .select("user_id, timezone")
      .not("onboarded_at", "is", null);

    const targets: Array<{ user_id: string; timezone: string; date: string }> = [];
    for (const p of profiles ?? []) {
      const tz = (p.timezone as string | null) || "UTC";
      const { hour, date } = localHourAndDate(tz);
      if (hour === TARGET_HOUR) targets.push({ user_id: p.user_id as string, timezone: tz, date });
    }

    if (targets.length === 0) {
      return new Response(JSON.stringify({ scheduled: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Skip users who already have a brief for today
    const ids = targets.map((t) => t.user_id);
    const { data: existing } = await sb
      .from("ray_briefs")
      .select("user_id, brief_date")
      .in("user_id", ids)
      .in("brief_date", Array.from(new Set(targets.map((t) => t.date))));
    const haveToday = new Set((existing ?? []).map((e: any) => `${e.user_id}|${e.brief_date}`));

    const pending = targets.filter((t) => !haveToday.has(`${t.user_id}|${t.date}`));

    let okCount = 0;
    let errCount = 0;
    for (const t of pending) {
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/ray-brief`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SERVICE_ROLE}`,
            apikey: SERVICE_ROLE,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_id: t.user_id, source: "cron" }),
        });
        if (res.ok) okCount += 1; else { errCount += 1; console.warn("[ray-brief-cron] non-ok", t.user_id, res.status); }
      } catch (e) {
        errCount += 1;
        console.warn("[ray-brief-cron] fetch threw", t.user_id, e);
      }
    }

    return new Response(JSON.stringify({ scheduled: pending.length, ok: okCount, err: errCount, skipped: targets.length - pending.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[ray-brief-cron] fatal", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

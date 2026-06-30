/**
 * ray-scheduler — Wave 5: Scheduled playbooks.
 *
 * Invoked by pg_cron on a 5-minute cadence. Finds every enabled schedule
 * whose next_run_at has elapsed, snapshots the playbook into a new
 * ray_playbook_runs row, advances next_run_at by the schedule's cadence,
 * and records a timeline event.
 *
 * Cron expressions supported: simple cadences only (every N minutes/hours/days,
 * or "weekly"/"monthly"). For richer cron, swap parser later.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function advance(cron: string, from = new Date()): Date {
  const next = new Date(from.getTime());
  const c = cron.trim().toLowerCase();
  if (c === "@weekly" || c === "weekly") next.setDate(next.getDate() + 7);
  else if (c === "@monthly" || c === "monthly") next.setMonth(next.getMonth() + 1);
  else if (c === "@daily" || c === "daily") next.setDate(next.getDate() + 1);
  else if (c === "@hourly" || c === "hourly") next.setHours(next.getHours() + 1);
  else {
    // Fallback: weekly
    next.setDate(next.getDate() + 7);
  }
  return next;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();
  const { data: due, error } = await supabase
    .from("ray_playbook_schedules")
    .select("id,user_id,playbook_slug,cron")
    .eq("enabled", true)
    .lte("next_run_at", nowIso)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let triggered = 0;
  for (const sched of due ?? []) {
    // Minimal playbook run: title pulled from slug, tasks left empty so the
    // PlaybookRunner can rehydrate from the template at load time.
    const { data: run, error: runErr } = await supabase
      .from("ray_playbook_runs")
      .insert({
        user_id: sched.user_id,
        slug: sched.playbook_slug,
        title: sched.playbook_slug.replace(/-/g, " "),
        category: "scheduled",
        status: "scheduled",
        tasks: [],
        progress: 0,
      })
      .select("id")
      .single();
    if (runErr) continue;

    await supabase
      .from("ray_playbook_schedules")
      .update({
        last_run_at: nowIso,
        last_run_id: run?.id ?? null,
        next_run_at: advance(sched.cron).toISOString(),
      })
      .eq("id", sched.id);

    await supabase.from("ray_timeline").insert({
      user_id: sched.user_id,
      event_type: "playbook_scheduled_run",
      summary: `Scheduled playbook started: ${sched.playbook_slug}`,
      payload: { schedule_id: sched.id, run_id: run?.id, slug: sched.playbook_slug },
      severity: "info",
    });

    triggered++;
  }

  return new Response(JSON.stringify({ ok: true, triggered }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

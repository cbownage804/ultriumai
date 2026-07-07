// Ray remediation queue tick — advances approved rows: dispatches agent
// actions, transitions state, and honours scheduled_for windows. Runs on a
// cron trigger (60s), but can also be invoked manually from the Queue page.
//
// deno-lint-ignore-file no-explicit-any
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("wrayth_remediation_actions")
    .select("id, user_id, provider, slug, action_type, target_id, params")
    .eq("lifecycle_state", "approved")
    .or(`scheduled_for.is.null,scheduled_for.lte.${nowIso}`)
    .limit(50);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const processed: any[] = [];
  for (const row of rows ?? []) {
    if (row.target_id === "unassigned") continue;

    // Mark running.
    await supabase
      .from("wrayth_remediation_actions")
      .update({ lifecycle_state: "running", status: "running" })
      .eq("id", row.id);

    let ok = false;
    let errMsg: string | null = null;

    try {
      if (row.provider === "agent") {
        const { data: dispatchData, error: fErr } = await supabase.functions.invoke("agent-action-request", {
          body: {
            device_id: row.target_id,
            action_type: row.action_type,
            params: row.params ?? {},
            confirmed: true,
          },
        });
        if (fErr) throw new Error(fErr.message);
        // Link the resulting device_actions row back to this remediation so
        // `agent-action-result` can cascade the terminal status. Without
        // this, cron-dispatched actions never close out in Ray's timeline.
        const agentActionId = (dispatchData as any)?.action?.id ?? null;
        if (agentActionId) {
          await supabase
            .from("wrayth_remediation_actions")
            .update({ agent_action_id: agentActionId })
            .eq("id", row.id);
        }
      } else if (row.provider === "ms365" || row.provider === "defender") {
        const { error: fErr } = await supabase.functions.invoke("ms-graph-remediate", {
          body: {
            action_type: row.action_type,
            target_id: row.target_id,
            params: row.params ?? {},
            audit_id: row.id,
          },
        });
        if (fErr) throw new Error(fErr.message);
      } else {
        throw new Error(`unknown_provider:${row.provider}`);
      }
      ok = true;
    } catch (e) {
      errMsg = e instanceof Error ? e.message : "dispatch_failed";
    }

    if (ok) {
      // Agent runs async — agent-action-result flips lifecycle_state to
      // completed/failed once the device reports back. MS365 executes
      // inline and ms-graph-remediate updates the audit row directly.
    } else {
      await supabase
        .from("wrayth_remediation_actions")
        .update({ lifecycle_state: "failed", status: "failed", error: errMsg })
        .eq("id", row.id);
    }
    processed.push({ id: row.id, ok, error: errMsg });
  }

  return new Response(JSON.stringify({ ok: true, count: processed.length, processed }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});

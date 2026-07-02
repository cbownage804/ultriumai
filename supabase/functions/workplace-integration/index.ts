// Unified admin endpoint for Workplace Embeds (Teams / Slack).
// Actions: connect_teams (create pending row), connect_slack (return OAuth stub URL),
// disconnect, test_assistant (echo-style stub).
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization") || "" } } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return json({ error: "unauthorized" }, 401);

  const { action, provider, payload } = await req.json().catch(() => ({}));

  try {
    if (action === "connect") {
      if (!["microsoft_teams", "slack"].includes(provider)) return json({ error: "invalid_provider" }, 400);
      const row = {
        user_id: user.id,
        provider,
        status: "pending",
        workspace_name: payload?.workspace_name || null,
        tenant_id: payload?.tenant_id || null,
        installed_by: user.id,
        metadata: { setup_started_at: new Date().toISOString() },
      };
      const { data, error } = await supabase
        .from("workplace_integrations")
        .upsert(row, { onConflict: "user_id,provider" })
        .select()
        .single();
      if (error) throw error;
      await supabase.from("integration_events").insert({
        integration_id: data.id, user_id: user.id, provider,
        event_type: "install_started", actor: user.email || "user", detail: payload || {},
      });

      // Placeholder OAuth URL — real credentials required to go live.
      const oauth_url = provider === "slack"
        ? "https://slack.com/oauth/v2/authorize?client_id=PLACEHOLDER&scope=chat:write,commands,app_mentions:read&user_scope="
        : null;

      return json({ ok: true, integration: data, oauth_url, note: "Placeholder — production OAuth requires Wrayth admin to register the app." });
    }

    if (action === "disconnect") {
      const { data: existing } = await supabase.from("workplace_integrations")
        .select("id").eq("user_id", user.id).eq("provider", provider).maybeSingle();
      if (!existing) return json({ ok: true });
      await supabase.from("workplace_integrations")
        .update({ status: "disconnected", encrypted_tokens: null, last_event_at: new Date().toISOString() })
        .eq("id", existing.id);
      await supabase.from("integration_events").insert({
        integration_id: existing.id, user_id: user.id, provider,
        event_type: "disconnected", actor: user.email || "user", detail: {},
      });
      return json({ ok: true });
    }

    if (action === "mark_connected") {
      // Dev helper — simulates a completed install for testing.
      const { data, error } = await supabase.from("workplace_integrations")
        .update({
          status: "connected",
          workspace_id: payload?.workspace_id || `sim_${crypto.randomUUID().slice(0, 8)}`,
          workspace_name: payload?.workspace_name || "Simulated Workspace",
          tenant_id: payload?.tenant_id || null,
          last_event_at: new Date().toISOString(),
        })
        .eq("user_id", user.id).eq("provider", provider)
        .select().single();
      if (error) throw error;
      await supabase.from("integration_events").insert({
        integration_id: data.id, user_id: user.id, provider,
        event_type: "install_completed", actor: "system", detail: { simulated: true },
      });
      return json({ ok: true, integration: data });
    }

    if (action === "test_assistant") {
      const { data: integration } = await supabase.from("workplace_integrations")
        .select("id, status").eq("user_id", user.id).eq("provider", provider).maybeSingle();
      if (!integration || integration.status !== "connected") {
        return json({ error: "not_connected" }, 400);
      }
      const prompt = (payload?.prompt || "Hello Ray").toString();
      // Log a synthetic inbound + outbound message pair (stub for KB routing).
      const answer = `Ray (stub): I only answer from your approved company knowledge base. You asked: "${prompt.slice(0, 200)}". Full KB routing lands with the bot deployment.`;
      await supabase.from("workplace_messages").insert([
        { integration_id: integration.id, user_id: user.id, provider, direction: "inbound", content: prompt, external_user_name: user.email },
        { integration_id: integration.id, user_id: user.id, provider, direction: "outbound", content: answer, kb_sources: [] },
      ]);
      return json({ ok: true, answer });
    }

    return json({ error: "unknown_action" }, 400);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

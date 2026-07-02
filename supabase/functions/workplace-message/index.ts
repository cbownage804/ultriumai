// Workplace message endpoint: receives Teams/Slack messages, invokes ray-router
// logic, returns provider-native payload (Adaptive Card or Block Kit). Auth is
// a shared bearer token per workplace_integrations row (not a Supabase JWT),
// because callers are Teams/Slack backends, not app users.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { classify, runSkill, validateRayResponse, type SkillRow } from "../ray-router/_lib.ts";
import { toSlackBlocks, toTeamsAdaptiveCard } from "../ray-router/adapters.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-workplace-token, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DEFAULT_APP_BASE = Deno.env.get("WRAYTH_APP_BASE_URL") ?? "https://wrayth.ai";

async function callGemini(system: string, user: string): Promise<string | null> {
  if (!LOVABLE_API_KEY) return null;
  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.choices?.[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

async function llmClassify({ catalog, message }: { catalog: string; message: string }) {
  const raw = await callGemini(
    `Route the message to exactly one Ray skill. Reply JSON {"skill":"<slug>","confidence":0..1}. Skills:\n${catalog}\nDefault to "knowledge".`,
    message,
  );
  if (!raw) return null;
  try {
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const p = JSON.parse(m[0]);
    if (typeof p?.skill !== "string") return null;
    return { skill: p.skill as string, confidence: Number(p.confidence ?? 0.6) };
  } catch {
    return null;
  }
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const started = Date.now();
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const token = req.headers.get("x-workplace-token") ?? "";
  if (!token) return json(401, { error: "missing_token" });

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const integrationId = String(body.integration_id ?? "");
  const provider = String(body.provider ?? "");
  const message = String(body.message ?? "").trim();
  const externalUserId = body.external_user_id ? String(body.external_user_id) : null;
  const externalUserName = body.external_user_name ? String(body.external_user_name) : null;
  const channelId = body.channel_id ? String(body.channel_id) : null;

  if (!integrationId || !message) return json(400, { error: "missing_fields" });
  if (provider !== "microsoft_teams" && provider !== "slack") {
    return json(400, { error: "invalid_provider" });
  }

  // Look up integration and verify shared token
  const { data: integ, error: integErr } = await admin
    .from("workplace_integrations")
    .select("id, user_id, org_id, provider, status, metadata, encrypted_tokens")
    .eq("id", integrationId)
    .eq("provider", provider)
    .maybeSingle();
  if (integErr || !integ) return json(404, { error: "integration_not_found" });
  if (integ.status !== "connected") return json(403, { error: "integration_not_connected" });

  const expected = (integ.encrypted_tokens as Record<string, unknown> | null)?.shared_secret;
  if (!expected || expected !== token) return json(401, { error: "invalid_token" });

  const source = provider === "microsoft_teams" ? "teams" : "slack";
  const appBaseUrl =
    ((integ.metadata as Record<string, unknown> | null)?.app_base_url as string) ??
    DEFAULT_APP_BASE;

  // Log inbound
  await admin.from("workplace_messages").insert({
    integration_id: integ.id,
    user_id: integ.user_id,
    provider,
    external_user_id: externalUserId,
    external_user_name: externalUserName,
    channel_id: channelId,
    direction: "inbound",
    content: message.slice(0, 4000),
  });

  let skillSlug = "unknown";
  let confidence = 0;
  let reasoning = "unknown";

  try {
    const { data: skills = [] } = await admin
      .from("ray_skills")
      .select("slug, name, description, keywords")
      .eq("enabled", true);

    const routed = await classify(message, (skills ?? []) as SkillRow[], { llm: llmClassify });
    skillSlug = routed.slug;
    confidence = routed.confidence;
    reasoning = routed.reasoning;

    const response = await runSkill(routed.slug, message, {
      userId: integ.user_id,
      orgId: integ.org_id ?? null,
      serviceClient: admin,
      llmChat: callGemini,
    });

    const errs = validateRayResponse(response);
    if (errs.length) throw new Error(`invalid_ray_response: ${errs.join(",")}`);

    const payload =
      provider === "microsoft_teams"
        ? { type: "adaptive_card", card: toTeamsAdaptiveCard(response, { appBaseUrl }) }
        : { type: "block_kit", blocks: toSlackBlocks(response, { appBaseUrl }) };

    // Audit skill invocation (source = teams/slack)
    await admin.from("ray_skill_invocations").insert({
      user_id: integ.user_id,
      org_id: integ.org_id ?? null,
      skill_slug: response.skill,
      input_message: message.slice(0, 2000),
      classifier_confidence: confidence,
      response_summary: response.message?.slice(0, 500),
      status: "ok",
      latency_ms: Date.now() - started,
      source,
      metadata: { reasoning, integration_id: integ.id, channel_id: channelId },
    });

    // Log outbound
    await admin.from("workplace_messages").insert({
      integration_id: integ.id,
      user_id: integ.user_id,
      provider,
      external_user_id: externalUserId,
      external_user_name: externalUserName,
      channel_id: channelId,
      direction: "outbound",
      content: response.message?.slice(0, 4000),
      kb_sources: response.sources ?? [],
      metadata: { skill: response.skill },
    });

    return json(200, {
      skill: response.skill,
      classifier: { slug: skillSlug, confidence, reasoning },
      ...payload,
    });
  } catch (e) {
    const err = (e as Error).message?.slice(0, 500) ?? "unknown";
    await admin.from("ray_skill_invocations").insert({
      user_id: integ.user_id,
      org_id: integ.org_id ?? null,
      skill_slug: skillSlug,
      input_message: message.slice(0, 2000),
      classifier_confidence: confidence,
      response_summary: null,
      status: "error",
      error: err,
      latency_ms: Date.now() - started,
      source,
      metadata: { reasoning, integration_id: integ.id },
    });
    return json(500, { error: err });
  }
});

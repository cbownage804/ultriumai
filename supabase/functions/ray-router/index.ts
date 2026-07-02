// Ray Router serve wiring. All business logic lives in _lib.ts.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";
import { classify, runSkill, type SkillRow } from "./_lib.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
  } catch (_e) {
    return null;
  }
}

async function llmClassify({ catalog, message }: { catalog: string; message: string }) {
  const raw = await callGemini(
    `You route a user message to exactly one Ray skill. Reply with a JSON object like {"skill":"<slug>","confidence":0..1}. Skills:\n${catalog}\nIf nothing fits, use "knowledge".`,
    message,
  );
  if (!raw) return null;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (typeof parsed?.skill !== "string") return null;
    return { skill: parsed.skill as string, confidence: Number(parsed.confidence ?? 0.6) };
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const started = Date.now();

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  let userId: string | null = null;
  let orgId: string | null = null;
  let message = "";
  let source = "in_app";
  let slug = "unknown";
  let confidence = 0;
  let reasoning = "unknown";

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userErr } = await admin.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    userId = user.id;

    const body = await req.json();
    message = (body?.message ?? "").toString().trim();
    source = body?.source ?? "in_app";
    const forcedSkill: string | undefined = body?.skill;
    const context = body?.context as
      | { kind?: string; title?: string; body?: string; evidence?: unknown }
      | undefined;
    if (!message) {
      return new Response(JSON.stringify({ error: "empty message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Recommendation-aware follow-ups: prepend a short context header so both
    // the classifier and the invoked skill can see what the user is looking at.
    let messageForSkill = message;
    if (context && (context.title || context.body)) {
      const parts = [
        `[Context: ${context.kind ?? "item"}]`,
        context.title ? `Title: ${context.title}` : "",
        context.body ? `Details: ${context.body}` : "",
      ].filter(Boolean).join("\n");
      messageForSkill = `${parts}\n\nUser question: ${message}`;
    }

    const { data: membership } = await admin
      .from("org_team_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    orgId = membership?.organization_id ?? null;

    const { data: skills = [] } = await admin
      .from("ray_skills")
      .select("slug, name, description, keywords")
      .eq("enabled", true);

    const routed = forcedSkill
      ? { slug: forcedSkill, confidence: 1, reasoning: "forced" }
      : await classify(message, (skills ?? []) as SkillRow[], { llm: llmClassify });
    slug = routed.slug;
    confidence = routed.confidence;
    reasoning = routed.reasoning;

    const response = await runSkill(slug, messageForSkill, {
      userId: user.id,
      orgId,
      serviceClient: admin,
      llmChat: callGemini,
    });

    await admin.from("ray_skill_invocations").insert({
      user_id: user.id,
      org_id: orgId,
      skill_slug: response.skill,
      input_message: message.slice(0, 2000),
      classifier_confidence: confidence,
      response_summary: response.message?.slice(0, 500),
      status: "ok",
      latency_ms: Date.now() - started,
      source,
      metadata: { reasoning },
    });

    return new Response(
      JSON.stringify({ ...response, classifier: { slug, confidence, reasoning } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("ray-router error", e);
    // Best-effort audit of the failure so it shows up in the invocation log
    if (userId) {
      try {
        await admin.from("ray_skill_invocations").insert({
          user_id: userId,
          org_id: orgId,
          skill_slug: slug,
          input_message: message.slice(0, 2000),
          classifier_confidence: confidence,
          response_summary: null,
          status: "error",
          error: (e as Error).message?.slice(0, 500) ?? "unknown",
          latency_ms: Date.now() - started,
          source,
          metadata: { reasoning },
        });
      } catch (_) { /* ignore */ }
    }
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

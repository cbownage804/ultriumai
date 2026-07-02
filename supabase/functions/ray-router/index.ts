// Ray Router — classifies an incoming message, invokes a skill module,
// returns a shared response schema, and logs the invocation.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ---------- Shared response schema ----------
export type RayCard = {
  title?: string;
  body?: string;
  fields?: { label: string; value: string }[];
  severity?: "info" | "success" | "warn" | "danger";
};
export type RayAction = {
  id: string;
  label: string;
  intent: "navigate" | "run_action" | "open_playbook" | "external";
  target: string;
  payload?: Record<string, unknown>;
  risk?: "low" | "medium" | "high";
};
export type RaySource = {
  kind: "kb_org" | "kb_wrayth" | "device" | "identity" | "threat";
  id?: string;
  label: string;
  url?: string;
};
export type RayResponse = {
  skill: string;
  message: string;
  cards?: RayCard[];
  actions?: RayAction[];
  sources?: RaySource[];
  follow_ups?: string[];
  meta?: Record<string, unknown>;
};

// ---------- Classifier ----------
type SkillRow = {
  slug: string;
  name: string;
  description: string;
  keywords: string[];
};

function keywordScore(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) if (t.includes(kw.toLowerCase())) hits++;
  return hits;
}

async function classify(
  message: string,
  skills: SkillRow[],
): Promise<{ slug: string; confidence: number; reasoning: string }> {
  // Deterministic keyword pass first — cheap and predictable
  const scored = skills
    .map((s) => ({ slug: s.slug, score: keywordScore(message, s.keywords) }))
    .sort((a, b) => b.score - a.score);
  if (scored[0]?.score >= 2) {
    return { slug: scored[0].slug, confidence: 0.9, reasoning: "keyword" };
  }

  // LLM fallback
  try {
    const catalog = skills
      .map((s) => `- ${s.slug}: ${s.description}`)
      .join("\n");
    const res = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": LOVABLE_API_KEY,
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                `You route a user message to exactly one Ray skill. Reply with a JSON object like {"skill":"<slug>","confidence":0..1}. Skills:\n${catalog}\nIf nothing fits, use "knowledge".`,
            },
            { role: "user", content: message },
          ],
          response_format: { type: "json_object" },
        }),
      },
    );
    if (res.ok) {
      const j = await res.json();
      const raw = j.choices?.[0]?.message?.content ?? "{}";
      const parsed = JSON.parse(raw);
      if (skills.find((s) => s.slug === parsed.skill)) {
        return {
          slug: parsed.skill,
          confidence: Number(parsed.confidence ?? 0.6),
          reasoning: "llm",
        };
      }
    }
  } catch (e) {
    console.warn("classify llm failed", e);
  }
  return { slug: "knowledge", confidence: 0.3, reasoning: "fallback" };
}

// ---------- Skill: Threat ----------
async function skillThreat(
  message: string,
  _ctx: SkillContext,
): Promise<RayResponse> {
  const urls = message.match(/https?:\/\/[^\s)]+/gi) ?? [];
  const emails = message.match(/[\w.+-]+@[\w-]+\.[\w.-]+/gi) ?? [];
  const suspiciousTlds = [".zip", ".mov", ".xyz", ".top", ".ru", ".click"];
  const flagged = urls.filter((u) =>
    suspiciousTlds.some((t) => u.toLowerCase().includes(t))
  );

  const cards: RayCard[] = [];
  if (urls.length || emails.length) {
    cards.push({
      title: "What I inspected",
      fields: [
        { label: "Links found", value: String(urls.length) },
        { label: "Emails found", value: String(emails.length) },
        { label: "Suspicious TLDs", value: String(flagged.length) },
      ],
      severity: flagged.length ? "warn" : "info",
    });
  }

  const verdict = flagged.length
    ? "This message contains links with commonly abused TLDs. Treat as suspicious until verified."
    : urls.length || emails.length
    ? "Nothing obviously malicious in the surface indicators, but that alone doesn't clear an email. Run full header analysis."
    : "Paste the sender, headers, or the link you want me to check.";

  return {
    skill: "threat",
    message: verdict,
    cards,
    actions: [
      {
        id: "open_threat",
        label: "Open Threat Center",
        intent: "navigate",
        target: "/app/threats",
      },
      {
        id: "start_incident",
        label: "Start Phishing Playbook",
        intent: "open_playbook",
        target: "phishing_response",
        risk: "medium",
      },
    ],
    follow_ups: [
      "Analyze full email headers",
      "Check if any of my monitored addresses got this",
    ],
    sources: [{ kind: "threat", label: "Wrayth Threat Center" }],
  };
}

// ---------- Skill: Device ----------
async function skillDevice(
  message: string,
  ctx: SkillContext,
): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const lower = message.toLowerCase();
  const { data: devices = [] } = await supabase
    .from("wrayth_devices")
    .select("id, hostname, last_seen_at, posture, user_id")
    .eq("user_id", ctx.userId)
    .order("last_seen_at", { ascending: false })
    .limit(200);

  const list = devices ?? [];
  let subset = list;
  let heading = `${list.length} enrolled devices`;

  if (lower.includes("bitlocker")) {
    subset = list.filter((d: any) => {
      const p = d.posture ?? {};
      return p.bitlocker_enabled === false;
    });
    heading = `${subset.length} device(s) missing BitLocker`;
  } else if (lower.includes("rdp")) {
    subset = list.filter((d: any) => d.posture?.rdp?.enabled === true);
    heading = `${subset.length} device(s) with RDP enabled`;
  } else if (lower.includes("local admin") || lower.includes("admin")) {
    subset = list.filter((d: any) =>
      (d.posture?.local_admins?.count ?? 0) > 1
    );
    heading = `${subset.length} device(s) with multiple local admins`;
  } else if (lower.includes("update") || lower.includes("patch")) {
    subset = list.filter((d: any) =>
      (d.posture?.updates?.pending_security ?? 0) > 0
    );
    heading = `${subset.length} device(s) with pending security updates`;
  }

  const rows = subset.slice(0, 15).map((d: any) => ({
    label: d.hostname ?? d.id.slice(0, 8),
    value: d.last_seen_at
      ? new Date(d.last_seen_at).toLocaleString()
      : "never",
  }));

  return {
    skill: "device",
    message: subset.length
      ? `Here's what I see across your fleet.`
      : `Nothing matched that query in your fleet.`,
    cards: [{ title: heading, fields: rows, severity: subset.length ? "warn" : "success" }],
    actions: [
      {
        id: "open_devices",
        label: "Open Device Dashboard",
        intent: "navigate",
        target: "/app/agents",
      },
    ],
    follow_ups: [
      "Show devices with RDP enabled",
      "Which devices are missing updates?",
      "Who has local admin?",
    ],
    sources: [{ kind: "device", label: "Wrayth Device Agent" }],
    meta: { matched: subset.length, total: list.length },
  };
}

// ---------- Skill: Identity ----------
async function skillIdentity(
  message: string,
  ctx: SkillContext,
): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const [{ data: vault }, { data: score }, { data: breaches }] =
    await Promise.all([
      supabase
        .from("password_entries")
        .select("password_strength, is_compromised")
        .eq("user_id", ctx.userId),
      supabase
        .from("ray_security_scores")
        .select("score, updated_at")
        .eq("user_id", ctx.userId)
        .order("updated_at", { ascending: false })
        .limit(2),
      supabase
        .from("dark_web_monitors")
        .select("id, target, last_breach_at")
        .eq("user_id", ctx.userId)
        .limit(20),
    ]);

  const weak = (vault ?? []).filter((v: any) =>
    v.password_strength === "weak"
  ).length;
  const compromised = (vault ?? []).filter((v: any) =>
    v.is_compromised
  ).length;
  const current = score?.[0]?.score ?? null;
  const prev = score?.[1]?.score ?? null;
  const delta = current != null && prev != null ? current - prev : null;

  const cards: RayCard[] = [
    {
      title: "Identity posture",
      fields: [
        { label: "Vault size", value: String((vault ?? []).length) },
        { label: "Weak passwords", value: String(weak) },
        { label: "Compromised", value: String(compromised) },
        {
          label: "Security score",
          value: current != null ? String(current) : "n/a",
        },
      ],
      severity: compromised > 0 || weak > 3 ? "warn" : "success",
    },
  ];

  const parts: string[] = [];
  if (delta != null && delta !== 0) {
    parts.push(
      `Your score moved from ${prev} to ${current} (${
        delta > 0 ? "+" : ""
      }${delta}).`,
    );
  } else if (current != null) {
    parts.push(`Your current security score is ${current}.`);
  }
  if (compromised > 0) parts.push(`${compromised} vault entries appear in breaches.`);
  if (weak > 0) parts.push(`${weak} passwords are rated weak.`);
  if ((breaches ?? []).length) {
    parts.push(`I'm monitoring ${breaches!.length} identity targets on the dark web.`);
  }
  if (!parts.length) parts.push("Everything I can see looks clean.");

  return {
    skill: "identity",
    message: parts.join(" "),
    cards,
    actions: [
      {
        id: "open_vault",
        label: "Open Password Health",
        intent: "navigate",
        target: "/app/safepass",
      },
      {
        id: "open_breach",
        label: "Review Breach Exposure",
        intent: "navigate",
        target: "/app/breach-monitor",
      },
    ],
    follow_ups: [
      "Which of my passwords are reused?",
      "Show my latest breach alerts",
    ],
    sources: [{ kind: "identity", label: "SafePass + Breach Monitor" }],
  };
}

// ---------- Skill: Knowledge ----------
async function skillKnowledge(
  message: string,
  ctx: SkillContext,
): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const q = message.replace(/[^\w\s]/g, " ").trim().slice(0, 200);
  const tsq = q.split(/\s+/).filter(Boolean).join(" & ");

  // 1) prefer org-scoped KB
  let orgHits: any[] = [];
  if (ctx.orgId && tsq) {
    const { data } = await supabase
      .from("wrayth_kb")
      .select("id, title, content, category")
      .eq("org_id", ctx.orgId)
      .eq("published", true)
      .textSearch("title", tsq, { type: "websearch", config: "english" })
      .limit(3);
    orgHits = data ?? [];
    if (orgHits.length === 0) {
      const { data: alt } = await supabase
        .from("wrayth_kb")
        .select("id, title, content, category")
        .eq("org_id", ctx.orgId)
        .eq("published", true)
        .ilike("content", `%${q.split(/\s+/)[0] ?? ""}%`)
        .limit(3);
      orgHits = alt ?? [];
    }
  }

  // 2) Wrayth-wide knowledge_base_articles as fallback
  let genericHits: any[] = [];
  if (orgHits.length === 0 && q) {
    const { data } = await supabase
      .from("knowledge_base_articles")
      .select("id, title, content")
      .ilike("title", `%${q.split(/\s+/)[0] ?? ""}%`)
      .limit(3);
    genericHits = data ?? [];
  }

  const chosen = orgHits.length ? orgHits : genericHits;
  const sources: RaySource[] = chosen.map((h) => ({
    kind: orgHits.length ? "kb_org" : "kb_wrayth",
    id: h.id,
    label: h.title,
  }));

  // Compose a grounded answer via LLM using only chosen snippets
  let answer =
    "I couldn't find a matching article in your knowledge base yet. Add one under Knowledge → Articles and I'll use it here.";
  if (chosen.length) {
    try {
      const context = chosen
        .map((h, i) =>
          `[[${i + 1}]] ${h.title}\n${(h.content ?? "").slice(0, 1200)}`
        )
        .join("\n\n");
      const res = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": LOVABLE_API_KEY,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content:
                  "You are Ray, answering only from the provided knowledge snippets. Cite as [1], [2]. If the snippets don't answer, say so.",
              },
              {
                role: "user",
                content: `Question: ${message}\n\nSnippets:\n${context}`,
              },
            ],
          }),
        },
      );
      if (res.ok) {
        const j = await res.json();
        answer = j.choices?.[0]?.message?.content ?? answer;
      }
    } catch (e) {
      console.warn("kb llm failed", e);
    }
  }

  return {
    skill: "knowledge",
    message: answer,
    sources,
    actions: chosen.length
      ? []
      : [
        {
          id: "open_kb",
          label: "Manage Knowledge Base",
          intent: "navigate",
          target: "/app/knowledge",
        },
      ],
    follow_ups: chosen.length
      ? ["Show me the full article", "Any related policies?"]
      : ["How do I add a company KB article?"],
  };
}

// ---------- Router ----------
type SkillContext = {
  userId: string;
  orgId: string | null;
  serviceClient: ReturnType<typeof createClient>;
};

const SKILL_HANDLERS: Record<
  string,
  (message: string, ctx: SkillContext) => Promise<RayResponse>
> = {
  threat: skillThreat,
  device: skillDevice,
  identity: skillIdentity,
  knowledge: skillKnowledge,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const started = Date.now();
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const {
      data: { user },
      error: userErr,
    } = await admin.auth.getUser(jwt);
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const message: string = (body?.message ?? "").toString().trim();
    const source: string = body?.source ?? "in_app";
    const forcedSkill: string | undefined = body?.skill;
    if (!message) {
      return new Response(JSON.stringify({ error: "empty message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve org membership
    const { data: membership } = await admin
      .from("org_team_members")
      .select("organization_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    const orgId = membership?.organization_id ?? null;

    // Load enabled skills
    const { data: skills = [] } = await admin
      .from("ray_skills")
      .select("slug, name, description, keywords")
      .eq("enabled", true);

    const { slug, confidence, reasoning } = forcedSkill
      ? { slug: forcedSkill, confidence: 1, reasoning: "forced" }
      : await classify(message, skills ?? []);

    const handler = SKILL_HANDLERS[slug] ?? SKILL_HANDLERS.knowledge;
    const response = await handler(message, {
      userId: user.id,
      orgId,
      serviceClient: admin,
    });

    // Audit
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
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("ray-router error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "unknown" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

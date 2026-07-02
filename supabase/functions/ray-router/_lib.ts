// Pure library for the Ray router: types, classifier, skill handlers.
// Kept free of Deno.serve() so it can be imported by tests.

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

export const RESPONSE_KEYS = [
  "skill",
  "message",
  "cards",
  "actions",
  "sources",
  "follow_ups",
  "meta",
] as const;

/** Validate that a value conforms to the shared RayResponse schema. Returns
 *  a list of validation errors (empty when valid). */
export function validateRayResponse(r: unknown): string[] {
  const errs: string[] = [];
  if (!r || typeof r !== "object") return ["not an object"];
  const obj = r as Record<string, unknown>;
  if (typeof obj.skill !== "string" || !obj.skill) errs.push("missing skill");
  if (typeof obj.message !== "string") errs.push("missing message");
  if (obj.cards !== undefined && !Array.isArray(obj.cards)) errs.push("cards must be array");
  if (obj.actions !== undefined && !Array.isArray(obj.actions)) errs.push("actions must be array");
  if (obj.sources !== undefined && !Array.isArray(obj.sources)) errs.push("sources must be array");
  if (obj.follow_ups !== undefined && !Array.isArray(obj.follow_ups)) errs.push("follow_ups must be array");
  for (const a of (obj.actions as RayAction[] | undefined) ?? []) {
    if (!a?.id || !a?.label || !a?.intent || !a?.target) errs.push("action missing required fields");
  }
  return errs;
}

// ---------- Classifier ----------
export type SkillRow = {
  slug: string;
  name?: string;
  description: string;
  keywords: string[];
};

export function keywordScore(text: string, keywords: string[]): number {
  const t = text.toLowerCase();
  let hits = 0;
  for (const kw of keywords) if (t.includes(kw.toLowerCase())) hits++;
  return hits;
}

export type ClassifyDeps = {
  llm?: (prompt: { catalog: string; message: string }) => Promise<{ skill: string; confidence: number } | null>;
};

export async function classify(
  message: string,
  skills: SkillRow[],
  deps: ClassifyDeps = {},
): Promise<{ slug: string; confidence: number; reasoning: string }> {
  const scored = skills
    .map((s) => ({ slug: s.slug, score: keywordScore(message, s.keywords) }))
    .sort((a, b) => b.score - a.score);
  if (scored[0]?.score >= 2) {
    return { slug: scored[0].slug, confidence: 0.9, reasoning: "keyword" };
  }
  if (scored[0]?.score === 1) {
    // Single keyword hit is a soft signal — still confident enough to skip LLM
    return { slug: scored[0].slug, confidence: 0.6, reasoning: "keyword_soft" };
  }
  if (deps.llm) {
    try {
      const catalog = skills.map((s) => `- ${s.slug}: ${s.description}`).join("\n");
      const out = await deps.llm({ catalog, message });
      if (out && skills.find((s) => s.slug === out.skill)) {
        return { slug: out.skill, confidence: Number(out.confidence ?? 0.6), reasoning: "llm" };
      }
    } catch (_e) { /* fall through */ }
  }
  return { slug: "knowledge", confidence: 0.3, reasoning: "fallback" };
}

// ---------- Skill context ----------
// The serviceClient must be a supabase-js compatible client. We keep it
// as `any` so tests can inject a lightweight fake.
export type SkillContext = {
  userId: string;
  orgId: string | null;
  serviceClient: any;
  llmChat?: (system: string, user: string) => Promise<string | null>;
};

// ---------- Skill: Threat ----------
const SUSPICIOUS_TLDS = [".zip", ".mov", ".xyz", ".top", ".ru", ".click", ".gq", ".tk"];

export async function skillThreat(message: string, _ctx: SkillContext): Promise<RayResponse> {
  const urls = message.match(/https?:\/\/[^\s)]+/gi) ?? [];
  const emails = message.match(/[\w.+-]+@[\w-]+\.[\w.-]+/gi) ?? [];
  const flagged = urls.filter((u) => SUSPICIOUS_TLDS.some((t) => u.toLowerCase().includes(t)));

  // Never claim a verdict without evidence
  if (urls.length === 0 && emails.length === 0) {
    return {
      skill: "threat",
      message:
        "I need something concrete to inspect. Paste the sender address, a suspicious link, or the full email headers and I'll analyze them.",
      actions: [{ id: "open_threat", label: "Open Threat Center", intent: "navigate", target: "/app/threats" }],
      follow_ups: ["I'll paste headers", "Analyze this link: https://..."],
      sources: [{ kind: "threat", label: "Wrayth Threat Center" }],
      meta: { verdict: "insufficient_evidence" },
    };
  }

  const cards: RayCard[] = [
    {
      title: "What I inspected",
      fields: [
        { label: "Links found", value: String(urls.length) },
        { label: "Emails found", value: String(emails.length) },
        { label: "Suspicious TLDs", value: String(flagged.length) },
      ],
      severity: flagged.length ? "warn" : "info",
    },
  ];

  const verdict = flagged.length
    ? "One or more links use TLDs commonly abused in phishing. Treat this as suspicious until the sender is verified through a trusted channel."
    : "Surface indicators are unremarkable, but this is not a full verdict — headers, DKIM/SPF/DMARC, and attachment analysis still need to run before I can clear it.";

  return {
    skill: "threat",
    message: verdict,
    cards,
    actions: [{ id: "open_threat", label: "Open Threat Center", intent: "navigate", target: "/app/threats" }],
    follow_ups: ["Analyze full email headers", "Check if any of my monitored addresses got this"],
    sources: [{ kind: "threat", label: "Wrayth Threat Center" }],
    meta: { verdict: flagged.length ? "suspicious" : "inconclusive", flagged_urls: flagged.length },
  };
}

// ---------- Skill: Device ----------
export async function skillDevice(message: string, ctx: SkillContext): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const lower = message.toLowerCase();

  const { data: devicesRaw } = await supabase
    .from("wrayth_devices")
    .select("id, hostname, last_seen_at, revoked_at")
    .eq("user_id", ctx.userId)
    .is("revoked_at", null)
    .order("last_seen_at", { ascending: false })
    .limit(200);

  const devices: Array<{ id: string; hostname: string | null; last_seen_at: string | null }> = devicesRaw ?? [];

  if (devices.length === 0) {
    return {
      skill: "device",
      message:
        "You don't have any enrolled devices yet. Install the Wrayth agent on a machine and it will appear here.",
      actions: [{ id: "enroll", label: "Enroll a device", intent: "navigate", target: "/app/agents" }],
      follow_ups: ["How do I install the agent?"],
      sources: [{ kind: "device", label: "Wrayth Device Agent" }],
      meta: { total: 0 },
    };
  }

  // Pull latest posture per device
  const { data: postureRaw } = await supabase
    .from("wrayth_device_posture")
    .select("device_id, payload, findings, captured_at")
    .eq("user_id", ctx.userId)
    .in("device_id", devices.map((d) => d.id));
  const postureByDevice = new Map<string, any>();
  for (const p of postureRaw ?? []) postureByDevice.set(p.device_id, p.payload ?? {});

  const enriched = devices.map((d) => ({ ...d, posture: postureByDevice.get(d.id) ?? {} }));

  let subset = enriched;
  let heading = `${enriched.length} enrolled device${enriched.length === 1 ? "" : "s"}`;
  let filterApplied = false;

  if (lower.includes("bitlocker")) {
    subset = enriched.filter((d) => d.posture?.bitlocker_enabled === false);
    heading = `${subset.length} device(s) missing BitLocker`;
    filterApplied = true;
  } else if (lower.includes("rdp")) {
    subset = enriched.filter((d) => d.posture?.rdp?.enabled === true);
    heading = `${subset.length} device(s) with RDP enabled`;
    filterApplied = true;
  } else if (lower.includes("local admin") || lower.match(/\badmin(s)?\b/)) {
    subset = enriched.filter((d) => (d.posture?.local_admins?.count ?? 0) > 1);
    heading = `${subset.length} device(s) with more than one local admin`;
    filterApplied = true;
  } else if (lower.includes("update") || lower.includes("patch")) {
    subset = enriched.filter((d) => (d.posture?.updates?.pending_security ?? 0) > 0);
    heading = `${subset.length} device(s) with pending security updates`;
    filterApplied = true;
  }

  const anyPostureAvailable = postureByDevice.size > 0;
  const message = !filterApplied
    ? `You have ${enriched.length} enrolled device${enriched.length === 1 ? "" : "s"}. Ask me about BitLocker, RDP, local admins, or pending updates for a focused view.`
    : subset.length === 0
    ? filterApplied && !anyPostureAvailable
      ? "None of your devices have reported posture yet — the agent is enrolled but hasn't sent a first check-in."
      : "Nothing matched that filter — that's a good sign."
    : "Here's what I see across your fleet.";

  const rows = subset.slice(0, 15).map((d) => ({
    label: d.hostname ?? d.id.slice(0, 8),
    value: d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : "never",
  }));

  return {
    skill: "device",
    message,
    cards: [{
      title: heading,
      fields: rows,
      severity: subset.length && filterApplied ? "warn" : "success",
    }],
    actions: [{ id: "open_devices", label: "Open Device Dashboard", intent: "navigate", target: "/app/agents" }],
    follow_ups: ["Show devices with RDP enabled", "Which devices are missing updates?", "Who has local admin?"],
    sources: [{ kind: "device", label: "Wrayth Device Agent" }],
    meta: { matched: subset.length, total: enriched.length, posture_available: anyPostureAvailable },
  };
}

// ---------- Skill: Identity ----------
// Only reads metadata columns (strength_score, breach counts). Never touches
// password_encrypted or any other ciphertext — nothing here can be leaked
// even if a vault is locked on the client.
export async function skillIdentity(_message: string, ctx: SkillContext): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const [vaultRes, scoreRes, breachRes] = await Promise.all([
    supabase.from("password_entries").select("strength_score").eq("user_id", ctx.userId),
    supabase
      .from("ray_security_scores")
      .select("score, created_at")
      .eq("user_id", ctx.userId)
      .order("created_at", { ascending: false })
      .limit(2),
    supabase
      .from("dark_web_monitors")
      .select("id, email, domain, breach_count, latest_breach, is_active")
      .eq("user_id", ctx.userId)
      .limit(50),
  ]);

  const vault = (vaultRes.data ?? []) as Array<{ strength_score: number | null }>;
  const scores = (scoreRes.data ?? []) as Array<{ score: number; created_at: string }>;
  const breaches = (breachRes.data ?? []) as Array<{ breach_count: number | null; is_active: boolean }>;

  const weak = vault.filter((v) => (v.strength_score ?? 100) < 50).length;
  const totalBreachHits = breaches.reduce((s, b) => s + (b.breach_count ?? 0), 0);
  const activeMonitors = breaches.filter((b) => b.is_active).length;
  const current = scores[0]?.score ?? null;
  const prev = scores[1]?.score ?? null;
  const delta = current != null && prev != null ? current - prev : null;

  const cards: RayCard[] = [{
    title: "Identity posture",
    fields: [
      { label: "Vault entries", value: String(vault.length) },
      { label: "Weak passwords", value: String(weak) },
      { label: "Breach hits", value: String(totalBreachHits) },
      { label: "Security score", value: current != null ? String(current) : "not scored yet" },
    ],
    severity: totalBreachHits > 0 || weak > 3 ? "warn" : "success",
  }];

  const parts: string[] = [];
  if (delta != null && delta !== 0) {
    parts.push(`Your score moved from ${prev} to ${current} (${delta > 0 ? "+" : ""}${delta}).`);
  } else if (current != null) {
    parts.push(`Your current security score is ${current}.`);
  } else {
    parts.push("I don't have a security score yet — check in once your first scan completes.");
  }
  if (totalBreachHits > 0) parts.push(`Monitored identities have ${totalBreachHits} known breach hits across ${activeMonitors} active watches.`);
  if (weak > 0) parts.push(`${weak} vault entries have a weak strength score.`);
  if (vault.length === 0 && breaches.length === 0 && current == null) {
    parts.length = 0;
    parts.push("There's no identity data linked to your account yet. Add passwords to your vault or start a breach watch and I can answer this properly.");
  }

  return {
    skill: "identity",
    message: parts.join(" "),
    cards,
    actions: [
      { id: "open_vault", label: "Open Password Health", intent: "navigate", target: "/app/safepass" },
      { id: "open_breach", label: "Review Breach Exposure", intent: "navigate", target: "/app/breach-monitor" },
    ],
    follow_ups: ["Which of my passwords are reused?", "Show my latest breach alerts"],
    sources: [{ kind: "identity", label: "SafePass + Breach Monitor" }],
    meta: { vault_total: vault.length, weak, breach_hits: totalBreachHits, has_score: current != null },
  };
}

// ---------- Skill: Knowledge ----------
export async function skillKnowledge(message: string, ctx: SkillContext): Promise<RayResponse> {
  const supabase = ctx.serviceClient;
  const q = message.replace(/[^\w\s]/g, " ").trim().slice(0, 200);
  const firstWord = q.split(/\s+/)[0] ?? "";
  const tsq = q.split(/\s+/).filter(Boolean).join(" & ");

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
    if (orgHits.length === 0 && firstWord) {
      const { data: alt } = await supabase
        .from("wrayth_kb")
        .select("id, title, content, category")
        .eq("org_id", ctx.orgId)
        .eq("published", true)
        .ilike("content", `%${firstWord}%`)
        .limit(3);
      orgHits = alt ?? [];
    }
  }

  let genericHits: any[] = [];
  if (orgHits.length === 0 && firstWord) {
    const { data } = await supabase
      .from("knowledge_base_articles")
      .select("id, title, content, is_public, status")
      .eq("is_public", true)
      .ilike("title", `%${firstWord}%`)
      .limit(3);
    genericHits = (data ?? []).filter((r: any) => !r.status || r.status === "published");
  }

  const chosen = orgHits.length ? orgHits : genericHits;
  const kind: RaySource["kind"] = orgHits.length ? "kb_org" : "kb_wrayth";
  const sources: RaySource[] = chosen.map((h) => ({ kind, id: h.id, label: h.title }));

  let answer =
    "I couldn't find a matching article in your knowledge base yet. Add one under Knowledge → Articles and I'll answer from it.";

  if (chosen.length && ctx.llmChat) {
    try {
      const context = chosen
        .map((h, i) => `[[${i + 1}]] ${h.title}\n${(h.content ?? "").slice(0, 1200)}`)
        .join("\n\n");
      const system =
        "You are Ray. Answer ONLY from the provided knowledge snippets. Cite them inline as [1], [2]. If the snippets do not answer the question, say so plainly. Never invent facts.";
      const user = `Question: ${message}\n\nSnippets:\n${context}`;
      const reply = await ctx.llmChat(system, user);
      if (reply && reply.trim()) answer = reply;
    } catch (_e) { /* keep default */ }
  } else if (chosen.length) {
    // No LLM available — surface the top snippet directly so we're still grounded.
    const top = chosen[0];
    answer = `From your knowledge base: **${top.title}** [1]\n\n${(top.content ?? "").slice(0, 600)}`;
  }

  return {
    skill: "knowledge",
    message: answer,
    sources,
    actions: chosen.length
      ? [{ id: "open_kb", label: "Open article", intent: "navigate", target: "/app/knowledge" }]
      : [{ id: "open_kb", label: "Manage Knowledge Base", intent: "navigate", target: "/app/knowledge" }],
    follow_ups: chosen.length
      ? ["Show me the full article", "Any related policies?"]
      : ["How do I add a company KB article?"],
    meta: { hits: chosen.length, source: kind },
  };
}

// ---------- Dispatcher ----------
export const SKILL_HANDLERS: Record<string, (m: string, c: SkillContext) => Promise<RayResponse>> = {
  threat: skillThreat,
  device: skillDevice,
  identity: skillIdentity,
  knowledge: skillKnowledge,
};

export async function runSkill(slug: string, message: string, ctx: SkillContext): Promise<RayResponse> {
  const handler = SKILL_HANDLERS[slug] ?? SKILL_HANDLERS.knowledge;
  const resp = await handler(message, ctx);
  // Enforce schema at the boundary
  const errs = validateRayResponse(resp);
  if (errs.length) {
    return {
      skill: slug,
      message: "I couldn't format a proper answer for that.",
      meta: { schema_errors: errs },
    };
  }
  return resp;
}

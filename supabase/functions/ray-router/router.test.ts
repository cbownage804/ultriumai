// Smoke tests for the Ray router library: classifier routing per skill,
// happy-path per skill, and shared response schema enforcement.
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classify,
  keywordScore,
  runSkill,
  skillDevice,
  skillIdentity,
  skillKnowledge,
  skillThreat,
  validateRayResponse,
  type SkillRow,
} from "./_lib.ts";

const SKILLS: SkillRow[] = [
  { slug: "threat",    description: "phishing/email/link analysis",  keywords: ["phishing","email","link","safe","suspicious","headers"] },
  { slug: "device",    description: "device posture",                keywords: ["device","bitlocker","rdp","admin","update","patch","laptop"] },
  { slug: "identity",  description: "score, breach, passwords, mfa", keywords: ["score","breach","password","mfa","weak","reused"] },
  { slug: "knowledge", description: "company KB / how do I",         keywords: ["how do i","install","policy","vpn","kb","article"] },
];

// ---------- Fake Supabase query builder ----------
type Table = Record<string, any[]>;
function makeFakeClient(tables: Table) {
  function query(name: string) {
    let rows = [...(tables[name] ?? [])];
    const api: any = {
      select: () => api,
      eq: (col: string, val: any) => { rows = rows.filter((r) => r[col] === val); return api; },
      in: (col: string, vals: any[]) => { rows = rows.filter((r) => vals.includes(r[col])); return api; },
      is: (col: string, val: any) => { rows = rows.filter((r) => (val === null ? r[col] == null : r[col] === val)); return api; },
      order: () => api,
      limit: (n: number) => { rows = rows.slice(0, n); return api; },
      ilike: (col: string, pat: string) => {
        const needle = pat.replace(/%/g, "").toLowerCase();
        rows = rows.filter((r) => String(r[col] ?? "").toLowerCase().includes(needle));
        return api;
      },
      textSearch: (col: string, q: string) => {
        const needle = q.split(/\s*&\s*/)[0]?.toLowerCase() ?? "";
        rows = rows.filter((r) => String(r[col] ?? "").toLowerCase().includes(needle));
        return api;
      },
      maybeSingle: async () => ({ data: rows[0] ?? null, error: null }),
      then: (resolve: any) => resolve({ data: rows, error: null }),
    };
    return api;
  }
  return { from: (name: string) => query(name) };
}

// ================== Classifier ==================

Deno.test("classifier: keyword hit routes to threat", async () => {
  const r = await classify("Is this email safe? phishing link inside", SKILLS);
  assertEquals(r.slug, "threat");
  assert(r.confidence >= 0.6);
});

Deno.test("classifier: device keywords route to device", async () => {
  const r = await classify("Which devices are missing BitLocker?", SKILLS);
  assertEquals(r.slug, "device");
});

Deno.test("classifier: identity keywords route to identity", async () => {
  const r = await classify("Why did my security score drop after that breach?", SKILLS);
  assertEquals(r.slug, "identity");
});

Deno.test("classifier: knowledge keywords route to knowledge", async () => {
  const r = await classify("How do I install the VPN?", SKILLS);
  assertEquals(r.slug, "knowledge");
});

Deno.test("classifier: no signal falls back to knowledge", async () => {
  const r = await classify("hello there", SKILLS);
  assertEquals(r.slug, "knowledge");
  assertEquals(r.reasoning, "fallback");
});

Deno.test("classifier: LLM is consulted only when keyword score is zero", async () => {
  let called = 0;
  await classify("hello there", SKILLS, {
    llm: async () => { called++; return { skill: "threat", confidence: 0.7 }; },
  });
  assertEquals(called, 1);
  called = 0;
  await classify("bitlocker rdp update", SKILLS, {
    llm: async () => { called++; return { skill: "threat", confidence: 0.7 }; },
  });
  assertEquals(called, 0); // keyword path wins, LLM never called
});

Deno.test("keywordScore counts case-insensitively", () => {
  assertEquals(keywordScore("Update the PATCH now", ["update", "patch"]), 2);
  assertEquals(keywordScore("nothing here", ["update"]), 0);
});

// ================== Threat skill ==================

Deno.test("threat: no urls/emails → refuses to give a verdict", async () => {
  const r = await skillThreat("I got a weird message today", { userId: "u", orgId: null, serviceClient: null });
  assertEquals(validateRayResponse(r), []);
  assertEquals((r.meta as any).verdict, "insufficient_evidence");
  assertStringIncludes(r.message.toLowerCase(), "concrete");
});

Deno.test("threat: suspicious TLD → suspicious verdict, warn severity", async () => {
  const r = await skillThreat("Check https://login-security.zip/reset please", { userId: "u", orgId: null, serviceClient: null });
  assertEquals((r.meta as any).verdict, "suspicious");
  assertEquals(r.cards?.[0].severity, "warn");
});

Deno.test("threat: benign-looking url → inconclusive, never claims safe", async () => {
  const r = await skillThreat("Is https://example.com safe?", { userId: "u", orgId: null, serviceClient: null });
  assertEquals((r.meta as any).verdict, "inconclusive");
  // Must not claim it is safe
  assert(!/\bsafe\b/i.test(r.message) || /not a full verdict|verified/i.test(r.message));
});

// ================== Device skill ==================

Deno.test("device: empty state when no devices enrolled", async () => {
  const fake = makeFakeClient({ wrayth_devices: [], wrayth_device_posture: [] });
  const r = await skillDevice("Which devices are missing bitlocker?", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals(validateRayResponse(r), []);
  assertEquals((r.meta as any).total, 0);
  assertStringIncludes(r.message.toLowerCase(), "don't have any enrolled devices");
});

Deno.test("device: bitlocker filter matches posture payload", async () => {
  const fake = makeFakeClient({
    wrayth_devices: [
      { id: "d1", user_id: "u1", hostname: "PC-01", last_seen_at: new Date().toISOString(), revoked_at: null },
      { id: "d2", user_id: "u1", hostname: "PC-02", last_seen_at: new Date().toISOString(), revoked_at: null },
    ],
    wrayth_device_posture: [
      { device_id: "d1", user_id: "u1", payload: { bitlocker_enabled: false }, findings: [], captured_at: "" },
      { device_id: "d2", user_id: "u1", payload: { bitlocker_enabled: true }, findings: [], captured_at: "" },
    ],
  });
  const r = await skillDevice("which devices are missing bitlocker", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals((r.meta as any).matched, 1);
  assertEquals((r.meta as any).total, 2);
  assert(r.cards?.[0].fields?.some((f) => f.value.includes("PC-01") || f.label === "PC-01"));
});

Deno.test("device: does not leak another user's devices", async () => {
  const fake = makeFakeClient({
    wrayth_devices: [
      { id: "d1", user_id: "u1", hostname: "Mine", last_seen_at: "", revoked_at: null },
      { id: "d2", user_id: "u2", hostname: "SomeoneElse", last_seen_at: "", revoked_at: null },
    ],
    wrayth_device_posture: [],
  });
  const r = await skillDevice("show my devices", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals((r.meta as any).total, 1);
});

// ================== Identity skill ==================

Deno.test("identity: empty state when nothing is linked", async () => {
  const fake = makeFakeClient({ password_entries: [], ray_security_scores: [], dark_web_monitors: [] });
  const r = await skillIdentity("why did my score drop", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals(validateRayResponse(r), []);
  assertEquals((r.meta as any).vault_total, 0);
  assertEquals((r.meta as any).has_score, false);
});

Deno.test("identity: only exposes metadata columns (no ciphertext)", async () => {
  const fake = makeFakeClient({
    password_entries: [
      { user_id: "u1", strength_score: 20, password_encrypted: "SHOULD_NEVER_APPEAR" },
      { user_id: "u1", strength_score: 90, password_encrypted: "ALSO_SECRET" },
    ],
    ray_security_scores: [{ user_id: "u1", score: 82, created_at: new Date().toISOString() }],
    dark_web_monitors: [{ user_id: "u1", email: "a@b.com", breach_count: 2, is_active: true }],
  });
  const r = await skillIdentity("posture check", { userId: "u1", orgId: null, serviceClient: fake });
  const serialized = JSON.stringify(r);
  assert(!serialized.includes("SHOULD_NEVER_APPEAR"));
  assert(!serialized.includes("ALSO_SECRET"));
  assertEquals((r.meta as any).weak, 1);
  assertEquals((r.meta as any).breach_hits, 2);
});

// ================== Knowledge skill ==================

Deno.test("knowledge: empty state → tells user to add articles", async () => {
  const fake = makeFakeClient({ wrayth_kb: [], knowledge_base_articles: [] });
  const r = await skillKnowledge("how do i submit expenses", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals(validateRayResponse(r), []);
  assertEquals((r.meta as any).hits, 0);
  assert(r.sources?.length === 0 || r.sources === undefined || r.sources.length === 0);
});

Deno.test("knowledge: prefers org KB and returns citations from retrieved snippets only", async () => {
  const fake = makeFakeClient({
    wrayth_kb: [
      { id: "kb1", org_id: "org1", title: "VPN setup", content: "Connect via Wrayth VPN client. Server: vpn.corp.", category: "how-to", published: true },
    ],
    knowledge_base_articles: [
      { id: "kba1", title: "VPN general", content: "generic", is_public: true, status: "published" },
    ],
  });
  const r = await skillKnowledge("vpn setup steps", { userId: "u1", orgId: "org1", serviceClient: fake });
  assertEquals((r.meta as any).source, "kb_org");
  assertEquals(r.sources?.length, 1);
  assertEquals(r.sources?.[0].kind, "kb_org");
  // With no llmChat provided, we surface the snippet content directly — proves grounding
  assertStringIncludes(r.message, "VPN setup");
});

Deno.test("knowledge: org scoping prevents another org's KB from leaking", async () => {
  const fake = makeFakeClient({
    wrayth_kb: [
      { id: "kb1", org_id: "orgA", title: "AlphaSecret", content: "internal alpha info", published: true },
      { id: "kb2", org_id: "orgB", title: "BetaSecret",  content: "internal beta info",  published: true },
    ],
    knowledge_base_articles: [],
  });
  const r = await skillKnowledge("alphasecret", { userId: "u1", orgId: "orgB", serviceClient: fake });
  const serialized = JSON.stringify(r);
  assert(!serialized.includes("AlphaSecret"), "must not include another org's article");
});

Deno.test("knowledge: falls back to public Wrayth KB when no org KB match", async () => {
  const fake = makeFakeClient({
    wrayth_kb: [],
    knowledge_base_articles: [
      { id: "kba1", title: "Install Wrayth", content: "steps to install", is_public: true, status: "published" },
      { id: "kba2", title: "Install internal", content: "secret", is_public: false, status: "published" },
    ],
  });
  const r = await skillKnowledge("install", { userId: "u1", orgId: null, serviceClient: fake });
  assertEquals((r.meta as any).source, "kb_wrayth");
  assert(r.sources && r.sources.length >= 1);
  assert(!JSON.stringify(r).includes("secret"));
});

// ================== Dispatcher + schema ==================

Deno.test("runSkill: always returns a schema-valid response", async () => {
  const fake = makeFakeClient({ wrayth_devices: [], wrayth_device_posture: [] });
  for (const slug of ["threat", "device", "identity", "knowledge"]) {
    const ctx = { userId: "u", orgId: null, serviceClient: fake };
    const r = await runSkill(slug, "test message", ctx as any);
    assertEquals(validateRayResponse(r), [], `${slug} produced invalid response`);
    assertEquals(r.skill, slug);
  }
});

Deno.test("runSkill: unknown slug falls through to knowledge", async () => {
  const fake = makeFakeClient({ wrayth_kb: [], knowledge_base_articles: [] });
  const r = await runSkill("does-not-exist", "hello", { userId: "u", orgId: null, serviceClient: fake } as any);
  assertEquals(r.skill, "knowledge");
});

/**
 * Ray Intelligence Pipeline — v0.6
 *
 * Shared primitives every Ray intelligence edge function composes.  A module
 * (investigation, malware analysis, log summarization, policy generator,
 * compliance scan, attack path, board report, script analysis) only ever
 * routes user input through this pipeline — no direct AI-gateway calls,
 * no duplicated MITRE / IOC / credit / memory logic.
 *
 * Design goals
 *   - Zero external deps beyond Deno + npm:.
 *   - Every helper is *pure enough* to unit-test.
 *   - Failures degrade gracefully: memory writes and IOC upserts never abort
 *     the caller's main flow.
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/** Default reasoning model for intelligence modules. Callers may override. */
export const DEFAULT_MODEL = "google/gemini-2.5-flash";

/** Higher-effort reasoning model — use for compliance + attack path work. */
export const DEEP_MODEL = "google/gemini-2.5-pro";

/** Per-module Ray Compute costs (single source of truth). */
export const RAY_COMPUTE_COSTS = {
  investigation: 3,
  malware: 4,
  script: 2,
  log_analysis: 5,
  incident_summary: 6,
  executive_report: 8,
  board_report: 8,
  policy_generation: 10,
  compliance_scan: 15,
  attack_path: 20,
} as const;

export type ModuleId = keyof typeof RAY_COMPUTE_COSTS;

// ─── AI call ──────────────────────────────────────────────────────────────

export type AiCallOptions = {
  system: string;
  user: string;
  model?: string;
  jsonMode?: boolean;
  temperature?: number;
};

export type AiCallResult<T = unknown> = {
  ok: boolean;
  parsed: T | null;
  raw: string | null;
  error: string | null;
  model: string;
};

/**
 * Call the Lovable AI Gateway.  Returns a structured result — never throws.
 * Errors surface as `{ ok: false, error }` so callers can decide how to
 * record + return them.
 */
export async function aiCall<T = Record<string, unknown>>(
  opts: AiCallOptions,
): Promise<AiCallResult<T>> {
  const model = opts.model ?? DEFAULT_MODEL;
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) return { ok: false, parsed: null, raw: null, error: "LOVABLE_API_KEY missing", model };

  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: opts.system },
          { role: "user", content: opts.user },
        ],
        ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
        ...(typeof opts.temperature === "number" ? { temperature: opts.temperature } : {}),
      }),
    });
    if (res.status === 429) return { ok: false, parsed: null, raw: null, error: "rate_limited", model };
    if (res.status === 402) return { ok: false, parsed: null, raw: null, error: "credits_exhausted", model };
    if (!res.ok) return { ok: false, parsed: null, raw: null, error: `ai_${res.status}`, model };

    const body = await res.json();
    const raw: string = body?.choices?.[0]?.message?.content ?? "";
    if (!opts.jsonMode) return { ok: true, parsed: raw as unknown as T, raw, error: null, model };

    try {
      const parsed = JSON.parse(raw) as T;
      return { ok: true, parsed, raw, error: null, model };
    } catch {
      return { ok: false, parsed: null, raw, error: "parse_failed", model };
    }
  } catch (e) {
    return {
      ok: false, parsed: null, raw: null,
      error: (e as Error).message?.slice(0, 200) ?? "ai_unknown",
      model,
    };
  }
}

// ─── Evidence extraction ──────────────────────────────────────────────────

export type Ioc = { type: string; value: string; value_norm: string };

/**
 * Lightweight extractor — regex-only, deterministic, zero AI cost.  Used to
 * seed the reasoning step (and to pre-populate ray_ioc_index) before the LLM
 * ever sees the input.
 */
export function extractIocs(input: string): Ioc[] {
  const found = new Map<string, Ioc>(); // key = `${type}:${norm}`
  const push = (type: string, value: string) => {
    const v = value.trim(); if (!v) return;
    const norm = v.toLowerCase();
    const key = `${type}:${norm}`;
    if (!found.has(key)) found.set(key, { type, value: v, value_norm: norm });
  };

  // IPv4
  for (const m of input.matchAll(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g)) push("ip", m[0]);
  // Domains (best-effort — avoids simple emails by requiring no leading @)
  for (const m of input.matchAll(/(?<![@\w.-])([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+)/gi)) push("domain", m[1]);
  // URLs
  for (const m of input.matchAll(/https?:\/\/[^\s"'<>)]+/gi)) push("url", m[0]);
  // Email addresses
  for (const m of input.matchAll(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi)) push("email", m[0]);
  // Hashes (MD5/SHA1/SHA256)
  for (const m of input.matchAll(/\b[a-f0-9]{64}\b/gi)) push("sha256", m[0]);
  for (const m of input.matchAll(/\b[a-f0-9]{40}\b/gi)) push("sha1", m[0]);
  for (const m of input.matchAll(/\b[a-f0-9]{32}\b/gi)) push("md5", m[0]);

  return [...found.values()];
}

// ─── Organization memory ──────────────────────────────────────────────────

type SupabaseClientLike = {
  from: (t: string) => {
    // deno-lint-ignore no-explicit-any
    select: (...a: any[]) => any;
    // deno-lint-ignore no-explicit-any
    update: (...a: any[]) => any;
    // deno-lint-ignore no-explicit-any
    insert: (...a: any[]) => any;
  };
};

/**
 * Upsert extracted IOCs into ray_ioc_index.  Never throws — best-effort.
 * `investigationId` is optional and, when present, is appended to the row's
 * investigation_ids array (capped at 25 most-recent).
 */
export async function upsertIocIndex(
  admin: SupabaseClientLike,
  args: { userId: string; orgId?: string | null; iocs: Ioc[]; investigationId?: string; verdict?: string | null },
): Promise<void> {
  const { userId, orgId, iocs, investigationId, verdict } = args;
  if (!iocs.length) return;
  const now = new Date().toISOString();

  for (const ioc of iocs) {
    try {
      const { data: existing } = await admin
        .from("ray_ioc_index")
        .select("id, investigation_ids, occurrence_count")
        .eq("user_id", userId)
        .eq("ioc_type", ioc.type)
        .eq("ioc_value_norm", ioc.value_norm)
        .maybeSingle?.() ?? { data: null };

      const row = existing as { id: string; investigation_ids: string[]; occurrence_count: number } | null;

      if (row) {
        const ids = new Set(row.investigation_ids ?? []);
        if (investigationId) ids.add(investigationId);
        const nextIds = [...ids].slice(-25);
        await admin.from("ray_ioc_index").update({
          last_seen_at: now,
          occurrence_count: (row.occurrence_count ?? 1) + 1,
          investigation_ids: nextIds,
          last_verdict: verdict ?? null,
          updated_at: now,
        }).eq("id", row.id);
      } else {
        await admin.from("ray_ioc_index").insert({
          user_id: userId,
          org_id: orgId ?? null,
          ioc_type: ioc.type,
          ioc_value: ioc.value,
          ioc_value_norm: ioc.value_norm,
          first_seen_at: now,
          last_seen_at: now,
          occurrence_count: 1,
          investigation_ids: investigationId ? [investigationId] : [],
          last_verdict: verdict ?? null,
        });
      }
    } catch {
      // swallow — memory writes must never block a caller
    }
  }
}

// ─── Small type helpers ───────────────────────────────────────────────────

export const asArr = (v: unknown): unknown[] => Array.isArray(v) ? v : [];
export const asObj = (v: unknown): Record<string, unknown> =>
  (v && typeof v === "object" && !Array.isArray(v)) ? v as Record<string, unknown> : {};
export const asStr = (v: unknown, max = 4000): string | null =>
  typeof v === "string" ? v.slice(0, max) : null;

# v0.4 — Ray becomes an AI Security Copilot

Big scope. I want to land it in **four shippable slices** so we always have a working product, not a half-built vision. Each slice is ~1 build session.

---

## Slice 1 — Recommendations Engine (the "no one asked, Ray noticed" moment)

**Goal:** Home screen shows a "Ray found N things worth your attention" card.

- New table `ray_recommendations` — one row per detected finding, per user/org, with `severity`, `category` (device/identity/threat/knowledge), `title`, `body`, `evidence` JSON, `status` (new/reviewed/dismissed/resolved), `first_seen_at`, `last_seen_at`, `linked_action_id`.
- New edge function `ray-scan` — runs the four skills in "scan mode" (no user question) against fleet + identity + threat data, dedupes into `ray_recommendations` by a stable fingerprint so we don't spam duplicates every run.
- New component `RayRecommendationsCard` on `/app/ray` and dashboard home: greeting + top 3 by severity, [Review] button → `/app/ray/recommendations` list page.
- Cron: every 6h via `pg_cron` → `ray-scan` for each active org member.

**Non-goals:** email/Teams/Slack digest (slice 3), auto-remediation (already gated in agent).

## Slice 2 — Unified Conversational Ray

**Goal:** Kill the "pick a skill" mental model. One chat box, Ray decides.

- Rename `/app/ray/skills` UX to just **Ray**. The classifier already picks a skill; we stop surfacing the skill name as the primary label and instead show it as a small badge on the response ("routed via device").
- Add a **home Ray composer** on `/app/ray` (and a floating "Ask Ray" button in the app shell) that opens the same router.
- Add **recommendation-aware follow-ups**: when a rec is open, Ray's system prompt is seeded with "the user is looking at rec X — evidence Y". So "what should I do?" gets a scoped answer.
- Keep skill isolation server-side. UI is unified; internals unchanged.

## Slice 3 — Weekly Security Digest

**Goal:** Monday morning email/in-app card summarizing the week.

- New table `ray_digests` — one row per org per week: score_before, score_after, counts (breaches, devices improved, reboots pending, updates installed, extensions removed), highlights JSON.
- New edge function `ray-digest-build` — aggregates from `ray_recommendations`, `ray_security_scores`, `ray_org_timeline`, breach/device tables into a digest row.
- New edge function `ray-digest-send` — renders + emails via existing `send-email`; also posts to Teams/Slack via the workplace-message adapters we just shipped.
- Cron: Monday 9am local (stored per org).
- In-app view at `/app/ray/digest` shows the latest digest with the same content.

## Slice 4 — Organization Memory (highest leverage per your note)

**Goal:** Ray knows facts about *your* org and uses them in reasoning.

- New table `ray_org_memory` — `(org_id, key, value, confidence, source, verified_by, verified_at)`. Examples: `sanctioned_saas=["Microsoft 365","Duo"]`, `banned_saas=["Dropbox"]`, `mfa_provider="Duo"`, `password_policy_min=14`.
- Admin UI at `/app/ray/memory` — CRUD + "Ray suggested this — confirm?" queue for inferred facts (e.g. "I noticed 40/42 logins use Duo — mark Duo as your MFA provider?").
- **Wire into skills:** threat skill and knowledge skill get org memory injected into their prompt/evidence. Phishing verdict can now cite "your org does not use Dropbox" as evidence.
- New edge function `ray-memory-infer` (nightly) — proposes new memory entries from observed signals.

## Deferred to v0.5 (explicitly not this milestone)

- **Security Graph** — real graph store + reasoning. This is a v0.5 architectural change; slice 4's memory is the pragmatic first step.
- **Incident Timeline UI** — we already have `ray_org_timeline`; a proper per-user/device timeline view is a v0.5 UI slice.
- Auto-remediation of recommendations (would reuse the existing action safety gates; skipped now to keep scope contained).

---

## Technical details

- All new tables get `org_id`-scoped RLS + `GRANT`s per project convention. `ray_recommendations` and `ray_org_memory` use `has_role`/org membership checks, not `auth.uid()` alone.
- Recommendation fingerprint = `sha1(org_id || category || subject_id || rule_slug)` stored as `fingerprint TEXT UNIQUE` per org.
- `ray-scan`, `ray-digest-build`, `ray-memory-infer` are `verify_jwt = false` and called by pg_cron with the service role.
- Recommendations reuse the existing `RayResponse.actions` contract; buttons only appear when a real navigate target or approved playbook exists (same gate as workplace embeds).
- No changes to agent collectors, no new device-side code. This is all backend intelligence + UI on top of data we already collect.

---

## Order of build

1. **Slice 1** first (Recommendations) — biggest visible payoff, unblocks slices 3 & 4.
2. **Slice 4** next (Org Memory) — you flagged it as highest priority, and it makes slice 2 and future threat skill dramatically better.
3. **Slice 2** (Unified Ray UX) — cheap once 1 + 4 are in.
4. **Slice 3** (Digest) — last, because it aggregates outputs of 1, 2, 4.

## Questions before I start

1. **Digest delivery default:** email + in-app only, or also auto-post to any connected Teams/Slack workspace on Mondays?
2. **Recommendation scope:** per-user (Brandon sees his devices) or per-org (any admin sees the whole fleet)? Assuming org-scoped for admins, user-scoped for members — confirm?
3. **Org memory seeding:** ship with a starter set (common SaaS, common MFA providers) so Ray has something to reason with on day one, or fully empty until admin/Ray populates it?

Answer those and I'll start with Slice 1.

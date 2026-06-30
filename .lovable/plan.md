# Wrayth — Triple Track Execution Plan

I'll ship these in order. Each track ends in a working, demoable state before moving on.

---

## Track 1 — Real Data Hardening (Vault / Scan / Watch → Ray)

Goal: kill the remaining demo data so Ray's briefings, score, and recommendations reflect real signals.

**Vault (passwords / 2FA)**
- Read live entries from the existing `safepass_*` / vault tables (already PBKDF2 encrypted client-side).
- Compute live metrics: reused count, weak entropy count, missing-2FA count, breached count via the existing HIBP edge proxy (`ray-breach-check`) using k-anonymity SHA1 prefix — never send full hashes.
- Persist results to `ray_findings` (`source = 'vault'`) so Ray's score + recommendations consume the same pipeline.

**Scan (email + file threats)**
- Pull live counts from `safescan_*` tables, last 30 days. Drop hardcoded "demo threats."
- Surface latest 5 detections on the module card; write a `ray_findings` row per active threat.

**Watch (identity / exposure)**
- Replace seeded breach list with a live HIBP `breachedaccount` lookup via `safeweb-scanner` for each verified email on the profile.
- Cache results in `ray_findings` (`source = 'watch'`) with a 24h TTL so we don't burn API calls.

**Ray glue**
- `ray-briefing` already reads `ray_findings` — extend its scoring weights so vault / scan / watch each contribute, and so the morning brief cites real numbers ("3 reused passwords, 1 breached login, 2 exposed emails").
- Add `useRayLiveSignals` hook that batches the three module syncs and runs on dashboard mount + after onboarding.

**Acceptance:** dashboard shows real numbers for a freshly onboarded user; no `Math.random`, no `mockX` imports left in `src/pages/safesuite/{Vault,Scan,Watch}.tsx`.

---

## Track 2 — Wrayth Marketing Site

Goal: a standalone marketing surface for Wrayth that sells Ray, separate from `ultriumai.com`.

- New route tree under `/wrayth/*` (kept inside this project; later mappable to its own domain). Pages:
  - `/wrayth` — hero "Meet Ray. Your AI cybersecurity teammate.", violet pulse, single CTA "Meet Ray" → `/auth?next=/app/onboarding/ray`.
  - `/wrayth/ray` — what Ray does (Vault / Scan / Watch under one mind), animated eye, JARVIS-tone copy.
  - `/wrayth/pricing` — outcome-based tiers wired to the existing Stripe price IDs in `src/config/safeSuiteTiers.ts`.
  - `/wrayth/resources` — security playbook excerpts pulled from `src/lib/ray/playbooks/templates.ts` as static teasers.
- Shared `WraythMarketingLayout` with its own nav (Platform, Pricing, Resources, Sign in) — no app chrome.
- SEO: per-page `<title>`/meta/OG, JSON-LD `Product` + `Organization`, single H1, canonical, sitemap entries.
- Strictly design-token driven (matte black, graphite, soft silver, Electric Violet only on Ray-thinking states).

**Acceptance:** `/wrayth` loads with zero app-sidebar bleed, all CTAs route to existing auth/checkout, Lighthouse SEO ≥ 95.

---

## Track 3 — Ray Action Engine Wave 5

Goal: playbooks become resumable, schedulable, and feel alive.

- **Resumable runs:** persist per-task state in `ray_playbook_runs` (`current_step`, `step_state jsonb`, `paused_at`). `PlaybookRunner.tsx` rehydrates from last step on reopen.
- **Scheduled playbooks:** new `ray_playbook_schedules` table (`cron`, `playbook_id`, `next_run_at`). Cron-trigger edge function `ray-scheduler` (every 5 min) enqueues due runs. Uses `pg_cron` + `pg_net` (per platform guidance — scheduled via `supabase--insert`, not migration, since URL+anon key are tenant-specific).
- **Progress UX:** step pills, ETA, "Ray is working…" violet pulse, and a `ray_timeline` event per step completion. Toast on resume: "Picking up where we left off."
- **Library polish:** filter chips on `PlaybookLibrary` (Critical / Quick win / Scheduled), and a "Schedule monthly" button on relevant playbooks (credit freeze refresh, OAuth audit, MFA review).

**Acceptance:** start a playbook, close the tab, reopen — Ray resumes at the same step. Schedule a playbook for "every Monday 9am" and verify a run appears.

---

## Order of operations

1. Track 1 lands first — everything downstream is more compelling once Ray cites real data.
2. Track 2 — marketing can then confidently quote "real-time HIBP-backed monitoring."
3. Track 3 — depth feature; ships after the surface is solid.

I'll execute Track 1 immediately on approval, then continue straight through 2 and 3 without re-prompting.
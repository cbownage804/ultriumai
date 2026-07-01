## Wrayth 5.1 — Product QA & Polish Sprint

**Rule:** No new capabilities. If I find something missing that isn't a bug, I log it as "post-beta" and move on.

**Deliverable:** a `Launch Issues` checklist that starts populated and gets driven to zero P0/P1 items.

---

### Phase 1 — Instrumented audit (build the checklist)

Extend `scripts/audit.mjs` and add companion scanners so the "Launch Issues" list is generated, not guessed:

1. **`scripts/audit-routes.mjs`** — enumerate every `<Route path=...>` in `src/App.tsx` and each route's page component. Flag: pages with no loading state, no empty state, no error boundary, or that call `supabase` without a `try/catch`.
2. **`scripts/audit-buttons.mjs`** — grep for `<Button` / `onClick` without a handler, `onClick={() => {}}`, `disabled` with no reason comment, and `TODO`/`FIXME`/`console.log` inside handlers.
3. **`scripts/audit-copy.mjs`** — flag remaining `SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack` outside Ray's system prompt, and inconsistent Ray voice ("I", "we", "the system" in the same file).
4. **`scripts/audit-edge-functions.mjs`** — for each `supabase/functions/*/index.ts`: has CORS handler, wraps handler in `try/catch`, returns JSON on error, calls `getClaims()` when it touches user data.

Everything writes into `src/dev/launchIssues.json` with `{ severity, area, file, line, message }`. `LaunchChecklist.tsx` renders it grouped by severity so we can drive it down in the dev-only checklist page.

### Phase 2 — Fix by severity (P0 → P1 → P2)

Work top-down through the generated list:

- **P0 — hard failures.** Page crashes, dead routes, edge functions that always 500, buttons with no handler, workflows that write partial data.
- **P1 — customer-visible gaps.** Missing loading/empty/error states, unhandled promise rejections, legacy brand strings, Ray speaking inconsistently, silent auth failures.
- **P2 — polish.** Copy consistency, spacing, toast wording, Ray tone drift.

Each fix updates `launchIssues.json` by removing the addressed entries and re-running the relevant scanner.

### Phase 3 — Workflow verification (real data only, no seeded demos)

Walk each critical flow end-to-end against the live Supabase backend and document the result in `docs/qa/workflows.md`:

- Auth: sign-up → email verify → onboarding → dashboard.
- Onboarding: real HIBP scan, real M365 import path, real vault seeding — no mock inserts.
- Ray Morning Brief: cron trigger → `ray-morning-brief` edge fn → `ray_briefings` row → UI render → voice playback.
- Recommendations: generate → surface in UI → user acts → status transitions (`pending` → `in_progress` → `resolved`).
- Extension: install → domain trust lookup → autofill request → vault unlock → log entry.
- Org dashboard: `ray_org_health` snapshot writes, department roll-ups, delta vs. prior day.
- MSP dashboard: multi-client roll-up, per-client drill-down, RLS boundary check (staff from MSP A cannot read MSP B).

For each, capture: does it load, does every button do what it says, does every API call succeed, does the empty state read well, does an error surface humanely.

### Phase 4 — Edge function health sweep

For every deployed function, verify: fresh deploy succeeds, cold-start latency, structured JSON error on failure, CORS preflight OK, `verify_jwt` matches intent. Any function that isn't reachable from the app anymore gets deleted.

### Phase 5 — Final gate

Ship criteria before I call the sprint done:
- `launchIssues.json` has zero P0 and zero P1.
- Every workflow in Phase 3 has a green checkbox in `docs/qa/workflows.md`.
- Supabase linter clean (or every remaining warning has an explicit note in `@security-memory`).
- `scripts/audit.mjs` still shows: 0 consoles, 0 arbitrary hex, 0 TODOs, ≤1 legacy brand hit (Ray's prompt).

### Out of scope (explicitly)
- Multi-tenant KB, new tenancy models, MSP hierarchy redesign.
- Any new page, feature, or Ray capability.
- Visual redesign beyond fixing broken/inconsistent copy and states.

### Technical notes
- Scanners are Node ESM under `scripts/`, driven by `rg` and simple AST-free regex — same approach as existing `audit.mjs`.
- `launchIssues.json` lives under `src/dev/` (already git-ignored from audit's own scan via the `src/dev/` skip).
- Workflow verification uses Playwright via shell against `http://localhost:8080` with the injected Supabase session — no seeded demo data.

---

**First action if approved:** build the four scanners in Phase 1, generate the initial `launchIssues.json`, and report the P0/P1 counts before touching any fixes.
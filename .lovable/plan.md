## Wrayth 3.0 — Ray Action Engine

Goal: every recommendation in Wrayth becomes an interactive playbook Ray walks the user through, with real lifecycle state, score rewards, timeline entries, and memory.

This is a large build. I'll ship it in four focused waves so we get something working end-to-end fast, then expand. Each wave is independently usable.

---

### Wave 1 — Universal Action Framework (foundation)

**Database (one migration)**
- `ray_playbooks` — the catalog (slug, title, description, category, estimated_minutes, reward_score, task_ids[]). Seeded server-side from a templates file; users never edit this.
- `ray_playbook_runs` — a user's instance of a playbook with lifecycle: `new → ready → in_progress → completed → archived`, plus `paused_at`, `completed_at`, `progress`, `tasks` (jsonb of `{id, label, done, done_at, ray_prompt}`), `affected_assets` jsonb, `score_delta_actual`.
- `ray_tasks_catalog` (lightweight reference; stored as TS for now if not needed in DB — see Architecture below).
- Add `playbook_run_id` (nullable) to `ray_recommendations` so a recommendation can point at its in-flight run.

**Client SDK — `src/lib/ray/playbooks/`**
- `catalog.ts` — reusable task primitives: `enableMfa`, `generatePassword`, `storeRecoveryCodes`, `verifyDevice`, `reviewBreach`, `updatePassword`, `addPasskey`, `verifyRecoveryEmail`, `reviewAdminPermissions`, `scanIdentity`, `reviewExposure`. Each exports `{ id, label, defaultRayPrompt, render?: ComponentSlug }`.
- `templates.ts` — playbook templates composed of tasks: `secure-google`, `secure-microsoft`, `resolve-credential-exposure`, `eliminate-weak-passwords`, `protect-identity`, `verify-devices`, `monitor-domains`, `passkey-upgrade`.
- `engine.ts` — `startPlaybook(slug)`, `advanceTask(runId, taskId)`, `pause(runId)`, `resume(runId)`, `archive(runId)`, `complete(runId)`. On complete: write `ray_timeline`, write `ray_memory` achievement, bump `ray_security_scores`, queue a brief update flag.
- `hooks/usePlaybookRun.ts` — subscribes to a single run, exposes progress, current task, Ray's prompt for that task, and action callbacks.

**Recommendation → Action Launcher mapping**
- `src/lib/ray/playbooks/router.ts` — `playbookForRecommendation(rec)` maps recommendation `kind` → playbook slug (weak_password → password-replacement, missing_mfa → mfa, breach → credential-recovery, passkey_available → passkey-upgrade, inactive_device → device-verification).

---

### Wave 2 — Conversational playbook runner UI

**Component: `src/components/ray/PlaybookRunner.tsx`**
- Full-bleed conversational layout (no wizard chrome). Left rail: task checklist with progress. Main column: Ray's current message + the single action for this step + Continue / I did this / Skip / Pause.
- Ray speaks one short message per task. Tone matches existing Ray voice (calm, JARVIS-like). Pulls copy from the task's `defaultRayPrompt`, overridable per playbook.
- Header shows: playbook title, estimated minutes remaining, expected score reward, live progress %.

**Component: `src/components/ray/FixWithRayButton.tsx`**
- Small button that, given a `RayRecommendation`, calls `playbookForRecommendation` + `startPlaybook` then navigates to `/app/ray/playbook/:runId`.
- Drop-in replacement for the existing "Fix with Ray" buttons in `RayInsightPanel`, `RayNoticesPanel`, `Ray.tsx` recommendations list, Passwords page weak-password rows, Threats breach rows, MFA hub recommendations.

**Route**
- `/app/ray/playbook/:runId` → `PlaybookRunnerPage.tsx` renders `PlaybookRunner`.

**Completion celebration**
- Reuse existing `ScoreCelebration` overlay style. Show: "Excellent work. Your Google account is now protected with MFA. Your Security Score increased from X to Y. I'll continue monitoring it automatically."

---

### Wave 3 — Ray Workspace (`/app/ray` overhaul)

Rebuild `src/pages/safesuite/Ray.tsx` into Ray's headquarters with these stacked sections (existing AskRay bar stays at top):
- **Current Mission** — the active mission card (existing `ray_missions`).
- **Current Playbook** — the active `in_progress` run, big resume CTA.
- **Suggested Next** — top 1 recommended playbook from open recommendations.
- **Paused Playbooks** — resume / archive.
- **Completed Playbooks** — recent wins with score delta and date.
- **Prepared Notices** — existing `RayNoticesPanel`.
- **Conversation History** — last 10 AskRay questions from `ray_timeline`.
- **What Ray remembers** — existing memory panel.

---

### Wave 4 — Wiring everywhere + polish

- Replace every existing "Fix with Ray" / "Start" button on Home brief, Morning Brief, Passwords, Threats, Exposure, Identity, Devices, MFA hub with `<FixWithRayButton recommendation={r} />`.
- Missions page: completing a mission step that has a matching playbook offers "Run the playbook with Ray".
- Morning Brief: completed playbooks since last brief appear as "Recent wins".
- Timeline: new `playbook_completed` event type with score delta and asset list.
- Ray Memory: on completion, insert a high-confidence memory `achievement:<playbook_slug>`.

---

### Technical notes (for me)

- Reuse, don't replace. `ray_missions` stays for the "one mission at a time" framing; playbooks are the executable layer underneath. A mission step can optionally reference a playbook slug.
- Task catalog lives in TypeScript (not DB) so adding tasks is a code change, not a migration. `ray_playbook_runs.tasks` snapshots the task list at start so future template changes don't mutate past runs.
- All score deltas write through a single helper so Trends, Brief, and Celebration stay consistent.
- No new edge functions required for Wave 1–3. Ray's per-task prompts are static copy; if we want dynamic coaching later we can add a `ray-coach` function.

---

### Out of scope for this PR

- External integrations that *perform* the change for the user (e.g. actually flipping Google MFA via API). Ray coaches; the user clicks Continue when done. This matches the spec ("I'll stay with you until we're finished. Open your Google Security page.").
- Reordering the sidebar. Workspace expansion is on `/app/ray` only.

If this plan looks right I'll start with the migration + Wave 1 SDK, then Wave 2 runner UI, then Wave 3 workspace, then Wave 4 wiring.

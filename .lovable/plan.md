# Wrayth Zero-Fake-Data Purge & Zero-State Rebuild

## Product Rule (locked in)

Wrayth will NEVER ship with demo, placeholder, seeded, fake, mock, or sample security data. Every screen must gracefully support a true zero-state where Ray teaches the customer what will appear once they configure the platform. This is now a permanent project constraint.

## Approach

Rather than one giant PR touching 60+ files, I'll work in reviewable phases. After each phase you can spot-check the pages before I move on.

## Phase 1 — Audit & Inventory (this turn)

Produce an exhaustive report of every offense:

- Grep every Wrayth surface for hardcoded arrays typed like `Threat[]`, `Device[]`, `Investigation[]`, `Alert[]`, `Report[]`, `Policy[]`, `Identity[]`, `AttackPath[]`, `TimelineEvent[]`, `Malware[]`, `Finding[]`, `Organization[]`.
- Flag `Math.random()`, `faker`, `lorem`, hardcoded percentages, fake timestamps (`new Date(Date.now() - …)` used as telemetry), fake user names, sample CVEs.
- Flag any component that renders charts/tables without a data-source hook.
- Classify each hit: **DELETE** (pure fixture), **REWIRE** (should query a real table), or **KEEP** (dev-only under `src/dev/` or `src/components/demos/` marketing surfaces on public pages).
- Output written to `src/dev/fakeDataAudit.json` (dev-only) so the next phases have a checklist.

## Phase 2 — Zero-State Primitives

Build the shared components every screen will use so the empty experience is consistent and on-brand:

- `<RayZeroState/>` — Ray avatar + "in Ray's voice" copy slot + primary/secondary CTA + optional setup-progress strip.
- `<RayEducationalPanel/>` — "What appears here" bullet list.
- `<RaySetupChecklist/>` — reads real setup status (agent installed? M365 connected? extension installed? first identity added? first scan run?) from Supabase and renders progress.
- `<RayNextAction/>` — computes the single highest-value next step from setup state.
- Screen-level helper `useHasAnyData(table, filter)` — cheap `head:true, count:'exact'` query to decide zero-state vs. real render.

All under `src/components/ray/zero-state/`. No design tokens hardcoded — uses existing semantic tokens.

## Phase 3 — Rewire the Core Surfaces (page-by-page)

Each page loses its hardcoded fixtures, gains a real Supabase query, and falls back to `<RayZeroState/>` when the query is empty. Copy tailored per screen, in Ray's voice.

| Screen | Real source | Zero-state message | CTA |
|---|---|---|---|
| Home / Dashboard | aggregate of below | "I'm waiting for your first device to check in." | Install agent / Connect M365 / Install extension |
| Threat Center | `xdr_threats`, `security_alerts` | Explains what Ray detects | Install agent, connect M365 |
| Investigations | `ray_investigations` | Explains investigations | Start first investigation |
| Compliance | compliance scan tables | Explains compliance scans | Run first scan |
| Devices | `vanguard_agents`, `rmm_agents` | Explains auto-population | Download agent |
| Identity Monitoring | identity tables | Explains identity monitoring | Add first identity |
| Vault | SafePass entries | Explains vault value | Import passwords / Install extension |
| Graph | `ray_attack_paths` + edges | Explains relationships appear automatically | Install agent |
| Reports | `reports` | Explains executive reports come from real investigations | (disabled until data) |
| Timeline | timeline events table | Explains Ray builds history from real activity | Install agent |
| Malware | malware tables | Zero-state | Install agent |
| Policies | policy tables | Zero-state | Create first policy |
| Attack Paths | `ray_attack_paths` | Zero-state | Install agent |
| Memory | `ray_memory` | Zero-state | Start conversation |
| Ray Activity Ticker | `ray_skill_invocations` etc. | Silent / "Ray is standing by" | — |

## Phase 4 — Metric & Chart Cleanup

- Every `AccountHealthPanel`, threat count badge, fleet score, risk score, RC-usage widget, MRR/ARR display: verify it reads from a real query. Any that don't → replace with `<RayZeroState/>` or hide.
- Delete random-data chart helpers.
- Delete "fake sparkline" utilities.

## Phase 5 — Onboarding Reset

- `RayOnboarding` and `OnboardingFlow` audited to make sure they teach and drive setup, and do not preload sample activity into the account.
- Setup progress written to a real `wrayth_setup_progress` table (one row per user/org) so all zero-states can key off it.

## Phase 6 — Guardrails

- New file `src/dev/fake-data.eslint-notes.md` documenting the rule.
- README section under `src/components/ray/zero-state/README.md` for future contributors.
- Update `.lovable/memory/` with the constraint (done).

## Out of Scope

- Public marketing pages (`/`, pricing, resources) may keep illustrative content — they are marketing, not the product. Anything under `/app/*` and `/admin/*` product surfaces is in scope.
- `src/components/demos/*` on public marketing routes is preserved.
- Admin console fake fallbacks (already added in the previous turn) will also be scrubbed — MRR/ARR/RC widgets must show "No data yet" instead of estimates when tables are empty.

## Technical Details

- Detection query pattern:
  ```ts
  const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
  const isEmpty = !count;
  ```
- Setup-state table:
  ```sql
  create table public.wrayth_setup_progress (
    user_id uuid primary key references auth.users(id) on delete cascade,
    agent_installed_at timestamptz,
    m365_connected_at timestamptz,
    extension_installed_at timestamptz,
    first_identity_added_at timestamptz,
    first_scan_completed_at timestamptz,
    first_investigation_started_at timestamptz,
    updated_at timestamptz default now()
  );
  grant select, insert, update on public.wrayth_setup_progress to authenticated;
  grant all on public.wrayth_setup_progress to service_role;
  alter table public.wrayth_setup_progress enable row level security;
  create policy "self read"  on public.wrayth_setup_progress for select to authenticated using (user_id = auth.uid());
  create policy "self write" on public.wrayth_setup_progress for insert to authenticated with check (user_id = auth.uid());
  create policy "self update" on public.wrayth_setup_progress for update to authenticated using (user_id = auth.uid());
  ```
- Any file removed must also be removed from imports; TS build must stay green.
- No changes to routes, auth, RBAC, or admin console structure beyond scrubbing fake numbers.

## Execution Order Across Turns

1. This turn: **Phase 1 audit** — inventory + report.
2. Next turn: **Phase 2 primitives + Phase 5 setup table**.
3. Then: **Phase 3** in batches of 3–4 screens per turn, highest-visibility first (Home → Threat Center → Devices → Investigations → …).
4. Then: **Phase 4** metric cleanup and **Phase 6** guardrails.

Confirm and I'll start with Phase 1 (the audit report) so you can see the full offender list before I begin deleting anything.

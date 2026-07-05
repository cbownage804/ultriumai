# Phase 2 — Make Ray Feel Autonomous

Build on the Phase 1 One-Click Remediation Engine so Ray moves from reactive
("here are recommendations") to proactive ("I can fix 5 things for you, want
me to?") while giving orgs real controls: approval policies, maintenance
windows, rollback, chained remediations, and trust indicators.

## Delivery order (each layer is shippable on its own)

1. **Pending Remediations on Home** — the single biggest perceived-intelligence
   win. Everything else amplifies it.
2. **Approval policy + org auto-fix settings**
3. **Queued remediation lifecycle** (Queued → Approved → Running → Verifying → Completed → Rollback available)
4. **Rollback (Undo) per action**
5. **Maintenance windows**
6. **Remediation chains** (playbook-style multi-step)
7. **Trust indicators** on every card (confidence, source, risk, rollback)
8. **Completion notifications** (in-app first; email/Teams/Slack later)

## What already exists

- `wrayth_remediation_actions` table with `provider`, `status`, `previous_state`, `new_state`, `duration_ms`
- Executor registry (`agent`, `ms365`) with the `FixNowButton` + `RemediationRunner` UI
- `ms-graph-remediate` edge function with rollback-friendly state snapshots
- `RayRemediationTimeline` page streaming from Realtime
- `RayRecommendationsCard` with per-rec "Ask Ray" (perfect insertion point for pending fixes)

## Architecture

### 1. Pending Remediations feed

Map each open `ray_recommendations` row to a remediation slug (when one
exists) via a new resolver `src/lib/ray/remediations/resolver.ts`:

```ts
resolveRemediationForRec(rec): { remediation, target, params, confidence } | null
```

New component `PendingRemediationsCard` (Home + Ray recommendations top-of-page):

```
Ray can safely fix:
  ✓ Enable SmartScreen                 Low risk    ~30s
  ✓ Disable SMBv1                      Med risk    ~1m
  ✓ Force MFA registration (3 users)   Low risk    ~45s
  ✓ Rotate 3 breached passwords        Low risk    ~2m
Estimated: 4 minutes
[ Review ]  [ Fix everything ]
```

`Fix everything` opens a batch preview → queues each as a job.

### 2. Approval policy (org-scoped settings)

New table `wrayth_remediation_policies` (one row per org):

```
org_id uuid pk
auto_fix_mode text  -- never | suggest_only | auto_low | auto_medium | auto_except_critical | autonomous
always_auto text[] -- category slugs
never_auto  text[] -- category slugs
notify_on_complete bool
updated_at, updated_by
```

Settings page `src/pages/safesuite/RemediationPolicySettings.tsx` — radio
group for `auto_fix_mode`, chip pickers for always/never lists.

Enforcement:
- `FixNowButton` reads the policy; if a rec falls under `never_auto`, disables Fix Now with reason chip.
- The **queue processor** (edge function `remediation-queue-tick`, cron every 60s) auto-approves+runs items that match the policy tier.

### 3. Queued remediation lifecycle

Add columns to `wrayth_remediation_actions`:

```
lifecycle_state text default 'running'
  -- queued | pending_approval | approved | running | verifying | completed | failed | rolled_back
scheduled_for timestamptz null   -- honors maintenance windows
approved_by uuid null
approved_at timestamptz null
chain_id uuid null                -- FK to wrayth_remediation_chains(id)
chain_step_index int null
rollback_of uuid null              -- self-FK: this row undoes another
```

State machine lives in `src/lib/ray/remediations/lifecycle.ts`; edge function
`remediation-queue-tick` transitions rows and dispatches executors.

New UI: `RemediationQueuePage.tsx` — grouped by state, bulk approve, cancel.

### 4. Rollback

Every completed row already stores `previous_state`. Add:

- `previewLines`-style `undoLines` on each `Remediation` in the catalog
- `undoAction(action_type, previous_state)` per executor. Agent side: reuse
  inverse `action_type` (e.g. `enable_firewall` ↔ `disable_firewall`, if
  applicable) OR replay the raw previous_state where the action is a
  PATCH-style Graph call.
- New button on completed rows in Timeline + Runner completion screen:
  `Undo` → dispatches an inverse job with `rollback_of = <original_id>`.

Slugs whose `reversible = false` render `Undo` disabled with tooltip.

### 5. Maintenance windows

New table `wrayth_maintenance_windows` (org-scoped):

```
id, org_id, name, mode (immediate|business_hours|overnight|weekends|custom)
timezone, weekday_mask int, start_time time, end_time time
active bool
```

When queueing, resolver sets `scheduled_for` to next window opening.
`remediation-queue-tick` only picks up rows where `scheduled_for <= now()`.

UI: `MaintenanceWindowSettings.tsx` — presets + custom editor.

### 6. Remediation chains

New table `wrayth_remediation_chains`:

```
id, org_id, name, trigger_slug text, steps jsonb
  -- [{slug, params_from_prev, halt_on_fail}, ...]
created_at, active bool
```

Seed with the exemplar chain:

```
weak_password_detected
 → force-password-reset
 → revoke-sessions
 → require-mfa
 → notify-user
 → verify-signin  (30-min wait, checks last successful signin)
 → close-incident
```

Chain runner in `src/lib/ray/remediations/chain.ts`; queue processor
advances step-by-step, writing each as its own `wrayth_remediation_actions`
row with `chain_id + chain_step_index`.

Runner UI extension: shows chain steps as a vertical timeline inside
`RemediationRunner`.

### 7. Trust indicators

Extend `Remediation` type with:

```ts
confidenceHint?: number        // static baseline, 0-100
sourceLabel: string            // 'Microsoft Defender', 'Wrayth Agent', 'HIBP'
```

Compute per-instance confidence in resolver (baseline × signal freshness).
Render a compact strip on every `FixNowButton` preview and on Timeline rows:

```
Confidence 99%   ·   Source: Microsoft Defender   ·   Risk: Low   ·   Rollback: Yes
```

### 8. Notifications

MVP: on `lifecycle_state → completed|failed|rolled_back`, insert into
existing `notifications` table with a `remediation_summary` type. Existing
bell UI picks them up. Email/Teams/Slack scaffolded behind a feature flag
for later.

## File map

**New**
- `src/lib/ray/remediations/resolver.ts` — rec → remediation mapping
- `src/lib/ray/remediations/lifecycle.ts` — state machine
- `src/lib/ray/remediations/chain.ts` — chain runner
- `src/lib/ray/remediations/policy.ts` — policy fetch + evaluation
- `src/components/ray/remediation/PendingRemediationsCard.tsx`
- `src/components/ray/remediation/BatchFixDialog.tsx`
- `src/components/ray/remediation/TrustIndicators.tsx`
- `src/components/ray/remediation/UndoButton.tsx`
- `src/pages/safesuite/RemediationPolicySettings.tsx`
- `src/pages/safesuite/RemediationQueuePage.tsx`
- `src/pages/safesuite/MaintenanceWindowSettings.tsx`
- `supabase/functions/remediation-queue-tick/index.ts` (cron every 60s)

**Edited**
- `src/lib/ray/remediations/catalog.ts` — add `sourceLabel`, `confidenceHint`, `undoLines`, reverse pairings
- `src/lib/ray/remediations/providers/{agent,ms365}.ts` — add `undoAction()`
- `src/components/ray/remediation/FixNowButton.tsx` — policy gate + trust strip + `scheduled_for`
- `src/components/ray/remediation/RemediationRunner.tsx` — chain view, Undo button on completion
- `src/pages/safesuite/RayRemediationTimeline.tsx` — Undo per row, lifecycle filter
- `src/pages/safesuite/RayRecommendations*.tsx` + Home page — mount `PendingRemediationsCard`
- `src/App.tsx` + `src/layouts/WraythLayout.tsx` — routes/nav for Queue, Policy, Windows

**Migrations**
- Add columns to `wrayth_remediation_actions` (lifecycle_state, scheduled_for, approved_by/at, chain_id, chain_step_index, rollback_of)
- Create `wrayth_remediation_policies`, `wrayth_maintenance_windows`, `wrayth_remediation_chains` with GRANTs + RLS
- pg_cron schedule for `remediation-queue-tick`

## Explicitly out of scope for Phase 2

- Email / Teams / Slack notification delivery (in-app only)
- Multi-org policy inheritance (single org row for now)
- ML-based confidence scoring (static baselines)
- Chain editor UI — chains are seeded/coded; visual builder is Phase 3
- Two-person approval flow (Phase 3, alongside chain editor)

## Risks

- **Auto-fix regret** — misclassified "low risk" auto-runs damage trust. Ship
  with `suggest_only` as the default; every auto-run writes an easily
  visible Timeline entry with a one-click Undo.
- **Cron cost** — `remediation-queue-tick` runs every 60s; keep it O(pending
  rows) with a partial index on `(lifecycle_state, scheduled_for)`.
- **Rollback fidelity** — some agent actions are not truly reversible
  (e.g. force-logoff). Mark `reversible=false` and never show Undo.
- **Chain fan-out** — a chain that fails mid-way must halt or continue per
  `halt_on_fail` per step, never silently abandon state.

## After Phase 2

Security Playbooks — reusable investigation+response workflows built on the
same lifecycle + chain plumbing, tying investigations, graph memory,
remediation, and reporting into one incident flow.

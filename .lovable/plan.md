# Wrayth 4.2 — Ray Protects Your Organization

Ray graduates from understanding one person to understanding an entire company — and, for MSPs, every client organization in one view. This plan ships in four waves so each piece is usable on its own.

## What Ray will be able to say

> "Good morning, Brandon. I checked all 42 employees overnight. No critical threats. Two haven't enabled MFA. One credential appeared in a new breach. Average score went 91 → 93. I'd fix John's password first."

And for Ultrium:

> "Good morning, Brandon. I checked 27 client organizations overnight. Three need attention today."

## Wave 1 — Org Brain Foundation (data + scoring)

Build the schema and synthesis engine Ray will read from. No new UI yet beyond a basic page.

New tables (all RLS-scoped to org membership):
- `ray_org_profiles` — per-employee Ray profile: score, MFA status, breach count, last_active, top risks JSON.
- `ray_org_health` — daily snapshot per org: overall score, identity/device/threat/exposure/compliance/training/software/domain sub-scores, deltas vs yesterday.
- `ray_org_missions` — company-wide missions (e.g. "Enable MFA company-wide"): target, progress, est_minutes, owner.
- `ray_org_timeline` — org-level events ("John enabled MFA", "Heather added Dropbox").
- `ray_org_briefings` — daily executive brief text + structured stats, one per org per day.
- `ray_org_department_scores` — department roll-ups for the heat map.

Edge functions:
- `ray-org-sync` — pulls signals from `vault_*`, `ray_findings`, `safepass_breach_*`, `vanguard_*`, `ms_graph_*`, dark web monitors. Rolls them into `ray_org_profiles` + sub-scores.
- `ray-org-brief` — Gemini-powered executive summary using yesterday vs today deltas + top recommendation. Writes to `ray_org_briefings` and `ray_org_timeline`.
- `pg_cron` schedule for both nightly per org.

SDK: `src/lib/ray/org/` (`profiles.ts`, `health.ts`, `missions.ts`, `timeline.ts`, `briefings.ts`).

## Wave 2 — Organization Dashboard

New route `/app/org` (auto-shown when the user belongs to an org; personal dashboard stays at `/app/dashboard`).

Components in `src/components/ray/org/`:
- `OrgMorningBriefHero` — Ray-voiced exec summary, score with delta arrow, "since yesterday" bullets, primary CTA.
- `OrgHealthGrid` — 8 intelligence surfaces (Identities, Devices, Threats, Exposure, Compliance, Training, Software, Domains) as cards with sub-score + one-line Ray comment.
- `EmployeeIntelligenceList` — replaces user table. Each row is a Ray profile card (score, Ray's one-liner, top fix). Sort defaults to "Ray's priority".
- `OrgTimelineFeed` — yesterday / today sections from `ray_org_timeline`.
- `OrgMissionsPanel` — progress bars per mission with "Continue mission" → playbook launcher.
- `RiskHeatMap` — department bars from `ray_org_department_scores`, hover shows Ray's reasoning.
- `AIPrioritizationList` — "Today I'd spend my time on…" top-3 with impact deltas, each launches an existing playbook.

Reuses MorningBriefHero patterns and existing playbook runner — no duplication.

## Wave 3 — Ask Ray (org questions) + memory

Extend the existing Ask Ray palette and `ray-action` edge function with an org intent router so these natural questions all work:
- "Who worries you most?"
- "Which department is improving?"
- "Did anything important happen overnight?"
- "Are we safer than last week?"
- "Who still needs MFA?"
- "Show me every device that hasn't checked in."
- "Are we ready for cyber insurance?"

Implementation: new skills in `src/lib/ray/org/skills/` that query the org tables and return structured answers Ray narrates. Reuses `ray_memory` keyed by `org_id` so Ray remembers things like "I recommended MFA to John 5 days ago — escalating priority."

## Wave 4 — MSP Multi-Tenant View (Ultrium killer feature)

New route `/app/msp` gated on `useAccountType().isMSPOrMSSP`.

- `MspMorningBrief` — "I checked 27 client organizations overnight. Three need attention today."
- `ClientOrgGrid` — one card per `msp_clients` row showing org score, delta, # employees, top issue, "Open" → switches active org context.
- `CrossClientPrioritization` — Ray ranks work across all clients ("Acme: enable MFA for 3 users — biggest score lift today").
- Extends `ray-org-sync` + `ray-org-brief` to iterate every client an MSP owns; writes one briefing per client and one MSP-level rollup to `ray_org_briefings` with `scope = 'msp'`.

## Cross-cutting

- All new tables follow the GRANT → RLS → POLICY order; policies use a `has_org_access(auth.uid(), org_id)` security-definer function so MSP staff inherit access to their clients without recursion.
- Every new edge function entry added to `supabase/config.toml`.
- `MorningBriefHero` (personal) gets a small "View organization brief" link when the user belongs to an org.
- Voice (Ray TTS) reused as-is for org briefings — Pro gating unchanged.
- No changes to the browser extension in this release.

## Technical details

- Scoring formula lives in `src/lib/ray/org/scoring.ts`: org_score = weighted avg of sub-scores (identity 25, devices 20, threats 20, exposure 15, compliance 10, training 5, software 3, domains 2). Per-employee score reuses existing personal scoring + MFA/breach signals.
- Org context resolution: new `useActiveOrg()` hook picks org from `org_teams` membership (or `msp_clients` when MSP switches context). Defaults to user's primary org.
- `ray_org_*` writes go through edge functions with service role; reads from the client use RLS.
- Heat map departments come from `comanaged_departments` / `org_team_members.department` when present, else "Unassigned".
- Backwards compatible: solo users without an org keep seeing the existing personal dashboard.

## Success criteria

A CEO logs in, spends 60 seconds on `/app/org`, and knows:
- current company risk,
- what changed overnight,
- what matters most,
- exactly what to do next — without opening a report.

An MSP owner logs in, spends 60 seconds on `/app/msp`, and knows which of their clients need attention today.

## Out of scope for 4.2 (saved for later)

- Cyber insurance readiness report PDF (Ray will answer the question; formal report ships in 4.3).
- Org-wide auto-remediation (Ray still proposes; humans execute via playbooks).
- Slack/Teams delivery of the exec briefing.

## Goal
Turn the Ray onboarding flow from a scripted demo into the user's real first session — every selection, import, finding, and score is persisted and re-used by the dashboard and the rest of Wrayth.

## Architecture: Ray Intelligence Engine
New module `src/lib/ray/` acting as the single source of truth Ray asks before speaking:

```text
src/lib/ray/
  index.ts                  // getRayContext(userId): unified snapshot
  passwordIntelligence.ts   // strength, age, reuse, dupes, missing fields
  breachIntelligence.ts     // HIBP lookups (k-anonymity via edge function)
  identityIntelligence.ts   // providers, ecosystem, audience
  threatIntelligence.ts     // placeholder, reads scan/watch tables
  behaviorIntelligence.ts   // login cadence, activity log summary
  scoring.ts                // weighted 0–100 score + factor breakdown
  recommendations.ts        // deterministic recs from findings
```

All UI (onboarding finale, Home briefing, Vault health) calls `getRayContext()` instead of computing its own numbers.

## Data model (one migration)
- `ray_profiles` — `user_id`, `audience`, `providers jsonb`, `existing_manager`, `future_integrations jsonb`, `onboarded_at`, `import_source`.
- `ray_security_scores` — `user_id`, `score`, `factors jsonb`, `created_at` (history table; latest = current).
- `ray_findings` — `user_id`, `entry_id`, `kind` (weak/reused/breached/missing_url/missing_username/empty/old/no_mfa), `severity`, `details jsonb`, `resolved_at`.
- `ray_recommendations` — `user_id`, `title`, `body`, `priority`, `source_finding_ids jsonb`, `status`, `created_at`.
- All four: RLS scoped to `auth.uid() = user_id`, proper GRANTs, updated_at triggers where mutable.

## Step 1 — Profile capture (real)
Rewrite the existing onboarding steps in `RayOnboarding.tsx` to:
- Collect audience (Personal/Family/Business), Microsoft 365, Google Workspace, Apple, Other, existing password manager, planned integrations.
- On step submit, upsert into `ray_profiles`.

## Step 2 — Real password import
Replace the demo import with a real importer:
- New `src/components/onboarding/PasswordImportStep.tsx` with source picker: Chrome, Edge, Firefox, Safari, Bitwarden, 1Password, Keeper, LastPass, Dashlane, Generic CSV.
- New `src/lib/import/parsers/` — one parser per source (each accepts the exported CSV/JSON for that vendor; browsers all export CSV with same schema; password managers each have their own column layout).
- Pipeline: parse → normalize → dedupe (by url+username) → encrypt with the user's existing SafePass master key (reuse `useSafePass` encryption path) → insert into `safepass_entries`.
- Live progress (parsed / deduped / encrypted / saved counts) streamed from the importer.

## Step 3 — Real security analysis
After import completes, run `passwordIntelligence.analyze(entries)`:
- zxcvbn-based strength, reuse map, duplicate detection, missing url/username, empty password, age (if `password_changed_at` present).
- Call edge function `ray-breach-check` (new, wraps HIBP range API with k-anonymity SHA-1 prefix) for each unique password hash; cache results.
- Persist every issue into `ray_findings`.

## Step 4 — Real security score
`scoring.ts` weighted formula (documented in code):
```text
base 100
- 8 per breached credential (cap 40)
- 4 per weak password (cap 30)
- 3 per reused password group (cap 20)
- 5 if no MFA indicators on any high-value account
- 2 per missing-url/empty/old (cap 15)
+ small bonuses for strong, unique, MFA-enabled
clamp 0..100
```
Write to `ray_security_scores` (history).

## Step 5 — Personalized Ray report
`recommendations.generate(findings, score, profile)` produces ordered, real recommendations.
Onboarding finale renders the actual numbers ("I analyzed N passwords…") from `getRayContext()`.

## Persistence + dashboard wiring
- On finish: mark `ray_profiles.onboarded_at`, leave score + recs in DB, navigate to `/safesuite`.
- Replace localStorage `wrayth.ray.onboarded:{uid}` gate with `ray_profiles.onboarded_at IS NOT NULL`.
- Rewrite `SafeSuiteDashboard` briefing to load the persisted latest score + recommendations via `getRayContext()` and diff against previous score for the "Since our last review…" line. No regeneration on load.

## Honesty rule
Intelligence modules return `{ value, confidence, missing: string[] }`. When data is missing (e.g. no breach API key configured), Ray's copy says "I need X to check that" instead of fabricating a number.

## Out of scope (intentionally)
- Microsoft 365 / Google Workspace live API ingestion (profile captures the intent; actual sync is a later feature).
- Browser-extension live capture.
- Endpoint/phishing modules (engine has the slot, no data yet).

## Deliverables
1. One migration creating the four tables + RLS + GRANTs.
2. `src/lib/ray/*` intelligence engine.
3. `src/lib/import/parsers/*` + import pipeline.
4. New `ray-breach-check` edge function.
5. Rewritten `RayOnboarding.tsx` using real steps.
6. Updated `SafeSuiteDashboard.tsx` reading from the engine.
7. Onboarding gate switched from localStorage to DB.

Estimated scope: ~15 new files, ~3 rewrites, 1 migration, 1 edge function.

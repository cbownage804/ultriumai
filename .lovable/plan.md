# Wrayth 5.0 — Polish & Production Readiness

No new features. Every change must answer: *does this make Wrayth more polished, trustworthy, or enjoyable?* If not, it goes to backlog.

## The spine: internal Launch Checklist

Before touching anything else, build a dev-only page at `/app/_launch` (hidden from nav, gated by `import.meta.env.DEV || ?debug=1`). It's the measurable definition of "ready" and the dashboard we work against for the rest of the sprint.

Categories, each with checks that resolve to pass / warn / fail:
- Branding & Legacy — automated grep for `SafePass|SafeScan|SafeWeb|SafeSuite|SafeAssist|SafeTrack`, old routes, old asset paths
- UI Consistency — token audit (hardcoded colors, arbitrary radii, non-token spacing)
- Copy & Ray Voice — sampled phrases + a Ray glossary check
- Extension QA — manual checklist with per-item status persisted to `localStorage`
- Mobile Responsive — viewport screenshots at 375 / 768 / 1440
- Performance — Lighthouse-lite metrics + bundle size budget
- Accessibility — axe-core in dev
- Error Handling — coverage matrix per surface
- Security — headers, RLS coverage, session expiration
- Analytics & Monitoring — event coverage
- Empty / Loading / Error states — per-route matrix
- Beta blockers — free-form list

Each item links to the file or route it references so we can fix in place.

## Phase order & scope

Executed in this order, one phase per iteration, each ending with the Launch Checklist recomputed:

```text
1  Legacy Purge          → grep-driven deletion + rename sweep
2  Design System Audit   → tokens, radii, spacing, shadow, typography scale
3  Interaction Audit     → focus, hover, disabled, transitions
4  Ray Voice Pass        → single source of Ray phrases + tone rules
5  Copy Review           → plain-English rewrite across UI
6  Performance           → lazy routes, query dedup, memoization
7  Accessibility         → keyboard, ARIA, contrast, reduced motion
8  Error Handling        → global boundary + typed edge-function errors
9  Empty States          → per-page intentional zero-data screens
10 Visual Polish         → motion review, skeletons, gradients, glow discipline
11 Extension QA          → popup / side panel / context bar walkthrough
12 End-to-End QA         → 7 documented user journeys
13 Production Readiness  → headers, secrets, indexes, rate limits, backups
```

## Phase 1 — Legacy Purge (concrete)

Run a single sweep that deletes / renames:
- All `Safe*` string references in `src/`, `supabase/functions/`, `public/`, `extension/`
- Routes: any surviving `/safesuite/*`, `/safepass/*`, `/safescan/*`, `/safeweb/*` → 301 to `/app/*` equivalents, then remove after one release
- Components: `grep`-find unused exports and delete
- Icons: remove unused Lucide imports (biome or a small script)
- Demo data files, `TODO` / `FIXME` comments, stray `console.log`, dev-only UI
- DB: audit `Safe*` tables that are no longer read from any code path; produce a *drop candidates* list in the Launch Checklist rather than dropping immediately (destructive → user confirms per table)

## Phase 2–5 — Design & Language

- Introduce `src/design/tokens.ts` as the single source of truth for spacing / radius / shadow scales and lint arbitrary Tailwind values via a small codemod report in the Launch Checklist
- Consolidate Ray's phrases into `src/lib/ray/voice.ts` with a `say()` helper and tone rules (calm, plain, never dramatic). All Ray UI reads from here.
- Copy pass on every page's headings, empty states, error toasts, button labels — reviewed against a short style guide added to `docs/voice.md`

## Phase 6–10 — Quality gates

- Performance: React Query cache tuning, `React.lazy` per route, drop duplicate `supabase.from()` calls, defer non-critical animations
- Accessibility: axe-core dev overlay, focus ring audit, `prefers-reduced-motion` respected in all custom keyframes, 44px min touch targets
- Error handling: one `<RayErrorBoundary>`, a typed `edgeInvoke()` wrapper that maps failures to human copy ("Ray couldn't reach that just now. Try again in a moment.")
- Empty states: one `<EmptyState>` primitive with icon / title / body / CTA; every list route uses it
- Visual polish: motion budget — no animation > 300ms, no decorative-only motion; skeleton library standardized

## Phase 11–13 — Ship-ready

- Extension: manual QA script in `extension/QA.md`, side panel + context bar smoke tests
- E2E: 7 documented journeys in `docs/journeys.md`, each walked and screenshotted into the Launch Checklist
- Production readiness: security headers on published site, rate limits on public edge functions, session expiration UX, DB index review, secrets audit, backup posture note

## Ground rules for the sprint

- **No new features.** New ideas → append to `docs/backlog.md`, do not build.
- **No new pages** except `/app/_launch` (dev-only).
- **Every PR-sized change** ends with the Launch Checklist recomputed so we can see progress.
- **Destructive DB drops** are proposed, not executed, until you approve per table.

## Technical details

- Launch Checklist lives at `src/pages/dev/LaunchChecklist.tsx`, route registered only when `import.meta.env.DEV` or `?debug=1`; not linked from nav
- Automated checks run client-side against a static manifest (`src/dev/launchManifest.ts`) plus a Node script `scripts/audit.mjs` for grep-based checks written into `src/dev/auditReport.json` at build time
- Ray voice module: `src/lib/ray/voice.ts` exports `RAY_PHRASES` and `say(key, vars)`; existing components migrate incrementally, tracked by the checklist
- Error wrapper: `src/lib/edge.ts` exports `edgeInvoke<T>()` that normalizes `FunctionsHttpError`, offline, and timeout into a `{ ok, data, message }` shape
- Empty state: `src/components/ui/empty-state.tsx`
- Backlog file: `docs/backlog.md`

## What I'll do first if you approve

1. Build the dev-only Launch Checklist page + the audit script so we have a scoreboard
2. Run Phase 1 legacy purge and commit the diff
3. Report Launch Checklist scores and pause for you to pick the next phase to drive

Confirm and I'll start with the Launch Checklist + Phase 1.

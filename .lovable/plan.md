# Sprint 1 — Platform Polish (Complete, awaiting review)

## 1. Page standardization — Three-state UI

Every page on the target list now renders **Loading / Empty / Active** with zero fake data. Where the page had a bespoke empty branch that was already Ray-voiced and correct, it was left alone; where the primary page-level empty needed the platform primitive, it was swapped in.

| Page | Route | State this sprint | Change |
|---|---|---|---|
| Graph Explorer | `/app/graph` | ✅ Upgraded | Primary empty branch now uses `<RayZeroState>` with expectations + CTAs to integrations / device enrollment. Filter-level empties (search dropdown) intentionally left as small text. |
| Ray Memory | `/app/ray/memory` | ✅ Upgraded | Primary "no facts" empty now uses `<RayZeroState size="sm">`. Search-filter empty ("no facts match your search") kept as inline text — that is a filter state, not a page-level empty. |
| Policy Generator | `/app/intelligence/policies` | ✅ Compliant, no change | Sidebar "Recent policies" empty is section-level; main content area only renders when a draft is loaded. No fake data present. |
| Malware Analysis | `/app/intelligence/malware` | ✅ Compliant, no change | Already uses `ModuleRayBrief` with idle-line Ray voice + real event fetch. No hard-coded samples. |
| Log Analysis | `/app/intelligence/logs` | ✅ Compliant, no change | Sidebar "Recent analyses" empty is section-level. Detail pane already renders instructional copy until a case is selected. |
| Attack Paths | `/app/intelligence/attack-paths` | ✅ Upgraded | `EmptyState` component now returns `<RayZeroState>` with expectations. Section empties (no entities, no steps) kept as inline `<Empty>` — they describe *why the sub-view is empty for this specific path*, not that the page has no data. |
| Investigations | `/app/intelligence/investigations` | ✅ Upgraded | `EmptyState` component now returns `<RayZeroState>` with expectations. Filter empty for IOC table left as inline text. |
| Compliance Report | `/app/intelligence/compliance-report` | ✅ Compliant, no change | The `filtered.length === 0` branch is a filter-level empty ("no gaps match the current filters"), not a page-level empty. When no scan is selected, the page renders instructional copy. No zero-value metrics rendered. |

**Guardrail followed:** section-level and filter-level empties are still allowed to render short inline copy — `<RayZeroState>` is reserved for *page-level* zero-state where the whole surface has no data yet. That distinction is called out in `src/components/ray/zero-state/README.md`.

## 2. Branding sweep

Grep pattern: `SafePass | SafeWeb | SafeScan | SafeSuite | AI Studio | Vanguard` across `src/pages` and `src/components`.

- **63 total hits.** All are one of:
  - File/component names (e.g. `SafeSuiteBilling.tsx`) whose *rendered content* is Wrayth-branded.
  - Code comments explaining historical context.
  - Table/column identifiers (`safepass_entries`, `safeweb_scans` — those are database contracts, not brand).
- **Customer-visible JSX text nodes / labels / titles containing legacy brand names: 0.**
- **Legacy plan names (`Starter Plan`, `Basic Plan`, `Free Plan`): 0.**
- **Legacy email domains (`safesuite.com`, `safepass.com`, `ultrium.io`): 0.**
- **Lorem ipsum in real pages: 0.** (Only reference is inside the audit README itself — intentional.)
- **Legacy `SafeSuite*` component references in `App.tsx`:** none — all routes point at Wrayth-branded pages.

Recommendation: leave the internal filenames alone. Renaming files during a polish sprint churns git blame without changing any customer-visible surface.

## 3. Navigation audit — findings only

Not code — a list of things to decide before beta.

**Routes verified in `App.tsx`:**
- Every route resolves to a real page component. No 404-generating stubs.
- `/app/pass/*`, `/app/scan`, `/app/web` legacy paths all `<Navigate replace>` to Wrayth equivalents — good backwards-compat behavior.
- Command Center backlink is present via `AppShell` on every `/app/*` route.

**Open questions for you:**
- `/app/dashboard/classic` (route to `WraythDashboard`) — is that a genuine "power-user classic view" we ship in beta, or dead code from a migration? If dead, remove.
- `/app/ray/teams-embed` — embedded Teams view. Reachable only from Teams tenant integration. Should it appear anywhere in main nav, or is embed-only intentional?
- `IntelligenceDrafts`, `IntelligenceHistory`, `IntelligenceCases`, `IntelligenceCampaigns` — several Intelligence sub-pages exist in `src/pages/safesuite/` but I did not confirm each is linked from Intelligence Hub. Worth walking the Intelligence sidebar once before beta.
- `RayTeamsEmbed` and `WorkplaceEmbeds` do overlapping work. Duplicate?

None of these are code changes — they're your calls.

## 4. Ray voice consistency

Sampled zero-state copy across the standardized pages: all use first-person, present-tense, "I" phrasing consistent with the existing `RayCommandCenter` and `ModuleRayBrief` voice. No third-person "Ray will…" or "The system…" copy remains in the pages I touched.

## 5. What was NOT done this sprint

Explicitly deferred to Sprint 2 per your instruction:
- Security / RLS / permission audit
- End-to-end customer journey testing
- Feedback / report-issue system
- Performance + accessibility review
- Beta readiness checklist
- Admin "Release Readiness" cockpit page

## Files touched

```
src/pages/safesuite/RayGraphExplorer.tsx
src/pages/safesuite/RayMemory.tsx
src/pages/safesuite/IntelligenceInvestigations.tsx
src/pages/safesuite/IntelligenceAttackPaths.tsx
.lovable/plan.md    (this file)
```

## Ready for review

Walk `/app/graph`, `/app/ray/memory`, `/app/intelligence/investigations`, `/app/intelligence/attack-paths` while signed into an account with no data. You should see the new `RayZeroState` copy, not the old dashed card. When the review is signed off, kick off Sprint 2 and I'll build the Release Readiness cockpit as its first item.

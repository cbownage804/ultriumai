# Wrayth 2.0 — Consistency Sprint

Goal: open any page, cover the logo, still know it's Wrayth. Stop shipping "products." Start shipping **areas Ray understands.**

Internal names (Vault / Scan / Watch / SafeSuite / SafePass / SafeAssist) stay in the database, file paths, and edge function URLs — only user-facing surfaces change.

---

## Phase 1 — Sidebar & global navigation

Rebuild `SafeSuiteLayout` sidebar to the new shape:

```text
WRAYTH                          ← wordmark
👁  Good afternoon, Brandon     ← live greeting
    Security Score  98
    Everything looks healthy.   ← from getRayContext()

──── MAIN ────
🏠  Home
👁  Ray                         ← dedicated route, not floating

──── PROTECTION ────
🔐  Passwords    (was Vault)
🛡  Threats      (was Scan)
🌐  Exposure     (was Watch)
👤  Identity     (new placeholder area)
💻  Devices      (new placeholder area)
📄  Reports      (new placeholder area)

──── WORKSPACE ────
Organizations · Team · Shared · API · Extensions

──── BOTTOM ────
Settings · Billing · Account · Admin
```

- Remove every "SafeSuite", "Vault", "Scan", "Watch" label from the sidebar.
- Active route highlight + collapsed/icon mode preserved.
- Greeting + score block reads from `getRayContext` (real data, no placeholder).
- New nav targets (`/safesuite/identity`, `/safesuite/devices`, `/safesuite/reports`) get lightweight "Ray is learning this area" placeholder pages so nothing 404s.

## Phase 2 — Ray gets a real page

`/safesuite/ray` becomes Ray's home: conversation, history, recommendations, tasks. The existing floating eye stays as a quick-summon shortcut but the canonical destination is the page. AskRay palette (⌘K) still works.

## Phase 3 — Rename every user-facing page

Sweep every page header, breadcrumb, tab title, toast, empty state, doc string, and marketing block:

| Old user-facing string | New |
|---|---|
| Vault / Password Vault / SafePass | **Passwords** (subtitle: *Managed by Ray*) |
| Scan / SafeScan | **Threats** (subtitle: *Analyzed by Ray*) |
| Watch / SafeWeb / SafeWeb Monitoring | **Exposure** (subtitle: *Monitored by Ray*) |
| SafeAssist | **Ray** |
| SafeSuite (in-app) | **Wrayth** |
| Security Health / Vault Health | **Ray's Assessment** |
| "Vault Stats" cards | "Passwords / Threats / Exposure" |

Page tone shifts from product-y to conversational:
- "Password Vault" → "Passwords — Ray found no weak passwords."
- "Threat Scan results" → "Ray analyzed 3 files today."
- "Dark Web Monitoring" → "Ray is watching 7 identities."

Dashboard's three product cards become "Passwords / Threats / Exposure" tiles.

## Phase 4 — Wrayth icon family (custom)

One SVG family, all derived from triangular Wrayth language. Lives at `src/components/icons/wrayth/`. Same API as Lucide (`size`, `className`, `strokeWidth`).

- `IconHome` — chevron-roof triangle
- `IconRay` — hooded eye (matches logo)
- `IconPasswords` — geometric key echoing the W
- `IconThreats` — triangular radar
- `IconExposure` — hooded eye, open variant
- `IconIdentity` — hex profile
- `IconDevices` — angular monitor
- `IconReports` — folded-triangle paper
- `IconSettings`, `IconBilling`, `IconAccount`, `IconAdmin`, `IconTeam`, `IconOrg`, `IconShared`, `IconAPI`, `IconExtensions`

Sidebar swaps from Lucide → Wrayth icons. Lucide stays allowed for small inline cues elsewhere; the navigation must use the family.

## Phase 5 — Consistency pass

- Standardize section headers across all module pages on the same `<RayPageHeader title subtitle="Managed by Ray" />` component.
- Every health/recommendation block routed through one `<RayAssessment>` component, fed by `getRayContext`.
- Remove residual "SafeSuite" wording from landing/marketing surfaces still using it.
- Audit toasts/empty states for legacy product names.

---

## Technical notes

- Files touched (primary):
  - `src/layouts/SafeSuiteLayout.tsx` — sidebar rebuild
  - `src/components/safesuite/SafeSuiteNav.tsx` — top-bar wording
  - `src/components/icons/wrayth/*` — new icon family
  - `src/components/ray/RayPageHeader.tsx`, `RayAssessment.tsx` — new shared primitives
  - `src/pages/safesuite/SafePass/*`, `SafeScan/*`, `SafeWeb/*` — page headers + copy
  - `src/pages/safesuite/SafeSuiteDashboard.tsx` — three tiles renamed, assessment block
  - `src/pages/safesuite/Ray.tsx` (new) — Ray's page
  - `src/pages/safesuite/{Identity,Devices,Reports}.tsx` (new placeholders)
  - `src/App.tsx` — register new routes
- Internal identifiers (DB tables `safepass_*`, edge functions `safepass-*`, route paths `/safesuite/passwords` etc.) are NOT renamed — too risky, no user-visible benefit.
- Existing routes `/safesuite/safepass`, `/safesuite/safescan`, `/safesuite/safeweb` keep working as aliases; new canonical paths `/safesuite/passwords`, `/safesuite/threats`, `/safesuite/exposure` redirect to the existing modules so deep links don't break.
- No business logic changes. No DB migrations. No edge function changes.

## Suggested sequencing

Because this is a lot of surface area for one turn, I'd ship in this order and check in after each:

1. **Sidebar + Ray page + dashboard tiles** (highest visible impact, ~1 turn)
2. **Page header/assessment primitives + Passwords/Threats/Exposure rename sweep** (~1 turn)
3. **Wrayth icon family + sidebar icon swap** (~1 turn; the icons themselves take real care)
4. **Identity/Devices/Reports placeholder areas + final copy audit** (~1 turn)

## Questions before I start

1. **Icon family scope** — hand-author the SVG paths inline (fastest, fully controllable, no external assets), or generate stylized PNG glyphs? Inline SVG is the right call for an icon family; confirming.
2. **Identity / Devices / Reports** — placeholders that say "Ray is learning this area" so the nav is complete, or hide them until built?
3. **Ray's page** — start with a conversation surface that reuses the existing SafeAssist chat (rebranded), plus a "Recent recommendations" panel pulled from `ray_recommendations`? Voice / memory / tasks come later.

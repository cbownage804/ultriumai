# Capability-First Pricing + Ray Compute

Move Wrayth from quota-based SaaS pricing to capability-based pricing with Ray Compute as the single usage meter. Applies to marketing pricing pages, in-app billing, tier gating, and Stripe.

## New tier model

| Tier | Price | Ray Compute / mo | Positioning |
|---|---|---|---|
| Free | $0 | 0 (upgrade to unlock) | Personal protection |
| Pro | $15 / mo | 25 RC | Power users & consultants |
| Business | $39 / user / mo | 100 RC | Teams |
| Enterprise | Custom | Custom pool | Orgs, SSO/SCIM/API |

All plans: unlimited devices, identities, Ray conversations, password vault, browser extension, daily/weekly briefs, coaching, threat monitoring.

Ray Compute is spent only on: Deep Threat Investigation (3), Malware Analysis (3), Log Analysis (5), Compliance Gap Report (5), Executive Report (5), Attack Path (4), Policy Generation (2), Incident Timeline (2), Script Rewrite (1), PowerShell Explain (1).

## Scope

### 1. Pricing page (`src/pages/pricing/WraythPricing.tsx` + supporting components)
- Rewrite all four tier cards around capabilities and outcomes — no counts, no "500 passwords", no "250 messages".
- Add **"Included with every plan"** section: unlimited monitoring, Ray conversations, password manager, browser extension, daily/weekly briefs, security coaching, recommendations, threat monitoring.
- Add **"Powered by Ray Compute"** section explaining what RC is, which advanced workflows use it, and the per-action cost table.
- Show monthly RC allowance as a benefit line ("Includes 25 Ray Compute / month · top up anytime") rather than a limit.
- Free tier lists Pro-only capabilities under "Not included" (Deep Investigations, Executive Reports, Compliance, Policy Generator, Malware Analysis, Attack Paths).

### 2. Tier config (`src/config/safeSuiteTiers.ts`)
- Replace numeric quota fields (`passwords`, `scans`, `assets`, `rayMessages`, `voiceMinutes`) with capability booleans + `rayCompute: number`.
- Feature list rewritten per tier per spec above.
- Keep existing `stripePriceId` / `stripeYearlyPriceId` on Pro & Business (already live Wrayth prices). Update Pro monthly to $15 (currently $9.99) — see Stripe section.

### 3. Stripe
- Update `prod_Tp7uzqASD23WKz` (Wrayth Pro) monthly price from $9.99 → $15. Create a new $15 monthly price, deactivate the old $9.99 price, wire the new price ID into `useStripeCheckout.ts` + `safeSuiteTiers.ts`.
- Add `metadata.ray_compute_monthly` on each product: Pro=25, Business=100, Enterprise=custom.
- Leave Business ($29.99), Business Annual, Enterprise ($45) as-is unless you want those repriced too (call out in follow-up).

### 4. In-app billing & gating
- `src/hooks/useUserSubscription.ts` / `useSafeSuite.ts`: replace quota checks with capability checks + Ray Compute balance.
- Remove UI copy referencing "X of Y passwords used", "X of Y scans", "X of Y messages", "X min voice" from: `SafeSuitePaywall`, `UsageMeter`, `SubscriptionBanner`, `TierGate`, vault/scan/watch pages, and Ray composer.
- Add a **Ray Compute meter** component (balance + monthly allowance + top-up link) that replaces the old usage meters wherever they were shown.
- Billing page (`/app/billing`): swap the "Usage" tab from per-feature quotas to a single Ray Compute usage chart + recent RC-consuming actions list.

### 5. Ray Compute accounting
- Introduce a small helper `src/lib/ray/compute.ts` exporting the action → cost map so any Ray tool/edge-function can charge consistently.
- Backend: existing Ray Compute balance table (already present per project memory `ray-compute-monetization`) — no schema change unless missing an action_type column. Will verify during implementation and add a migration if needed.

### 6. Copy sweep
- Marketing pages, comparison table, FAQs, onboarding tour, and empty states scrubbed of quota language (`grep -r "passwords" "scans" "messages" "voice minutes"`).

## Out of scope
- Refactoring Stripe subscriptions of existing customers (grandfathered on old prices).
- Building the actual top-up / one-off RC purchase checkout (can be a follow-up — will stub a "Buy more Ray Compute" CTA).
- Changing Business or Enterprise price points.

## Technical notes
- All new pricing tokens live in `safeSuiteTiers.ts`; components read from there so future price tweaks are one-file changes.
- `TierGate` gains a `requiresCapability` prop (e.g. `"executive_reports"`) instead of `requiresTier`.
- Ray Compute cost map is the single source of truth; UI badges on advanced actions render `Uses N Ray Compute` from it.

## Deliverables
1. Redesigned `/pricing` page.
2. Updated tier config + Stripe Pro monthly price.
3. Ray Compute meter in billing + removal of legacy quota meters.
4. Capability-based gating replacing quota gating.
5. Copy sweep across pricing/billing/onboarding surfaces.

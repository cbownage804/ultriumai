## SafeSuite Overhaul Plan

The SafeSuite surface is huge (5 modules, 30+ pages, 25+ edge functions). Shipping "all of it works" in one pass would burn credits and break things. I'll split this into 4 sequenced phases. **Each phase ends in a deployable, revenue-capable state** — so even if we stop after Phase 1, you can take money.

You picked all 4 scopes + "keep existing Stripe setup as-is", so this is the order I'll work in.

---

### Phase 1 — Revenue path works end-to-end (highest priority)

Goal: a logged-in user can pick a plan, pay, and immediately get access to gated features. No silent failures.

1. **Audit live Stripe prices** — call Stripe to confirm every `priceId` in `src/hooks/useStripeCheckout.ts` (`SAFESUITE_PRICES`) and `src/config/productPricing.ts` actually exists and is active. Replace any stale/test IDs.
2. **`safesuite-checkout` edge function** — verify it reads tier+billing, picks the right price, creates a Checkout Session, handles existing customer, returns `{url}`. Add structured logging + clear error messages.
3. **`safesuite-check-subscription`** — confirm it sets `subscribed`, `subscription_tier`, `subscription_end` in the `subscribers` table and is called on login + periodic refresh.
4. **`safesuite-webhook`** — verify it's wired to Stripe (signing secret present), handles `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, and writes to `subscribers`.
5. **`safesuite-customer-portal`** — verify it works for managing/cancelling subs.
6. **`SafeSuitePaywall` / `FeatureGate`** — make sure it actually blocks when `subscribed=false` and unblocks immediately after a successful checkout return (currently has a `TierLimitInfo` that reads stale state in some places).
7. **`/safesuite/billing` page** — show current plan, renewal date, upgrade CTAs, "Manage subscription" button calling customer-portal.
8. **Success/cancel routes** — `/payment/success` should re-run `check-subscription` then route to `/safesuite/dashboard`. `/payment/cancel` should land on `/pricing/safesuite`.

Exit criteria: I can sign up → pay with test card `4242…` → land on dashboard with feature gates unlocked → cancel in portal → gates re-lock.

---

### Phase 2 — Core modules don't have dead ends

Walk each module and fix anything that throws, 404s, or shows empty state with no recovery. Not a redesign — just "every button does what it says."

- **SafeScan** (`/safesuite/scan`): scan submit → result render → history list. Confirm `safescan-api` returns and `safescan-ai-analyzer` enriches.
- **SafePass** (`/safesuite/pass` + 14 sub-pages): vault unlock, add entry, breach check, extension page, team sharing. Verify PBKDF2 client-side encrypt path still works.
- **SafeWeb** (`/safesuite/web`): asset add, dark-web scan kickoff, recommendations render.
- **SafeTrack** (`/safesuite/track`): asset CRUD, warranty lookup.
- **Dashboard** (`/safesuite/dashboard`): tiles link correctly, usage meters read from `safesuite-usage`.

For each: open the page in a headless browser, click the primary CTA, fix what breaks. Per-module fix budget is small — anything that needs a redesign gets logged, not rebuilt.

---

### Phase 3 — Auth, onboarding, trial flow

1. **Sign up at `/safesuite/auth`** → email confirm → `/safesuite/dashboard` with Free tier active.
2. **Product Intent Picker** (post-signup) — point everyone toward Pro trial, not back to picker.
3. **Trial banner** (`SubscriptionBanner`) — show days-left, upgrade CTA opens checkout.
4. **MFA gates** — confirm `MFAOnboardingGate` only prompts on Business/Enterprise per memory.
5. **Forgot/reset password** flow on SafeSuite — confirm `/reset-password` page exists and `resetPasswordForEmail` uses correct origin per memory.

---

### Phase 4 — Production readiness

1. **Edge function secrets audit** — `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY` all set. Flag any missing.
2. **RLS spot-check** on `subscribers`, `safepass_vaults`, `safepass_entries`, `safenet_devices` — service-role-only writes, user-scoped reads.
3. **SEO on marketing pages** — `/pricing/safesuite`, `/products/safesuite`, `/safesuite/features`: title <60ch, meta desc <160ch, OG tags, single H1, product JSON-LD.
4. **Security scan** — run `security--run_security_scan`, fix any new critical findings, leave the previously-ignored ones alone.
5. **Publish** — push live to `ultriumai.app` after Phase 1 minimum so revenue can start flowing.

---

### Out of scope (won't touch unless you ask)

- Pricing model changes (you said keep as-is)
- Visual redesign of any module
- New features (AI add-ons, white-label, MSP reseller flows — already covered by other memories)
- Vanguard, AI Studio, customer portal — separate products

---

### How I'll work it

I'll execute **Phase 1 in this turn after you approve**, then check in before Phase 2. Each phase ≈ 1 round of edits + 1 round of verification with headless browser. You'll see exactly what changed, what was tested, and what's still broken before we move on.

Approve and I start with the Stripe price audit.
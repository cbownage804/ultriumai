

# Unified Auth, Smart Onboarding, and Marketing Refresh

## Overview

Consolidate the authentication experience into a single page, replace the confusing "Account Type" dropdown with a product picker that intelligently recommends the right product, and update sitewide marketing copy to clearly communicate what each product is for and who it serves.

## Phase 1: Unified Auth with Product Picker

### Remove Duplicate Auth
- Delete `src/pages/vanguard/VanguardAuthPage.tsx`
- Remove the `/vanguard/auth` route from `App.tsx` and `vanguardRoutes.tsx`
- Add a redirect so `/vanguard/auth` maps to `/auth?return=vanguard` (no broken links)

### Replace "Account Type" with Product Intent
On the **Sign Up** tab of `/auth`, replace the Business/MSP/MSSP dropdown with a product recommendation step:

```text
+------------------------------------------+
|  What brings you here?                   |
|                                          |
|  [ ] I want to protect my passwords,    |
|      emails, and digital life            |
|      --> SafeSuite (Recommended for      |
|          individuals & small teams)      |
|                                          |
|  [ ] I need RMM, helpdesk, pentesting,  |
|      or full IT operations               |
|      --> Vanguard (For MSPs & IT teams) |
|                                          |
|  [ ] I want to build custom AI          |
|      assistants for my business          |
|      --> AI Studio                       |
|                                          |
|  Users can select ONE or MULTIPLE.       |
+------------------------------------------+
```

- Single selection: user goes directly to that product dashboard after signup
- Multiple selections: user goes to the Product Hub
- Stored in `profiles.product_interests` (text array) and `profiles.primary_product` (text)

### Smart CTA Recommendations
Add contextual recommendation badges:
- "Are you a business or individual? We recommend **SafeSuite Enterprise**"
- "Need pentesting, helpdesk, or full RMM? Try **Vanguard**"
- "Want to build AI chatbots? Start with **AI Studio**"

These appear as subtle helper text below each option.

## Phase 2: Smart Post-Login Routing

Update `useRoleBasedRedirect` and `RoleBasedRedirect`:

```text
User logs in
    |
    v
Has primary_product set?
    |-- Yes --> Go to that product dashboard
    |-- No --> Has product_interests?
                |-- Single product --> Set as primary, go there
                |-- Multiple --> Go to Hub
                |-- None (legacy user) --> Go to Hub
```

MSP/Admin role-based routing stays unchanged (takes priority).

## Phase 3: Unified Adaptive Onboarding

Merge the three onboarding systems into one:

- After signup + product selection, show only the onboarding steps relevant to the chosen product
- **SafeSuite path**: Skip to dashboard (free tier auto-provisions), show in-app tooltips
- **Vanguard path**: Show the existing 4-step Vanguard wizard (company setup, agent install, etc.)
- **AI Studio path**: Show the existing GPT creation steps
- All paths share the profile completion step (name, company)

## Phase 4: Sitewide Marketing Updates

### Homepage (`Index.tsx`)
- Update hero subtitle: emphasize three clear audience segments
- Add a "Which product is right for you?" quiz-style section below the product cards
- Update FAQ answers to reference current capabilities

### Product Hub (`ProductHub.tsx`)
- Replace "Invite Only" on Vanguard with "Start Free Trial" or "View Plans" linking to `/pricing/vanguard`
- Add smart recommendation banner: "Based on your profile, we recommend..." for users who haven't explored all products

### Product Pages
- **SafeSuite** (`SafeSuiteProductPage.tsx`): Emphasize individual-first messaging -- "Protect your digital life" with clear business tier upsell
- **Vanguard** (`VanguardProductPage.tsx`): Lead with "Replace your entire MSP stack" positioning, clear module breakdown
- **AI Studio** (`AIStudioProductPage.tsx`): Focus on "Build AI in minutes, no code required"

### Navigation
- Ensure all product CTAs route to `/auth?return=[product]` so new users get product-aware signup

## Database Changes

Add two columns to `profiles`:

```text
primary_product  text        (nullable) -- safesuite | vanguard | ai_studio
product_interests text[]     (nullable) -- array of selected products
```

## Files Modified

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Replace account type dropdown with product picker cards |
| `src/hooks/useRoleBasedRedirect.tsx` | Add primary_product routing logic |
| `src/components/RoleBasedRedirect.tsx` | Route based on primary_product |
| `src/hooks/useOnboarding.ts` | Check product_interests for adaptive onboarding |
| `src/components/OnboardingFlow.tsx` | Make steps product-aware |
| `src/pages/ProductHub.tsx` | Replace "Invite Only" with actionable CTA, add recommendation banner |
| `src/pages/Index.tsx` | Add "Which product?" section, update messaging |
| `src/pages/products/VanguardProductPage.tsx` | Update CTAs to route through unified auth |
| `src/pages/products/SafeSuiteProductPage.tsx` | Update CTAs to route through unified auth |
| `src/App.tsx` | Remove `/vanguard/auth` route, add redirect |
| `src/routes/vanguardRoutes.tsx` | Remove VanguardAuthPage from public routes |

## Files Deleted

| File | Reason |
|------|--------|
| `src/pages/vanguard/VanguardAuthPage.tsx` | Replaced by unified `/auth` |

## What Stays the Same

- All existing product access logic (`useProductAccess`)
- Separate pricing pages per product
- ProtectedRoute and session management
- MSP/Admin role-based routing priority
- Product Hub remains accessible at `/hub` as the multi-product dashboard


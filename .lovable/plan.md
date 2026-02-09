

# Separate Marketing from Apps: ultriumai.com vs ultriumai.app

## Overview

Split the platform so that **ultriumai.com** serves only marketing/public pages, while **ultriumai.app** serves all authenticated app experiences. The AI Studio App Builder's user-hosted apps (currently at `slug.ultriumai.app`) will move to a new domain to free up `ultriumai.app` for the platform.

## Current State

- **Everything** runs on one domain (ultriumai.com / ultriumai.lovable.app)
- Marketing pages: `/`, `/products/*`, `/pricing/*`, `/terms`, `/privacy`, `/docs/*`, `/changelog`, etc.
- App pages: `/auth`, `/hub`, `/safesuite/*`, `/vanguard/*`, `/ai-studio/*`, `/dashboard/*`, `/settings`, `/admin/*`, etc.
- AI-built apps hosted at `slug.ultriumai.app` via Cloudflare Workers

## Target Architecture

```text
ultriumai.com (Marketing)          ultriumai.app (Platform Apps)
------------------------------     --------------------------------
/                (Homepage)        /auth           (Login/Signup)
/products/*      (Product pages)   /hub            (Product Hub)
/pricing/*       (Pricing)         /safesuite/*    (SafeSuite app)
/terms           (Legal)           /vanguard/*     (Vanguard app)
/privacy         (Legal)           /ai-studio/*    (AI Studio app)
/security        (Legal)           /dashboard/*    (Dashboards)
/docs/*          (Knowledge base)  /settings       (User settings)
/changelog       (Public)          /admin/*        (Admin center)
/feedback        (Public)          /profile        (User profile)
/install         (PWA)             /customer-portal/* (Portal)
/guide           (Public)          /organization   (Org mgmt)
```

AI-built app hosting moves from `slug.ultriumai.app` to `slug.apps.ultriumai.com` (or another domain you choose).

## Implementation Steps

### Step 1: Move AI-Built App Hosting Domain

Update the AI App Builder to use a new hosting domain for user-built apps:

- **Files to change**: `supabase/functions/serve-preview/index.ts`, `src/components/ai-builder/DeployDialog.tsx`, `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
- Replace all `ultriumai.app` references in these files with the new hosting domain (e.g., `apps.ultriumai.com`)
- Update the Cloudflare Worker wildcard DNS to point to the new domain
- **Note**: You'll need to set up a new wildcard DNS record for the new hosting domain in Cloudflare

### Step 2: Create Domain Detection Utility

Update `src/utils/subdomain.ts` to detect which domain the user is on:

- Add a function `isMarketingDomain()` that returns true for `ultriumai.com`
- Add a function `isAppDomain()` that returns true for `ultriumai.app`
- Handle Lovable preview URLs (continue working as-is for development)

### Step 3: Add Cross-Domain Routing Logic

Create a new utility `src/utils/domainRouter.ts`:

- `getAppUrl(path)` -- returns full URL on ultriumai.app for app routes
- `getMarketingUrl(path)` -- returns full URL on ultriumai.com for marketing routes
- In preview/localhost, these return local paths (no redirect needed)
- In production, these return cross-domain URLs

### Step 4: Update App.tsx Router

Add domain-aware routing at the top of `AppRouter`:

- If on **ultriumai.com** and user navigates to an app route (e.g., `/auth`, `/hub`, `/safesuite/*`), redirect to `ultriumai.app` equivalent
- If on **ultriumai.app** and user navigates to a marketing route (e.g., `/products/*`, `/pricing/*`), redirect to `ultriumai.com` equivalent
- On preview/localhost, serve everything as-is (no change to dev experience)

### Step 5: Update Auth Flow for Cross-Domain

Update authentication to work across the two domains:

- **Files**: `src/integrations/supabase/client.ts` -- this file is auto-generated and cannot be edited. Instead, auth sharing will work through Supabase's built-in session detection via `detectSessionInUrl`
- Login happens on `ultriumai.app/auth`
- Marketing site links to `ultriumai.app/auth` for "Sign In" / "Get Started" CTAs
- After login, user stays on `ultriumai.app`
- Since both domains share the same Supabase project, auth tokens work on both (stored in localStorage per domain -- users will just need to log in on the app domain)

### Step 6: Update All Internal Links

Search and update hardcoded references across the codebase:

- Marketing pages: "Sign In" / "Get Started" buttons link to `ultriumai.app/auth`
- App pages: Logo clicks / "Back to homepage" links go to `ultriumai.com`
- Product Hub tiles stay as internal navigation (already on `.app`)
- Edge Functions referencing `ultriumai.com` URLs (e.g., `portal-auth`, `safesuite-customer-portal`) update redirect URLs to use `.app` for app routes
- **Files affected**: ~99 files contain domain references; most are email addresses or branding (no change needed). Key files needing URL updates:
  - `src/components/RoleBasedRedirect.tsx`
  - `src/components/ProtectedRoute.tsx`
  - `src/components/auth/UnifiedAuthRedirect.tsx`
  - `src/pages/UltriumVanguard.tsx`
  - `supabase/functions/portal-auth/index.ts`
  - `supabase/functions/safesuite-customer-portal/index.ts`
  - `supabase/functions/safesuite-team-checkout/index.ts`
  - SEO/schema components

### Step 7: Update SEO and Meta

- `src/components/seo/OrganizationSchema.tsx`: Keep `ultriumai.com` as the organization URL (correct -- it's the marketing site)
- Update canonical URLs so marketing pages point to `.com` and app pages point to `.app`
- Update PWA manifest if applicable

### Step 8: Connect ultriumai.app Domain in Lovable

- Go to **Project Settings > Domains** in Lovable
- Add `ultriumai.app` as a custom domain
- Add DNS records: A record for `@` and `www` pointing to `185.158.133.1`, plus the TXT verification record
- Both `ultriumai.com` and `ultriumai.app` will serve the same Lovable project
- The routing logic in Step 4 handles which content appears on which domain

## What You Need to Do Outside Lovable

1. **DNS for ultriumai.app**: Add A records pointing to Lovable's IP (`185.158.133.1`) and the TXT verification record
2. **New hosting domain for AI-built apps**: Set up DNS (e.g., `apps.ultriumai.com` with wildcard) pointing to your Cloudflare Worker
3. **Update Cloudflare Worker**: Change the worker to match on the new hosting domain instead of `ultriumai.app`

## What Does NOT Change

- Email addresses (`support@ultriumai.com`, `hello@send.ultriumai.com`) stay the same
- Development/preview experience -- everything continues to work on localhost and Lovable preview URLs
- Database, Edge Functions, and auth backend remain identical
- Subdomain redirect logic for `safesuite.ultriumai.com` and `vanguard.ultriumai.com` continues to work (they redirect to path-based routes)


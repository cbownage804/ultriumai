

# Vanguard Separation: Migration Plan

## Overview

Vanguard has grown into an enormous product within UltriumAI -- roughly **90+ pages**, **70+ component directories**, **10+ dedicated hooks**, **50+ edge functions**, and **12+ config files**. Moving it to its own Lovable project will dramatically reduce the size of both projects and allow each to scale independently.

## What Stays in UltriumAI Core (This Project)

The following remain in the current project and are shared across all products:

- **Product Hub** (`/hub`) -- update the Vanguard tile to link externally to `vanguard.ultriumai.com`
- **Auth system** (`useAuth`, `AuthPage`, Supabase client config)
- **Admin Center**, Organization management
- **SafeSuite** (all `/safesuite` routes, components, edge functions)
- **AI Studio** (all `/ai-studio` routes, components, edge functions)
- **Shared UI** (`src/components/ui/*`, `InfoTooltip`, `PageHelpButton`, etc.)
- **Global features** (Knowledge Base sidebar, Floating Help Button, Guide page)
- **Billing/Stripe** infrastructure shared across products

## What Moves to the New Vanguard Project

### 1. Pages (90+ files)

| Location | Count |
|---|---|
| `src/pages/vanguard/*` | ~89 files (full directory) |
| `src/pages/VanguardDashboard.tsx` | 1 |
| `src/pages/VanguardDevices.tsx` | 1 |
| `src/pages/VanguardDeviceDetail.tsx` | 1 |
| `src/pages/VanguardSetup.tsx` | 1 |
| `src/pages/UltriumVanguard.tsx` | Remove (redirect page, no longer needed) |

### 2. Components (70+ directories and standalone files)

The entire `src/components/vanguard/` directory moves, including all subdirectories:

`ai-command`, `analytics`, `automation`, `billing`, `comanaged`, `comply`, `copilot`, `cortex`, `dashboard`, `device`, `devices`, `helpdesk`, `horizon`, `integrations`, `notifications`, `pentest`, `portal`, `profiles`, `pursuit`, `recon`, `reports`, `sentinel`, `settings`, `shared`, `ui`, `vulnscan`

Plus ~65 standalone component files (VanguardNavigation, VanguardLayout, HorizonDashboard, etc.)

### 3. Hooks (10 files)

- `useVanguardSubscription.ts`
- `useVanguardAgentConfig.ts`
- `useVanguardCustomer.ts`
- `useVanguardAtlas.ts`
- `useVanguardScanner.ts`
- `useVanguardLimits.ts`
- `useCortexFeatures.ts`
- Plus any other `useVanguard*` or module-specific hooks (threat hunts, vulnerability scans, etc.)

### 4. Contexts

- `VanguardSubscriptionContext.tsx`

### 5. Config Files

- `vanguardTierLimits.ts`
- `reconPricing.ts`
- `productPricing.ts` (Vanguard-specific portions)
- `moduleTours.ts` (Vanguard tour definitions)
- `pageInstructions.ts` (Vanguard section)

### 6. Routes

- `src/routes/vanguardRoutes.tsx` -- the entire file becomes the new project's route tree

### 7. Edge Functions (~50+)

All Vanguard-prefixed and module-specific functions move:

**Vanguard Core:** `vanguard-agent-api`, `vanguard-agent-config`, `vanguard-agentless-scan`, `vanguard-ai-copilot`, `vanguard-ai-ticket-processor`, `vanguard-alerting`, `vanguard-autonomous-response`, `vanguard-behavioral-engine`, `vanguard-check-subscription`, `vanguard-checkout`, `vanguard-connectivity-test`, `vanguard-customer-portal`, `vanguard-general-chat`, `vanguard-network-connector`, `vanguard-notification-engine`, `vanguard-relay-config`, `vanguard-threat-detector`

**RMM/Horizon:** `rmm-agent-checkin`, `rmm-agent-download`, `rmm-agent-manager`, `rmm-agent-ps`, `rmm-agent`, `rmm-checkin`, `rmm-client-config`, `rmm-command-result`, `rmm-command`, `rmm-commands`, `rmm-realtime`, `rmm-remote-api`, `rmm-remote-session`, `horizon-agent-commands`, `agent-checkin`, `agent-console-operations`, `agent-file-operations`, `agent-provision`

**Security/XDR:** `xdr-*` (6 functions), `threat-intel-*` (4 functions), `siem-*` (3 functions), `malware-scanner`, `containment-action`, `fim-operations`, `ip-reputation`, `dark-web-monitor`, `incident-manager`, `live-response`, `uba-analysis`

**Helpdesk/Response:** `email-to-ticket`, `process-inbound-email`, `helpdesk-ai-features`, `psa-sync`, `portal-*` (6 functions)

**Compliance/Recon:** `compliance-*` (7 functions), `recon-*` (4 functions), `pentest-ai-analysis`, `run-compliance-scan`

**AI (Vanguard-specific):** `ai-ticket-*`, `ai-helpdesk-*`, `ai-edr-*`, `ai-patch-manager`, `ai-smart-alerts`, `ai-technician-copilot`, `ai-escalation-engine`, `generate-script`, `generate-executive-report`, `generate-msp-invoice`

**Billing:** `msp-billing`, `msp-billing-unified`, `get-msp-billing-data`, `provision-client-tenant`, `business-billing`

**Other:** `white-label-config`, `sentinel-ai-triage`, `m365-*`, `gws-security-monitor`, `meraki-networks`, `monitor-device`, `webhook-delivery`, `availability-monitor`, `scheduled-report-generator`

### 8. Assets

- `vanguard-logo.png` and any Vanguard-specific images/icons in `src/assets/` or `public/lovable-uploads/`

## Steps to Execute the Migration

### Step 1: Create a New Lovable Project

Start a brand new Lovable project called "Vanguard" and set up the base stack:
- React + Vite + Tailwind + TypeScript (default Lovable stack)
- Connect the **same Supabase backend** so all database tables and edge functions are shared
- Install the same key dependencies (Radix UI, TanStack Query, Recharts, TipTap, Framer Motion, etc.)

### Step 2: Copy Shared Foundation into the New Project

Recreate these shared pieces in the new project:
- `src/components/ui/*` (shadcn components)
- `src/hooks/useAuth.ts` and auth utilities
- `src/integrations/supabase/client.ts` and types
- `src/lib/utils.ts`
- Tailwind config (dark theme, custom colors)
- The help system (`PageHelpButton`, `InfoTooltip`, `FloatingHelpButton`, Knowledge Base)

### Step 3: Move Vanguard Code to the New Project

Transfer all files listed above (pages, components, hooks, contexts, configs, routes) into the new project, maintaining the same directory structure but removing the `/vanguard` path prefix from routes (since the entire app IS Vanguard now).

For example:
- `/vanguard/dashboard` becomes `/dashboard`
- `/vanguard/tickets` becomes `/tickets`
- `/vanguard/horizon/operations` becomes `/horizon/operations`

### Step 4: Move Edge Functions

Copy all ~50+ Vanguard edge functions to the new project's `supabase/functions/` directory. Since they share the same Supabase backend, they will continue working with the same database tables.

### Step 5: Update UltriumAI Core (This Project)

After the new project is set up:

1. **Remove** all Vanguard files from this project:
   - Delete `src/components/vanguard/` entirely
   - Delete `src/pages/vanguard/` entirely
   - Delete Vanguard-specific pages from `src/pages/`
   - Delete `src/routes/vanguardRoutes.tsx`
   - Delete Vanguard hooks, contexts, and configs
   - Delete Vanguard edge functions from `supabase/functions/`

2. **Update Product Hub** to link externally:
   - Change the Vanguard tile's `href` to `https://vanguard.ultriumai.com`
   - Use `window.location.href` instead of `navigate()` for the Vanguard button

3. **Update subdomain logic** -- remove Vanguard handling from `subdomain.ts` and `productRoutes.ts`

4. **Clean up** unused imports, dead routes in `App.tsx`, and any cross-references

### Step 6: Configure Custom Domain

Set up `vanguard.ultriumai.com` as a custom domain on the new Lovable project (in Project Settings > Domains).

## Important Notes

- **Shared Supabase Backend**: Both projects connect to the same Supabase instance. Database tables, RLS policies, and auth all remain unchanged. No data migration is needed.
- **Auth Continuity**: Since both projects share the same Supabase auth, users who sign in on one can access the other. You may want to implement a seamless cross-domain session handoff later.
- **Incremental Approach**: You can build the new Vanguard project incrementally -- start with the core layout, navigation, and dashboard, then move modules one by one.
- **This project will NOT be modified today** -- the plan is to guide you on what to build in the new project and what to remove here later.

## Estimated Scope

| Category | File Count |
|---|---|
| Pages to move | ~93 |
| Component directories to move | ~26 subdirectories + ~65 standalone files |
| Hooks to move | ~10 |
| Edge functions to move | ~50+ |
| Config files to move | ~5 |
| Routes file | 1 |

This is a large but straightforward migration since Vanguard is already well-isolated behind its own layout, routes, and component tree.


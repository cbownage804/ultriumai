

# Unified Team & License Management System

## The Problem

Today, the platform has **fragmented team/access models**:
- **SafeSuite** has `safesuite_teams` + `safesuite_team_members` with seat-based management (Business tier only)
- **AI Studio** has credit pools but no team/member management
- **Vanguard** has its own subscription context with per-technician billing
- **`user_product_access`** tracks individual user access levels but has no concept of "this user belongs to Organization X and their access is paid for by Organization X"

There's no unified way for a company admin to say: *"I'm paying for 10 seats across SafeSuite Pro + AI Studio Team Plus, and here are my employees."*

## Proposed Solution: Organization-Level License Management

### Core Concept

Introduce an **Organization** entity that owns licenses (subscriptions) and assigns them to members. This sits above the existing per-product access system.

```text
Organization (company)
  |-- Licenses (SafeSuite Pro x10, AI Studio Team Plus x10)
  |-- Members (employees)
        |-- Assigned Licenses (John gets SafeSuite Pro + AI Studio)
```

### Key Design Decisions

1. **Per-seat licensing**: Each product license has a seat count. Admins assign seats to members.
2. **Cross-product bundles**: An org can hold licenses for any combination of products (SafeSuite, AI Studio, Vanguard).
3. **Role-based org management**: Owner, Admin, Member roles within the organization.
4. **Backward compatible**: Individual users keep working exactly as today. Org membership is additive -- it upgrades a user's `user_product_access` level.

---

## Technical Plan

### 1. New Database Tables

**`organizations`** -- The company/team entity
- `id`, `name`, `slug`, `owner_id`, `billing_email`, `max_members`, `created_at`

**`organization_members`** -- Who belongs to the org
- `id`, `organization_id`, `user_id`, `email`, `role` (owner/admin/member), `status` (active/pending/suspended), `invited_by`, `joined_at`

**`organization_licenses`** -- What products the org has paid for
- `id`, `organization_id`, `product` (ai_studio/safesuite/vanguard), `access_level` (pro/business/enterprise), `total_seats`, `used_seats`, `stripe_subscription_id`, `billing_cycle`, `started_at`, `expires_at`

**`organization_license_assignments`** -- Which member gets which license
- `id`, `license_id`, `member_id`, `assigned_by`, `assigned_at`

All tables get RLS policies scoped to organization membership.

### 2. Backend Changes

- **New edge function `org-checkout`**: Creates a Stripe checkout session for org-level licenses (product + seats + billing cycle). Replaces the need for separate per-product team checkout functions.
- **Webhook handler update**: When an org subscription is confirmed, populate `organization_licenses` and auto-upgrade each assigned member's `user_product_access` row.
- **Invite flow**: Org admins invite by email. On acceptance, the member's `user_product_access` is upgraded to match their assigned licenses.

### 3. Frontend: Organization Management Page (`/organization`)

A new page accessible from the user menu with tabs:

- **Members** -- Invite, remove, change roles. Shows seat usage per license.
- **Licenses** -- View active licenses, seat allocation, renewal dates. "Add License" triggers checkout.
- **Settings** -- Org name, billing email, danger zone (delete org).

### 4. Integration with Existing Systems

- **`useProductAccess` hook**: Extended to check both individual access AND org-assigned licenses. If a user has an org license for SafeSuite Pro, `hasAccess('safesuite', 'pro')` returns `true`.
- **SafeSuite Team**: The existing `safesuite_teams` system continues to work for shared vaults. Org membership becomes the billing/access layer on top.
- **AI Studio Credits**: Org licenses for AI Studio grant the corresponding credit pool. The org admin can optionally set per-member credit limits.
- **Vanguard**: Org licenses map to Vanguard tier access, working alongside the existing `VanguardSubscriptionContext`.

### 5. Migration Path

- Existing `safesuite_teams` data is preserved. A migration utility can optionally link existing teams to new organizations.
- No breaking changes to individual users -- the org system is purely additive.

---

## File Changes Summary

| Area | Files | Action |
|------|-------|--------|
| Database | New migration SQL | Create 4 tables + RLS + triggers |
| Hook | `src/hooks/useOrganization.ts` | New -- CRUD for org, members, licenses |
| Hook | `src/hooks/useProductAccess.ts` | Update -- check org licenses too |
| Page | `src/pages/OrganizationManagement.tsx` | New -- Members/Licenses/Settings tabs |
| Edge Function | `supabase/functions/org-checkout/index.ts` | New -- Stripe checkout for org licenses |
| Edge Function | `supabase/functions/stripe-webhooks/index.ts` | Update -- handle org subscription events |
| Routes | `src/App.tsx` | Add `/organization` route |
| Navigation | User menu component | Add "Organization" link |



# Wrayth Platform Admin Console — Build Plan

A full multi-tenant control center at `/admin/*`, gated by a new RBAC layer. Built in phased slices so each ships working end-to-end rather than one giant unusable skeleton.

---

## Phase 0 — User Wipe (runs first, once approved)

Hard-delete every `auth.users` row **except** `brandon@ultriumai.com`.

- Edge function `admin-wipe-users` (service role) that:
  1. Looks up Brandon's user_id.
  2. Iterates all other users, calls `auth.admin.deleteUser(id)` — cascades through every `user_id`-referenced table.
  3. Truncates orphaned rows on tables without FK cascade (`profiles`, `subscribers`, `msps`, `msp_clients`, `user_roles`, `safepass_*`, `ray_org_*`, `org_team_*`, `org_credits`).
- One-time run via the admin UI ("Danger Zone" button, typed-confirmation modal). No cron, no repeat.
- Grants Brandon `super_admin` in the new `platform_roles` table after wipe.

Explicit user confirmation required in the UI before it fires.

---

## Phase 1 — RBAC foundation (migration)

New role model (separate from existing `user_roles` which is app-tenant scoped):

- `platform_role` enum: `super_admin`, `support`, `billing_ops`, `platform_ops`, `read_only`.
- `platform_admins(user_id, role, granted_by, granted_at)`.
- `has_platform_role(_uid, _role)` — SECURITY DEFINER, used by all admin RLS + edge functions.
- `is_platform_admin(_uid)` — true for any non-null platform role.
- `admin_audit_trails` already exists — reused; every admin edge function writes one row per action.

Route guard `<PlatformAdminGate role="...">` wraps all `/admin/*` routes and calls `has_platform_role` via RPC.

---

## Phase 2 — Admin shell + navigation

New route tree under `/admin` with its own layout (sidebar + topbar, distinct from `/app`):

```
/admin
  /platform      dashboard, users, organizations
  /msps          list, /msps/:id (tenant switch drill-down)
  /billing       revenue, stripe, ray-compute
  /ops           announcements, feature-flags, audit-log, support, health
  /threat        global-threats, device-fleet, agent-releases
  /ai            usage, prompts, costs
```

Shared primitives: `<AdminPageHeader>`, `<AdminMetricCard>`, `<AdminDataTable>` (search + column filter + pagination + CSV export), `<DrillDownDialog>`.

---

## Phase 3 — Data modules (each = one edge function + one page)

Every module is a thin React page backed by a service-role edge function that enforces `has_platform_role` on entry. No direct client-side reads of admin-only data.

### 3a. Platform → Users
- Edge fn `admin-users`: list/search, get detail (profile + login history + devices + subscription + RC balance), suspend/unsuspend, delete, reset password, grant credits, force MFA reset, impersonate (mints a short-lived magic link).
- Page: searchable table → drawer with tabs (Overview / Devices / Subscription / Ray Compute / Activity).

### 3b. Platform → Organizations
- Edge fn `admin-orgs`: list orgs joined w/ member/device/vault/threat counts, compute usage, plan, computed health score.
- Detail page mirrors M365-admin style: header (name/owner/plan/health) + tabs (Members, Devices, Vaults, Threats, Billing, Activity).

### 3c. MSPs
- Edge fn `admin-msps`: list MSPs, drill into MSP → client grid (name + security score badge). "Enter tenant" mints a scoped impersonation session and routes to `/app/dashboard?as=<client_id>`.
- MSP detail: fleet score, critical issues, pending recommendations, devices, users, licenses, billing, compute usage, reports, policies (all pulled from existing `msp_*` and `ray_org_*` tables).

### 3d. Billing & Revenue
- Edge fn `admin-billing`: aggregates Stripe (`stripe.subscriptions.list`, `invoices.list`, `charges.list`) + local `payment_transactions`, `ai_credit_ledger`, `subscribers`.
- Rows: MRR / ARR / new / churn / ARPU / LTV; plan mix; RC used today / purchases / credits sold / investigations run; Stripe activity / refunds / failed / past due / canceled / trials ending.

### 3e. Platform Operations
- Reuses existing tables: `admin_announcements`, `feature_flags`, `admin_audit_trails`, `support_tickets`, `platform_changelog`, `system_health_metrics`, `platform_error_logs`.
- Pages: CRUD tables + a maintenance-banner toggle wired into a new `admin_banner` feature flag consumed globally in `WraythLayout`.

### 3f. Threat Intel
- Reads: `xdr_threats`, `xdr_iocs`, `security_alerts`, `safeweb_threats`, `safemail_threats`, `safenet_vulnerabilities`, `ray_attack_paths`.
- Aggregates: threats today by category, top CVEs, most vulnerable software, top attack paths.

### 3g. Agent Fleet
- Reads: `vanguard_agents`, `rmm_agents`, `wrayth_agent_release`, `vanguard_agent_metrics`.
- KPIs: online/offline, per-OS counts, agent versions vs latest release, needs-update, check-in failures, last heartbeat table.

### 3h. AI Analytics
- Reads: `ai_credit_ledger`, `ai_agent_runs`, `ray_skill_invocations`, `ray_playbook_runs`, `copilot_messages`, `ray_investigations`.
- Charts: top questions, top playbooks, avg RC cost, feature adoption, model cost (RC × unit price).

---

## Phase 4 — Audit logging

Every edge function writes to `admin_audit_trails` with `{actor_id, action, target_type, target_id, before, after, ip}`. Audit-log page reads it back with filter/search.

---

## Technical section

- **Migrations** (single migration):
  - `CREATE TYPE platform_role`; `CREATE TABLE public.platform_admins` w/ GRANTs to `authenticated`+`service_role`, RLS enabled, self-select policy.
  - `has_platform_role(uuid, platform_role)` + `is_platform_admin(uuid)` SECURITY DEFINER.
  - `admin_banner` seed in `feature_flags`.
- **Edge functions** (all `verify_jwt = true`, all call `has_platform_role` before any work):
  `admin-wipe-users`, `admin-users`, `admin-orgs`, `admin-msps`, `admin-billing`, `admin-ops`, `admin-threat-intel`, `admin-agent-fleet`, `admin-ai-analytics`, `admin-impersonate`.
- **Frontend**:
  - Route file `src/routes/admin.tsx` + `src/pages/admin/**` (one file per subpage).
  - Shared `src/components/admin/*` primitives.
  - `useAdminRole()` hook + `<PlatformAdminGate>`.
  - Recharts for graphs (already installed).
- **Stripe**: reuses existing `STRIPE_SECRET_KEY`. Billing aggregates cached in-memory per request; no cron in v1.
- **Impersonation**: edge fn creates a magic link via `generateLink({ type: 'magiclink' })`, logs to `admin_impersonation_logs`, returns URL — admin clicks through in a new tab.

### Deferred to v2 (call out, don't build)
- Scheduled snapshotting of MRR/ARR into `revenue_analytics` (currently computed live on each visit).
- Real-time websocket dashboards.
- Fine-grained per-column RBAC (v1 is role-gated, not field-gated).
- Public status page.

---

## Build order & why

1. Migration + wipe function (blocks everything, and user asked for the wipe).
2. Admin shell + RBAC gate.
3. Users → Orgs → MSPs (highest-value operational surfaces).
4. Billing (revenue visibility).
5. Ops (announcements/flags — small, high ROI).
6. Threat Intel + Agent Fleet + AI Analytics (read-only dashboards, mostly SQL aggregations).

Shipping this in one turn would be ~40+ files. **I'll execute Phase 0 + Phase 1 + Phase 2 + Phase 3a (Users) in the first pass**, then continue module-by-module in subsequent turns so you can review each slice as it lands rather than getting one giant unreviewable dump.

Confirm and I'll start with the migration + wipe.

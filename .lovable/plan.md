

# Sitewide Feature Expansion — Phased Rollout

## Phase 1: Global UX Upgrades

### What already exists
- Global Command Palette (Cmd+K) with 35+ routes
- Global Breadcrumbs (auto-generated from URL)
- Keyboard Shortcuts overlay (Shift+?)
- Hub Onboarding Tour
- Light/Dark/System theme toggle

### What to add

**1.1 — Global User Menu (Profile Dropdown)**
Replace the scattered Profile/Sign Out buttons across Product Hub, Vanguard, and SafeSuite headers with a single reusable `UserProfileDropdown` component. It will show the user avatar, name, email, and quick links to Profile, Settings, Notifications, Billing, and Sign Out. This gives every authenticated page a consistent top-right identity anchor.

**1.2 — Toast Notification Feed (Persistent)**
The current notification centers are product-specific (Vanguard has `RealtimeNotificationCenter`, general app has `NotificationCenter`). Add a unified global notification bell in the user menu that aggregates all product notifications into one feed with badge count, available on every page.

**1.3 — Global "What's New" Changelog Sidebar**
A `PlatformChangelogTab` already exists in the Admin Center. Surface a user-facing "What's New" indicator (a sparkle dot on the user menu) that opens a slide-over showing recent platform updates. This keeps users informed about new features without requiring email blasts.

**1.4 — Page Transition Animations**
Add subtle Framer Motion page transitions (fade + slight vertical slide) at the route level via the `SuspenseWrapper`. This eliminates the jarring hard-cut between pages and feels polished.

---

## Phase 2: Analytics and Insights

### What already exists
- `useAnalytics` hook (Google Analytics gtag integration)
- `useAnalyticsTracking` hook (event tracking)
- `ActivityFeedWidget` on Product Hub
- Executive Dashboard in Vanguard (mock data)
- Admin Center with user activity feed

### What to add

**2.1 — Admin Analytics Dashboard**
A new tab in the Unified Admin Center showing real user metrics: DAU/MAU, product adoption (which products are opened most), feature usage heatmap (which pages get traffic), and signup-to-activation funnel. Pulls from the existing `user_activity_feed` table.

**2.2 — User Session Insights**
Track and display per-user engagement: last login, session count, most-used product, and account health score. Visible in the Admin Center's customer accounts view.

**2.3 — Product Adoption Metrics**
Add a simple dashboard widget showing how many users have accessed each product (AI Studio, Vanguard, SafeSuite) in the last 7/30 days, plus new activations. Helps identify which products need more onboarding attention.

---

## Phase 3: Revenue and Growth

### What already exists
- Pricing pages for all products (AI Studio, Vanguard, SafeSuite, Custom Apps)
- Stripe integration for payments (PaymentSuccess/PaymentCancel pages)
- Credits purchase flow
- MSP Churn Prediction component
- Subscription management hooks

### What to add

**3.1 — In-App Upgrade Prompts**
Smart contextual upgrade nudges that appear when users hit limits (e.g., "You've used 90% of your AI credits" or "Upgrade to unlock this feature"). Uses the existing feature-gating infrastructure but adds friendly, non-blocking banner prompts instead of hard walls.

**3.2 — Referral Program**
A "Refer a Friend" page accessible from the user menu. Users get a unique referral link, can track invites sent vs. converted, and earn credits or discounts. Requires a new `referrals` table and a simple tracking edge function.

**3.3 — Usage-Based Billing Alerts**
Email and in-app notifications when users approach credit thresholds (50%, 75%, 90%, 100%). Uses the existing `ai_credit_ledger` table and adds threshold-check logic.

---

## Phase 4: Content and Engagement

### What already exists
- Admin Announcements system (database tables exist)
- Customer Portal announcement banner
- Knowledge Base in Customer Portal and Docs pages
- Survey page

### What to add

**4.1 — Public Changelog Page**
A `/changelog` route showing versioned product updates with dates, descriptions, and category tags (New Feature, Improvement, Fix). Admin creates entries from the Admin Center; users see a read-only, nicely formatted timeline.

**4.2 — In-App Feature Request Board**
A `/feedback` page where authenticated users can submit feature requests, upvote existing ones, and see status updates (Under Review, Planned, Shipped). Requires a new `feature_requests` table with upvote tracking.

**4.3 — System Status Banner**
A lightweight global banner that appears at the top of every page when there's an active incident or scheduled maintenance. Controlled via an `system_status` table or admin toggle.

---

## Implementation Order

```text
Phase 1 (UX)      --> 1.1 User Menu -> 1.2 Notification Feed -> 1.4 Transitions -> 1.3 Changelog Sidebar
Phase 2 (Analytics)--> 2.1 Admin Dashboard -> 2.2 Session Insights -> 2.3 Adoption Metrics
Phase 3 (Revenue)  --> 3.1 Upgrade Prompts -> 3.3 Billing Alerts -> 3.2 Referral Program
Phase 4 (Content)  --> 4.1 Changelog Page -> 4.3 Status Banner -> 4.2 Feature Request Board
```

## Technical Notes

- **No new dependencies required** — Framer Motion (already installed) handles animations; all UI uses existing Radix/shadcn primitives
- **Database tables needed**: `referrals`, `feature_requests`, `feature_request_votes`, `system_status`, `platform_changelog` (public-facing)
- **Edge functions needed**: `track-referral`, `check-credit-thresholds`
- **Existing patterns followed**: All new components use the established shadcn/Radix component library, Supabase queries via `@tanstack/react-query`, and the existing auth/subscription context providers


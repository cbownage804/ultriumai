
# UltriumAI Platform Rollout Implementation Plan

## Overview
This plan implements the comprehensive brand and naming consolidation rollout across all 5 phases as specified. All changes are **UI labeling, navigation, and presentation only** — no functionality, enforcement, permissions, or billing logic changes.

---

## Phase 1: Brand & Naming Consolidation

### 1.1 Vanguard Module Naming Map

The following branded names will be applied throughout the platform:

| Capability | Branded Module Name | Current Label |
|------------|---------------------|---------------|
| RMM / Ops Monitoring | **Vanguard Horizon** | Devices, RMM |
| Security / SOC / Detection | **Vanguard Pursuit** | Alerts, SOC, Threats |
| Network Discovery | **Vanguard Recon** | Network Discovery |
| Incident / Helpdesk | **Vanguard Response** | Tickets, Service Desk |
| AI Copilot | **Vanguard Cortex** | AI Copilot |
| Knowledge Base | **Vanguard Atlas** | Knowledge Base |
| Compliance / Reports | **Vanguard Ledger** | Reports, Compliance |

### 1.2 Files to Update

**Navigation Component:**
- `src/components/vanguard/VanguardNavigation.tsx` — Update all nav item titles to use branded names

**Page Headers (document.title + visible headers):**
- `src/pages/vanguard/VanguardRMM.tsx` — "Vanguard Horizon"
- `src/pages/vanguard/VanguardHelpdesk.tsx` — "Vanguard Response"  
- `src/pages/vanguard/VanguardAlerts.tsx` — "Vanguard Pursuit"
- `src/pages/vanguard/VanguardKnowledge.tsx` — "Vanguard Atlas"
- `src/pages/vanguard/VanguardReports.tsx` — "Vanguard Ledger"
- `src/pages/vanguard/VanguardAIKnowledge.tsx` — "Vanguard Cortex"
- `src/pages/vanguard/VanguardAISessions.tsx` — "Vanguard Cortex"
- `src/pages/vanguard/VanguardAIAnalytics.tsx` — "Vanguard Cortex"
- Network-related pages — "Vanguard Recon"

---

## Phase 2: Dashboard & Navigation Alignment

### 2.1 Dashboard Branding

**File:** `src/pages/VanguardDashboard.tsx`

Changes:
- Rename "Dashboard" title → **"Vanguard Command"**
- Add subtitle: *"Unified visibility across Horizon, Pursuit, Response, and Cortex"*
- Update `document.title` to "Vanguard Command | Ultrium Vanguard"

### 2.2 Sidebar Navigation Structure

**File:** `src/components/vanguard/VanguardNavigation.tsx`

Reorganize navigation with semantic grouping headers:

```text
Vanguard Command (Dashboard)

━━ VANGUARD HORIZON ━━
  • Devices
  • Agent Health
  • Patches

━━ VANGUARD PURSUIT ━━  
  • Alerts
  • Threats
  • SOC
  • Vulnerabilities

━━ VANGUARD RECON ━━
  • Network Discovery
  • Asset Mapping

━━ VANGUARD RESPONSE ━━
  • Tickets
  • SLAs
  • Customers

━━ VANGUARD ATLAS ━━
  • Knowledge Base
  • SOPs

━━ VANGUARD LEDGER ━━
  • Reports
  • Compliance

━━ VANGUARD CORTEX ━━
  • AI Dashboard
  • KB Generator
  • Session Summaries
  • AI Analytics
```

Implementation approach:
- Add section header dividers using subtle cyan text
- Keep existing routes unchanged
- Group items logically under branded headers

### 2.3 Dashboard Widget Grouping

**File:** `src/pages/VanguardDashboard.tsx`

Add section headers above widget groups:
- "Vanguard Response — Ticket Status" above TicketStatusWidget
- "Vanguard Pursuit — Active Threats" above AlertStatusWidget
- "Vanguard Horizon — Device Health" above AvailabilityMonitoringWidget
- "Vanguard Cortex — AI Operations" (future AI widget placeholder)

---

## Phase 3: Marketing Site & Product Pages

### 3.1 Product Pages Verification

Confirm these public routes exist and are accessible:
- `/products/ai-studio` ✓ (AIStudioProductPage.tsx)
- `/products/vanguard` ✓ (VanguardProductPage.tsx)  
- `/products/safesuite` ✓ (SafeSuiteProductPage.tsx)

### 3.2 Update VanguardProductPage.tsx

**File:** `src/pages/products/VanguardProductPage.tsx`

Changes:
- Replace "SafeOps™ RMM" → "Vanguard Horizon (RMM & Monitoring)"
- Replace "SafeDesk™ Helpdesk" → "Vanguard Response (Service Desk)"
- Add module names to capability cards where appropriate
- Keep CTAs routing to `/contact` (not `/auth`)

### 3.3 Navigation Rules

**File:** `src/components/Navigation.tsx`

Verify:
- Products dropdown routes to `/products/*` pages ✓
- No auto-redirect to login from product exploration
- Separate "Dashboard" link for authenticated users ✓

---

## Phase 4: Social Content System

No code changes required — this phase defines content rules for the existing social media generator.

**Verification only:**
- Confirm AI Studio content emphasizes "Business AI Control Plane"
- Confirm SafeSuite content emphasizes practical security
- Confirm links route to `/products/*` pages

---

## Phase 5: Sales Enablement

No code changes required — this phase is post-launch documentation work.

---

## Technical Implementation Details

### Navigation Component Restructure

The VanguardNavigation.tsx will be updated to use a grouped structure:

```typescript
interface NavGroup {
  header: string;
  brandName: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    header: 'VANGUARD HORIZON',
    brandName: 'Horizon',
    items: [
      { title: 'Devices', path: `${basePath}/devices`, icon: Monitor },
      { title: 'Patches', path: `${basePath}/patches`, icon: Package },
    ]
  },
  {
    header: 'VANGUARD PURSUIT',
    brandName: 'Pursuit',
    items: [
      { title: 'Alerts', path: `${basePath}/alerts`, icon: Bell },
      { title: 'SOC', path: `${basePath}/soc`, icon: Shield },
      { title: 'Threats', path: `${basePath}/threats`, icon: Target },
    ]
  },
  // ... additional groups
];
```

### Page Header Pattern

Each page will follow this consistent header pattern:

```typescript
<div className="flex items-center gap-3">
  <div className="p-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30">
    <Icon className="h-6 w-6 text-cyan-400" />
  </div>
  <div>
    <h1 className="text-2xl font-bold text-white">Vanguard {ModuleName}</h1>
    <p className="text-white/60">{Capability description}</p>
  </div>
</div>
```

---

## Files to Modify (Complete List)

### Phase 1 & 2 (Core Navigation & Branding)

| File | Changes |
|------|---------|
| `src/components/vanguard/VanguardNavigation.tsx` | Add grouped structure with branded headers |
| `src/pages/VanguardDashboard.tsx` | Rename to "Vanguard Command", add section headers |
| `src/pages/vanguard/VanguardHome.tsx` | Update module cards with branded names |
| `src/pages/vanguard/VanguardRMM.tsx` | "Vanguard Horizon (Endpoint Management)" |
| `src/pages/vanguard/VanguardHelpdesk.tsx` | "Vanguard Response (Service Desk)" |
| `src/pages/vanguard/VanguardAlerts.tsx` | "Vanguard Pursuit (Alerts)" |
| `src/pages/vanguard/VanguardKnowledge.tsx` | "Vanguard Atlas (Knowledge Base)" |
| `src/pages/vanguard/VanguardReports.tsx` | "Vanguard Ledger (Reports & Compliance)" |
| `src/pages/vanguard/VanguardAIKnowledge.tsx` | "Vanguard Cortex (KB Generator)" |
| `src/pages/vanguard/VanguardAISessions.tsx` | "Vanguard Cortex (Session Summaries)" |
| `src/pages/vanguard/VanguardAIAnalytics.tsx` | "Vanguard Cortex (AI Analytics)" |

### Phase 3 (Marketing Pages)

| File | Changes |
|------|---------|
| `src/pages/products/VanguardProductPage.tsx` | Update SafeOps/SafeDesk branding to Horizon/Response |

---

## Acceptance Verification Checklist

### Phase 1
- [ ] All UI labels reflect finalized module names
- [ ] No legacy generic labels visible to users
- [ ] No functionality changes occurred

### Phase 2  
- [ ] Dashboard renamed to "Vanguard Command"
- [ ] New user immediately understands module ownership
- [ ] Navigation grouped semantically by module
- [ ] No UI regressions or broken navigation

### Phase 3
- [ ] Incognito users can fully explore all products
- [ ] Navigation never surprises users with login
- [ ] CTAs lead to pricing/contact, not forced auth

---

## Implementation Order

1. **VanguardNavigation.tsx** — Core navigation restructure with grouped headers
2. **VanguardDashboard.tsx** — Rename to Vanguard Command with widget sections
3. **Individual page files** — Update all page titles and headers
4. **VanguardHome.tsx** — Update module cards with branded names
5. **VanguardProductPage.tsx** — Update marketing page branding

---

## Constraints Enforced

- ✓ No pricing tier changes
- ✓ No token/credit/query exposure
- ✓ No "unlimited" language
- ✓ No AI capacity visibility
- ✓ No auto-redirects to login
- ✓ No backend behavior changes
- ✓ UI labeling only

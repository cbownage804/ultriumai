

# Merge Horizon Sub-Menus into the Main Black Sidebar

## Problem
The Horizon RMM page currently renders its own second sidebar (`HorizonSidebar`) next to the main `VanguardNavigation` sidebar, creating an awkward double-sidebar layout. The user wants all Horizon sub-modules (Alerting, Patching, Security/EDR, Integrations, Remote Access, Access Control, Reporting) nested under the existing "VANGUARD HORIZON" group in the main black sidebar.

## Solution

Move the Horizon sub-items into the main sidebar as nested expandable groups, and convert the RMM page to route-based navigation instead of local state.

## What Changes

### 1. Expand VANGUARD HORIZON items in VanguardNavigation

Update the Horizon nav group in `VanguardNavigation.tsx` to include all the sub-module items as direct nav links, replacing the current short list (RMM Dashboard, Devices, Patches, Assets, Scripts, Backups, Automation):

```
VANGUARD HORIZON
  RMM Dashboard
  Devices / Patches / Assets / Scripts / Backups / Automation  (existing)
  --- Alerting ---
    Notifications / Escalation / On-Call / Suppression
  --- Patching ---
    Scheduling / Compliance / Rollback / Third-Party
  --- Security / EDR ---
    Threats / Vulnerabilities / Baselines / Playbooks
  --- Integrations ---
    PSA / Documentation / Backup / Discovery
  --- Remote Access ---
    File Transfer / Wake-on-LAN
  --- Access Control ---
    Multi-Tenant / RBAC / Activity Logs
  --- Reporting ---
    Executive / Scheduled / White-Label / SLA
```

Each sub-category heading (Alerting, Patching, etc.) will be a collapsible sub-group within the Horizon section, matching the existing CollapsibleNavGroup pattern but as a nested level.

### 2. Create routes for each Horizon sub-module

Add individual routes in `vanguardRoutes.tsx` for each sub-module (e.g., `/rmm/notifications`, `/rmm/escalation`, `/rmm/threats`, etc.) so the main sidebar can link to them directly.

### 3. Simplify VanguardRMM page

Remove the `HorizonSidebar` from `VanguardRMM.tsx`. Instead, use the route path to determine which module to render. The page will read the current route parameter and display the appropriate component, or default to the `HorizonDashboard`.

### 4. Add nested group support to CollapsibleNavGroup

Extend `CollapsibleNavGroup.tsx` to support a second level of collapsible sub-groups within a module, so Horizon's categories (Alerting, Patching, etc.) can expand/collapse independently under the Horizon header.

## Technical Details

**Files to modify:**
- `src/components/vanguard/VanguardNavigation.tsx` -- Add all Horizon sub-items with sub-group labels
- `src/components/vanguard/CollapsibleNavGroup.tsx` -- Add support for nested sub-groups (items can optionally be grouped under a sub-header with its own collapse toggle)
- `src/pages/vanguard/VanguardRMM.tsx` -- Remove HorizonSidebar, use route params to select module
- `src/routes/vanguardRoutes.tsx` -- Add child routes under `/rmm/:moduleId`

**Files no longer needed (can be kept but unused):**
- `src/components/vanguard/horizon/HorizonSidebar.tsx` -- No longer rendered

**Navigation data structure change:**
The `NavGroup` interface will gain an optional `subGroups` property allowing nested categorization within a single module section, keeping the sidebar to a single column.

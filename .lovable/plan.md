

# App Builder Settings Parity with Lovable

## Overview
The current `ProjectSettingsModal` has the right tab structure but each tab is shallow compared to Lovable's real settings. This plan upgrades each tab to match Lovable's feature set.

---

## Current State vs Target

| Tab | Current | Missing from Lovable |
|-----|---------|---------------------|
| General | Name, description, sound toggle | Project visibility (public/private), Knowledge/Memory management link, "Remix this project" button |
| Domains | Static published URL display | Inline custom domain management (add domain, DNS instructions, verification status, SSL status) -- the full `CustomDomainPanel` functionality should be embedded here |
| Integrations | Read-only status badges | Action buttons to connect/disconnect services, link to open each integration's config panel |
| Advanced | Hide badge, remixing toggle, delete | Reset project option, export project option, danger zone styling |

---

## Changes

### 1. General Tab Enhancements
- Add a "Project Visibility" toggle (Public / Private) with description
- Add a "Manage Knowledge" link button that closes the modal and opens the knowledge/memory panel (if one exists) or shows a placeholder
- Keep name, description, and sound toggle as-is

### 2. Domains Tab -- Embed Custom Domain Management
Instead of just showing the published URL, embed the core functionality from `CustomDomainPanel` directly:
- Show published URL at top (existing)
- Add an "Add Custom Domain" input with the add flow (domain input, TXT record instructions, verification simulation)
- Show domain list with status badges (verifying, active, failed)
- Remove/refresh actions per domain
- This replaces the empty "No custom domain configured" placeholder with actionable UI

### 3. Integrations Tab -- Add Action Buttons
- Each integration row gets a "Configure" or "Connect" button
- Clicking "Configure" closes the settings modal and opens the corresponding panel (Supabase, Stripe, GitHub settings)
- Pass callback props: `onOpenSupabase`, `onOpenStripe`, `onOpenGithub`

### 4. Advanced Tab -- Add Reset & Export
- Keep existing: hide badge toggle, allow remixing toggle, delete project
- Add "Reset Project" button (clears files, keeps settings) with confirmation
- Add "Export Project" button that triggers the existing export flow
- Style the delete/reset section as a "Danger Zone" with a subtle red border

---

## Technical Details

### File Changes

| File | Changes |
|------|---------|
| `ProjectSettingsModal.tsx` | Expand all 4 tabs with the features described above; add new props for callbacks |
| `AIAppBuilderWorkspace.tsx` | Pass additional callbacks (onOpenSupabase, onOpenStripe, onOpenGithub, onResetProject, onExportProject) to the modal |

### New Props for ProjectSettingsModal
```
onOpenSupabaseConfig?: () => void;
onOpenStripeConfig?: () => void;
onOpenGithubConfig?: () => void;
onResetProject?: () => void;
onExportProject?: () => void;
```

### Priority
1. Domains tab with inline domain management (biggest UX gap)
2. Integrations tab with action buttons (currently passive)
3. Advanced tab with reset/export (completes the danger zone)
4. General tab polish (smallest gap)


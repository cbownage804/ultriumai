

# Remaining Lovable Parity Items -- Implementation Plan

## Status Check

Items 1-6 are already complete. Item 10 (Hide Badge toggle) is **already implemented** in `ProjectSettingsModal.tsx` (line 732) and `ProjectSettings.tsx` (line 282). No work needed there.

Three items remain: **Security Scan View (#7)**, **Speed/Performance View (#8)**, and **Unified Design View (#9)**.

---

## Item 7: Security Scan -- Top-Level View Icon

**Goal:** Add a Shield icon to the top bar that opens the SecurityAuditorPanel directly, making it discoverable without Cmd+K.

**Changes:**

1. **`src/components/ai-builder/WorkspaceTopBar.tsx`**
   - Add `ShieldCheck` icon import from lucide-react
   - Add a new prop `setShowSecurityAuditor: (v: boolean) => void`
   - Add a shield icon button next to the Cloud/Database/Terminal icons in the center toolbar section
   - Tooltip: "Security"

2. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`**
   - Pass `setShowSecurityAuditor` down to `WorkspaceTopBar`

---

## Item 8: Speed/Performance -- Top-Level View Icon

**Goal:** Add a Gauge/Activity icon to the top bar that opens the PerformanceProfiler panel directly.

**Changes:**

1. **`src/components/ai-builder/WorkspaceTopBar.tsx`**
   - Add `Gauge` icon import from lucide-react
   - Add a new prop `setShowPerformanceProfiler: (v: boolean) => void`
   - Add a gauge icon button in the center toolbar
   - Tooltip: "Speed"

2. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`**
   - Pass `setShowPerformanceProfiler` down to `WorkspaceTopBar`

---

## Item 9: Unified Design View Panel

**Goal:** Create a consolidated `DesignViewPanel` that combines Theme Studio and Design System into one slide-out panel (similar to CloudViewPanel pattern).

**Changes:**

1. **Create `src/components/ai-builder/DesignViewPanel.tsx`**
   - Full-screen overlay panel (same pattern as CloudViewPanel)
   - Left sidebar with tabs: **Themes**, **Design System**, **Visual Edits**
   - Themes tab: renders `ThemeStudioPanel` content inline
   - Design System tab: renders `DesignSystemPanel` content inline
   - Visual Edits tab: button to activate Visual Edit Mode (sets `isVisualEditActive`)

2. **`src/components/ai-builder/panelKeys.ts`**
   - Add `'showDesignView'` to `PANEL_KEYS`

3. **`src/components/ai-builder/WorkspaceTopBar.tsx`**
   - Add `Palette` icon import
   - Add a new prop `setShowDesignView: (v: boolean) => void`
   - Add a palette icon button in the center toolbar
   - Tooltip: "Design"

4. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`**
   - Wire up `showDesignView` state and pass to top bar
   - Render `DesignViewPanel` when open

---

## Summary of File Changes

| File | Change |
|------|--------|
| `WorkspaceTopBar.tsx` | Add 3 new icon buttons (Shield, Gauge, Palette) with props |
| `AIAppBuilderWorkspace.tsx` | Pass 3 new setters to top bar; render DesignViewPanel |
| `panelKeys.ts` | Add `showDesignView` key |
| **NEW** `DesignViewPanel.tsx` | Unified design panel with Themes/Design System/Visual Edits tabs |

Item 10 (Hide Badge) requires no changes -- already fully implemented.


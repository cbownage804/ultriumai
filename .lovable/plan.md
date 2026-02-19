
# AI App Builder - Production Parity Audit & Remediation Plan

## Current State

The 253-phase feature roadmap (Sprints A-AD) is code-complete: all hooks are instantiated, all panels are lazy-loaded and rendered. However, there are critical **discoverability, UX, and structural gaps** that prevent production readiness.

---

## Gap Analysis

### 1. Command Palette Only Has ~20 Actions (of 150+ panels)

The `commandActions` array (the primary way to access tools, since the sidebar was removed) only registers about 20 actions. **All 130+ panels from Sprints E through AD are unreachable via Cmd+K.** Users have no way to discover or open Docker Compose, Kubernetes, OAuth Setup, MFA, KPI Dashboard, Full-Text Search, Permission Matrix, Audit Trail, etc., unless they know an internal state setter name.

**Fix:** Register every panel as a command action with appropriate category, icon, and keywords.

### 2. Toolbar Panels Dropdown Only Has 6 Generic Items

The `ToolbarPanelsDropdown` component has a hardcoded list of 6 generic categories (Analytics, Cloud, Code, Design, Security, Speed). It needs to be expanded into a categorized mega-menu or searchable panel picker that exposes all 150+ tools.

**Fix:** Replace the 6-item dropdown with a categorized panel registry that groups all tools by sprint/domain (DevOps, Auth, Search, Monitoring, etc.).

### 3. No Panel Registry / Manifest

Panels are opened via ~80+ individual `useState` booleans (`showDockerCompose`, `showK8s`, etc.). There is no central registry mapping panel IDs to their open/close functions. This makes it impossible to programmatically list, search, or batch-manage panels.

**Fix:** Create a `usePanelRegistry` hook that consolidates all panel visibility states into a single `Map<string, { open, setOpen, label, icon, category, keywords }>`. The command palette and toolbar dropdown would consume this registry.

### 4. Missing Error Boundaries Around Lazy Panels

All 150+ panels are lazy-loaded but wrapped only in a generic `<Suspense fallback={<PanelLoader />}>`. If any panel throws during render, the entire workspace crashes. Production apps need per-panel error boundaries.

**Fix:** Create a `<PanelErrorBoundary>` wrapper that catches errors per-panel and shows a "Panel failed to load" fallback with a retry button.

### 5. Workspace File is 2,771 Lines (Unmaintainable)

`AIAppBuilderWorkspace.tsx` is a single 2,771-line file with 230+ imports, 80+ `useState` calls, and inline render logic for every panel. This is a maintenance and performance risk.

**Fix:** Extract panel rendering into a `<PanelRenderer registry={panelRegistry} />` component that maps over the registry. Extract the top bar, bottom bar, and main content area into sub-components.

---

## Implementation Plan

### Phase 1: Panel Registry (Foundation)

Create `src/hooks/usePanelRegistry.ts`:
- Define a `PanelEntry` type: `{ id, label, icon, category, keywords, component, hookInstance }`
- Categories: `view`, `edit`, `devops`, `auth`, `search`, `monitoring`, `content`, `mobile`, `ai`, `data`, `collaboration`, `testing`, `security`, `monetization`, `dx`, `communication`, `navigation`, `polish`
- Export `usePanelRegistry()` returning `{ panels, openPanel(id), closePanel(id), togglePanel(id), isOpen(id), getByCategory(cat) }`
- Consolidates all 80+ `useState` booleans into one `Record<string, boolean>` managed via `useReducer`

### Phase 2: Command Palette Registration

Update `commandActions` to be auto-generated from the panel registry:
- Every panel gets a command action with `category: 'panel'`
- Add keywords for search (e.g., "docker", "k8s", "kubernetes", "oauth", "mfa", "seo")
- Group by category in the palette UI with section headers

### Phase 3: Toolbar Mega-Menu

Replace `ToolbarPanelsDropdown` with a categorized panel picker:
- Group panels by domain (DevOps, Auth, Search, etc.)
- Show category headers with counts
- Support search filtering within the dropdown
- Keep pin-to-toolbar functionality

### Phase 4: Panel Error Boundaries

Create `src/components/ai-builder/PanelErrorBoundary.tsx`:
- Wraps each lazy panel in a class-based error boundary
- Shows error message with retry button on failure
- Logs errors for debugging

### Phase 5: Workspace Decomposition

Split `AIAppBuilderWorkspace.tsx` into:
- `WorkspaceTopBar.tsx` - logo, project name, undo/redo, toolbar
- `WorkspaceBottomBar.tsx` - settings, deploy, share, export
- `WorkspaceMainContent.tsx` - chat, editor, preview panels
- `WorkspacePanelLayer.tsx` - renders all open panels from registry
- Keep `AIAppBuilderWorkspace.tsx` as the orchestrator (~500 lines max)

---

## Technical Details

### Panel Registry Data Structure

```text
type PanelEntry = {
  id: string              // e.g. 'docker-compose'
  label: string           // e.g. 'Docker Compose'
  icon: LucideIcon
  category: PanelCategory
  keywords: string[]
  sprint: string          // e.g. 'Y'
}

// Registry stores open state in a reducer:
// state: Record<string, boolean>
// dispatch({ type: 'TOGGLE', id: 'docker-compose' })
```

### Estimated Scope

- Phase 1 (Registry): 1 new file, refactor workspace state
- Phase 2 (Command Palette): Update commandActions generation
- Phase 3 (Toolbar): Rewrite ToolbarPanelsDropdown
- Phase 4 (Error Boundaries): 1 new component, wrap all panels
- Phase 5 (Decomposition): 4 new files, refactor workspace

### File Changes Summary

| Action | File |
|--------|------|
| Create | `src/hooks/usePanelRegistry.ts` |
| Create | `src/components/ai-builder/PanelErrorBoundary.tsx` |
| Create | `src/components/ai-builder/WorkspaceTopBar.tsx` |
| Create | `src/components/ai-builder/WorkspaceBottomBar.tsx` |
| Create | `src/components/ai-builder/WorkspaceMainContent.tsx` |
| Create | `src/components/ai-builder/WorkspacePanelLayer.tsx` |
| Rewrite | `src/components/ai-builder/ToolbarPanelsDropdown.tsx` |
| Refactor | `src/components/ai-builder/AIAppBuilderWorkspace.tsx` |
| Update | `src/components/ai-builder/lazyPanels.ts` (add registry metadata) |

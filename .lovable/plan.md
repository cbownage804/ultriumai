

# Complete Production Parity Sweep -- Final Pass

## Executive Summary

After thorough audit of all 2,906 lines of `AIAppBuilderWorkspace.tsx`, the 333-line `panelRegistry.ts`, the 394-line `WorkspacePanelLayer.tsx`, and the 237-line `EnhancedCommandPalette.tsx`, the following gaps remain. This plan addresses every one of them.

---

## Gap Inventory

### Gap A: 5 Panels Missing from Registry (Not Discoverable via Cmd+K or Toolbar)

These panels exist and render but are NOT in `panelRegistry.ts`, so they cannot be found via the command palette or the toolbar mega-menu:

| Panel | stateKey | Current Location |
|-------|----------|-----------------|
| Template Library | `showTemplates` | WorkspacePanelLayer |
| Edit History Timeline | `showEditHistory` | WorkspacePanelLayer |
| Keyboard Shortcuts | `showShortcuts` | WorkspacePanelLayer |
| Diff Review | `showDiffReview` | WorkspacePanelLayer |
| Quick File Switcher | `showQuickSwitcher` | WorkspacePanelLayer |

**Fix:** Add 5 entries to `panelRegistry.ts`.

### Gap B: 5 Panels Missing from `panelSetters` Map (Cmd+K Cannot Open Them)

Even if added to the registry, `openPanelByKey()` (line 2103) looks up setters in the `panelSetters` map (lines 1900-2100). These 5 are absent:

- `showTemplates`, `showEditHistory`, `showShortcuts`, `showDiffReview`, `showQuickSwitcher`

**Fix:** Add 5 entries to the `panelSetters` map.

### Gap C: 6 Structural Panels Lack SafePanel Crash Isolation

These panels are rendered inline in the workspace layout (lines 2710-2801) with bare conditional renders -- no error boundary, no Suspense:

| Panel | Line | Risk |
|-------|------|------|
| FileSearchPanel | 2710 | Crash kills entire right panel |
| ProjectFileTree | 2715-2721 | Crash kills file navigation |
| BuildLogPanel | 2763-2766 | Crash kills build output |
| VersionTimelineSlider | 2768-2791 | Crash kills version nav |
| ConsolePanel | 2792-2795 | Crash kills console |
| TerminalEmulator | 2797-2800 | Crash kills terminal |

**Fix:** Wrap each in `<SafePanel>` or at minimum `<PanelErrorBoundary>` (SafePanel's `show` prop handles the conditional, but these use different patterns -- some use inline `{show && ...}` which we need to preserve for layout flow, so we wrap the inner content in `<PanelErrorBoundary>` instead).

### Gap D: WorkspaceTopBar Not Integrated (180 Lines of Duplication)

`WorkspaceTopBar.tsx` (264 lines) exists but is never rendered. The workspace still has ~180 lines of inline header JSX (lines 2163-2344). This is code duplication that will diverge over time.

**Fix:** This is complex because the TopBar component's props have diverged from the workspace's inline JSX. The inline version references many local variables directly. To properly integrate, we need to:
1. Update `WorkspaceTopBar` props to match current workspace state
2. Replace the inline block with the component
3. Pass all required props

### Gap E: Dead Code -- `showCommandPalette` State

Line 429: `const [showCommandPalette, setShowCommandPalette] = useState(false);` -- this state variable is no longer used since `Cmd+K` now toggles `showEnhancedPalette`. The old `CommandPalette` import may also be dead.

**Fix:** Remove the dead state variable and any unused import of the old `CommandPalette`.

### Gap F: `usePanelManager` Hook Created But Never Used

`src/hooks/usePanelManager.ts` was created to consolidate all 80+ `useState` booleans into a single reducer, but was never integrated. All panel visibility is still managed by individual `useState` calls.

**Fix:** This is a large refactor (touching every panel reference). Document as tech debt for a future pass. Not blocking production.

---

## Implementation Plan

### Phase 1: Add 5 Missing Panels to Registry

**File:** `src/components/ai-builder/panelRegistry.ts`

Add these entries to the registry array (after the core panels section):

```text
{ id: 'templates', label: 'Template Library', icon: Layers, category: 'edit', keywords: ['template', 'starter', 'scaffold'], stateKey: 'showTemplates' }
{ id: 'edit-history', label: 'Edit History', icon: History, category: 'view', keywords: ['edit', 'history', 'timeline', 'versions'], stateKey: 'showEditHistory' }
{ id: 'shortcuts', label: 'Keyboard Shortcuts', icon: Keyboard, category: 'dx', keywords: ['keyboard', 'shortcut', 'hotkey', 'keybind'], stateKey: 'showShortcuts' }
{ id: 'diff-review', label: 'Diff Review', icon: Eye, category: 'edit', keywords: ['diff', 'review', 'changes', 'approve'], stateKey: 'showDiffReview' }
{ id: 'quick-switcher', label: 'Quick File Switcher', icon: Search, category: 'edit', keywords: ['quick', 'switch', 'file', 'jump'], stateKey: 'showQuickSwitcher' }
```

### Phase 2: Add 5 Missing Setters to panelSetters Map

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (inside the `panelSetters` useMemo, ~line 2090)

Add:
```text
showTemplates: (v) => setShowTemplates(v),
showEditHistory: (v) => setShowEditHistory(v),
showShortcuts: (v) => setShowShortcuts(v),
showDiffReview: (v) => setShowDiffReview(v),
showQuickSwitcher: (v) => setShowQuickSwitcher(v),
```

### Phase 3: Wrap 6 Structural Panels in PanelErrorBoundary

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

These panels are structural (they affect layout flow) so we can't use `SafePanel` directly (which hides when `show=false`). Instead, wrap the inner content in `<PanelErrorBoundary>`:

**FileSearchPanel** (line 2710):
```text
<PanelErrorBoundary panelName="File Search">
  <FileSearchPanel open={showFileSearch} ... />
</PanelErrorBoundary>
```

**ProjectFileTree** (lines 2717-2718):
```text
<PanelErrorBoundary panelName="File Tree">
  <ProjectFileTree files={project.files} ... />
</PanelErrorBoundary>
```

**BuildLogPanel** (lines 2764-2766):
```text
<PanelErrorBoundary panelName="Build Log">
  <BuildLogPanel entries={buildLog.entries} ... />
</PanelErrorBoundary>
```

**VersionTimelineSlider** (lines 2770-2791):
```text
<PanelErrorBoundary panelName="Version Timeline">
  <VersionTimelineSlider ... />
  {showDiffViewer && ...}
</PanelErrorBoundary>
```

**ConsolePanel** (lines 2793-2795):
```text
<PanelErrorBoundary panelName="Console">
  <ConsolePanel ... />
</PanelErrorBoundary>
```

**TerminalEmulator** (lines 2798-2800):
```text
<PanelErrorBoundary panelName="Terminal">
  <TerminalEmulator ... />
</PanelErrorBoundary>
```

### Phase 4: Remove Dead Code

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

1. Remove `const [showCommandPalette, setShowCommandPalette] = useState(false);` (line 429)
2. Remove the `CommandPalette` import from `lazyPanels` (line 243) if no longer referenced elsewhere
3. Clean up any remaining references to `showCommandPalette`

### Phase 5: Integrate WorkspaceTopBar

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

Replace the inline header block (lines 2163-2344, ~180 lines) with:
```text
<WorkspaceTopBar
  projectName={project.name}
  isEditingName={isEditingName}
  editName={editName}
  setEditName={setEditName}
  setIsEditingName={setIsEditingName}
  onRename={handleRename}
  canUndo={canUndo}
  canRedo={canRedo}
  onUndo={handleUndo}
  onRedo={handleRedo}
  rightTab={rightTab}
  setRightTab={setRightTab}
  ... (remaining props)
/>
```

**File:** `src/components/ai-builder/WorkspaceTopBar.tsx`

Update props interface to match what the workspace currently passes. Key differences to reconcile:
- Add `isGenerating` prop
- Add `openPanel` callback
- Remove `showCommandPalette` / `setShowCommandPalette` (dead)
- Add `setShowPromptHistory`, `setShowVersionHistory`
- Add `setShowSettingsPanel`
- Add `previewIframeRef` for refresh button

---

## File Changes Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `panelRegistry.ts` | Add 5 entries (+10 lines) |
| 2 | `AIAppBuilderWorkspace.tsx` | Add 5 setters to panelSetters map (+5 lines) |
| 3 | `AIAppBuilderWorkspace.tsx` | Wrap 6 inline panels in PanelErrorBoundary (+12 lines) |
| 4 | `AIAppBuilderWorkspace.tsx` | Remove dead showCommandPalette state + import (-3 lines) |
| 5 | `AIAppBuilderWorkspace.tsx` | Replace inline header with WorkspaceTopBar (-170 lines) |
| 5 | `WorkspaceTopBar.tsx` | Update props to match workspace state (~20 lines changed) |

**Net effect:** ~-146 lines from workspace, all panels crash-safe and discoverable.

---

## What This Achieves

- Every single panel (155+ total) is in the registry, discoverable via Cmd+K and toolbar mega-menu
- Every panel has a working setter in `panelSetters` so `openPanelByKey()` works for all
- All structural panels (file tree, console, terminal, build log, search, timeline) have error boundaries
- Dead code removed (old command palette state)
- WorkspaceTopBar finally integrated, reducing workspace by ~170 lines
- `usePanelManager` documented as future tech debt (non-blocking)

### What Remains After This (Non-Blocking Tech Debt)

- `usePanelManager` hook consolidation (80+ useState to 1 reducer) -- large refactor, no user-facing impact
- Workspace file still ~2,750 lines -- the remaining code is essential orchestration logic


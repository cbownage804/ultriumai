
# More Performance Issues: Redundant Compilation, Auto-Save Storms, and Panel Overhead

Beyond what's been fixed, here are 5 remaining issues contributing to sluggishness and potential preview failures.

---

## Issue 12: `compiledForHosting` Runs a SECOND Full Compilation on Every File Change

**File**: `AIAppBuilderWorkspace.tsx`, lines 1214-1217

```typescript
const compiledForHosting = useMemo(
  () => getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser),
  [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser]
);
```

This runs a complete vanilla compilation every time `project.files` changes -- entirely independent of `liveCompiledHTML` and `stableHTML`. When the batched `setFiles` fires after generation, this memo recomputes synchronously alongside `liveCompiledHTML`, doubling the compilation cost. For hosted preview upload, this doesn't even need to run during generation.

**Fix**: Guard this memo with `if (isGenerating) return null;` to skip it during generation, same as `liveCompiledHTML`. Or better: reuse `stableHTML`/`liveCompiledHTML` instead of running a separate compilation.

---

## Issue 13: Three Auto-Save Effects Fire Simultaneously After Generation

**File**: `AIAppBuilderWorkspace.tsx`, lines 1083-1109

Three separate effects all trigger when `project.files` changes:
1. Line 1083: Cloud auto-save (`scheduleAutoSave`) -- debounced 2s
2. Line 1100: IndexedDB save (`idbPersistence.saveToIDB`) -- immediate
3. Line 1106: localStorage draft save (`saveDraft`) -- immediate

Effects 2 and 3 run synchronously on the same render that updates `project.files`. For a 15-file project, serializing and writing to IDB + localStorage blocks the main thread for 50-200ms right when the preview should be compiling.

The `isGenerating` guard on these effects means they all fire the instant `isGenerating` flips to `false` (which is the same render where `project.files` gets populated). So compilation, auto-save x3, and all deferred work compete on the same frame.

**Fix**: Add a startup delay to the IDB and localStorage saves -- use `setTimeout(..., 1000)` after `isGenerating` transitions from true to false, so compilation and preview have priority.

---

## Issue 14: `tsValidator.validate()` Runs Synchronously on the Completion Render

**File**: `AIAppBuilderWorkspace.tsx`, lines 955-965

```typescript
const validationResult = tsValidator.validate(latestFiles);
```

This runs inside the `isGenerating` transition effect (line 940), which fires on the same render as the `latestFiles` effect. TypeScript validation iterates every file, parses ASTs, and checks types -- potentially 100-300ms for larger projects. It runs before the deferred `setTimeout` block, so it blocks the preview.

**Fix**: Move `tsValidator.validate()` into the deferred `setTimeout` block alongside lighthouse/bundleSize (line 980). Smoke test and conflict detection can stay synchronous since they're fast.

---

## Issue 15: The 200+ Boolean Panel Accessors Are Still Being Created

**File**: `AIAppBuilderWorkspace.tsx`, lines 368-576

Despite the Issue 9 fix making `sp()` stable, there are still 210 lines of `const showX = !!panels.showX` (lines 368-576). These aren't closures so they're cheap individually, but:
- They create 210 local variables on every render
- They're used as props to child components, causing those children to re-render whenever ANY panel toggles (because `panels` is a new object from the reducer)

More importantly, the 210 `const setShowX = sp(...)` calls (lines 586-794) still create 210 function calls per render. Even though `sp` is stable, `sp('showVersionHistory')` returns a new closure every call.

**Fix**: Memoize the setter map (already partially done at line 2013 with `panelSetters`). Replace the 210 individual `setShowX` constants with direct lookups from `panelSetters`. This eliminates 210 closure allocations per render.

---

## Issue 16: `commandActions` Memo Has Heavyweight Dependencies

**File**: `AIAppBuilderWorkspace.tsx`, lines 2028-2057

```typescript
const commandActions = useMemo((): CommandAction[] => {
  ...
}, [handleSave, handleUndo, handleRedo, handlePublish, openPanelByKey,
    codeSmellDetector, project.files, docGenerator, project.name, activeFile, handleSend]);
```

This memo depends on `project.files` and `activeFile`. Every time a file changes or the user switches tabs, this rebuilds the entire command action array (core actions + all 155+ registry entries). The `PANEL_REGISTRY.map()` inside allocates 155 objects each time.

**Fix**: Split into two memos: one for static registry actions (no dependencies, computed once), and one for the handful of dynamic core actions. Merge them in a third memo that's cheaper to update.

---

## Summary

| Issue | Type | Impact | Fix Difficulty |
|-------|------|--------|----------------|
| 12. Redundant `compiledForHosting` | Duplicate compilation | 200-500ms extra blocking on file change | Easy -- guard with `isGenerating` |
| 13. Triple auto-save on completion | Main thread contention | 50-200ms serialization competing with compilation | Easy -- defer with setTimeout |
| 14. Synchronous TS validation | Main thread blocking | 100-300ms before preview can render | Easy -- move into deferred block |
| 15. 210 setter closures per render | Allocation overhead | ~3ms per render, child re-render cascades | Medium -- use panelSetters map |
| 16. Heavy `commandActions` memo | Unnecessary recomputation | 155 object allocations on every file change | Medium -- split static/dynamic |

## Implementation Plan

### Step 1: Guard `compiledForHosting` during generation (Issue 12)
Add `if (isGenerating) return null;` as the first line of the `compiledForHosting` useMemo.

### Step 2: Defer auto-saves after generation (Issue 13)
Add a `postGenerationDelayRef` that tracks when `isGenerating` transitions to false. In the IDB and localStorage save effects, skip saves for 1 second after this transition to let compilation take priority.

### Step 3: Move TS validation to deferred block (Issue 14)
Move `tsValidator.validate(latestFiles)` into the existing `setTimeout(() => { ... }, 100)` block at line 980, alongside lighthouse audit and bundle size analysis.

### Step 4: Consolidate panel setters (Issue 15)
Replace the 210 individual `const setShowX = sp(...)` lines with a single `panelSetters` memo that returns a `Record<string, (v: boolean) => void>`. Update all JSX prop references to use `panelSetters.showVersionHistory` instead of `setShowVersionHistory`.

### Step 5: Split command actions memo (Issue 16)
Create a `staticRegistryActions` memo with no dependencies (computed once). Keep dynamic core actions in a separate memo with minimal dependencies. Merge in the final `commandActions` memo.

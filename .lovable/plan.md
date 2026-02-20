

# Additional Performance Issues: Duplicate Work, Unnecessary Dependencies, and Bloat

## Issue 17: Duplicate Smoke Test — Runs Twice When Generation Ends

**File**: `AIAppBuilderWorkspace.tsx`, lines 963 and 1429

Two separate effects both call `smokeTest.runSmokeTest()` when `isGenerating` flips from true to false:

- **Line 963** (the `latestFiles` completion effect): Runs smoke test + conflict detection + error annotations
- **Line 1429** (the `prevIsGenerating` watcher): Runs smoke test again and forwards errors to chat

Both fire on the same render cycle. The second call at line 1429 is entirely redundant since line 963 already ran the test and captured the results.

**Fix**: Remove the duplicate smoke test at line 1429. If error forwarding to chat is needed, do it in the line 963 block where the results are already available.

---

## Issue 18: Thumbnail Capture Calls `getCompiledHTML` a THIRD Time After Generation

**File**: `AIAppBuilderWorkspace.tsx`, lines 1726-1736

```typescript
useEffect(() => {
  if (wasGeneratingRef.current && !isGenerating && project.files.length > 0 && currentProjectId) {
    const html = getCompiledHTML(supabaseConfig, stripeConfig, envVars, ...);
    if (html) {
      setTimeout(() => {
        captureAndUpload(html, currentProjectId).catch(() => {});
      }, 2000);
    }
  }
  wasGeneratingRef.current = isGenerating;
}, [isGenerating, ...]);
```

When generation ends, this calls `getCompiledHTML()` — which is a full synchronous vanilla compilation — even though `compiledForHosting` or `stableHTML` already contain the compiled output. This is a third compilation (after `liveCompiledHTML` and `compiledForHosting`).

**Fix**: Use `stableHTML || compiledForHosting` instead of calling `getCompiledHTML` again.

---

## Issue 19: Keyboard Shortcut Effect Re-registers on Every File Change

**File**: `AIAppBuilderWorkspace.tsx`, line 1291

```typescript
}, [project.files, canUndo, canRedo, isGenerating, stopGenerating, ...]);
```

`project.files` is in the dependency array, which means the `keydown` listener is removed and re-added on every single file change. The handler doesn't even use `project.files` directly — it only calls `handleUndo`/`handleRedo` which are already stable callbacks.

**Fix**: Remove `project.files` from the dependency array. The handler uses callback refs (`handleUndo`, `handleRedo`) that are already memoized with their own dependencies.

---

## Issue 20: 200+ Boolean Accessor Variables Still Created Every Render

**File**: `AIAppBuilderWorkspace.tsx`, lines 368-576

Despite Issue 15 fixing the setter closures, there are still **208 lines** like:
```typescript
const showVersionHistory = !!panels.showVersionHistory;
const showConsole = !!panels.showConsole;
// ... 206 more
```

These create 208 local boolean variables on every render. More importantly, since `panels` is a new object from the reducer on any panel toggle, ALL 208 booleans are recalculated and all child components receiving them as props get new values (triggering re-renders) even if their specific panel didn't change.

**Fix**: Replace these with direct `panels.showX` reads in JSX and prop passing. For the ~12 panels used in keyboard shortcuts and escape handling (where boolean checks are needed inline), keep only those. Remove the other ~196 that are just passed through to child components.

---

## Issue 21: `latestRef.current` Assignment on Every Render

**File**: `AIAppBuilderWorkspace.tsx`, lines 1143-1144

```typescript
const latestRef = useRef({ name: project.name, files: project.files, messages });
latestRef.current = { name: project.name, files: project.files, messages };
```

This creates a new object on every render and assigns it to the ref. While cheap, it happens on the hot path of a 2800-line component that renders frequently. The object allocation is unnecessary — the ref should store individual values or use a pattern that doesn't allocate.

**Fix**: Store name/files/messages as separate refs, or assign to properties of the existing object instead of creating a new one.

---

## Summary

| Issue | Type | Impact | Fix Difficulty |
|-------|------|--------|----------------|
| 17. Duplicate smoke test | Wasted CPU | 50-100ms redundant analysis | Easy -- remove duplicate call |
| 18. Triple getCompiledHTML | Wasted CPU | 200-500ms redundant compilation | Easy -- reuse stableHTML |
| 19. Keyboard handler re-registration | Unnecessary teardown/setup | Event listener churn on every file change | Easy -- remove project.files dep |
| 20. 208 boolean variables per render | Allocation overhead + prop cascades | Child re-renders on any panel toggle | Medium -- use panels.X directly |
| 21. latestRef object allocation | Micro-optimization | New object allocation per render | Easy -- assign properties |

## Implementation Plan

### Step 1: Remove duplicate smoke test (Issue 17)
Delete the `smokeTest.runSmokeTest()` call at line 1429. Move the `forwardErrorToChat` logic into the existing smoke test block at line 963.

### Step 2: Reuse stableHTML for thumbnail capture (Issue 18)
Replace `getCompiledHTML(...)` at line 1728 with `stableHTML || compiledForHosting`. Remove `getCompiledHTML` and its config dependencies from the effect's dependency array.

### Step 3: Remove project.files from keyboard handler deps (Issue 19)
Remove `project.files` from the dependency array at line 1291.

### Step 4: Eliminate unnecessary boolean accessors (Issue 20)
Keep only the ~12 boolean accessors used in keyboard shortcuts/escape handling. For all other panel visibility checks, use `panels.showX` directly in JSX and SafePanel `show` props.

### Step 5: Fix latestRef allocation (Issue 21)
Replace the object creation with direct property assignment on the existing ref object.


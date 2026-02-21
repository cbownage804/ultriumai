
## Comprehensive Fix: Toast Spam, Preview Freeze, and Main Thread Blocking

### Root Cause Analysis

The "page not responding" crash has **multiple compounding causes**:

1. **Synchronous compilation blocks the main thread for 3-10+ seconds** -- `compileReactProject()` in `useReactCompiler.ts` transpiles ALL files in a tight synchronous loop (line 464). For even 4-5 files with Babel transformation, this locks the browser.

2. **Post-generation work avalanche** -- When generation ends (line 768), the workspace runs synchronously:
   - `smokeTest.runSmokeTest(latestFiles)` -- synchronous
   - `conflictDetection.detectConflicts(latestFiles)` -- synchronous
   - `errorAnnotations.updateAnnotations(...)` -- synchronous
   - Then `setTimeout(100ms)` fires MORE synchronous work: TS validation, Lighthouse audit, bundle analysis, auto-patching, companion file generation
   - All of this cascades before the preview even renders

3. **`bundleForBrowser` runs full AST bundler synchronously** -- called from CompilationBridge, it runs `incrementalCompiler.compileIncremental` + `astBundler.buildDependencyGraph` for every file

4. **`handlePublish` calls `getCompiledHTML` synchronously on click** (line 1621) -- this is a FULL compilation that blocks the main thread

5. **`setFiles()` triggers cascading re-renders** -- When files are set after generation, it triggers `filesDigest` change in CompilationBridge, which starts compilation, which sets `isCompiling`, which triggers more re-renders across 3 BuilderPreviewPanel instances + GeneratingOverlay

6. **Multiple `setFiles()` calls in sequence** (lines 708, 828) -- The batched file merge at line 828 triggers a SECOND compilation cycle 100ms after the first one starts

7. **127 toast calls** remain in AIAppBuilderWorkspace.tsx -- only 3 use `dedupeToast`, the other 124 fire direct `toast.success/error/info` calls that can still stack during rapid operations

---

### Fix Plan (8 Phases)

#### Phase 1: Kill all remaining direct toast calls in high-frequency paths
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Replace ALL remaining `toast.success/error/info` calls with `dedupeToast` across the entire file. This is the single biggest contributor to DOM buildup -- 124 unprotected toast calls.

#### Phase 2: Defer ALL post-generation work
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Move the synchronous smoke test, conflict detection, and error annotations into the existing `setTimeout(100)` deferred block (or increase to `setTimeout(500)` and use `requestIdleCallback`). Currently lines 783-792 run synchronously BEFORE the setTimeout block.

Change:
```typescript
// BEFORE (synchronous, blocks main thread)
const smokeResult = smokeTest.runSmokeTest(latestFiles);
const conflictWarnings = conflictDetection.detectConflicts(latestFiles);
errorAnnotations.updateAnnotations(...);

// AFTER (all deferred)
requestIdleCallback(() => {
  const smokeResult = smokeTest.runSmokeTest(latestFiles);
  // ... rest
}, { timeout: 3000 });
```

#### Phase 3: Prevent double setFiles triggering double compilation
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

The `setTimeout(100)` block at line 810-829 calls `setFiles()` again with patched files, which triggers a SECOND full compilation cycle. Instead, batch these patches into the FIRST `setFiles()` call, or gate the second one behind `requestIdleCallback` with a longer delay (2s+).

#### Phase 4: Make `handlePublish` async-safe
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

`handlePublish` (line 1620) calls `getCompiledHTML()` synchronously. Instead, reuse the already-compiled `compiledForHosting` state (which is already available). The code already does this for `handleSave` (line 1538) but not for publish.

Change:
```typescript
// BEFORE
const compiledHTML = getCompiledHTML(supabaseConfig, stripeConfig, ...);

// AFTER
const compiledHTML = compiledForHosting || stableHTMLRef.current;
```

#### Phase 5: Add compilation debounce to CompilationBridge
**File: `src/components/ai-builder/CompilationBridge.tsx`**

When `filesDigest` changes rapidly (e.g., from multiple `setFiles` calls), the current `compilationLockRef` prevents re-entry but doesn't debounce. Add a 500ms debounce before starting compilation so rapid file changes consolidate into one compilation.

#### Phase 6: Reduce GeneratingOverlay polling during compilation
**File: `src/components/ai-builder/GeneratingOverlay.tsx`**

The overlay polls `partialFilesRef` every 2 seconds even during the `isCompiling` phase (after generation ends). During compilation, there are no new files to show, so skip polling when `isCompiling && !isGenerating`.

#### Phase 7: Reduce StreamingCodeEditor polling frequency
**File: `src/components/ai-builder/StreamingCodeEditor.tsx`**

The editor polls at 3000ms intervals. This is reasonable, but each poll triggers `setEditorStreamFiles` which can cascade re-renders. Add a deep equality check (file count + last file path) before calling setState.

#### Phase 8: Cap health check restarts
**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

The health check `setIframeKey(k => k + 1)` at line 235 forces a full iframe reload. Each reload triggers a new `srcdoc` write, which can trigger new errors, which can trigger more health check failures. Add a max reload count (e.g., 2 reloads per compilation cycle) to prevent infinite reload loops.

---

### Files to Edit

1. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** -- Phases 1-4 (toast dedup, defer post-gen work, prevent double setFiles, async publish)
2. **`src/components/ai-builder/CompilationBridge.tsx`** -- Phase 5 (compilation debounce)
3. **`src/components/ai-builder/GeneratingOverlay.tsx`** -- Phase 6 (skip polling during compilation)
4. **`src/components/ai-builder/StreamingCodeEditor.tsx`** -- Phase 7 (smarter setState check)
5. **`src/components/ai-builder/BuilderPreviewPanel.tsx`** -- Phase 8 (cap iframe reloads)

### Expected Impact

```text
Before:
  Generation ends
    --> setFiles (triggers filesDigest change)
    --> smokeTest + conflictDetection + errorAnnotations (SYNC, blocks ~200ms)
    --> setTimeout(100ms): TS validation + Lighthouse + auto-patch (blocks ~500ms)
    --> auto-patch calls setFiles AGAIN (triggers 2nd compilation)
    --> CompilationBridge starts compilation (blocks 3-8s)
    --> Health check detects blank iframe --> setIframeKey++ (reload loop)
    --> 124 unprotected toasts fire from various callbacks
    --> Browser: "This page isn't responding"

After:
  Generation ends
    --> setFiles (single batch including patches)
    --> ALL post-gen work deferred via requestIdleCallback
    --> CompilationBridge debounces 500ms, compiles ONCE
    --> Health check paused during compilation, max 2 reloads
    --> All toasts deduplicated (5s window)
    --> Browser stays responsive
```



# Multi-Phase Fix: Remaining Lovable Build Parity Issues

## Overview

After analyzing the full compilation pipeline, I've identified 6 remaining issues that break Lovable parity. These cause preview flashes, post-build regressions, and unnecessary recompilations even after the previous 5-phase fix.

---

## Phase 1: Post-Build `setFiles` Triggers a Redundant Recompilation

**Problem:** After a build completes, the deferred post-generation work (lines 1068-1126) runs smoke tests, auto-patches delete buttons, and generates companion files. If any patches are produced, `setFiles()` is called again (line 1113), which changes `filesDigest` in CompilationBridge, triggering another full recompile. This causes a second iframe update/flash several seconds after the build appeared complete.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Before calling `setFiles()` in the deferred post-gen patch (line 1113), set `skipNextCompileRef.current = true` so CompilationBridge skips the recompile for this particular file change.
- This is the same mechanism already used for visual edits (line 202 in CompilationBridge).

---

## Phase 2: `handleBgComplete` Compiles Twice (Fire-and-Forget + Polling Fallback)

**Problem:** In `handleBgComplete` (lines 312-393), the React compile is started as a fire-and-forget `.then()` chain (line 313). Then the dispatch logic (lines 370-393) starts a SECOND polling loop checking `stableHTMLRef.current` every 200ms. If the first compile sets `stableHTMLRef` AND CompilationBridge also triggers a compile (because `filesDigest` changed when `setFiles` was called at line 308), there are now potentially 3 compilation paths racing.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Capture the compile promise from line 313 and chain the dispatch directly to it instead of using the polling fallback. This eliminates the race entirely.

```typescript
// Current: fire-and-forget compile + separate polling fallback
compileReactProjectRef.current(mergedFiles, {...}).then(compiled => {
  if (compiled.html) handleStableHTML(compiled.html);
});
// ... later, separate polling for stableHTMLRef

// Fixed: chain dispatch to the SAME promise
const compilePromise = compileReactProjectRef.current(mergedFiles, {...}).then(compiled => {
  if (compiled.html) handleStableHTML(compiled.html);
});
compilePromise.finally(() => {
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('bg-job-completed', { detail: { jobId } }));
  }, 500);
});
```

---

## Phase 3: CompilationBridge Double-Entry from `isGenerating` + `filesDigest` Effects

**Problem:** CompilationBridge has TWO effects that reset compilation state when `isGenerating` changes:
1. Lines 125-161: The generation start/end effect (depends on `[isGenerating, setStableHTML]`)
2. Lines 169-174: A SECOND reset effect (depends on `[isGenerating, filesDigest]`)

When `isGenerating` goes to `false`, BOTH effects fire. Effect #2 (line 170-173) unconditionally resets `compilationAttemptedRef` and `compilationLockRef`, undoing the work of Effect #1 which carefully set those flags based on external state.

**Fix in `CompilationBridge.tsx`:**
- Remove Effect #2 entirely (lines 168-174). Its work is already handled correctly by Effect #1.

---

## Phase 4: `GeneratingOverlay` Shows During Compilation-Only Phase (No Files to Display)

**Problem:** When `isCompiling` is true but `isGenerating` is false (compilation after generation), the `GeneratingOverlay` still shows but with an empty file list and just says "Compiling preview...". In Lovable, compilation happens silently -- no overlay. The old preview stays visible until the new one is ready.

**Fix in `GeneratingOverlay.tsx`:**
- Don't show the overlay when only compiling (not generating). The shimmer bar on the preview panel is sufficient visual feedback.
- Change `showOverlay` from `isGenerating || isCompiling` to just `isGenerating`.

---

## Phase 5: `BuilderPreviewPanel` Shows `SkeletonPreview` When `html` is Null During Generation

**Problem:** In `BuilderPreviewPanel.tsx` (lines 528-529), when `html` is null AND `isGenerating` is true, it shows `SkeletonPreview`. But with our Phase 1 fix (keeping old preview visible), `html` should NOT be null during subsequent generations -- only on the very first build.

However, there's an edge case: if the user clears the project and starts fresh (`handleReset` calls `setStableHTML(null)` at line 1985), the skeleton correctly shows. The current logic is correct for first builds but we should ensure the overlay (GeneratingOverlay) is rendered ON TOP of the existing preview, not replacing it.

**Fix in `BuilderPreviewPanel.tsx`:**
- Reorder the rendering priority: if `html` exists, ALWAYS render the iframe (even during generation). The `GeneratingOverlay` is already rendered as a child overlay on top.
- Only fall back to `SkeletonPreview` if `html` is truly null (first build or after reset).

This is already the current behavior since `html` (compiledHTML) preserves the old value. No code change needed -- just verification.

---

## Phase 6: Stale Closure in `handleBgComplete` for `supabaseConfig`/`stripeConfig`

**Problem:** `handleBgComplete` (line 276) is a `useCallback` with dependency array `[project.files, setFiles, setMessages]`. But inside it references `supabaseConfig`, `stripeConfig`, `envVars`, `serviceKeys`, `cdnPackages`, `bundleForBrowser`, and `linkedGPT` -- none of which are in the dependency array. This means the compile inside `handleBgComplete` uses stale config values if the user changed integrations since the callback was created.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Store these configs in refs and read from refs inside `handleBgComplete`, OR add them to the dependency array. Refs are preferred to avoid unnecessary recreation of the callback (which would break the background generation wiring).

---

## Technical Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `AIAppBuilderWorkspace.tsx` | Set `skipNextCompileRef = true` before deferred post-gen `setFiles` |
| 2 | `AIAppBuilderWorkspace.tsx` | Chain dispatch to compile promise instead of polling fallback |
| 3 | `CompilationBridge.tsx` | Remove duplicate reset effect (lines 168-174) |
| 4 | `GeneratingOverlay.tsx` | Only show overlay during generation, not compilation-only |
| 5 | `BuilderPreviewPanel.tsx` | Verify iframe always renders when html exists (already correct) |
| 6 | `AIAppBuilderWorkspace.tsx` | Use refs for stale config closure in `handleBgComplete` |

## Expected Result

After all 6 phases:
- No post-build flash from deferred auto-patching
- No duplicate/triple compilation from racing promises
- No CompilationBridge double-unlock from competing effects
- Clean overlay behavior: shimmer during generation, silent compilation
- Correct config values used even after integration changes
- True Lovable parity: old preview stays, seamlessly replaced by new build


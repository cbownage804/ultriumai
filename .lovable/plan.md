

# Multi-Phase Fix: True Lovable Parity for Build-Preview Cycle

## Overview

There are 5 remaining issues causing preview regeneration, flashing, and failed color updates. This plan addresses all of them systematically.

---

## Phase 1: Fix the Race Condition in `handleBgComplete`

**Problem:** `handleBgComplete` starts an async React compile (`.then()`), but dispatches `bg-job-completed` on a fixed 2-second timer. If the compile takes longer than 2s, `setIsGenerating(false)` fires before `handleStableHTML` is called. Both refs are null, CompilationBridge force-recompiles, causing a double compile and iframe flash.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Move the `bg-job-completed` dispatch INSIDE the compile's `.then()` callback (or `.finally()`), so the event only fires AFTER the preview HTML is ready.
- Keep a minimum 500ms delay after compile to allow React to render.
- For vanilla (non-React) projects, dispatch immediately after synchronous compile.

```
// Current (broken):
setFiles(mergedFiles);
compileReactProject(mergedFiles).then(compiled => handleStableHTML(compiled.html));
setTimeout(() => dispatch('bg-job-completed'), 2000);  // fires too early!

// Fixed:
setFiles(mergedFiles);
const compilePromise = isReact
  ? compileReactProject(mergedFiles).then(compiled => {
      if (compiled.html) handleStableHTML(compiled.html);
    })
  : Promise.resolve().then(() => {
      const result = getCompiledHTML(...);
      if (result) handleStableHTML(result);
    });

compilePromise.finally(() => {
  setTimeout(() => dispatch('bg-job-completed', { jobId }), 500);
});
```

---

## Phase 2: Prevent CompilationBridge's Main Effect from Redundant Recompile

**Problem:** When `isGenerating` goes false, both the generation-ending effect AND the main compilation effect fire. The generation-ending effect syncs state, but the main effect may still see a digest mismatch and trigger a recompile.

**Fix in `CompilationBridge.tsx`:**
- Add a `justSyncedFromExternalRef` flag. Set it to `true` in the generation-ending effect when syncing from external HTML. Check it in the main compilation effect and skip if true.

```typescript
// New ref
const justSyncedFromExternalRef = useRef(false);

// In generation-ending effect (line 128):
if (!stableHTMLRef.current && externalHasPreview) {
  // ... existing sync logic ...
  justSyncedFromExternalRef.current = true;  // NEW
}

// In main compilation effect (line 176):
if (isGenerating || filesRef.current.length === 0) { ... return; }

// NEW: Skip if we just synced from external in the same render cycle
if (justSyncedFromExternalRef.current) {
  justSyncedFromExternalRef.current = false;
  prevFilesDigestRef.current = filesDigest;
  return;
}
```

---

## Phase 3: Remove Nuclear Fallback Double-Compile

**Problem:** The workspace has a 4-second nuclear fallback (lines 2155-2189) that compiles AGAIN if `stableHTML` isn't set. With Phase 1's fix ensuring compile completes before `bg-job-completed`, this fallback becomes redundant and can cause a third compile.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Increase the nuclear fallback timeout from 4s to 10s (safety net only, should never fire now).
- Add a log to track if it ever fires, so we can remove it entirely later.
- Critically, add a guard: if `stableHTMLRef.current` is already set, skip.

---

## Phase 4: Smarter Iframe Remount in BuilderPreviewPanel

**Problem:** When keeping the old preview visible during generation and then replacing with new HTML, the head section WILL differ (new compiled JS/CSS), so `iframeKey` always increments. This causes a full iframe teardown and rebuild, which is the visible flash.

**Fix in `BuilderPreviewPanel.tsx`:**
- Instead of comparing head sections to decide on remount, use `srcdoc` directly. The browser will naturally re-render when `srcdoc` changes -- no need to force remount via key.
- Only increment `iframeKey` for explicit user-triggered refreshes and health check recovery (not for content updates).
- Remove the "structural change" detection entirely from the html-change effect.

```typescript
// Current: increments iframeKey on structural HTML changes
useEffect(() => {
  if (html && hasEverHadHtmlRef.current && html !== prevHtmlRef.current) {
    if (isStructuralChange) setIframeKey(k => k + 1);
  }
  ...
}, [html]);

// Fixed: never increment iframeKey from HTML changes
// Browser handles srcdoc updates natively
useEffect(() => {
  if (html) hasEverHadHtmlRef.current = true;
  prevHtmlRef.current = html;
}, [html]);
```

The iframe's `key` will only change from:
- User clicking Refresh button
- Health check recovery (auto-rollback)
- `refreshKey` prop (tab visibility change)

---

## Phase 5: Stabilize filesDigest During Generation

**Problem:** `handleStreamDelta` calls `setFiles()` during streaming, changing `filesDigest` multiple times while `isGenerating` is true. When generation ends, the digest may have shifted since `prevFilesDigestRef` was last set.

**Fix in `CompilationBridge.tsx`:**
- In the generation-ending sync (all three branches), always set `prevFilesDigestRef.current = filesDigest` to ensure the main compilation effect sees no digest change.
- This is already done in the current code for the sync and lock branches, but verify the force-recompile branch also updates correctly.

---

## Technical Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `AIAppBuilderWorkspace.tsx` | Move `bg-job-completed` dispatch into compile callback |
| 2 | `CompilationBridge.tsx` | Add `justSyncedFromExternalRef` guard |
| 3 | `AIAppBuilderWorkspace.tsx` | Increase nuclear fallback to 10s safety net |
| 4 | `BuilderPreviewPanel.tsx` | Stop incrementing `iframeKey` on HTML content changes |
| 5 | `CompilationBridge.tsx` | Already correct, verify digest sync in all branches |

## Expected Result

After all 5 phases:
- User sends "change colors to teal"
- Current preview stays visible (no blank, no skeleton)
- AI generates new files, background job compiles
- Compile finishes, `handleStableHTML` sets new HTML
- `bg-job-completed` fires AFTER compile, `setIsGenerating(false)`
- CompilationBridge syncs from external ref, no redundant recompile
- `BuilderPreviewPanel` receives new `html` prop, browser updates `srcdoc` in-place
- No iframe remount, no flash, colors update seamlessly


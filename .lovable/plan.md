

# Multi-Phase Fix: Final Lovable Build Parity Issues

## Overview

After a thorough analysis of the full compilation pipeline following the previous 11-phase fixes, I've identified 5 remaining issues that break Lovable parity. These cause subtle but noticeable UX regressions: stale previews after manual edits, error console noise, and unnecessary work during tab returns.

---

## Phase 1: Manual Code Edits Don't Trigger Recompilation for React Projects

**Problem:** When a user manually edits code in the Monaco editor, `handleContentChange` calls `upsertFile()` which updates `project.files` and changes `filesDigest` in CompilationBridge. The main compilation effect (line 178) detects the digest change and tries hot-patching via `liveSync.applyPatches()`. However, for React projects, the `useLivePreviewSync` hook at line 56 (`useLivePreviewSync.ts`) returns `null` for any `.tsx`/`.ts`/`.jsx`/`.js` file change -- forcing a full reload path. But the "full reload" path in CompilationBridge (lines 210-212) only unlocks `compilationLockRef` and falls through -- it doesn't actually trigger a new compilation because `compilationLockRef` was already `true` from the previous build.

**Fix in `CompilationBridge.tsx`:**
- When hot-patching fails for a files-changed scenario (line 210), explicitly reset `compilationAttemptedRef` to `false` alongside unlocking `compilationLockRef`, so the subsequent logic (lines 226-321) actually starts a new compilation.

---

## Phase 2: Error Console Accumulates Stale Errors Across Builds

**Problem:** In `BuilderPreviewPanel.tsx` (line 315-319), errors and console logs are cleared when `html` changes. However, during a build where the preview stays visible (Phase 4 of previous fix -- no iframe remount), `html` updates in-place via `srcdoc`. The browser doesn't necessarily fire a fresh `error` event for resolved issues, but the old error entries remain in state from the previous render cycle. This means users see errors from the OLD build persisting after a successful new build.

**Fix in `BuilderPreviewPanel.tsx`:**
- Also clear errors and console logs when `isGenerating` transitions from `true` to `false` (build complete). This ensures the error console reflects only the NEW build's state.

---

## Phase 3: `previewRefreshKey` Causes Unnecessary Iframe Remount on Tab Return

**Problem:** When a user switches away from the browser tab and comes back, `visibilitychange` fires and increments `previewRefreshKey` (line 2227). Since `iframeKey` is now `${iframeKey}-${refreshKey}`, this forces a full iframe teardown and rebuild -- even though the `srcdoc` hasn't changed. For complex previews with external resource loads, this causes a visible flash and reload delay.

In real Lovable, tab return just checks if the iframe is still healthy and only remounts if the content is gone.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Before incrementing `previewRefreshKey`, check iframe health first. Only increment if the iframe body appears blank (similar to the health check logic already in `BuilderPreviewPanel`). If the iframe is still healthy, skip the remount.

---

## Phase 4: `handleStreamDelta` Triggers Redundant `setFiles` During Streaming

**Problem:** `handleStreamDelta` (line 379) calls `setFiles(mergedFiles)` every 2KB of new content during streaming. Each call changes `filesDigest` in CompilationBridge, but CompilationBridge correctly skips compilation while `isGenerating` is true (line 179). However, each `setFiles` call triggers a React re-render of the entire workspace component tree -- including all 100+ hooks. With large multi-file generations producing 50KB+ of content, this causes 25+ unnecessary workspace re-renders during streaming.

**Fix in `AIAppBuilderWorkspace.tsx`:**
- Throttle `handleStreamDelta`'s `setFiles` calls to at most once every 3 seconds using a ref-based timestamp guard. The files are already being parsed into `partialFilesRef` for the overlay display -- the actual `setFiles` merge only needs to happen periodically for the editor display.

---

## Phase 5: `CompilationBridge` Hot-Patch Effect Fires on Every `filesDigest` Change

**Problem:** The hot-patch effect at the bottom of CompilationBridge (lines 414-419) fires on every `filesDigest` change. It calls `liveSync.applyPatches()` which internally compares files to the previous snapshot. For React/TS files, this always returns `null` (needs full reload), but the comparison work is still done on every keystroke in the editor.

**Fix in `CompilationBridge.tsx`:**
- Guard the hot-patch effect: only run if `stableHTML` exists AND we're not currently in a compilation cycle (i.e., `compilationLockRef.current` is false or a compilation just completed). Also skip if the main compilation effect already handled this digest change.

---

## Technical Summary

| Phase | File | Change |
|-------|------|--------|
| 1 | `CompilationBridge.tsx` | Reset `compilationAttemptedRef` when hot-patch fails to enable recompilation |
| 2 | `BuilderPreviewPanel.tsx` | Clear errors on generation end (isGenerating false transition) |
| 3 | `AIAppBuilderWorkspace.tsx` | Check iframe health before forcing remount on tab return |
| 4 | `AIAppBuilderWorkspace.tsx` | Throttle `setFiles` in `handleStreamDelta` to once per 3s |
| 5 | `CompilationBridge.tsx` | Skip redundant hot-patch effect when main effect already handled digest |

## Expected Result

After all 5 phases:
- Manual code edits in Monaco trigger proper React recompilation and preview update
- Error console clears on new successful build (no stale errors from previous build)
- Tab return only remounts iframe if content is actually gone (no unnecessary flash)
- Streaming performance improved: 25+ fewer re-renders during large generations
- No wasted hot-patch comparison work on every keystroke


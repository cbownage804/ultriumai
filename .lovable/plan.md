

## Fix: Preview Not Updating + State Lost on Tab Switch

Two distinct bugs are causing the problems shown in your screenshots.

---

### Bug 1: State Lost on Tab Switch

**Root Cause**: When `handleBgComplete` calls `setFiles(mergedFiles)`, React schedules the state update asynchronously. But `latestRef.current.files` (which the draft persistence reads) is only updated on the NEXT render. If you switch browser tabs before React re-renders, the `visibilitychange: hidden` handler calls `flushDraft()` which saves the OLD (empty/stale) files, not the newly merged ones.

**Fix** (in `AIAppBuilderWorkspace.tsx`, inside `handleBgComplete`, right after `setFiles(mergedFiles)`):

Add an immediate, synchronous draft save using the `mergedFiles` array directly, bypassing the ref that hasn't been updated yet:

```text
setFiles(mergedFiles);
// Immediately persist so tab-switch can't lose data
saveDraftImmediate(project.name, mergedFiles, []);
```

Also update `latestRef.current.files = mergedFiles` directly inside `handleBgComplete` so the visibility handler always has the latest files, even if React hasn't re-rendered yet.

---

### Bug 2: Preview Not Updating on 2nd+ Builds

**Root Cause**: There is a state synchronization conflict between `handleBgComplete` (in the workspace) and `CompilationBridge`. When `handleBgComplete` compiles and sets `stableHTMLRef.current`, the `CompilationBridge` sees `externalStableHTMLRef.current` is already set and skips recompilation (line 149-157). But when the NEXT build comes, `handleBgComplete` clears `stableHTMLRef.current = null` (line 286) in the workspace -- but `CompilationBridge` has its OWN `stableHTMLRef` that may still be set, causing guard conditions to skip compilation.

Additionally, when hunk patches produce syntax errors (as shown in your first screenshot), the worker compiler correctly reports the error, but the error HTML is displayed. On the next build attempt, `stableHTMLRef` still holds the error fallback HTML, and the digest-based change detection may not trigger recompilation.

**Fix** (in `AIAppBuilderWorkspace.tsx`):

1. After `setFiles(mergedFiles)`, also update `latestRef.current.files` synchronously
2. Force-clear `stableHTML` state (not just ref) before starting compilation, so CompilationBridge sees the null and doesn't skip
3. Always call `setPreviewRefreshKey(k => k + 1)` at the END of `handleBgComplete`, not just inside individual branches -- ensures the iframe always gets the latest content

**Fix** (in `CompilationBridge.tsx`):

1. When generation ends and `externalStableHTMLRef` has content, always sync -- don't check `stableHTMLRef.current` first (it may be stale from a previous build cycle)
2. Clear `compilationLockRef` at the START of each generation cycle, not just when `stableHTMLRef` is null

---

### Technical Summary

| File | Line(s) | Change |
|------|---------|--------|
| `AIAppBuilderWorkspace.tsx` | ~314 | Add `latestRef.current.files = mergedFiles` + `saveDraftImmediate(...)` right after `setFiles(mergedFiles)` |
| `AIAppBuilderWorkspace.tsx` | ~286 | Also call `setStableHTML(null)` (state setter, not just ref) to notify CompilationBridge |
| `AIAppBuilderWorkspace.tsx` | ~376 | Add a final unconditional `setPreviewRefreshKey(k => k + 1)` after the compile promise chain |
| `CompilationBridge.tsx` | ~138-144 | On generation start, also clear `compilationLockRef` and `justSyncedFromExternalRef` |
| `CompilationBridge.tsx` | ~149 | Remove the `!stableHTMLRef.current` guard -- always sync from external when generation ends |


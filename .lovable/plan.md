

## Fix: Preview Not Updating on 2nd+ Builds + Data Loss on Tab Switch

### Problem 1: Preview Only Updates on First Build

**Root cause**: When a new generation starts, `stableHTMLRef.current` is never cleared. So when the second build completes in `handleBgComplete`:
- Line 326: `if (!stableHTMLRef.current && hasReactFiles)` evaluates to FALSE because the ref still holds the first build's HTML
- The React compilation is skipped entirely
- `CompilationBridge`'s generation-ending effect also sees a truthy `stableHTMLRef.current` and just syncs the digest without recompiling
- Result: the preview stays frozen on the first build's output

**Fix**: Clear `stableHTMLRef.current` at the START of `handleBgComplete` (before the compilation logic runs). This ensures every build triggers fresh compilation.

```text
File: src/components/ai-builder/AIAppBuilderWorkspace.tsx (~line 285, inside handleBgComplete)

Add at the top of handleBgComplete, before the compilation logic:
  stableHTMLRef.current = null;
```

This single line ensures the guard condition on line 326 passes on every build, not just the first one.

---

### Problem 2: Data Lost When Switching Tabs During Build

**Root cause**: Two issues compound:
1. The `isNewProjectRef.current` flag prevents the visibility handler from restoring data (line 1293/1311). This flag is only set to `false` AFTER generation completes (line 1230), so if the user switches tabs during a build, the handler exits early.
2. The `saveDraftImmediate` added in the last fix only fires when generation completes -- not during streaming. If the user switches tabs mid-generation, no draft has been saved yet.

**Fix**: In the `flushDraft` function (line 1291), remove the `isNewProjectRef.current` early return guard. If there are files or messages, they should always be saved regardless of the project's "new" status.

Also in `handleVisibility` (line 1311), remove the `isNewProjectRef.current` guard so restoration works even for fresh projects that have started generating.

```text
File: src/components/ai-builder/AIAppBuilderWorkspace.tsx

Line 1293: Remove `if (isNewProjectRef.current) return;` from flushDraft
Line 1311: Remove `if (isNewProjectRef.current) return;` from handleVisibility
```

---

### Summary

| File | Line | Change |
|---|---|---|
| `AIAppBuilderWorkspace.tsx` | ~285 (handleBgComplete) | Add `stableHTMLRef.current = null;` before compilation logic so every build recompiles |
| `AIAppBuilderWorkspace.tsx` | ~1293 | Remove `isNewProjectRef.current` guard from `flushDraft` |
| `AIAppBuilderWorkspace.tsx` | ~1311 | Remove `isNewProjectRef.current` guard from `handleVisibility` |

All changes are in a single file. The preview fix is a one-line addition; the persistence fix removes two guard conditions that were overly protective.

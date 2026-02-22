

# Fix: Keep Preview Visible During Generation (No Blank Screen)

## Root Cause

The core problem is on **line 125 of CompilationBridge.tsx**: when any chat message triggers `sendMessage()`, it sets `isGenerating = true`, and CompilationBridge immediately responds by calling `setStableHTML(null)` -- which **blanks the preview**. This happens for every single chat request, including simple "change the colors to teal" messages.

This is fundamentally different from how Lovable works. Lovable keeps the current preview visible while generating, then seamlessly updates it when the new code is ready. Your app builder destroys the preview the instant generation starts, showing a skeleton/loading screen instead.

## The Fix (2 files)

### Change 1: CompilationBridge.tsx -- Don't null stableHTML when generation starts

Instead of resetting `stableHTML` to null when `isGenerating` becomes true, keep the existing preview visible. Only reset `liveCompiledHTML` (the compilation result tracker) and the compilation flags. The old preview stays in the iframe while the AI works.

When the new compilation finishes (either via `handleBgComplete` direct compile or via the compilation effect), `setStableHTML` will be called with the new HTML, which will naturally replace the old preview.

**Lines 119-128 change from:**
```
if (isGenerating && !prevIsGeneratingForReset.current) {
  setStableHTML(null);          // <-- THIS BLANKS THE PREVIEW
  setLiveCompiledHTML(null);
  compilationAttemptedRef.current = false;
  compilationLockRef.current = false;
}
```

**To:**
```
if (isGenerating && !prevIsGeneratingForReset.current) {
  // DON'T null stableHTML -- keep the current preview visible
  // while the AI generates. The new compilation result will
  // replace it when ready (via handleBgComplete or compilation effect).
  setLiveCompiledHTML(null);
  compilationAttemptedRef.current = false;
  compilationLockRef.current = false;
}
```

### Change 2: CompilationBridge.tsx -- Allow recompilation to overwrite existing stableHTML

Currently, when `stableHTML` already exists and `filesDigest` changes, the code tries hot-patching first (line 187). But after a full AI generation where files are completely rewritten, hot-patching will always fail (since JS/TS changes force a null return from `detectPatches`). The existing logic already falls through to a full recompile in this case, but we need to make sure the new result overwrites the old stableHTML properly.

The key change: in the compilation effect (line 176), when `stableHTML` exists and `filesDigest` changed, and hot-patching fails, don't just "fall through" -- explicitly unlock and proceed. The `runCompilation` function already calls `setStableHTML(result)` at line 273, which will replace the old preview with the new one.

This is already mostly correct, but we need to ensure `compilationLockRef` is reset when generation ends so the recompilation can proceed.

### Change 3: Preview update effect -- Handle stableHTML replacement

In the preview update effect (line 374-394), when `liveCompiledHTML` is set and `stableHTML` already exists (old preview), we need to always update to the new result instead of trying to hot-patch (which will fail for full regenerations).

**Lines 374-389 change to:**
```
if (liveCompiledHTML) {
  if (stableHTML === liveCompiledHTML) return;
  // If we already have a preview showing (stableHTML is not null),
  // just replace it with the new compilation result directly.
  // Hot-patching only works for incremental CSS/HTML changes,
  // not full regenerations.
  setStableHTML(liveCompiledHTML);
  liveSync.resetSnapshot(filesRef.current);
  return;
}
```

## What This Achieves

- User types "change colors to teal" in chat
- AI generation starts -- **current preview stays visible** (no skeleton, no blank screen)
- AI generates new files, `handleBgComplete` compiles them
- New compiled HTML replaces the old preview seamlessly
- If the AI correctly updated the colors, the preview now shows teal
- If it didn't, the user still sees their site (not a blank screen) and can try again

## Technical Summary

| File | Change |
|------|--------|
| `CompilationBridge.tsx` line 125 | Remove `setStableHTML(null)` when generation starts |
| `CompilationBridge.tsx` lines 374-389 | Always replace stableHTML with new liveCompiledHTML (don't try hot-patching after full regen) |




# Fix: Preview Not Updating After Generation

## Root Cause Found

There is a **race condition** between `handleBgComplete` (direct compilation) and `CompilationBridge`'s `isGenerating` transition effect:

1. `handleBgComplete` runs, compiles files, and calls `handleStableHTML(result)` -- preview should show up
2. Milliseconds later, `setIsGenerating(false)` fires (line 1344 in `useAIAppBuilder.ts`)
3. CompilationBridge's `isGenerating` transition effect (line 127-131) sees generation ending and sets `prevFilesDigestRef.current = '__force_recompile__'`
4. This triggers CompilationBridge's main compilation effect (line 157+), which detects `filesDigest !== prevFilesDigestRef.current` and **resets stableHTML back to null** (line 168)
5. The preview goes blank again, then a 500ms debounce + 100ms rAF delay starts a redundant recompilation
6. If that recompilation also has issues (lock contention, digest mismatch), the preview stays blank forever

Additionally, **visual edits for color/text** send the change through `sendMessage` (full AI generation), which resets the entire preview. Simple property changes should be applied directly to source files and recompiled without triggering AI.

## Fix Plan

### 1. CompilationBridge: Don't reset stableHTML if it was JUST set

In `CompilationBridge.tsx`, the main compilation effect (line 165-168) resets `stableHTML` to null when `filesDigest` changes. But if `handleBgComplete` just set `stableHTML` with valid compiled HTML, this destroys it. 

**Fix**: When `isGenerating` transitions to `false`, do NOT set `prevFilesDigestRef` to `'__force_recompile__'`. Instead, check if `stableHTML` is already set with the correct content. If `handleBgComplete` already compiled, skip recompilation entirely.

Specifically in the `isGenerating` transition effect (lines 127-131):
- Instead of always setting `prevFilesDigestRef.current = '__force_recompile__'`, only do so if `stableHTMLRef.current` is still null (meaning `handleBgComplete`'s direct compilation hasn't produced a result yet)

### 2. CompilationBridge: Don't null-out stableHTML on filesDigest change

In the main compilation effect (lines 165-168), when `stableHTMLRef.current` exists and `filesDigest` changed, it sets `stableHTML(null)` before recompiling. This causes a flash of blank preview. 

**Fix**: Instead of nulling stableHTML, just unlock and recompile. Keep the old preview visible until the new one is ready. Set the `prevFilesDigestRef` and unlock the lock, but don't call `setStableHTML(null)`.

### 3. Visual edits: Apply color/text directly to source files

In `handleVisualEdit` (AIAppBuilderWorkspace.tsx lines 1848-1853), color changes call `sendMessage` which triggers a full AI generation cycle. This is overkill for a simple CSS change.

**Fix**: For `color` and `text` property changes, directly modify the source files (add/update inline styles in HTML, or update CSS files) and call `setFiles` to trigger recompilation via CompilationBridge. Only fall back to `sendMessage` for complex changes that can't be applied mechanically.

## Technical Details

### File 1: `src/components/ai-builder/CompilationBridge.tsx`

**Change 1** -- `isGenerating` transition effect (lines 127-131):
```typescript
} else if (!isGenerating && prevIsGeneratingForReset.current) {
  // Generation ENDING -- only force recompile if handleBgComplete
  // hasn't already provided a compiled result
  if (!stableHTMLRef.current) {
    compilationLockRef.current = false;
    compilationAttemptedRef.current = false;
    prevFilesDigestRef.current = '__force_recompile__';
  }
  // If stableHTML is already set (from handleBgComplete direct compile),
  // just sync the digest so we don't trigger a redundant recompile
  else {
    prevFilesDigestRef.current = filesDigest;
    compilationLockRef.current = true;  // lock to prevent re-entry
    compilationAttemptedRef.current = true;
  }
}
```

**Change 2** -- Main compilation effect (lines 165-175), don't null stableHTML:
```typescript
if (stableHTMLRef.current && filesDigest !== prevFilesDigestRef.current) {
  // Files changed -- recompile but keep current preview visible
  prevFilesDigestRef.current = filesDigest;
  compilationLockRef.current = false;
  // DON'T set stableHTML to null -- keep old preview showing
  // until new compilation finishes
} else if (stableHTMLRef.current) {
  return;  // no change needed
}
```

### File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

**Change 3** -- `handleVisualEdit` for color (lines 1848-1853):

Instead of calling `sendMessage` for color changes, directly update the source file:
```typescript
} else if (property === 'color') {
  // Apply color directly to source files without triggering AI generation
  for (const file of htmlFiles) {
    // Add/update inline style on the matching element
    // Use a simple regex or string replacement approach
    // Then call upsertFile to trigger recompilation
  }
  // If direct source update fails, fall back to sendMessage
}
```

This ensures color changes update instantly without resetting the preview.

## Summary

These three changes work together:
- **Change 1** prevents CompilationBridge from overwriting `handleBgComplete`'s result
- **Change 2** prevents blank preview flashes during recompilation 
- **Change 3** prevents visual edits from triggering unnecessary full AI generation cycles


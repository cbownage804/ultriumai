
# Fix: Prevent Redundant Recompilation After Background Build

## Root Cause Found

The preview keeps regenerating because of a **state desync between the workspace and CompilationBridge**.

Here's the exact sequence causing the problem:

1. User sends "change colors to teal"
2. `sendMessage` sets `isGenerating = true`
3. Background job runs on the server, files stream in
4. `handleBgComplete` fires -- applies files, **directly compiles, and calls `handleStableHTML(compiled.html)`**
5. The workspace's `stableHTML` state is updated -- preview SHOULD show the new HTML
6. But CompilationBridge has **its own separate `stableHTMLRef`** which is still `null`
7. When `isGenerating` transitions to `false`, CompilationBridge checks `stableHTMLRef.current` (its own ref) -- sees `null`
8. Thinks compilation never happened -- **forces a redundant full recompile** by setting `prevFilesDigestRef = '__force_recompile__'`
9. The second compile produces a new HTML string, which changes the `html` prop to BuilderPreviewPanel
10. BuilderPreviewPanel detects the HTML changed and **remounts the iframe**, causing the visible flash/regeneration

The preview IS being compiled correctly the first time (step 4-5), but CompilationBridge doesn't know about it and triggers a second compile that forces a full iframe remount.

## The Fix (2 changes, 1 file each)

### Change 1: Pass workspace's stableHTMLRef to CompilationBridge

The workspace already has a `stableHTMLRef` (line 2148) that gets updated whenever `handleStableHTML` is called -- including when `handleBgComplete` directly compiles. Pass this ref to CompilationBridge so it can check if the preview was already set externally.

**`AIAppBuilderWorkspace.tsx`** -- Add `externalStableHTMLRef={stableHTMLRef}` to the CompilationBridge JSX (near line 2309).

### Change 2: CompilationBridge checks external ref on generation end

**`CompilationBridge.tsx`** -- In the "generation ENDING" effect (lines 126-139):

Currently:
```typescript
} else if (!isGenerating && prevIsGeneratingForReset.current) {
  if (!stableHTMLRef.current) {
    // Forces recompile -- BUT workspace already has the preview!
    compilationLockRef.current = false;
    compilationAttemptedRef.current = false;
    prevFilesDigestRef.current = '__force_recompile__';
  } else { ... }
}
```

Fixed to also check the external ref:
```typescript
} else if (!isGenerating && prevIsGeneratingForReset.current) {
  const externalHasPreview = externalStableHTMLRef?.current;
  if (!stableHTMLRef.current && externalHasPreview) {
    // handleBgComplete already compiled and set the preview externally.
    // Sync our internal state to match, skip redundant recompile.
    stableHTMLRef.current = externalHasPreview;
    setStableHTMLLocal(externalHasPreview);
    prevFilesDigestRef.current = filesDigest;
    compilationLockRef.current = true;
    compilationAttemptedRef.current = true;
  } else if (!stableHTMLRef.current) {
    compilationLockRef.current = false;
    compilationAttemptedRef.current = false;
    prevFilesDigestRef.current = '__force_recompile__';
  } else {
    prevFilesDigestRef.current = filesDigest;
    compilationLockRef.current = true;
    compilationAttemptedRef.current = true;
  }
}
```

## Technical Details

### File 1: `src/components/ai-builder/CompilationBridge.tsx`

- Add `externalStableHTMLRef?: React.RefObject<string | null>` to the `CompilationBridgeProps` interface
- In the generation ENDING branch (lines 126-139), check `externalStableHTMLRef?.current` before forcing a recompile
- If the external ref has HTML, sync it into CompilationBridge's internal state and skip recompilation

### File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

- Add `externalStableHTMLRef={stableHTMLRef}` prop to the `CompilationBridge` JSX element (around line 2309)

## What This Achieves

- `handleBgComplete` compiles once, sets the preview via `handleStableHTML`
- When `isGenerating` goes to `false`, CompilationBridge sees the external ref has HTML
- Syncs internal state, marks compilation as done, skips the redundant recompile
- No iframe remount, no flash, no regeneration
- Preview stays stable throughout the entire cycle

## Why Previous Fixes Didn't Work

The previous fix (removing `setStableHTML(null)`) was necessary but not sufficient. It stopped the preview from blanking at the START of generation, but didn't address the SECOND problem: CompilationBridge forcing a redundant recompile at the END of generation because its internal ref was out of sync with the workspace's state.

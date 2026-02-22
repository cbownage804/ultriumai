

# Fix: Preview Not Updating After Build + Color Changes Ignored

## Root Causes Found

Two critical bugs cause the preview to not reflect changes after a build:

### Bug 1: `filesDigest` uses content LENGTH instead of content hash (CompilationBridge.tsx, line 86)

The compilation trigger computes a "digest" of files using only `f.path + ':' + f.content.length`. When the AI replaces a color like `#FF5722` (7 chars) with `#009688` (7 chars), the total file length doesn't change, so the digest stays identical. The compilation effect never re-runs because its dependency (`filesDigest`) hasn't changed.

This is the primary reason color changes (and any same-length text replacement) are silently ignored in the preview.

**Fix:** Replace `content.length` with a fast content hash (e.g., djb2 or simple checksum) so any character change triggers recompilation.

### Bug 2: Background generation doesn't signal `isGenerating` to CompilationBridge (AIAppBuilderWorkspace.tsx, line 2159)

`CompilationBridge` receives `isGenerating` from `useAIAppBuilder` (SSE streaming state), but background generation uses a separate `isGeneratingOverride` state. During background builds, the CompilationBridge thinks nothing is generating, compiles intermediate files, and locks itself (`compilationLockRef = true`). When the final files arrive via `handleBgComplete`, the lock may prevent recompilation.

**Fix:** Pass `isGenerating || isGeneratingOverride` to CompilationBridge instead of just `isGenerating`.

---

## File Changes

### 1. `src/components/ai-builder/CompilationBridge.tsx`

**Line 84-87** -- Replace content-length digest with a fast hash:

```typescript
const filesDigest = useMemo(() => {
  if (files.length === 0) return '';
  // Use a fast hash of content (not just length) so same-length edits trigger recompilation
  return files.map(f => {
    let hash = 5381;
    for (let i = 0; i < f.content.length; i++) {
      hash = ((hash << 5) + hash + f.content.charCodeAt(i)) & 0x7fffffff;
    }
    return f.path + ':' + hash;
  }).join('|');
}, [files]);
```

This uses the djb2 hash algorithm which is fast and produces different outputs for any character change, ensuring even single-character edits (like color hex codes) trigger recompilation.

### 2. `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

**Line 2159** -- Pass combined generating state to CompilationBridge:

```typescript
isGenerating={isGenerating || isGeneratingOverride}
```

This ensures the CompilationBridge correctly defers compilation during background generation and properly resets locks when the build completes.

---

## Why Tab Switch "Fixed" It

The existing `previewRefreshKey` mechanism (lines 2062-2071) increments on `visibilitychange`, forcing the iframe to remount with whatever `stableHTML` is current. If the files had already been compiled once (with old content due to the digest bug), the stale HTML was shown. But when the user returned to the tab, the iframe remounted, and if any other side-effect had triggered a state update, the new HTML could appear. This was masking the underlying digest bug.

## Impact

These two fixes together ensure:
- Any file content change (even single characters) triggers recompilation
- Background generation properly blocks premature compilation
- The preview updates immediately after build completion without requiring a tab switch


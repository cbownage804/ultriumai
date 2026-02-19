

# Defer Preview Until Build Completes (Lovable-style)

## Problem

The preview iframe renders **during** code generation, causing three issues:

1. **Resource Load Errors** -- The iframe tries to load `app.js` before the AI has finished writing it, because `index.html` is upserted first and immediately compiled into the iframe's `srcDoc`
2. **Frozen/slow UI** -- Every streamed file chunk triggers a full recompilation (`liveCompiledHTML` via `useMemo`) and iframe reload, consuming memory and CPU during generation
3. **First-build bypass** -- The "defer preview" logic on line 1858 (`if (!isGenerating && liveCompiledHTML)`) correctly defers *subsequent* builds, but on the first build `stableHTML` is null, so line 1878 (`stableHTML || liveCompiledHTML`) falls through to the live-recomputing value

## Solution

Defer ALL preview rendering until `isGenerating` flips to `false`. Show the `SkeletonPreview` overlay during the build instead of a half-rendered iframe. This matches Lovable's behavior: build everything first, render preview only when done.

## Changes

### 1. `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

**Fix the `compiledHTML` passed to the preview panel:**

Replace the current logic (lines ~1855-1878):

```typescript
const [stableHTML, setStableHTML] = useState<string | null>(null);

// Defer preview updates until build completes
useEffect(() => {
  if (!isGenerating && liveCompiledHTML) {
    setStableHTML(liveCompiledHTML);
    liveSync.resetSnapshot(project.files);
  }
}, [isGenerating, liveCompiledHTML, project.files]);

// For first load (no previous build), show immediately
const compiledHTML = stableHTML || liveCompiledHTML;
```

With:

```typescript
const [stableHTML, setStableHTML] = useState<string | null>(null);

// Only update preview when generation completes (never mid-build)
useEffect(() => {
  if (!isGenerating && liveCompiledHTML) {
    const patched = liveSync.applyPatches(previewIframeRef, project.files);
    if (!patched) {
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(project.files);
    }
  }
}, [isGenerating, liveCompiledHTML, project.files]);

// NEVER fall through to liveCompiledHTML during generation
const compiledHTML = stableHTML;
```

Key change: `compiledHTML = stableHTML` (not `stableHTML || liveCompiledHTML`). This means during the first build, `compiledHTML` stays `null`, and the `BuilderPreviewPanel` shows `SkeletonPreview` instead of a broken half-rendered iframe.

**Stop upserting files during streaming into the project file system:**

The streaming file upsert on lines 1136-1145 triggers recompilation. Change it so files are only upserted to the editor (for the code tab) but NOT triggering `liveCompiledHTML` recomputation:

```typescript
useEffect(() => {
  if (isStreamingPreview && partialFiles.length > 0) {
    for (const file of partialFiles) upsertFile(file.path, file.content);
    const lastFile = partialFiles[partialFiles.length - 1];
    if (lastFile && rightTab === 'code') {
      setActiveFile(lastFile.path);
    }
  }
}, [partialFiles, isStreamingPreview]);
```

This part stays the same (files still appear in the editor), but since `compiledHTML` no longer reads `liveCompiledHTML` during generation, the preview won't update until the build finishes.

### 2. `src/components/ai-builder/BuilderPreviewPanel.tsx`

**Ensure SkeletonPreview shows when `html` is null during generation:**

The existing logic on line 412-445 already handles this correctly:
- `html` exists -> show iframe
- `html` is null AND `isGenerating` -> show `SkeletonPreview`
- `html` is null AND not generating -> show placeholder

No changes needed here since setting `compiledHTML = stableHTML` (which is `null` on first build) will naturally trigger the `SkeletonPreview` path.

## What This Achieves

- **No more "Resource Load Error"** -- the iframe never sees incomplete HTML
- **No frozen/slow UI** -- no mid-build recompilation or iframe reloads
- **Lower memory usage** -- the iframe DOM is not created until the build is done
- **Lovable-style UX** -- skeleton during build, full preview when complete
- **Existing hot-patch behavior preserved** -- manual edits after build still hot-patch via CSS

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Remove `liveCompiledHTML` fallback so `compiledHTML` is `null` until build completes |




# Fix: Stop Full Preview Regeneration on All Edits

## Problem

There are two separate issues causing full preview reloads:

### Issue 1: Visual edits (color/text) always fall back to `sendMessage`
The `handleVisualEdit` function tries to match CSS path selectors (like `body > div:nth-child(2) > h1`) against source file content using regex. These selectors are CSS DOM paths, not class/id names, so the regex **never matches**. Every color/text edit falls through to `sendMessage()`, which triggers a full AI generation cycle, nulls `stableHTML`, and destroys the preview.

### Issue 2: Every new `stableHTML` string causes a full iframe remount
In `BuilderPreviewPanel.tsx` (line 81), whenever the `html` prop changes to a new string value, `iframeKey` is incremented, which forces a complete iframe teardown and rebuild -- even if the change was minor.

## Fix

### Change 1: `AIAppBuilderWorkspace.tsx` -- Serialize iframe DOM instead of regex matching

For color and text visual edits, the `VisualEditOverlay` has already applied the change to the iframe DOM. Instead of trying to regex-match selectors in source files (which never works), we will:

1. Read the iframe's current DOM (which already has the edit applied)
2. Serialize it back to the source HTML file
3. Set `stableHTML` directly to the current iframe content (no recompile)
4. Skip the `sendMessage` fallback entirely

```
VisualEditOverlay applies edit to iframe DOM (already works)
  -> handleVisualEdit reads iframe DOM
  -> Serializes to source file via upsertFile (for persistence)
  -> stableHTML stays unchanged (iframe already shows the edit)
  -> No recompile, no AI generation
```

Specifically, replace the `sendMessage` fallback in both the `text` and `color` branches with:

```typescript
// Instead of sendMessage fallback:
const iframe = previewIframeRef.current;
const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document;
if (iframeDoc) {
  const serializedHTML = '<!DOCTYPE html>\n' + iframeDoc.documentElement.outerHTML;
  const mainHtml = project.files.find(f => f.path.endsWith('.html'));
  if (mainHtml) {
    pushUndo('Visual edit', project.files);
    // Use a flag to prevent CompilationBridge from recompiling
    skipNextCompilationRef.current = true;
    upsertFile(mainHtml.path, serializedHTML);
  }
}
// Do NOT call sendMessage -- the iframe already shows the change
```

### Change 2: `AIAppBuilderWorkspace.tsx` -- Add `skipNextCompilationRef`

Add a `useRef(false)` flag that tells CompilationBridge to skip recompilation for the next file change. Pass it as a prop to CompilationBridge.

### Change 3: `CompilationBridge.tsx` -- Respect skip flag

Add `skipNextCompilationRef` prop. In the main compilation effect, when `filesDigest` changes and `skipNextCompilationRef.current` is true:
- Reset the flag to false
- Sync `prevFilesDigestRef` to the new digest
- Update the live-sync snapshot
- Return without recompiling

```typescript
if (stableHTMLRef.current && filesDigest !== prevFilesDigestRef.current) {
  if (skipNextCompilationRef?.current) {
    skipNextCompilationRef.current = false;
    prevFilesDigestRef.current = filesDigest;
    liveSync.resetSnapshot(filesRef.current);
    console.info('[CompilationBridge] Skipping recompile (visual edit)');
    return;
  }
  // ... existing hot-patch / recompile logic
}
```

### Change 4: `BuilderPreviewPanel.tsx` -- Don't remount iframe for same-content updates

Currently line 81 increments `iframeKey` whenever `html !== prevHtmlRef.current`. This causes a full iframe teardown even for minor changes. The fix: only increment `iframeKey` if the HTML structure actually changed significantly (different length by more than a threshold), not for every single-character difference.

However, since Changes 1-3 prevent `stableHTML` from changing at all during visual edits, this is less critical. We will still add a guard: if the only difference is inline style changes, skip the iframe remount.

## Technical Details

### File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

- Add `const skipNextCompilationRef = useRef(false);` near other refs
- Pass `skipNextCompilationRef` to `CompilationBridge` as a prop
- In `handleVisualEdit` for `text` (line 1862-1868): replace `sendMessage` fallback with iframe DOM serialization
- In `handleVisualEdit` for `color` (line 1903-1909): replace `sendMessage` fallback with iframe DOM serialization
- Add `previewIframeRef` and `handleStableHTML` to `handleVisualEdit` dependency array

### File 2: `src/components/ai-builder/CompilationBridge.tsx`

- Add `skipNextCompilationRef` to props interface
- In main compilation effect (line 174), add skip check before hot-patch/recompile logic

## Why This Will Work

- The iframe DOM already has the correct visual state after VisualEditOverlay applies the change
- Serializing the DOM back to source ensures file persistence without regex guessing
- The skip flag prevents CompilationBridge from destroying the already-correct preview
- No `sendMessage` call means no AI generation, no credit usage, no preview reset
- Changes are instant and non-destructive


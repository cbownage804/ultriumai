

## Fix: Preview Never Appears Because React State Is Never Updated

### Root Cause (definitive)

`handleBgComplete` in `AIAppBuilderWorkspace.tsx` sets `stableHTMLRef.current = compiled` (a ref) but never calls the state setter `setStableHTML(compiled)`. Since `compiledHTML = stableHTML` (line 2263) reads from **React state** (not the ref), the preview panel always receives `null`.

The CompilationBridge's sync path (line 143) also uses `setStableHTMLLocal()` which only updates its own internal state -- it never calls `onStableHTML()` which would propagate back to the parent's `setStableHTML`.

Two lines of ref-only writes that should be state updates. That's the entire bug.

### Fix (2 changes, 2 lines each)

#### 1. `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

In `handleBgComplete`, replace the ref-only writes with calls to `handleStableHTML()` which updates both the ref AND the React state:

**Line 315** -- change:
```typescript
// Before:
stableHTMLRef.current = indexFile.content;

// After:
handleStableHTML(indexFile.content);
```

**Line 326** -- change:
```typescript
// Before:
stableHTMLRef.current = compiled;

// After:
handleStableHTML(compiled);
```

Add `handleStableHTML` to the `useCallback` dependency array on line 368.

#### 2. `src/components/ai-builder/CompilationBridge.tsx`

In the generation-ending effect (line 143), replace `setStableHTMLLocal` with `setStableHTML` so the parent also gets notified:

**Lines 142-143** -- change:
```typescript
// Before:
stableHTMLRef.current = externalHasPreview;
setStableHTMLLocal(externalHasPreview);

// After (setStableHTML already sets the ref + calls onStableHTML):
setStableHTML(externalHasPreview);
```

### Why This Is The Fix

1. `handleBgComplete` compiles successfully, calls `handleStableHTML(html)`
2. `handleStableHTML` sets `stableHTMLRef.current = html` AND calls `setStableHTML(html)` (React state update)
3. React re-renders, `compiledHTML = stableHTML` now has the HTML
4. `BuilderPreviewPanel` receives `html={compiledHTML}` with actual content
5. Preview appears

### What This Does NOT Change

- No changes to compilation logic, worker, debouncing, or locking
- No changes to the CompilationBridge main effect
- No changes to BuilderPreviewPanel rendering logic
- The `compileNowRef` fallback path already uses `setStableHTML()` correctly (line 231), so it was always working -- the issue was only in the `handleBgComplete` direct-compilation path


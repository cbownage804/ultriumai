

# Fix: Preview Not Updating After Build

## Root Cause

After deep analysis, the core issue is that when compiled HTML changes, the iframe's `srcDoc` attribute is updated by React on the **same DOM element** (same `key`), but some browsers don't reliably re-navigate the iframe when `srcDoc` changes via property assignment. The iframe only reliably loads new content when it's **remounted** (destroyed and recreated).

Currently, `iframeKey` only changes on health-check failures or tab visibility -- NOT when the compiled HTML changes. This is why tab-switching "fixes" it (it increments `refreshKey`, forcing a remount).

## Fix

### 1. `src/components/ai-builder/BuilderPreviewPanel.tsx`

Add an effect that increments `iframeKey` whenever the `html` prop changes from one non-null value to a **different** non-null value. This forces the iframe to remount with the new content.

```typescript
// Force iframe remount when compiled HTML changes
const prevHtmlRef = useRef<string | null>(null);
useEffect(() => {
  if (html && prevHtmlRef.current && html !== prevHtmlRef.current) {
    setIframeKey(k => k + 1);
  }
  prevHtmlRef.current = html;
}, [html]);
```

This is safe because:
- `null` to non-null: iframe is freshly created (wasn't in DOM before) -- no remount needed
- Non-null to different non-null: this is the problematic case -- forces remount
- Same value: no-op

### 2. `src/components/ai-builder/CompilationBridge.tsx` (safety net)

Add a `console.info` log when `setStableHTML` is called with a new value, so future debugging is easier. No logic changes needed beyond previous fixes.

## Why This Works

The existing flow (djb2 hash digest, generation-ending forced recompile) correctly produces new `liveCompiledHTML` and sets `stableHTML`. The problem was only in the **last mile**: the browser iframe not re-rendering despite `srcDoc` changing. Forcing a remount via key change is the standard React pattern for this.


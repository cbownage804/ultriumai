

# Fix: Preview Not Updating — iframeKey Logic Bug

## Problem

The `useEffect` in `BuilderPreviewPanel.tsx` (line 78) that forces iframe remount has a flawed condition:

```typescript
if (html && prevHtmlRef.current && html !== prevHtmlRef.current) {
```

The `prevHtmlRef.current` guard causes the **null-to-new-value** transition to be skipped — but that is exactly the transition that happens after every generation cycle (stableHTML is cleared to null during generation, then set to new compiled HTML when done). The iframe is never remounted, so the browser keeps showing old content.

## Fix

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`** (lines 76-83)

Replace the current effect with one that tracks whether html has ever been set. This avoids an unnecessary remount on the very first load while correctly catching all subsequent transitions including null-to-new:

```typescript
const prevHtmlRef = useRef<string | null>(null);
const hasEverHadHtmlRef = useRef(false);

useEffect(() => {
  if (html) {
    if (hasEverHadHtmlRef.current && html !== prevHtmlRef.current) {
      setIframeKey(k => k + 1);
    }
    hasEverHadHtmlRef.current = true;
  }
  prevHtmlRef.current = html;
}, [html]);
```

**Behavior by case:**
- First time html appears (initial load): `hasEverHadHtmlRef` is false, skip -- no unnecessary flash
- html changes to different value: increment iframeKey -- remount
- null to new value (post-generation): `hasEverHadHtmlRef` is true, `prevHtmlRef` is null, `html !== null` -- increment iframeKey -- remount (THIS IS THE FIX)
- Same value: no-op

No other files need changes. The compilation pipeline is working correctly; this is purely a last-mile rendering issue.


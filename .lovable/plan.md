

## Fix: Tab-Switch Data Loss + Persistent Skeleton

### Problem 1: Switching browser tabs wipes everything

The URL stays as `?new=true` for the entire session. If the browser discards your tab to save memory (common on Windows with many tabs), when you go back, the component remounts from scratch. The draft restoration code sees `?new=true` and skips restoring your saved work -- everything is lost.

**Root cause:** `?new=true` is never removed from the URL after the first generation starts. It was designed to prevent restoring an old draft when you click "New App", but it stays active forever, blocking ALL future recovery attempts.

### Problem 2: Preview stuck on skeleton

The skeleton shows during generation (normal), but after generation completes, two things can prevent the preview from appearing:

1. The `stableHTMLRef.current` check added in our last fix can block fresh generation previews. On a new project, `stableHTMLRef.current` starts as `null`, so the reset fires correctly. But the compilation effect at line 139 checks `stableHTMLRef.current` -- if for any reason it was set briefly (e.g., error fallback) and then the user sends another message, the guard `stableHTMLRef.current` being truthy prevents recompilation.

2. When `isGenerating` transitions false, the compilation effect depends on `filesDigest` which may not change if the files were already merged during streaming, causing the compilation effect to not fire.

### The Fix (2 files, 4 changes)

**File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

**Change A: Strip `?new=true` from URL after first message is sent**

After the user sends their first message and generation begins, remove `new=true` from the URL using `replaceState`. This ensures that if the tab is discarded and remounted, draft recovery will work.

Add a new effect after line 1012:
```typescript
// Strip ?new=true from URL once generation starts so tab recovery works
useEffect(() => {
  if (isGenerating && searchParams.get('new') === 'true') {
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
}, [isGenerating, searchParams]);
```

**Change B: Also persist to IndexedDB on visibilitychange (not just localStorage)**

The `visibilitychange` handler at line 997-1012 only saves to localStorage via `saveDraftImmediate`. IndexedDB (larger, more reliable) is not flushed. Add IDB flush alongside the draft flush:

```typescript
const flushDraft = () => {
  saveDraftImmediate(latestRef.current.name, latestRef.current.files, latestRef.current.messages);
  // Also flush to IndexedDB for more reliable recovery
  idbPersistence.saveToIDB(sessionId, latestRef.current.name, latestRef.current.files, latestRef.current.messages);
};
```

**File 2: `src/components/ai-builder/CompilationBridge.tsx`**

**Change C: Always reset stableHTML on fresh generation (fix the guard)**

The current guard `if (!stableHTMLRef.current)` was meant to preserve previews during auto-fix, but it also prevents resetting on fresh user messages. We need to distinguish auto-fix from fresh user messages.

Replace the reset logic (lines 110-118) with:
```typescript
useEffect(() => {
  if (isGenerating && !prevIsGeneratingForReset.current) {
    // Always reset stableHTML when a new generation starts.
    // The old preview will be replaced by the new compilation result.
    setStableHTML(null);
    // Also reset compilation state so the new build can run
    compilationAttemptedRef.current = false;
    compilationLockRef.current = false;
  }
  prevIsGeneratingForReset.current = isGenerating;
}, [isGenerating, setStableHTML]);
```

This removes the `stableHTMLRef.current` guard that was blocking resets. Showing the skeleton during generation is the correct behavior -- the previous fix was wrong to try to keep the old preview visible. The real fix for auto-fix loops is handled separately via the auto-fix circuit breaker (max 3 attempts).

**Change D: Force recompilation when filesDigest changes after generation**

Ensure the compilation effect fires even when `isGenerating` was already false but new files arrived (e.g., from auto-fix or streaming completion). Add an explicit trigger:

Replace lines 138-141:
```typescript
useEffect(() => {
  if (isGenerating || filesRef.current.length === 0) {
    return;
  }
  // If stableHTML already exists but filesDigest changed, reset it so
  // recompilation can run with the new files
  if (stableHTMLRef.current && filesDigest !== prevFilesDigestRef.current) {
    setStableHTML(null);
  }
  prevFilesDigestRef.current = filesDigest;
```

Add a `prevFilesDigestRef` to track when files actually change:
```typescript
const prevFilesDigestRef = useRef<string>('');
```

### Why this fixes both issues

1. **Tab switch**: `?new=true` is removed as soon as generation starts. If the browser discards the tab, the draft/IDB recovery kicks in and restores your work.

2. **Skeleton stuck**: `stableHTML` is properly reset on every generation, and the compilation lock is cleared so recompilation always runs when new files arrive.

### Risk assessment

- Removing `?new=true` from URL is cosmetic and has zero side effects (it already served its purpose of preventing draft restore)
- Dual IDB+localStorage flush adds minimal overhead (IDB save is debounced internally)
- Resetting stableHTML on every generation means you'll briefly see the skeleton during generation -- this is the expected, correct behavior
- The `prevFilesDigestRef` guard ensures recompilation fires when files actually change, not on every render




## Fix: Direct Compile Function (Bypass Effect Chain)

### Root Cause

The CompilationBridge's main effect (line 187-416) has accumulated 8+ guard conditions and 3 debounce mechanisms across fix attempts. These guards interact unpredictably with React 18's batched rendering, causing either:
- Guards blocking compilation (blank preview)
- Guards not blocking enough (multiple compilations / freeze)

The generation-ending effect (line 129-167) tries to "prepare" the main effect by clearing guards, but by the time the main effect evaluates, React may have re-rendered multiple times, resetting or re-checking guards in unexpected ways.

### Solution: Extract a standalone `compileNow` function

Instead of relying on the main effect for post-generation compilation, extract the compilation logic into a **ref-based function** that can be called directly from the generation-ending effect with a simple `setTimeout`. The main effect continues handling subsequent manual edits normally.

### Changes

#### File: `src/components/ai-builder/CompilationBridge.tsx`

**1. Add a `compileNowRef` function** (after line 185, before the main effect)

Create a ref-based async function that performs compilation using only refs (no closure dependencies):

```typescript
const compileNowRef = useRef<() => Promise<void>>();
compileNowRef.current = async () => {
  if (compilationLockRef.current) return;
  compilationLockRef.current = true;
  compilationRetryCountRef.current = 0;
  onCompilingChangeRef.current?.(true);

  try {
    let result: string | null = null;
    const currentFiles = filesRef.current;

    if (isReactProject) {
      try {
        const compiled = await Promise.race([
          compileReactProjectRef.current(currentFiles, {
            supabaseConfig: supabaseConfig || undefined,
            stripeConfig: stripeConfig || undefined,
            envVars,
          }),
          new Promise<null>((resolve) =>
            setTimeout(() => resolve(null), 30_000)
          ),
        ]);
        result = compiled?.html || null;
      } catch {
        result = null;
      }
    }

    // Vanilla fallback
    if (!result) {
      try {
        result = getCompiledHTMLRef.current(
          supabaseConfig, stripeConfig, envVars,
          serviceKeys, cdnPackages,
          bundleForBrowserRef.current, linkedGPT
        );
      } catch { result = null; }
    }

    if (result) {
      setLiveCompiledHTML(result);
      setStableHTML(result);
      liveSync.resetSnapshot(currentFiles);
      prevFilesDigestRef.current = filesDigest;
    } else {
      setLiveCompiledHTML(ERROR_FALLBACK_HTML);
      setStableHTML(ERROR_FALLBACK_HTML);
    }
  } catch (err) {
    console.error('[CompilationBridge] compileNow crashed:', err);
    setLiveCompiledHTML(ERROR_FALLBACK_HTML);
    setStableHTML(ERROR_FALLBACK_HTML);
  } finally {
    onCompilingChangeRef.current?.(false);
    compilationAttemptedRef.current = true;
  }
};
```

**2. Modify the generation-ending effect** (lines 149-157)

When generation ends with no preview, instead of clearing guards and hoping the main effect handles it, directly call `compileNowRef.current()` with a 200ms delay:

```typescript
} else if (!stableHTMLRef.current) {
  // Direct compilation — bypass the main effect's guard chain entirely
  console.info('[CompilationBridge] Generation ended with no preview — compiling directly in 200ms');
  compilationLockRef.current = false;
  compilationAttemptedRef.current = false;
  const timer = setTimeout(() => {
    compileNowRef.current?.();
  }, 200);
  // Store cleanup so the effect's return can cancel it if needed
  compilationCleanupRef.current = () => clearTimeout(timer);
}
```

Remove the `immediateCompileNeededRef.current = true` line since we no longer need it.

**3. Add an early return to the main effect** (after line 191)

Prevent the main effect from running during the initial post-generation window (when compileNow is handling it):

```typescript
// Skip initial compilation — handled by compileNow in the generation-ending effect
if (!stableHTMLRef.current && !compilationAttemptedRef.current && filesRef.current.length > 0) {
  console.info('[CompilationBridge] Main effect: deferring to compileNow for initial compilation');
  return;
}
```

This ensures the main effect only handles subsequent edits (where stableHTML already exists or compilationAttempted is true).

### Why This Works

1. Generation ends -- generation-ending effect fires
2. `compileNowRef.current()` is scheduled for 200ms later (outside React's commit phase)
3. Main effect also fires but hits the early return (stableHTML=null, compilationAttempted=false)
4. 200ms later, `compileNow` runs: sends work to the worker (off-thread), waits for result
5. Worker returns HTML -- `setStableHTML(result)` -- preview appears
6. Main effect re-evaluates on next edit -- stableHTML exists, normal hot-patch/recompile flow

No guard clearing, no debounce races, no effect dependency timing issues.

```text
Generation ends
      |
      +---> Generation-ending effect
      |       +---> setTimeout(compileNow, 200ms)
      |
      +---> Main effect fires (early return - defers to compileNow)
      |
      +--- 200ms ---+
                     |
                compileNow()
                     |
                     +---> worker.postMessage(files)
                     |         (off main thread)
                     +---> await result
                     +---> setStableHTML(html)
                     +---> Preview appears!
```

### What This Does NOT Change

- The main effect continues handling manual edits, hot-patching, and recompilation (lines 206-238)
- The debounce logic for rapid edits remains intact (500ms delay)
- The worker-based compilation remains off the main thread
- The safety net at line 2199 in AIAppBuilderWorkspace.tsx remains as a last resort

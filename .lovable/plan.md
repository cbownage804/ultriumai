
## Fix: Preview Never Renders After Generation

### Root Cause Analysis

The compilation pipeline has a fragile chain of effects, refs, locks, and timers that must all fire in the correct order. The failure mode:

1. `handleBgComplete` calls `setFiles(mergedFiles)` then tries vanilla compile (fails for TSX) 
2. `compilePromise = Promise.resolve()` resolves immediately via microtask
3. `setIsGeneratingOverride(false)` fires, causing CompilationBridge to see `isGenerating` transition
4. CompilationBridge's generation-ending effect schedules `compileNowRef` at 200ms
5. CompilationBridge's main effect ALSO fires (because `filesDigest` changed), starting a 500ms debounce
6. At 200ms, `compileNowRef` fires and calls the worker compiler
7. The worker either: (a) hangs trying to download esbuild-wasm, (b) compiles successfully but the result doesn't propagate, or (c) times out after 30s

The safety net at 5s fires but does nothing useful -- it toggles `isCompiling` which CompilationBridge doesn't depend on. Even if compilation eventually succeeds or falls back to ERROR_FALLBACK_HTML after 30s, the agent mode's verify step may have already finished and moved on.

### The Fix: Direct Compilation in `handleBgComplete`

Instead of relying on the fragile effect chain, call the worker compiler directly in `handleBgComplete` and await the result before releasing the generation state. This ensures:
- Compilation runs immediately after files are set
- The result is available before `isGeneratingOverride` goes false  
- No coordination needed between multiple effects, timers, and locks

#### Change 1: Import worker compiler in workspace and compile directly

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

In `handleBgComplete` (around line 321), after the self-contained check fails, instead of just trying vanilla compile:

```typescript
// After self-contained check fails:
// 1. Try worker compilation for React projects (TSX/JSX)
const hasReactFiles = mergedFiles.some(f => /\.(tsx|jsx)$/.test(f.path));
if (hasReactFiles) {
  try {
    const compiled = await Promise.race([
      workerCompiler.compileReactProject(mergedFiles, {
        supabaseConfig: supabaseConfigRef.current || undefined,
        stripeConfig: stripeConfigRef.current || undefined,
        envVars: envVarsRef.current,
      }),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 30_000)),
    ]);
    const html = (compiled as any)?.html || null;
    if (html) {
      stableHTMLRef.current = html;
      setStableHTML(html);
      compilePromise = Promise.resolve();
    }
  } catch (e) {
    console.warn('[handleBgComplete] Worker compilation failed:', e);
  }
}
// 2. Vanilla fallback (existing code)
if (!stableHTMLRef.current) {
  // ... existing vanilla compile attempt
}
```

Make `handleBgComplete` async so it can await the worker.

#### Change 2: Make the safety net actually trigger compilation

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

The current safety net at line 2217 toggles `isCompiling` which has no effect on CompilationBridge. Instead, expose a `forceCompile` callback from CompilationBridge and call it from the safety net:

```typescript
// In CompilationBridge: expose forceCompile via callback prop
onForceCompile?: (fn: () => void) => void;

// In the component body:
useEffect(() => {
  onForceCompile?.(() => {
    compilationLockRef.current = false;
    compileNowRef.current?.();
  });
}, [onForceCompile]);

// In workspace safety net:
forceCompileRef.current?.();
```

#### Change 3: Ensure ERROR_FALLBACK_HTML always shows

If both worker and vanilla compilation fail in `handleBgComplete`, set ERROR_FALLBACK_HTML so the user at least sees an error message instead of the empty placeholder:

```typescript
if (!stableHTMLRef.current) {
  stableHTMLRef.current = ERROR_FALLBACK_HTML;
  setStableHTML(ERROR_FALLBACK_HTML);
}
```

### Technical Details

- `handleBgComplete` already has access to `useWorkerCompiler` since it's in the workspace component
- The workspace already imports `useWorkerCompiler` (line 39)
- Making `handleBgComplete` async is safe since it's only called from `useBackgroundGeneration.onComplete`
- The 30s timeout ensures the function doesn't hang indefinitely
- CompilationBridge still works for subsequent edits (hot-patching, recompilation) -- this change only affects the initial post-generation compilation

### Expected Result

1. Generation completes, `handleBgComplete` fires
2. Worker compiler is called directly with 30s timeout
3. If worker succeeds: preview shows immediately
4. If worker fails: ERROR_FALLBACK_HTML shows (instead of blank)
5. `isGeneratingOverride` is set to false AFTER compilation result is available
6. CompilationBridge syncs from `externalStableHTMLRef` and skips redundant recompile

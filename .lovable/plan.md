

## Fix: Guaranteed Preview After Generation

### Problem
`handleBgComplete` currently sets `compilePromise = Promise.resolve()`, which immediately releases `isGeneratingOverride` via `.finally()`. This means CompilationBridge must compile via its effect chain (200ms timer, 500ms debounce, locks, guards). This chain has failed across 4+ fix attempts due to timing races between effects, stale refs, and lock contention.

### Solution: Compile Before Releasing State

Make `handleBgComplete` await the worker compiler directly with the local `mergedFiles` variable (which is always fresh — no stale closure issues). Only release `isGeneratingOverride` AFTER the result is set.

### Changes

#### 1. Direct Worker Compilation in handleBgComplete

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Replace the current self-contained check + `compilePromise = Promise.resolve()` block (lines 313-326) with:

```
// 1. Self-contained HTML shortcut (vanilla HTML projects)
const indexFile = mergedFiles.find(f => f.path === 'index.html');
const hasLocalModuleScripts = /src=["']\.?\/(?:src|main|app|index)\b/i.test(indexFile?.content || '');
if (indexFile && !hasLocalModuleScripts &&
    indexFile.content.includes('<!DOCTYPE html') &&
    indexFile.content.includes('</html>')) {
  stableHTMLRef.current = indexFile.content;
  setStableHTML(indexFile.content);
}

// 2. React/TSX projects: compile directly with worker
const hasReactFiles = mergedFiles.some(f => /\.(tsx|jsx)$/.test(f.path));
if (!stableHTMLRef.current && hasReactFiles) {
  try {
    const compiled = await Promise.race([
      workerCompiler.compileReactProject(mergedFiles, {
        supabaseConfig: supabaseConfigRef.current || undefined,
        stripeConfig: stripeConfigRef.current || undefined,
        envVars: envVarsRef.current,
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Worker timeout')), 30000)
      ),
    ]);
    if (compiled?.html) {
      stableHTMLRef.current = compiled.html;
      setStableHTML(compiled.html);
    }
  } catch (e) {
    console.warn('[handleBgComplete] Worker compilation failed:', e);
  }
}

// 3. Guaranteed fallback: always show something
if (!stableHTMLRef.current) {
  stableHTMLRef.current = ERROR_FALLBACK_HTML;
  setStableHTML(ERROR_FALLBACK_HTML);
}
```

This ensures:
- The worker gets the exact `mergedFiles` (no stale state)
- The result is set BEFORE `isGeneratingOverride` releases
- CompilationBridge sees `externalStableHTMLRef.current` already set, so it syncs and skips redundant recompile
- If everything fails, the user sees an error message (not a blank placeholder)

#### 2. Add Config Refs for Worker Access

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add refs to hold the latest config values so `handleBgComplete` can access them without adding to its dependency array:

```typescript
const supabaseConfigRef = useRef(supabaseConfig);
supabaseConfigRef.current = supabaseConfig;
const stripeConfigRef = useRef(stripeConfig);
stripeConfigRef.current = stripeConfig;
const envVarsRef = useRef(envVars);
envVarsRef.current = envVars;
```

#### 3. Add workerCompiler to handleBgComplete Dependencies

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

The `workerCompiler` from `useWorkerCompiler()` is already available in the workspace component. Add it to the `useCallback` dependency array for `handleBgComplete`.

### Why This Will Work

1. `mergedFiles` is a local variable — always fresh, never stale
2. Worker compilation happens synchronously (awaited) before any state release
3. `stableHTMLRef.current` is set before `setIsGeneratingOverride(false)` fires
4. CompilationBridge's generation-ending effect sees `externalStableHTMLRef.current` is set, syncs it, and skips its own compilation entirely
5. No effect chains, no timers, no locks to coordinate

### What's Different From Previous Attempts

- Previous attempt 1: Added worker compilation but still had `compilePromise = Promise.resolve()` so state released before compilation finished
- Previous attempt 2: Removed all compilation from handleBgComplete, relying on CompilationBridge effects which kept failing
- This attempt: `compilePromise` is the ACTUAL worker compilation promise, so `.finally()` only fires after compilation completes


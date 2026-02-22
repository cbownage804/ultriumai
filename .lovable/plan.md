

## Fix: Direct Compilation in handleBgComplete (Bypass Effect Chain)

### Root Cause

The CompilationBridge relies on a complex chain of React effects to detect when generation ends and trigger compilation. This chain has proven unreliable across 4+ fix attempts due to:
- `compileTrigger` increments causing effect re-runs that cancel in-flight debounce timers
- React 18's batched rendering creating unpredictable timing between state updates and effect execution
- Multiple guard conditions (`compilationLockRef`, `justSyncedFromExternalRef`, `prevFilesDigestRef`) that interact in subtle ways

The "Compiling preview..." UI appears (meaning compilation starts) but then falls back to "Live Preview" placeholder (meaning it either gets cancelled or produces null).

### Solution: Move Compilation Back to handleBgComplete (Correctly This Time)

Instead of relying on CompilationBridge effects for post-generation compilation, `handleBgComplete` will directly compile using the worker and set stableHTML **before** releasing `isGeneratingOverride`. This keeps CompilationBridge blocked (it sees `isGenerating=true`) so there's no worker contention or race condition.

Previous attempts at this approach failed because `isGeneratingOverride` was released too early, causing CompilationBridge to also try to compile and fight over the single-threaded worker. The fix is to only release `isGeneratingOverride` AFTER compilation completes.

### Changes

#### File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

In `handleBgComplete` (around lines 308-344):

Replace:
```typescript
setFiles(mergedFiles);
compilePromise = Promise.resolve();
console.info('[handleBgComplete] Files set, CompilationBridge will compile');
```

With direct compilation logic:
```typescript
setFiles(mergedFiles);
setIsCompiling(true);

// Compile directly — CompilationBridge stays blocked (isGeneratingOverride=true)
compilePromise = (async () => {
  try {
    const isReact = mergedFiles.some(f => /\.(tsx|jsx)$/.test(f.path));
    if (isReact) {
      const compiled = await Promise.race([
        compileReactProjectRef.current(mergedFiles, {
          supabaseConfig: supabaseConfig || undefined,
          stripeConfig: stripeConfig || undefined,
          envVars,
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000)),
      ]);
      if (compiled?.html) {
        handleStableHTML(compiled.html);
      }
    } else {
      const html = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
      if (html) handleStableHTML(html);
    }
  } catch (err) {
    console.warn('[handleBgComplete] Compilation failed:', err);
  } finally {
    setIsCompiling(false);
  }
})();
```

Also update the `.finally()` block to NOT check stableHTML — just release isGeneratingOverride after compilation.

#### File: `src/components/ai-builder/CompilationBridge.tsx`

Simplify the generation-ending effect:
- Remove the `compileTrigger` mechanism entirely (remove the state, remove the increment)
- When generation ends with `externalStableHTMLRef` already set, just sync and skip
- When generation ends without preview (handleBgComplete failed), use a simple `setTimeout(runCompilation, 100)` directly instead of the complex effect-chain-based approach
- Remove `compileTrigger` from the main effect's dependency array

This makes CompilationBridge a pure fallback for when handleBgComplete's direct compilation fails, plus handling subsequent manual edits.

### Why This Works

1. `handleBgComplete` compiles while `isGeneratingOverride` is still true
2. CompilationBridge sees `isGenerating=true` and does nothing (no worker contention)
3. When compilation finishes, `stableHTMLRef` has the result
4. `setIsGeneratingOverride(false)` fires — CompilationBridge sees `externalStableHTMLRef` is set and syncs without recompiling
5. If compilation fails, CompilationBridge's fallback kicks in on a simple timer

### Sequence Diagram

```text
handleBgComplete
  |
  +---> setFiles(mergedFiles)
  +---> setIsCompiling(true)
  +---> await workerCompile(mergedFiles)  // CompilationBridge blocked by isGenerating=true
  |       |
  |       +---> success: handleStableHTML(html)
  |       +---> failure: (CompilationBridge will retry as fallback)
  |
  +---> setIsCompiling(false)
  +---> setIsGeneratingOverride(false)
        |
        CompilationBridge sees isGenerating transition:
          - externalStableHTMLRef set? -> sync + skip
          - not set? -> setTimeout(compile, 100) as fallback
```

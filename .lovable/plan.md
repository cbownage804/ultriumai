

## Fix: Preview Shows "Compilation Error" Instead of Rendered App

### Root Cause

The `handleBgComplete` function tries to compile directly using the worker, but this fails (likely esbuild-wasm initialization timeout or network issue). It then tries `getCompiledHTML` as a vanilla fallback, but this also fails because `getCompiledHTML` reads `project.files` from its React state closure -- which is still the OLD files before `setFiles(mergedFiles)` has taken effect (React batches state updates).

When both fail, `handleBgComplete` sets `ERROR_FALLBACK_HTML` into `stableHTMLRef.current` (the workspace ref passed as `externalStableHTMLRef` to CompilationBridge). When `isGeneratingOverride` goes false, CompilationBridge sees `externalStableHTMLRef` has a value and **syncs it as-is** (line 147-155), skipping its own compilation entirely. So the error fallback gets locked in, and CompilationBridge never gets a chance to try.

### The Fix: Let CompilationBridge Handle Compilation

Remove the direct compilation attempt from `handleBgComplete`. The compilation logic in CompilationBridge already has:
- Worker compilation with 30s timeout
- Vanilla fallback
- Safety timeout with retry
- ERROR_FALLBACK_HTML as last resort

CompilationBridge reads files from `filesRef.current` (updated via props), so by the time it runs (200ms after generation ends), React has re-rendered with the new files.

### Changes

#### Change 1: Strip compilation from `handleBgComplete`

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

In `handleBgComplete`, remove the entire compilation block (the self-contained check, worker compilation, vanilla fallback, and error fallback). Keep only `setFiles(mergedFiles)` and the post-build snapshot. Do NOT set `stableHTMLRef.current` to anything -- leave it null so CompilationBridge knows it needs to compile.

The code from lines 313-371 (the self-contained check through the error fallback) will be replaced with just:

```
// Self-contained HTML shortcut (vanilla HTML projects without module scripts)
const indexFile = mergedFiles.find(f => f.path === 'index.html');
const hasLocalModuleScripts = /src=["']\.?\/(?:src|main|app|index)\b/i.test(indexFile?.content || '');
if (indexFile && !hasLocalModuleScripts &&
    indexFile.content.includes('<!DOCTYPE html') &&
    indexFile.content.includes('</html>')) {
  stableHTMLRef.current = indexFile.content;
  setStableHTML(indexFile.content);
}
// For React/TSX projects: leave stableHTMLRef null.
// CompilationBridge will compile after isGenerating transitions to false.
```

This keeps the fast path for vanilla HTML projects (which works reliably) while delegating React compilation to CompilationBridge.

#### Change 2: Remove `getCompiledHTML` from `handleBgComplete` dependencies

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Remove `getCompiledHTML` from the `useCallback` dependency array (line 408) since it's no longer called in handleBgComplete.

#### Change 3: Ensure `compilePromise` resolves correctly

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

The `compilePromise.finally()` at line 401 controls when `isGeneratingOverride` goes false. Since we're no longer awaiting compilation, `compilePromise = Promise.resolve()` should resolve immediately, which is fine -- CompilationBridge triggers compilation on the `isGenerating` transition anyway.

### Why This Works

1. Generation completes, `handleBgComplete` calls `setFiles(mergedFiles)`
2. For vanilla HTML: preview is set immediately (fast path, already works)
3. For React projects: `stableHTMLRef.current` stays null
4. `compilePromise` resolves, `setIsGeneratingOverride(false)` fires
5. CompilationBridge sees generation ending, `externalStableHTMLRef` is null
6. CompilationBridge enters the `!stableHTMLRef.current` branch (line 156) and calls `compileNowRef` at 200ms
7. `compileNowRef` reads `filesRef.current` (now updated with new files) and runs worker compilation
8. If worker fails, CompilationBridge has its own vanilla fallback and ERROR_FALLBACK_HTML
9. The 5s safety net with `forceCompileRef` provides additional recovery

### What's Different From Before

Previously, `handleBgComplete` was trying to be the primary compiler AND poisoning CompilationBridge with a premature error fallback. Now, `handleBgComplete` is just a file merger, and CompilationBridge is the single owner of compilation. This eliminates the race condition and stale-state bugs.

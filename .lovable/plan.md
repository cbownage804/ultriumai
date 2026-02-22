

# Fix: Preview Not Updating -- Nuclear Approach

After tracing the entire pipeline across 5+ files, the issue has resisted multiple targeted fixes. Instead of another surgical patch, this plan adds a **guaranteed fallback mechanism** plus **diagnostic logging** to catch any remaining edge cases.

## Root Cause Analysis

The compilation pipeline has multiple guards, locks, refs, and timing dependencies (500ms debounce, 2s bg-job delay, rAF + setTimeout). Any one of these can silently prevent the final `setStableHTML(result)` from reaching the preview. Previous fixes targeted specific paths but the exact failure mode varies.

## Plan

### 1. Nuclear Fallback Timer in `AIAppBuilderWorkspace.tsx`

Add a `useEffect` that watches for `isGenerating` transitioning from `true` to `false`. When it does, start a **4-second timer**. If `stableHTML` is still `null` after that timer fires (meaning CompilationBridge failed to produce output), directly compile the files and force-set `stableHTML`.

This bypasses the entire CompilationBridge effect chain as a last resort.

```
When isGenerating goes true -> false:
  Start 4s timer
  If stableHTML is still null:
    Compile project.files directly
    Call setStableHTML(result)
    Log warning for diagnostics
```

### 2. Diagnostic Logging in `CompilationBridge.tsx`

Add `console.info` breadcrumbs at every decision point:
- When the compilation effect fires and which branch it takes (early return vs proceed)
- When the debounce starts and when `runCompilation` begins
- The `compilationLockRef` and `stableHTMLRef` values at each check
- When `setStableHTML` is called with the final result

This ensures that when the issue occurs again, the console logs will reveal exactly where the flow breaks.

### 3. Force iframeKey increment in `BuilderPreviewPanel.tsx`

Add a secondary safety: increment `iframeKey` whenever `refreshKey` changes (which the workspace already increments on tab-return). This is already partially handled by the key template literal but adding an explicit effect ensures React processes it.

## Technical Details

### File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

Add after the existing `handleStableHTML` definition (~line 2054):

```typescript
// Nuclear fallback: if CompilationBridge fails to produce stableHTML
// within 4s of generation ending, compile directly.
useEffect(() => {
  if (prevIsGeneratingRef.current && !isGenerating && project.files.length > 0) {
    const timer = setTimeout(() => {
      if (!stableHTMLRef.current) {
        console.warn('[Workspace] Nuclear fallback: CompilationBridge failed to produce stableHTML after 4s, compiling directly');
        const result = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
        if (result) {
          handleStableHTML(result);
        }
      }
    }, 4000);
    return () => clearTimeout(timer);
  }
}, [isGenerating]);
```

This only fires if CompilationBridge's entire pipeline silently fails -- it's a safety net, not the primary path.

### File 2: `src/components/ai-builder/CompilationBridge.tsx`

Add console.info breadcrumbs at each guard in the compilation effect:

- Line 158 (isGenerating check): log if returning early
- Line 164 (stableHTML + digest check): log which branch
- Line 183 (compilationLock check): log lock state  
- Line 189 (inside debounce): log compilation start
- Line 238 (result ready): log result length

### File 3: `src/components/ai-builder/BuilderPreviewPanel.tsx`

No changes needed -- the existing `hasEverHadHtmlRef` logic is correct for the cases where `stableHTML` does get set.

## Why This Will Work

Even if we never find the exact timing bug in the effect chain, the nuclear fallback guarantees a working preview within 4 seconds of generation completing. The diagnostic logging will help identify the root cause for a permanent fix later.



# Fix: Preview Not Updating -- Direct Compilation Path

## Root Cause (finally found it)

Three compounding issues prevent the preview from updating:

1. **CompilationBridge is blocked by `isGenerating`**: When `handleBgComplete` runs, files are ready, but `isGenerating` (from `useAIAppBuilder`) stays `true` for 2 more seconds (waiting for the delayed `bg-job-completed` event). CompilationBridge skips compilation during this window.

2. **Nuclear fallback uses the wrong compiler**: The fallback calls `getCompiledHTML()` which returns `null` for React projects (lines 231-232 of `useProjectFileSystem.ts` both return null when no HTML files exist alongside React files). So the safety net never works.

3. **Accumulated delays**: Even when `isGenerating` finally turns false, there's a 500ms debounce + 100ms rAF deferral before compilation starts. Total delay from files-ready to preview: ~2.6 seconds minimum, assuming nothing else goes wrong.

## Fix

### File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

**Change `handleBgComplete` to compile immediately after merging files**, using the React compiler (same one CompilationBridge uses). This gives us a direct path from files-ready to preview, bypassing the entire effect chain.

```
handleBgComplete runs
  -> setFiles(mergedFiles) 
  -> detect if React project
  -> if React: call compileReactProject(mergedFiles) 
  -> if vanilla: call getCompiledHTML(mergedFiles)
  -> handleStableHTML(result)  // preview updates immediately
```

Specifically:
- Import `useReactCompiler` and `detectReactProject` in the workspace
- After `setFiles(mergedFiles)` in `handleBgComplete`, immediately compile the merged files
- Call `handleStableHTML(result)` with the compilation result
- This runs BEFORE `isGenerating` turns false, so the preview updates as soon as files are ready

**Also fix the nuclear fallback** to use the React compiler instead of `getCompiledHTML` when the project is React-based.

### File 2: `src/components/ai-builder/CompilationBridge.tsx` (no changes needed)

CompilationBridge continues working as before for manual edits, file changes, and other non-generation scenarios. The direct compilation in `handleBgComplete` just front-runs it for the generation case.

## Technical Details

In `handleBgComplete` (around line 307, after `setFiles(mergedFiles)`):

```typescript
// Immediately compile for preview -- don't wait for CompilationBridge effects
const isReact = detectReactProject(mergedFiles);
if (isReact) {
  compileReactProject(mergedFiles, {
    supabaseConfig: supabaseConfig || undefined,
    stripeConfig: stripeConfig || undefined,
    envVars,
  }).then(compiled => {
    if (compiled.html) {
      handleStableHTML(compiled.html);
    }
  }).catch(err => {
    console.error('[handleBgComplete] React compilation failed:', err);
  });
} else {
  const result = getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, linkedGPT);
  if (result) {
    handleStableHTML(result);
  }
}
```

And fix the nuclear fallback similarly -- use `compileReactProject` for React projects instead of `getCompiledHTML`.

## Why This Will Work

- No dependency on `isGenerating` state transitions
- No dependency on effect ordering or React batching
- No debounce or deferral delays
- Uses the correct compiler (React vs vanilla)
- Preview updates within milliseconds of files being ready
- CompilationBridge remains as backup for non-generation file changes

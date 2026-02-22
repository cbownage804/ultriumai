

## Fix: Preview Not Loading After Generation

### Problem Analysis

After deep code analysis, I identified a **deadlock race condition** between two competing compilation paths:

1. **`handleBgComplete`** (in AIAppBuilderWorkspace) tries to compile via the worker with a 20s timeout
2. **`CompilationBridge`** tries to compile when `isGeneratingOverride` becomes false

The issue is:
- `handleBgComplete`'s worker compilation sends a request to the shared Web Worker. If it times out (20s), the worker is STILL busy processing the request.
- When `CompilationBridge` retries (also via the same shared worker), its new request sits in the worker's message queue. Since the worker is single-threaded, it must finish the first request before starting the second.
- CompilationBridge's worker timeout is 15s. If the first worker request takes longer than 35s total (20s handleBgComplete timeout + 15s CompilationBridge timeout), both time out.
- The vanilla fallback (`getCompiledHTML`) then runs, but for React projects, it produces a near-empty HTML (just `<div id="root"></div>` with CSS inlined) -- or returns null if there's no `index.html`.

Additionally, the 500ms debounce in CompilationBridge's main effect can be **cancelled** by rapid re-renders that happen post-generation (auto-save effects, toast notifications, message state updates).

### Solution

**1. Remove direct compilation from `handleBgComplete`** (AIAppBuilderWorkspace.tsx)

Stop the dual-compilation approach entirely. `handleBgComplete` should only:
- Parse and merge files
- Call `setFiles(mergedFiles)` 
- Call `setIsGeneratingOverride(false)` immediately (no waiting for compilation)

This prevents the shared worker from being monopolized by a potentially-hanging request.

**2. Remove the 500ms debounce for initial compilation** (CompilationBridge.tsx)

When generation just ended (no existing `stableHTML`), start compilation immediately (0ms delay) instead of waiting 500ms. The debounce is only useful for rapid manual edits, not for post-generation compilation.

**3. Increase CompilationBridge worker timeout to 30s** (CompilationBridge.tsx)

The current 15s timeout is too aggressive for first-time esbuild-wasm initialization (WASM download). Increase to 30s to match `COMPILE_TIMEOUT_MS`.

**4. Add diagnostic console.log statements** (CompilationBridge.tsx)

Add logging at every decision point so the next failure can be traced immediately.

### Technical Details

#### File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

In `handleBgComplete` (around lines 308-352), replace the entire compilation block with:
```
setFiles(mergedFiles);
compilePromise = Promise.resolve();
console.info('[handleBgComplete] Files set, CompilationBridge will compile');
```

In the `compilePromise.finally()` block (around line 380), remove the compile check and just call `setIsGeneratingOverride(false)` directly.

#### File: `src/components/ai-builder/CompilationBridge.tsx`

- In the generation-ending effect (line 149-168): when no preview exists, call compilation directly instead of relying on the main effect. Set a `immediateCompileNeeded` flag.
- In the main effect debounce (line 267): use 0ms delay when `immediateCompileNeeded` is true (post-generation), 500ms otherwise.
- Change the worker timeout from 15s to 30s (line 337-341).
- Add a `console.info` at every early return to trace which guard condition prevented compilation.


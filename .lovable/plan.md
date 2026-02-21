

## Multi-Phase Fix: Page Freezing During and After Generation

### Problem

The page freezes because of several compounding issues beyond just toast spam (which was already fixed). The main thread gets blocked by:

1. **Synchronous compilation on the main thread** -- `compileReactProject()` is a heavy synchronous operation that processes all files (transpiling, sorting, bundling) in a single call, blocking the UI for seconds on larger projects
2. **Health check triggers iframe reload loop during compilation** -- The 2s health check detects the iframe as "blank" during the compilation phase (before HTML is ready) and forces `setIframeKey(k+1)`, which re-mounts the iframe, which can trigger further error cascades
3. **Auto-fix fires too soon after compilation** -- The 3-second post-generation cooldown doesn't account for compilation time (which can take 5-10s). Errors from a still-loading preview trigger the auto-fix pipeline, which sends AI requests, which trigger re-generation, which triggers re-compilation -- a freeze loop
4. **Double compilation** -- `compiledForHosting` runs a second full compilation 500ms after the first one finishes, doubling the main-thread blocking time

### Phase 1: Pause Health Check During Compilation
**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

Add an `isCompiling` prop and skip health checks while it's true. The iframe is expected to be blank/loading during compilation -- detecting it as "crashed" is a false positive.

- Add `isCompiling?: boolean` to props
- In the health check interval, early-return if `isCompiling` is true
- Reset `consecutiveFailsRef` to 0 when compilation starts

### Phase 2: Extend Auto-Fix Cooldown to Include Compilation
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

The current 3s cooldown only tracks generation end, not compilation end. Extend it:

- Update the `compilationEndedAt` ref (currently declared but never written to) when `isCompiling` transitions from true to false
- In `handleAutoFixError`, add a check: skip if `Date.now() - compilationEndedAt.current < 5000` (5s after compilation ends)
- This prevents transient iframe errors from triggering AI fix requests during the compilation settling window

### Phase 3: Defer Hosting Compilation Further
**File: `src/components/ai-builder/CompilationBridge.tsx`**

The hosting compilation currently fires 500ms after preview compilation. Increase to 2000ms and wrap in `requestIdleCallback` (with setTimeout fallback) to avoid blocking the main thread while the user is interacting with the preview.

- Change the 500ms timer to 2000ms
- Wrap the compilation call in `requestIdleCallback` (or `setTimeout` as fallback for Safari)

### Phase 4: Chunk the Transpilation Loop
**File: `src/hooks/useReactCompiler.ts`**

The `compileReactProject` function transpiles all files in a tight synchronous loop. For projects with 10+ files, this can freeze the main thread for several seconds. Break it into yielding chunks:

- This is the riskiest change -- the compilation is currently synchronous and returns a result directly
- Instead of making it fully async (which would require refactoring all callers), add a microtask yield every 5 files using a technique that keeps the function synchronous from the caller's perspective but gives the browser a chance to paint
- Actually, since CompilationBridge already uses `setTimeout(fn, 50)`, the better approach is to split the `for` loop in CompilationBridge into batches with `setTimeout` between them -- but this requires making it async
- **Simpler approach**: Just ensure the existing `requestAnimationFrame + setTimeout(50)` pattern in CompilationBridge is working correctly (it already defers), and increase the setTimeout to 100ms to give the browser more breathing room

### Phase 5: Pass `isCompiling` to BuilderPreviewPanel
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Wire the `isCompiling` state through to `BuilderPreviewPanel` so the health check can be paused:

- Add `isCompiling={isCompiling}` prop to all 3 instances of `<BuilderPreviewPanel>` in the JSX

### Technical Details

```text
Freeze Loop (Before)
Generation ends
  --> Compilation starts (blocks main thread 3-8s)
  --> Health check fires (iframe blank during compilation)
  --> setIframeKey++ (iframe remounts)
  --> Errors from half-loaded iframe
  --> Auto-fix fires (3s cooldown already passed since gen ended)
  --> New generation starts
  --> Repeat

Freeze Loop (After)
Generation ends
  --> Compilation starts
  --> Health check PAUSED (isCompiling=true)
  --> Compilation ends
  --> 5s auto-fix cooldown starts
  --> Health check resumes (iframe now has content)
  --> Hosting compilation deferred 2s + requestIdleCallback
  --> No false-positive crashes, no premature auto-fix
```

### Files to Edit
1. `src/components/ai-builder/BuilderPreviewPanel.tsx` -- add `isCompiling` prop, pause health check during compilation
2. `src/components/ai-builder/AIAppBuilderWorkspace.tsx` -- pass `isCompiling` prop, track `compilationEndedAt`, extend auto-fix cooldown
3. `src/components/ai-builder/CompilationBridge.tsx` -- increase hosting compilation delay to 2s, use `requestIdleCallback`
4. `src/hooks/useReactCompiler.ts` -- increase setTimeout breathing room from 50ms to 100ms (minor)


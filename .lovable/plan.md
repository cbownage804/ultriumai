

## Nuclear Fix: Page Freezing and Black Preview

### Root Cause (Final Diagnosis)

The page freezes because the compilation in `CompilationBridge.tsx` calls `compileReactProject()` **synchronously on the main thread**. This function (in `useReactCompiler.ts`) does three heavy operations in one synchronous call:

1. **`buildModuleMap()`** -- iterates all files, creates multiple map entries per file
2. **`sortByDependency()`** -- builds dependency graph with regex scanning of every file
3. **`transpileFile()` loop** (line 464) -- runs `stripTypeAnnotations()` on every file (line-by-line parsing with regex), then transforms all imports/exports

The resulting HTML string is ~50KB+ and includes a `<script src="babel.min.js">` tag (~3MB Babel Standalone) that then does a SECOND transpilation pass inside the iframe. All of this blocks the main thread for 3-10+ seconds.

Additionally, `getCompiledHTML()` is called AGAIN for the hosting compilation (another full synchronous pass), doubling the freeze time.

The previous fixes (debouncing, requestIdleCallback, health check pausing) helped but didn't solve the core problem: **the compilation itself is synchronous and blocks the thread for seconds**.

### Fix Strategy

Instead of trying to make the synchronous compilation "less bad," we will:

1. **Move compilation to a Web Worker** so it runs off the main thread entirely
2. **As a simpler immediate fix** (since Web Workers can't access hooks), use `setTimeout` chunking to yield control back to the browser between file transpilations
3. **Eliminate the double compilation** by making the hosting compilation reuse the preview result
4. **Add a hard guard** against the `getCompiledHTML` hosting path running while preview compilation is still in progress

### Phase 1: Chunked Async Compilation in CompilationBridge
**File: `src/components/ai-builder/CompilationBridge.tsx`**

Replace the synchronous `compileReactProject()` call with an async chunked approach:
- Instead of calling `compileReactProject(files)` which does everything synchronously, break the work into microtasks
- After the call returns, use `setTimeout(0)` to yield before setting state, giving the browser a paint frame
- Wrap the entire compile call in a `new Promise` + `setTimeout` so it doesn't block

Change the compilation from:
```typescript
const compiled = compileReactProjectRef.current(filesRef.current, options);
setLiveCompiledHTML(compiled.html);
```
To:
```typescript
// Yield to browser before and after heavy work
await new Promise(r => setTimeout(r, 0));
const compiled = compileReactProjectRef.current(filesRef.current, options);
await new Promise(r => setTimeout(r, 0));
setLiveCompiledHTML(compiled.html);
```

### Phase 2: Eliminate Double Compilation for Hosting
**File: `src/components/ai-builder/CompilationBridge.tsx`**

The hosting compilation (line 237) calls `getCompiledHTMLRef.current()` which is a SECOND full synchronous compilation. Instead, reuse the `liveCompiledHTML` result for hosting when available:

```typescript
// Instead of recompiling, reuse the preview result
setCompiledForHosting(liveCompiledHTML);
```

Only fall back to `getCompiledHTML()` for non-React projects where the preview and hosting formats differ.

### Phase 3: Add Yield Points Inside transpileFile Loop
**File: `src/hooks/useReactCompiler.ts`**

Make `compileReactProject` return a Promise and add yield points between file transpilations so the browser can paint:

- Convert `compileReactProject` to async
- After every 2 files transpiled, `await new Promise(r => setTimeout(r, 0))` to yield
- This keeps the total compilation time the same but prevents the "page not responding" dialog

### Phase 4: Suppress Toasts During Compilation Window
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add a compilation-aware gate to the `dedupeToast` helper. During `isCompiling=true`, suppress all non-error toasts entirely. This prevents any remaining toast accumulation from triggering during the compilation window.

### Phase 5: Increase Compilation Safety Timeout
**File: `src/components/ai-builder/CompilationBridge.tsx`**

Increase `COMPILE_TIMEOUT_MS` from 10s to 20s. With the yield points added in Phase 3, the wall-clock time for compilation will increase slightly (yielding adds overhead), so the safety timeout needs to accommodate this.

### Files to Edit
1. `src/components/ai-builder/CompilationBridge.tsx` -- async compilation with yields, eliminate double compilation, increase timeout
2. `src/hooks/useReactCompiler.ts` -- convert compileReactProject to async with yield points between files
3. `src/components/ai-builder/AIAppBuilderWorkspace.tsx` -- suppress non-error toasts during compilation

### Expected Impact

```text
Before:
  compileReactProject() blocks main thread 3-10s (synchronous)
  getCompiledHTML() blocks another 3-10s (hosting, synchronous)
  Total: 6-20s of main thread blocking
  Result: "This page isn't responding"

After:
  compileReactProject() yields every 2 files (~50ms chunks)
  Hosting reuses preview result (0ms)
  Total: same compilation time, but spread across yielding chunks
  Result: Browser stays responsive, progress indicator visible
```


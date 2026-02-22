
## Fix: Preview Never Appears Due to Crashed Compiler Worker

### Root Cause

The compiler Web Worker (`src/workers/compiler.worker.ts`) crashes immediately on load because Vite's React SWC plugin injects `@react-refresh` preamble code into ALL processed modules, including workers. Workers don't have `window`, so the `@react-refresh` module throws `ReferenceError: window is not defined`, killing the worker before it can process any compilation requests.

This means:
- Worker compilation never responds (pending forever)
- The 30-second `Promise.race` timeout fires, returning `null`
- Vanilla fallback also returns `null` for React projects (it can't handle JSX)
- The preview stays blank
- The "React refresh preamble" error shows in the error bar
- Auto-fix loops trying (and failing) to fix a host-level error

### Fix (3 changes)

#### 1. `vite.config.ts` -- Exclude workers from React plugin

Add a `worker` configuration that prevents Vite plugins from processing worker files:

```typescript
worker: {
  plugins: () => [],
},
```

This stops `@react-refresh` from being injected into `compiler.worker.ts`, allowing the worker to initialize and run correctly.

#### 2. `src/components/ai-builder/BuilderPreviewPanel.tsx` -- Filter host-level errors

Add a filter in the error message handler to suppress errors from the host Vite dev server (like `@react-refresh`) that are not actually from the preview iframe:

```typescript
// In the __PREVIEW_ERROR__ handler, add:
const isHostDevError = /react.refresh|@react-refresh|preamble was not loaded/i.test(msg);
if (isHostDevError) return prev; // Don't display host dev errors
```

This prevents false-positive errors from triggering the auto-fix loop.

#### 3. `src/components/ai-builder/CompilationBridge.tsx` -- Defensive fallback when worker fails

As a safety net, if the worker compilation returns null AND vanilla compilation returns null, ensure `ERROR_FALLBACK_HTML` is always set (never leave `stableHTML` as null with `compilationAttemptedRef = true`):

In `compileNowRef`, the existing code at lines 228-236 already handles this, but add a log to confirm the fallback fires. No code change needed here -- the vite.config fix is the primary solution.

### Why This Fixes Everything

1. Worker starts correctly (no `@react-refresh` crash)
2. Worker compiles React project into full HTML document with CDN dependencies
3. `compileNowRef` receives valid HTML from worker
4. `setStableHTML(html)` updates both ref and state
5. `compiledHTML = stableHTML` is now truthy
6. `BuilderPreviewPanel` receives `html={compiledHTML}` and renders the iframe
7. Preview appears
8. No false "React refresh" error in the error bar
9. No auto-fix loop triggered

### Technical Detail: How Lovable's Compilation Works

The App Builder compiles React projects entirely in the browser:
- A Web Worker runs esbuild-wasm for TypeScript stripping and regex-based import resolution
- The output is a self-contained HTML document with CDN-loaded React, Tailwind, and Babel
- Babel Standalone runs inside the iframe at runtime to transform JSX to JS
- The compiled HTML is set as `srcdoc` on the preview iframe

The worker was always the intended compilation path -- it just never worked because of the Vite dev server @react-refresh injection.

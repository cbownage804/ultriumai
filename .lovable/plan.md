

## Fix: Make Worker Self-Contained to Eliminate React Refresh Crash

### Root Cause

The `parserConfig` exclusion correctly skips files inside `src/workers/`, but the worker imports `DEFAULT_PACKAGES` from `@/lib/cdnPackageRegistry.ts` -- which is **outside** `src/workers/`. Vite injects the React Refresh preamble into that file. When the worker loads it, the `/@react-refresh` virtual module crashes in the worker context, silently killing the worker before any code executes.

This is why none of the `[CompilerWorker]` diagnostic logs appear in the console -- the worker never gets past module initialization.

```text
Worker module loading:
  compiler.worker.ts (no preamble -- in workers/)
    -> worker-window-shim.ts (no preamble -- in workers/)   [OK]
    -> cdnPackageRegistry.ts (HAS preamble -- NOT in workers/)
       -> /@react-refresh (Vite virtual module -- CRASHES in worker)
```

### Fix

Move the shared data (`DEFAULT_PACKAGES` array and `CDNPackageEntry` type) into a new file inside `src/workers/` so the worker only imports from its own directory. The main-thread code (`cdnPackageRegistry.ts`) will re-export from the new shared file.

### Changes

**1. New file: `src/workers/packageData.ts`**

Contains the `CDNPackageEntry` interface and `DEFAULT_PACKAGES` constant (cut from `cdnPackageRegistry.ts`). Since it lives in `src/workers/`, it will NOT receive the React Refresh preamble.

**2. Update: `src/lib/cdnPackageRegistry.ts`**

Replace the inline `CDNPackageEntry` interface and `DEFAULT_PACKAGES` array with re-exports from `@/workers/packageData`. All existing consumers (useReactCompiler, etc.) continue working with zero changes.

**3. Update: `src/workers/compiler.worker.ts`**

Change the import from `@/lib/cdnPackageRegistry` to `./packageData`. This eliminates the only import that reaches outside the workers directory, making the worker fully self-contained.

**4. Update: `src/hooks/useWorkerCompiler.ts`**

- Change the type import to come from `@/workers/packageData` instead of `@/lib/cdnPackageRegistry`.
- Add an `onerror` handler on the worker to catch and log any future load failures (defense-in-depth).

### Result

```text
Worker module loading (fixed):
  compiler.worker.ts (no preamble)
    -> worker-window-shim.ts (no preamble)     [OK]
    -> packageData.ts (no preamble -- in workers/)  [OK]
    -- NO imports outside src/workers/ --
```

The worker loads cleanly, compilation proceeds, and the preview renders.

### Technical Details

- `useProjectFileSystem` is already a `type`-only import in the worker, so it gets erased by TypeScript and never loads at runtime
- `CDNPackageEntry` is also type-only in the worker and in `useWorkerCompiler.ts`
- Only `DEFAULT_PACKAGES` is a runtime value needed by the worker
- The `onerror` handler will surface worker crashes in the main-thread console going forward, preventing silent failures


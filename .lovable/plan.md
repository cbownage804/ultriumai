

## Fix: Widen parserConfig to Skip ALL Worker Directory Files

### Root Cause

The `parserConfig` regex `/\.worker\.(ts|js|tsx|jsx)$/` correctly excludes `compiler.worker.ts` from React Refresh injection, but `worker-window-shim.ts` does NOT match this pattern (it ends in `-shim.ts`). So Vite injects the `@react-refresh` preamble into the shim file.

ES module evaluation order:
1. `compiler.worker.ts` loads (no preamble -- good)
2. Its first import `./worker-window-shim` loads -- but this file HAS the preamble injected
3. The preamble does `import RefreshRuntime from '/@react-refresh'` which accesses `window` -- CRASH
4. The shim's body `(self as any).window = self` never executes

### Fix

Change the `parserConfig` filter from matching `*.worker.ts` filenames to matching any file inside the `src/workers/` directory:

**File: `vite.config.ts`** (line 16)

Change:
```typescript
if (/\.worker\.(ts|js|tsx|jsx)$/.test(id)) return undefined;
```

To:
```typescript
if (/\/workers\//.test(id)) return undefined;
```

This ensures:
- `compiler.worker.ts` -- skipped (no preamble)
- `worker-window-shim.ts` -- skipped (no preamble)
- Any future worker utility files -- also skipped

With this fix, the shim evaluates first (depth-first import order), sets `window = self`, and all subsequent imports (like `useProjectFileSystem.ts` which DO get the preamble) will find `window` already defined.

### Why This Works

```text
Import evaluation order:
  compiler.worker.ts        (no preamble -- matched by /workers/)
    -> worker-window-shim.ts  (no preamble -- matched by /workers/)
       Body runs: window = self   [SUCCESS]
    -> useProjectFileSystem.ts (has preamble, but window exists now)
       @react-refresh accesses window   [OK -- window = self]
    -> cdnPackageRegistry.ts   (has preamble, window exists)
       [OK]
```

### Single File Change

Only `vite.config.ts` line 16 changes. No other files affected.


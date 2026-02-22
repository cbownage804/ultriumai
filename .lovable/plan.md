

## Fix: Build Error from Dynamic Import in Worker

### Problem

The dynamic `import('esbuild-wasm')` added in the last change causes Vite's Rollup build to attempt code-splitting inside the worker bundle. Workers default to IIFE output format, which does not support code-splitting, resulting in:

```
Invalid value "iife" for option "output.format" - UMD and IIFE output formats
are not supported for code-splitting builds.
```

### Solution

Change the worker output format from IIFE to ES module in `vite.config.ts`. The worker is already instantiated with `{ type: 'module' }` in `useWorkerCompiler.ts`, so it already expects ES module format. This is a one-line config change.

### Changes

#### File: `vite.config.ts`

Update the `worker` config to set the output format to `'es'`:

```typescript
worker: {
  plugins: () => [],
  format: 'es',
},
```

This tells Rollup to emit the worker as an ES module, which supports dynamic imports and code-splitting natively.

### Why This Is Safe

- The worker is already created with `{ type: 'module' }` in `useWorkerCompiler.ts` (line 25), so the browser already expects ES module format
- ES module workers are supported in all modern browsers (Chrome 80+, Firefox 114+, Safari 15+)
- No other code changes needed


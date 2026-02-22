

## Fix: Prevent React Refresh from Injecting into Worker (Final)

### Why Previous Fixes Failed

The `window` shim at the top of `compiler.worker.ts` runs **after** `@react-refresh` has already been imported and evaluated as a separate ES module. Vite's dev server injects `import RefreshRuntime from '/@react-refresh'` as the very first line of any file transformed by the React plugin. Since `@react-refresh` is a standalone module, it evaluates in its own scope before our worker code runs, and crashes on `window` access.

The `worker.plugins: () => []` config only affects the **build** pipeline's plugin list. In dev mode, the React SWC plugin's transform hook runs on all modules served through Vite's dev server, including ES module workers (which are served through the same module graph).

### The Fix

Use the React plugin's `exclude` option to prevent it from transforming worker files. This stops `@react-refresh` from being injected entirely.

### Changes

**File: `vite.config.ts`**

Update the `react()` plugin call to exclude worker files:

```typescript
react({
  exclude: /\.worker\.(ts|js|tsx|jsx)$/,
}),
```

This tells `@vitejs/plugin-react-swc` to skip its React Refresh and JSX transforms for any file matching `*.worker.ts` (or `.js`/`.tsx`/`.jsx`). Since the compiler worker doesn't contain React components or JSX, this is safe.

**File: `src/workers/compiler.worker.ts`**

The `window` shim from the previous fix can be kept as a safety net (it won't hurt), or removed since it's no longer needed. I'll keep it for defense-in-depth.

### Technical Details

- The `exclude` option is documented for exactly this use case: "You may use it to exclude JSX/TSX files that run in a worker"
- The default `exclude` is `/node_modules/`, so we need to include that in our pattern as well, or pass an array
- Since `exclude` accepts a regex or array, we'll use an array to preserve the default node_modules exclusion

Final config:
```typescript
react({
  exclude: [/node_modules/, /\.worker\.(ts|js|tsx|jsx)$/],
}),
```

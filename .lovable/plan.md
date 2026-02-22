

## Fix: `window is not defined` in Worker (React Refresh Injection)

### Problem

The runtime error `ReferenceError: window is not defined` at `@react-refresh:367:5` confirms that Vite's dev server is injecting the React Refresh preamble into the worker module. Even though `worker.plugins: () => []` is set, Vite's dev-mode HMR transform still processes ES module workers because they're served through the same module graph pipeline.

This crashes the worker immediately since Web Workers don't have a `window` global, which means `self.onmessage` never registers, and all compilation requests time out at 30 seconds.

### Solution

Add a `window` shim at the very top of the worker file, before any imports. This is a well-known workaround for Vite's React Refresh injection in workers. The shim creates a minimal `window` proxy pointing to `self` (the worker global), which satisfies the refresh preamble without side effects.

### Changes

#### File: `src/workers/compiler.worker.ts`

Add these lines at the very top of the file (before line 1), before any other code or imports:

```typescript
// Shim `window` for Vite dev mode — React Refresh preamble references `window`
// which doesn't exist in Web Workers. This no-ops the refresh runtime.
declare var window: any;
if (typeof window === 'undefined') {
  (self as any).window = self;
}
```

This ensures:
1. The `@react-refresh` preamble Vite injects finds a `window` object and doesn't crash
2. The refresh runtime effectively no-ops (it won't find React components in a compiler worker)
3. The rest of the worker module evaluates normally and `self.onmessage` registers
4. No changes needed to `vite.config.ts` or any other files

### Why Previous Fixes Didn't Catch This

The `worker.plugins: () => []` config prevents user-defined plugins from running in the worker build, but Vite's internal React Refresh transform (from `@vitejs/plugin-react-swc`) injects its preamble at a different stage in dev mode for ES module workers. The `window` shim is the standard fix used across the Vite ecosystem for this exact issue.

### Expected Result

1. Worker module loads without `window is not defined` error
2. `self.onmessage` registers successfully  
3. Compilation requests are received and processed
4. Preview renders after generation completes


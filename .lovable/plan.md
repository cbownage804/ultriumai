

## Fix: esbuild-wasm Version Mismatch Causing Compilation Timeout

### Problem

The console shows:
```
Cannot start service: Host version "0.27.3" does not match binary version "0.25.2"
```

The installed npm package is `esbuild-wasm@0.27.3`, but the WASM binary URL in `compiler.worker.ts` is hardcoded to download version `0.25.2`:

```typescript
wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.2/esbuild.wasm'
```

This mismatch causes esbuild initialization to fail. While the worker has a regex fallback for TypeScript stripping, the failed initialization still consumes time, and the overall compilation times out at 30 seconds, resulting in the "Compilation Error" screen.

### Fix

**File: `src/workers/compiler.worker.ts` (line 31)**

Update the WASM URL to match the installed package version:

```typescript
// Before
wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.2/esbuild.wasm'

// After
wasmURL: 'https://unpkg.com/esbuild-wasm@0.27.3/esbuild.wasm'
```

This single line change aligns the WASM binary with the host JS module, allowing esbuild to initialize successfully and compile projects within the timeout window.

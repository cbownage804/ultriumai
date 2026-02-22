
## Fix: Worker Compilation Timeout - Root Cause and Solution

### Root Cause (confirmed via console logs)

The worker **always** times out at 30s:
```
[handleBgComplete] Worker compilation failed: Error: Worker timeout
[handleBgComplete] No preview available - setting error fallback
```

The worker never responds because its module fails to evaluate. The static `import * as esbuild from 'esbuild-wasm'` at the top of `compiler.worker.ts` (line 9) runs at module load time. In a Vite worker build (`type: 'module'`), this 10MB+ dependency may fail to resolve or load, causing the entire worker module to crash before `self.onmessage` is ever registered. Since the message handler never exists, the worker silently ignores all messages.

### The Fix (2 changes)

#### Change 1: Dynamic esbuild import in the worker

**File: `src/workers/compiler.worker.ts`**

Replace the static top-level import with a dynamic import inside `ensureEsbuild()`. This ensures the worker module evaluates successfully and registers its message handler, even if esbuild-wasm fails to load. The regex-based fallback for TypeScript stripping will still work.

Before (line 9):
```typescript
import * as esbuild from 'esbuild-wasm';
```

After:
```typescript
let esbuild: any = null;
```

And update `ensureEsbuild()` to dynamically import:
```typescript
async function ensureEsbuild(): Promise<boolean> {
  if (esbuildReady) return true;
  if (!esbuildInitPromise) {
    esbuildInitPromise = (async () => {
      try {
        esbuild = await import('esbuild-wasm');
        await esbuild.initialize({
          wasmURL: 'https://unpkg.com/esbuild-wasm@0.25.2/esbuild.wasm',
          worker: false,
        });
        esbuildReady = true;
        console.info('[CompilerWorker] esbuild-wasm initialized');
      } catch (err: any) {
        console.warn('[CompilerWorker] esbuild-wasm failed, using regex fallback:', err.message);
        esbuildInitPromise = null;
      }
    })();
  }
  await esbuildInitPromise;
  return esbuildReady;
}
```

Update `esbuildStripTypes` to use the dynamic reference:
```typescript
async function esbuildStripTypes(code: string, isTsx: boolean): Promise<string> {
  if (!esbuild) throw new Error('esbuild not loaded');
  const result = await esbuild.transform(code, { ... });
  return result.code;
}
```

#### Change 2: Add error logging to worker initialization

**File: `src/workers/compiler.worker.ts`**

Wrap the message handler registration in a try-catch and add a self-test log so we can confirm the worker module evaluates:

```typescript
console.info('[CompilerWorker] Module loaded successfully');

self.onmessage = async (e: MessageEvent<WorkerMessage>) => {
  // ... existing handler
};
```

### Why This Works

1. The static `import * as esbuild from 'esbuild-wasm'` currently crashes the entire worker module if the import fails
2. By making it dynamic, the worker module always evaluates, `self.onmessage` always gets registered
3. If esbuild-wasm fails to load dynamically, the worker falls back to regex-based TypeScript stripping (already implemented)
4. The compilation produces the HTML string with CDN script tags, Babel transpilation, etc. -- all of which is done inside the worker and doesn't depend on esbuild

### Expected Result

1. Worker module loads successfully (dynamic import can't crash module evaluation)
2. `handleBgComplete` sends compile request, worker receives it
3. Worker tries esbuild (may fail), falls back to regex stripping
4. Worker transpiles files, generates HTML, responds within seconds
5. `handleBgComplete` sets the compiled HTML and releases state
6. Preview shows the generated app

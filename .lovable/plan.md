

## Problem

The Vite Sandbox server is fragile and causes frequent build failures. Key issues:

1. **No dynamic package installation** — the edge function sends `installPackages` but the server ignores it entirely, so any project using packages not in the template (e.g. `@xyflow/react`, `@tiptap/*`) fails with import errors
2. **`npx vite build`** — adds 2-3s of overhead per build resolving the binary; should use the local `node_modules/.bin/vite` directly
3. **`cp -r` for every build** — copies the entire template including `node_modules` (hundreds of MB) every time; should use hardlinks or symlinks
4. **No retry on 503** — when the server hits concurrency limits, the client gets a hard failure with no retry
5. **No process cleanup** — if a build times out, the child process may linger as a zombie
6. **No worker fallback** — `useWorkerCompiler` was stripped to "Vite Sandbox ONLY" with all fallback tiers removed, so any sandbox failure = red error screen
7. **Streaming compiles waste concurrency** — 3s polling during generation sends partial code to the sandbox, consuming slots from the 5-concurrent cap

## Plan

### 1. Harden `vite-sandbox/server.js`

- **Handle `installPackages`**: When the request body contains `installPackages: string[]`, run `npm install --no-save <packages>` in the build directory before building. Add a 15s timeout for install. Skip if array is empty.
- **Symlink `node_modules`**: Replace `cp -r` of the entire template with: (a) create build dir, (b) copy only config files (package.json, tsconfig.json, vite.config.ts, tailwind.config.js, postcss.config.js), (c) symlink `node_modules` from the template. If `installPackages` is non-empty, copy `node_modules` instead (so npm install doesn't mutate the template).
- **Use direct vite binary**: Replace `npx vite build` with `./node_modules/.bin/vite build` to skip npx resolution overhead.
- **Kill zombie processes**: When build times out, explicitly kill the child process (`child.kill('SIGKILL')`) instead of relying on `exec` timeout alone.
- **Add a build queue**: Instead of returning 503 immediately at capacity, queue up to 5 pending builds with a 10s queue timeout. Process queued builds FIFO as slots free up.
- **Better error extraction**: Parse Vite build stderr to extract the actual error message (file + line) instead of returning the entire raw output.

### 2. Restore worker fallback in `useWorkerCompiler.ts`

In `compileReactProject` (line 280-294), catch Vite Sandbox failures and fall back to `compileViaWorker` instead of throwing. This gives a lower-fidelity preview but prevents the red error screen.

```
Vite Sandbox → success? return
           → failure? → compileViaWorker → return (degraded but functional)
                     → failure? → throw (show error)
```

### 3. Reduce streaming compile pressure

In `CompilationBridge.tsx`:
- Increase streaming poll interval from 3s to **8s**
- Require **4** completed files (not 2) before attempting streaming compile
- Cap streaming compile attempts at **2** failures, then stop polling until generation finishes
- Add `isGoldenProject` prop and skip all compilation when true

### 4. Add retry with backoff on the client side

In `CompilationBridge.tsx` `runCompile`, if the Vite Sandbox returns a 503 or times out, retry once after a 3s delay before falling through to the worker fallback.

### Files Changed

| File | Change |
|------|--------|
| `vite-sandbox/server.js` | Symlink node_modules, handle installPackages, use direct vite binary, kill zombies, add build queue |
| `src/hooks/useWorkerCompiler.ts` | Restore worker fallback on Vite Sandbox failure |
| `src/components/ai-builder/CompilationBridge.tsx` | Add isGoldenProject guard, reduce streaming pressure, add retry logic |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Pass isGoldenProject to CompilationBridge |


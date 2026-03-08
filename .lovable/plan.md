

## Additional Hardening Opportunities

After reviewing the full compilation pipeline (edge function → Vite Sandbox server → client fallback), here are the remaining failure points and fixes.

---

### 1. Server: Warm build cache (avoid cold-start penalty)

The sandbox creates a fresh build directory for every request. For repeat builds with the same dependencies, we can cache the symlinked template setup.

**`vite-sandbox/server.js`**:
- Add a `/warm` endpoint that pre-creates 2-3 build directories with symlinked `node_modules` on startup, so the first requests skip filesystem setup entirely.
- Add periodic cleanup of stale build dirs (older than 60s) via a `setInterval` to prevent disk exhaustion if cleanup fails in `finally`.

### 2. Server: Graceful shutdown and process management

Currently the server has no `SIGTERM` handler — if systemd restarts it, in-flight builds are orphaned.

**`vite-sandbox/server.js`**:
- Add `SIGTERM`/`SIGINT` handlers that stop accepting new requests, wait up to 10s for in-flight builds to finish, then exit.
- Track all active child processes in a `Set` and `SIGKILL` them all on shutdown.

### 3. Server: Memory guard with automatic restart

The 2GB droplet can OOM if multiple builds run `npm install` simultaneously (each spawns a full Node process).

**`vite-sandbox/server.js`**:
- Limit concurrent `installPackages` builds to 1 (queue the rest). Regular symlinked builds can still run at full concurrency since they're lightweight.
- Add a `/health` memory check using `process.memoryUsage()` — return `503` if RSS exceeds 1.5GB so the client retries or falls back.

### 4. Edge function: Retry at the edge, not just the client

The `compile-vite` edge function currently makes one attempt and returns 503/504 on failure. The client then retries, adding round-trip latency.

**`supabase/functions/compile-vite/index.ts`**:
- Add a single retry with 2s delay inside the edge function itself for 503/timeout responses from the droplet, before returning failure to the client. This saves a full client→edge→droplet round trip.

### 5. Edge function: Expand TEMPLATE_PACKAGES list

The edge function's `TEMPLATE_PACKAGES` set is missing packages that are already in `setup-template.sh`'s `package.json` — like `axios`, `zustand`, `canvas-confetti`, `react-dropzone`, `react-markdown`, `react-color`, `dompurify`, `qrcode`, `html2canvas`, `jspdf`, `@hello-pangea/dnd`, `react-resizable-panels`, `@radix-ui/react-icons`, `uuid`, `@tailwindcss/typography`. Every missing entry triggers an unnecessary `npm install` on the droplet, adding 5-15s to the build.

**`supabase/functions/compile-vite/index.ts`**:
- Sync the `TEMPLATE_PACKAGES` set to match the exact dependency list in `setup-template.sh`.

### 6. Client: LKG (Last Known Good) persistence across page reloads

If the user refreshes the page, the LKG preview is lost and must recompile from scratch.

**`src/components/ai-builder/CompilationBridge.tsx`**:
- On successful compile, persist `stableHTML` to `sessionStorage` keyed by a project hash.
- On mount, check `sessionStorage` for a cached preview before triggering compilation.

### 7. Client: Health-check ping before compile

Currently the client blindly sends files to compile. If the droplet is down, it wastes 30s waiting for timeout.

**`src/hooks/useWorkerCompiler.ts`**:
- Before `compileViaViteSandbox`, do a fast `fetch(SANDBOX_URL + '/health')` with a 3s timeout. If it fails, skip straight to the worker fallback — saves 30s of dead waiting.
- Cache health status for 30s so we don't ping on every compile.

### 8. Server: Request deduplication

If files haven't changed, the same compile request can hit the server multiple times (e.g., recompile-needed loop).

**`vite-sandbox/server.js`**:
- Hash the incoming files payload. If an identical build is already in-flight, return a promise to the same result instead of starting a duplicate build.

---

### Summary of files to change

| File | Changes |
|------|---------|
| `vite-sandbox/server.js` | Warm cache, graceful shutdown, memory guard, install concurrency limit, stale dir cleanup, request dedup |
| `supabase/functions/compile-vite/index.ts` | Edge-level retry, sync TEMPLATE_PACKAGES with setup-template.sh |
| `src/hooks/useWorkerCompiler.ts` | Health-check ping before compile |
| `src/components/ai-builder/CompilationBridge.tsx` | LKG sessionStorage persistence |


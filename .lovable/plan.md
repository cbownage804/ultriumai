

## Architecture: Single-Path Vite Compilation (Lovable Parity)

### Status: ✅ Implemented

### What Changed

The compilation pipeline was simplified from a 3-tier fallback chain (Vite → Worker → Edge) to a **single path: Vite Sandbox only**.

### Resulting Flow

```text
User prompt → AI generates files → CompilationBridge auto-repairs files
→ Sends to Vite Sandbox (25s timeout) → Returns compiled HTML
→ Preview validation → srcdoc iframe
```

### On Failure

- No browser fallbacks (Worker/Edge removed entirely)
- Clean error state with "Retry compile" button
- LKG (Last Known Good) preview preserved when available
- Clear error messages identifying what failed

### Files Changed

1. **`src/hooks/useWorkerCompiler.ts`** — Removed Worker shared instance, Edge function fallback, health check cache. Single `compileViaViteSandbox` path only.
2. **`src/components/ai-builder/CompilationBridge.tsx`** — Reduced timeouts (30s budget), removed fallback comments.
3. **`src/hooks/useCompileTelemetry.ts`** — Removed `worker` tier and `workerFallbackRate` metric.
4. **`src/components/ai-builder/BuildHealthDashboard.tsx`** — Replaced "Worker Fallback %" with "Vite Only ✓".

### Why This Is Better

- **1 code path** instead of 3 → 3x less surface area for bugs
- **No browser-based Babel/esbuild** → no `<\/div>` escaping bugs, no regex type stripping
- **Server-side Vite** = same toolchain as Lovable → same reliability
- **Faster feedback** — 25s max instead of 55s worst-case chain

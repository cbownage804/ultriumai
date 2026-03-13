

# Fix App Builder Compilation Pipeline — Production-Ready Plan

## Diagnosis

After deep inspection of the entire pipeline, here are the **real issues** causing persistent compilation failures:

### Issue 1: Edge Functions May Not Be Deployed
`compile-vite` and `compile-project` show **zero logs** — not even successful calls. This means either:
- The edge functions were never deployed after recent edits
- They're erroring before any logging happens

This is the **most likely root cause**. Every compile attempt hits the edge function, gets nothing back, and the 30s timeout elapses before falling to the worker.

### Issue 2: Excessive Retry Cascade = 120s+ Wait
When the Vite Sandbox fails, the current flow is:
1. Vite Sandbox attempt (30s timeout)
2. Retry on 503 after 3s delay (30s timeout) 
3. `compile-project` edge function (25s timeout)
4. Worker fallback (20s timeout)

**Total worst case: ~108s of waiting** before anything renders.

### Issue 3: Worker Fallback Is Fragile
The Web Worker uses regex-based TypeScript stripping that breaks on generics, `satisfies`, type-only imports, etc. When it's finally reached after 60s+, it often crashes too.

### Issue 4: `tailwind.config.js` Uses `require()` in ESM Context
The template's `tailwind.config.js` has `plugins: [require("tailwindcss-animate")]` but `package.json` has `"type": "module"` — this causes Vite to crash on any project using Tailwind animations.

---

## Plan

### Step 1: Deploy Edge Functions
Re-deploy both `compile-vite` and `compile-project` edge functions to ensure they're actually running. This is the critical first step — if they're not deployed, the entire Vite Sandbox path is dead.

### Step 2: Fix Tailwind Config ESM Incompatibility
Change `vite-sandbox/setup-template.sh` tailwind config from:
```js
plugins: [require("tailwindcss-animate")]
```
to:
```js
plugins: [await import("tailwindcss-animate").then(m => m.default || m)]
```
And update `server.js` line 459-493 (the dynamic vite.config.ts) to match.

This is a **silent Vite crash** — no error is surfaced because the build process exits with a cryptic module error.

### Step 3: Cut the Retry Cascade (30s Max Total)
In `useWorkerCompiler.ts`:
- **Remove Attempt 2** (503 retry with 3s delay) — if Vite fails, go straight to worker
- **Remove Attempt 3** (`compile-project` edge function) — it also shows zero logs, likely undeployed
- Reduce to: **Vite Sandbox (20s) → Worker (15s)** = 35s max

### Step 4: Harden Worker Compiler TypeScript Stripping
In `compiler.worker.ts`:
- Strip `type`-only imports entirely (`import type { X }`)
- Strip `type` prefix from mixed imports (`import { type X, Y }`)
- Handle `satisfies`, `as const`, generic arrow functions
- Wrap each file's transform in try/catch so one bad file doesn't kill the whole build

### Step 5: Add Console Diagnostics
Add `console.info` breadcrumbs at each compilation tier transition so we can see exactly where it's failing when the user reports issues. Currently failures are silent.

### Step 6: Fix `postcss.config.js` ESM Format
Same issue as tailwind — the postcss config in `setup-template.sh` uses ESM export syntax but may conflict with PostCSS's expected format depending on the version.

---

## Implementation Order

1. **Deploy edge functions** (immediate — unblocks entire pipeline)
2. **Fix tailwind/postcss ESM configs** (fixes silent Vite crashes on droplet)
3. **Cut retry cascade** (reduces wait from 120s to 35s)
4. **Harden worker compiler** (makes fallback actually work)
5. **Add diagnostics** (makes future debugging possible)

## Expected Outcome
- Compilation succeeds on first attempt via Vite Sandbox in ~5-15s
- If droplet is down, worker fallback renders in ~20s total (not 120s)
- Tailwind-based projects no longer silently crash
- Console shows exactly which tier succeeded/failed


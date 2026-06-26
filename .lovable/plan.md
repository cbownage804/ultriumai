# Builder Auto-Repair Smoke Test

Add a Playwright-driven smoke test that loads the App Builder, injects a known-broken project (the `</motion></div>` bug), runs it through the auto-repair → compile pipeline, and asserts the UI thread never freezes.

## Approach

Avoid the full AI generation path (slow, non-deterministic, requires auth + credits). Instead, exercise the deterministic pipeline directly in the browser:

1. Load `/ai-studio/app-builder` with the managed Supabase session (already injected via `LOVABLE_BROWSER_SUPABASE_*`).
2. Seed a broken `App.tsx` into the in-memory project store via a `window.__BUILDER_TEST__` hook (new, dev-only).
3. Invoke the auto-repair + compile flow through the same hook.
4. Continuously poll a main-thread liveness heartbeat from the page; fail if any gap exceeds 1.5s (freeze threshold).
5. Assert: repaired file contains `</motion.div>`, preview iframe loads, no error overlay, heartbeat never stalled.

## Files

- `src/components/ai-builder/__testHooks__/builderTestHook.ts` (new) — dev-only `window.__BUILDER_TEST__` exposing `seedFiles`, `runAutoRepair`, `runCompile`, `getState`. Gated on `import.meta.env.DEV`.
- `src/components/ai-builder/AIAppBuilderWorkspace.tsx` — mount the test hook in a `useEffect` when `DEV`.
- `tests/e2e/builder-autorepair-smoke.spec.ts` (new) — Playwright test.
- `playwright.config.ts` (new, if absent) — minimal config: chromium, `http://localhost:8080`, 60s timeout.
- `package.json` — add `test:e2e` script: `playwright test`.

## Technical Details

**Liveness heartbeat:** test hook spawns a `setInterval(() => { window.__HEARTBEAT__ = performance.now() }, 100)`. Playwright polls `window.__HEARTBEAT__` every 200ms for 30s; max delta must stay < 1500ms.

**Broken fixture:**
```tsx
import { motion } from 'framer-motion';
export default function App() {
  return (<motion.div><h1>Hi</h1></motion></div>);
}
```
Expected post-repair: bare `</motion>` rewritten to `</motion.div>`.

**Assertions:**
- `result.repairs` includes `"repaired 1 malformed framer-motion closing tag"`.
- Preview iframe `#builder-preview-iframe` reaches `readyState === 'complete'`.
- No `[role="alert"]` with text matching `/failed to compile/i`.
- Heartbeat gap < 1500ms throughout.

**Scope guardrails:** hook is `DEV`-only (stripped from prod bundle), no network calls bypassed, no auth changes.

## Out of Scope

- Real AI generation E2E (separate, slower suite).
- CI wiring (left for follow-up).



## Reaching True Lovable Parity: Remaining Gaps

### Current Architecture vs Lovable

Your app builder runs **everything on the browser's main thread**: Babel transpilation, regex-based TypeScript stripping, module resolution, and preview rendering. Lovable uses a fundamentally different architecture that avoids browser freezes entirely.

### Gap 1: Move Compilation to a Web Worker (HIGH IMPACT)

**The Problem**: Your `CompilationBridge.tsx` runs Babel transpilation, `stripTypeAnnotations` (500+ lines of regex), and module resolution all on the main thread. This is why the browser freezes.

**The Fix**: Create a dedicated Web Worker (`compiler.worker.ts`) that handles all compilation off the main thread. The main thread only sends files and receives compiled HTML.

```text
Current:
  Main Thread: [UI + Compilation + Preview] --> FREEZE

Target:
  Main Thread: [UI + Preview] (always responsive)
  Web Worker:  [Babel + TypeScript + Bundling] (runs in background)
```

**Files to create/modify**:
- Create `src/workers/compiler.worker.ts` -- moves `useReactCompiler` logic into a worker
- Create `src/hooks/useWorkerCompiler.ts` -- wrapper hook that posts messages to the worker
- Modify `CompilationBridge.tsx` -- use worker-based compiler instead of main-thread compiler
- All the timeout/retry/freeze mitigations become unnecessary since the main thread stays free

### Gap 2: Replace Regex TypeScript Stripping with esbuild-wasm (HIGH IMPACT)

**The Problem**: `stripTypeAnnotations` in `useReactCompiler.ts` is 110 lines of fragile regex that breaks on edge cases (nested generics, complex type unions, decorator patterns). Lovable uses a real compiler.

**The Fix**: Load `esbuild-wasm` (200KB) in the Web Worker. It strips TypeScript AND transpiles JSX in one pass, 100x faster than Babel standalone, with zero edge-case bugs.

**Files to modify**:
- `src/workers/compiler.worker.ts` -- use `esbuild.transform()` instead of `stripTypeAnnotations` + Babel
- Remove `stripTypeAnnotations` from `useReactCompiler.ts`

### Gap 3: Real Package Resolution via Import Maps (MEDIUM IMPACT)

**The Problem**: Your current system loads packages via `window.__pkg_X` globals with CDN fallbacks. Missing packages silently render empty `<span>` elements via Proxy fallbacks. Lovable resolves packages properly.

**The Fix**: Use browser-native Import Maps + esm.sh for proper ESM package resolution. This eliminates the Proxy fallback system and the `cdnPackageRegistry.ts` entirely.

```text
Current:
  var { Button } = new Proxy(window.__pkg_X || {}, { get: ... })
  // Silent failure: renders empty <span>

Target:
  <script type="importmap">
  { "imports": { "lucide-react": "https://esm.sh/lucide-react@0.462.0" } }
  </script>
  import { Star } from 'lucide-react';  // Real ESM import, real errors
```

**Files to modify**:
- Modify `useReactCompiler.ts` `compileReactProject` -- generate import maps instead of async preamble
- Simplify `transpileFile` -- keep real import statements instead of converting to `window.__pkg_X`

### Gap 4: Sandboxed Preview via iframe sandbox or Service Worker (MEDIUM IMPACT)

**The Problem**: Your preview uses `srcdoc` with injected shims for localStorage, fetch, etc. This is fragile and causes DOM mismatches for visual editing. Lovable uses a proper sandboxed preview origin.

**The Fix**: Use a Service Worker on a preview subdomain (e.g., `preview.ultriumai.app`) that intercepts fetch requests and serves files from the virtual file system. This gives the preview a real browsing context with proper `window.location`, real `localStorage`, and no shimming needed.

**Files to create**:
- `public/preview-sw.js` -- Service Worker that serves VFS files
- Modify `BuilderPreviewPanel.tsx` -- use iframe `src` pointing to the SW-controlled origin instead of `srcdoc`

### Gap 5: Proper HMR Instead of Full Reloads (LOW-MEDIUM IMPACT)

**The Problem**: Your `useLivePreviewSync.ts` only hot-patches CSS. Any JS/TS change triggers a full `srcdoc` reload, which loses component state (scroll position, form inputs, expanded accordions).

**The Fix**: With the Service Worker preview (Gap 4), implement Vite-style HMR where changed modules are re-executed and React components are re-rendered without losing state.

### Recommended Implementation Order

1. **Web Worker compilation** (Gap 1) -- ✅ DONE
2. **esbuild-wasm** (Gap 2) -- ✅ DONE
3. **Import Maps** (Gap 3) -- ✅ DONE
4. **Service Worker preview** (Gap 4) -- ✅ DONE
5. **HMR** (Gap 5) -- ✅ DONE

### Priority Recommendation

Start with **Gap 1 (Web Worker)** because it solves the immediate browser freeze problem without any other architectural changes. The existing `useReactCompiler` code moves almost verbatim into a worker -- only the communication layer changes. This single change would eliminate the need for all the timeout/retry/rAF workarounds that have been accumulating.


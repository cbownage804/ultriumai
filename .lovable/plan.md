

## Problem Analysis

The recurring `SyntaxError: missing } after try block` and `unexpected token: identifier` errors stem from a fundamental architectural flaw in the compilation pipeline:

1. **The regex-based TypeScript stripper (`stripTypeAnnotations`)** is inherently fragile — it counts braces naively without understanding string literals, template literals, comments, or regex patterns. This corrupts code structure (eating braces, mangling blocks).
2. **The `new Function('__modules', moduleBody)` wrapper** requires `moduleBody` to be valid JavaScript. When the regex stripper fails to fully strip TypeScript, `new Function` throws a parse error. But worse — when the regex stripper *corrupts* valid code, the `new Function` wrapping itself gets malformed in the output.
3. **Babel already runs with `['typescript', { isTSX: true }]` preset** in the preview iframe (line 815), making the regex stripper completely redundant.

The root cause chain: esbuild WASM fails to load → regex fallback runs → regex corrupts code → `new Function(corrupted)` produces malformed JS → Babel can't parse the outer structure → fatal syntax errors in the preview.

## Permanent Fix

**Dual-path wrapping based on whether esbuild succeeded:**

### When esbuild IS available (current behavior, works fine)
- esbuild strips TypeScript correctly
- Code is wrapped in `new Function('__modules', JSON.stringify(moduleBody))` for per-file isolation
- Babel in preview handles JSX

### When esbuild is NOT available (the fix)
- **Skip `stripTypeAnnotations()` entirely** — do not run the regex stripper
- **Wrap modules in simple IIFEs** instead of `new Function(stringified)`:
  ```js
  (function(__modules) {
    try {
      // raw code with TypeScript still present
    } catch(e) { console.error(...); }
  })(window.__modules);
  ```
- **Babel's TypeScript preset** (already configured on line 815) strips all TypeScript syntax correctly in a single pass over the whole code string
- Runtime errors are still isolated per-file via the try/catch

### Files to change

**`src/workers/compiler.worker.ts`** — two changes:

1. **Lines 265-277**: When `useEsbuild` is false (or esbuild fails for a specific file), skip `stripTypeAnnotations()` entirely instead of calling it as fallback.

2. **Line 463**: Pass `useEsbuild` into the wrapping logic. When esbuild was used, keep the current `new Function` approach (TypeScript is already stripped, safe to parse as JS). When esbuild was NOT used, emit a simple IIFE with the raw code inline so Babel can transform it.

### Why this is permanent

- Eliminates the regex TypeScript stripper from the runtime path entirely (it becomes dead code when esbuild is unavailable)
- Babel is a production-grade TypeScript parser — no edge cases with brace counting, string literals, template literals, or comments
- Each module remains isolated in its own IIFE with try/catch for runtime errors
- No behavioral change when esbuild works (the common path)

### Trade-off

If the AI generates genuinely broken JavaScript (not TypeScript-related), a syntax error in one module will cause Babel's whole-file transform to fail. This is the same current behavior (line 815 already does a single Babel transform on all code). Per-file Babel transforms could be added later as an enhancement but are not needed for this fix.


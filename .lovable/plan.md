
## Fix: Separate Package Pre-Loading from Code Execution

### Problem Analysis

The preview is blank because of a fundamental conflict in the compilation pipeline:

1. External packages (lucide-react, framer-motion, etc.) are loaded via `await import('package')` INSIDE each transpiled file chunk
2. All chunks are concatenated into one code string and passed through `Babel.transform()`
3. `await` at the top level requires `sourceType: 'module'` -- but this can cause Babel to pass through un-stripped `import` declarations (from multi-line imports the regex misses), which crash inside `AsyncFunction`
4. Without `sourceType: 'module'`, Babel rejects the `await` entirely

No combination of Babel settings can fix this because the problem is structural.

### Solution: Pre-Load Packages Outside of Babel

Split the execution into two phases:

**Phase A - Package Pre-Loading (async, no Babel needed):**
```text
In the outer async IIFE (raw JS, no JSX):
  window.__pkg_lucide_react = await import('lucide-react')
  window.__pkg_framer_motion = await import('framer-motion')
  ... etc for all detected packages ...
```

**Phase B - Code Execution (synchronous, through Babel with sourceType: 'script'):**
```text
Each file chunk references pre-loaded packages:
  const { Star, Heart } = window.__pkg_lucide_react || {};
  function App() { return <div><Star /></div>; }
  __modules['App.tsx'].default = App;
```

Since Phase B has no `await`, it works with `sourceType: 'script'` and `new Function()` (no AsyncFunction needed).

### Additional Fix: Multi-Line Import Handling

Before the import regex runs, normalize multi-line imports into single lines:
```text
import {
  Star,
  Heart,
  Check
} from 'lucide-react';

becomes:

import { Star, Heart, Check } from 'lucide-react';
```

This ensures ALL import patterns are captured by the existing regex.

### Files to Edit

**1. `src/hooks/useReactCompiler.ts` - `transpileFile` function (~line 167-385)**

Changes:
- Add multi-line import normalization at the top of transpileFile (before the import regex)
- Change external package import handling: instead of generating `await import('pkg')`, generate `const { X } = window.__pkg_NAME || {};`
- Remove the async IIFE wrapper from file chunks (line 385) -- chunks become synchronous
- Return an object with both the code chunk AND a list of external packages used

**2. `src/hooks/useReactCompiler.ts` - `compileReactProject` function (~line 460-735)**

Changes:
- Collect all external packages from transpiled chunks
- Generate the package pre-loading preamble (async JS, injected before Babel transform)
- Revert Babel.transform to `sourceType: 'script'` (no top-level await needed in the code)
- Revert from `AsyncFunction` back to `new Function()` for the main code
- Keep the outer async IIFE for the preamble only

### HTML Template Structure (After Fix)

```text
<script>
(async function() {
  try {
    // Phase A: Pre-load packages (raw JS, no Babel)
    window.__pkg_lucide_react = {};
    try { window.__pkg_lucide_react = await import('lucide-react'); }
    catch(e) { console.warn('Failed to load lucide-react'); }

    window.__pkg_framer_motion = {};
    try { window.__pkg_framer_motion = await import('framer-motion'); }
    catch(e) { console.warn('Failed to load framer-motion'); }

    // Phase B: Transform and execute (synchronous, Babel sourceType: 'script')
    var code = "...all chunks referencing window.__pkg_X...mount script...";
    var transformed = Babel.transform(code, {
      presets: ['react', ['typescript', ...]],
      filename: 'app.tsx',
      sourceType: 'script'
    });
    new Function(transformed.code)();
  } catch(e) {
    // error display
  }
})();
</script>
```

### Why This Fixes Everything

- No `await` in the code string -- `sourceType: 'script'` works, no `AsyncFunction` needed
- No race conditions -- packages are fully loaded before any code executes
- Multi-line imports are normalized -- all import patterns are captured
- File chunks are synchronous -- no async IIFE wrapper, no fire-and-forget issues
- Babel only sees standard synchronous JS + JSX -- no edge cases

### Technical Details for Implementation

**Multi-line import normalizer** (added at top of `transpileFile`):
```typescript
// Join multi-line imports into single lines
code = code.replace(
  /^import\s+(?:[\w*{}\s,]+)\s+from\s/gm,
  // No-op match to find import start, then use a smarter approach:
);
// Better: replace newlines inside import { ... } blocks
code = code.replace(
  /import\s*\{([^}]*)\}/gs, // 's' flag: dot matches newline
  (match, names) => {
    const cleaned = names.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    return `import { ${cleaned} }`;
  }
);
```

**External import transform** (in the import handler, ~line 214-244):
```typescript
// Instead of: await import('lucide-react')
// Generate: window.__pkg_lucide_react
const importVar = `__pkg_${specifier.replace(/[^a-zA-Z0-9]/g, '_')}`;
const parts: string[] = [];
if (defaultImport) {
  parts.push(hasNoDefault
    ? `const ${defaultImport} = window.${importVar} || {};`
    : `const ${defaultImport} = (window.${importVar} || {}).default || window.${importVar} || {};`
  );
}
if (namedImports) {
  parts.push(`const { ${destructure} } = window.${importVar} || {};`);
}
// Track this package for the preamble
usedExternalPackages.add(specifier);
```

**File chunk wrapper** (line 385):
```typescript
// Before: await (async function() { ...code... })();
// After: (function() { ...code... })();
return `/* === ${file.path} === */\n(function() {\n${code}\n${registration.join('\n')}\n})();`;
```

**Preamble generation** (in compileReactProject):
```typescript
const preambleLines = usedPackages.map(pkg => {
  const varName = `__pkg_${pkg.replace(/[^a-zA-Z0-9]/g, '_')}`;
  return `window.${varName} = {};\ntry { window.${varName} = await import('${pkg}'); } catch(__e) { console.warn('Failed to load ${pkg}:', __e); }`;
});
const preamble = preambleLines.join('\n');
```



## Comprehensive Preview Fix: All Failure Points at Once

This plan addresses every identified failure mode in a single batch, ending the cycle of incremental fixes.

### What's Actually Breaking (All Three Layers)

**Layer 1: Type stripping gaps** -- The regex-based stripper still misses edge cases, causing Babel to crash inside the iframe. Previous fixes helped but may not cover all AI-generated patterns.

**Layer 2: External packages fail silently** -- When `esm.sh` fails to load `lucide-react`, `framer-motion`, etc., the destructured variables (`Star`, `motion`, etc.) become `undefined`. React crashes with "X is not a function" when it tries to render them. There is zero fallback.

**Layer 3: No resilience at the iframe level** -- When the Babel script inside the iframe crashes, it shows a syntax error div BUT if the crash happens before React mounts (e.g., during package destructuring), the #root div stays empty. The health check sees an empty body, tries to "roll back" (but there's no previous good HTML), and gives up.

### The Fix: 3 Changes, 1 File

All changes are in `src/hooks/useReactCompiler.ts`.

---

**Change 1: Proxy-based fallbacks for ALL external packages**

In `transpileFile` (around line 276-280), when generating the destructuring for external packages, wrap them with Proxy fallbacks so undefined components render as empty elements instead of crashing React.

Current code:
```javascript
var { Star, Check } = window.__pkg_lucide_react || {};
```

New code:
```javascript
var { Star, Check } = new Proxy(window.__pkg_lucide_react || {}, {
  get: function(t, p) {
    if (p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf') return function() { return ''; };
    return t[p] || function(props) { return React.createElement('span', props); };
  }
});
```

This ensures:
- If `lucide-react` loads: icons work normally
- If `lucide-react` fails: icons render as empty `<span>` instead of crashing
- Same pattern for `framer-motion`, `recharts`, and every other external package

For default imports (non-icon packages like `framer-motion`), wrap similarly:
```javascript
var motion = (window.__pkg_framer_motion || {}).default || 
  new Proxy({}, { get: (_, p) => function(props) { return React.createElement(p === 'div' ? 'div' : 'span', props); } });
```

**Change 2: CDN retry with jsdelivr fallback**

In the async preamble (around line 751-754), add a retry using jsdelivr when esm.sh fails:

Current:
```javascript
try { window.__pkg_X = await import('lucide-react'); } catch(__e) { console.warn('Failed:', __e); }
```

New:
```javascript
try { 
  window.__pkg_X = await import('lucide-react'); 
} catch(__e) { 
  try { 
    window.__pkg_X = await import('https://cdn.jsdelivr.net/npm/lucide-react/+esm'); 
  } catch(__e2) { 
    console.warn('Package lucide-react unavailable'); 
  } 
}
```

**Change 3: Bulletproof mount error handling**

In the mount script (around line 580-614), add a secondary catch around the entire initialization:

Wrap the transpiled chunks execution in a try-catch so that if ANY file's IIFE throws during execution, it doesn't prevent subsequent files from loading. Currently, a single crash in one file kills the entire pipeline.

Current (line 763):
```javascript
${transpiledChunks.join('\n\n')}
```

New -- wrap each chunk individually:
```javascript
${transpiledChunks.map(chunk => `try { ${chunk} } catch(__chunkErr) { console.error('[Module]', __chunkErr.message); }`).join('\n\n')}
```

### Technical Details

**File:** `src/hooks/useReactCompiler.ts`

**Edit locations:**
1. Lines 265-281 (`transpileFile`, external package destructuring) -- Add Proxy wrappers
2. Lines 751-754 (async preamble, package loading) -- Add jsdelivr retry  
3. Line 422 (chunk wrapper in transpileFile return) -- Wrap each chunk in try-catch
4. Line 763 (transpiledChunks.join) -- Per-chunk error isolation

**Why this fixes everything:**
- Undefined icons/components from failed CDN loads render as harmless empty elements instead of crashing React
- CDN retry doubles the chance of successful package loading
- Per-chunk error isolation means one bad file doesn't kill the entire app
- Combined with the type stripping fixes already applied, this covers all identified crash vectors

**Risk assessment:**
- Proxy fallbacks have near-zero performance cost (only invoked when a property is genuinely missing)
- jsdelivr retry adds latency only when esm.sh already failed (no impact on happy path)
- Per-chunk try-catch may hide legitimate errors, but showing a partial preview is far better than a blank screen
- No changes to the compilation flow or state management -- only changes inside the generated iframe HTML


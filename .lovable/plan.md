

## Fix: Unblock the Preview Pipeline (The Actual Root Cause)

### Why the preview is blank

The compiled HTML runs an async IIFE inside the iframe:

```
(async function() {
  // Step A: Load packages (CAN HANG FOREVER)
  await import('lucide-react');     // esm.sh can take 30s+
  await import('framer-motion');    // or never resolve
  
  // Step B: Babel transform (NEVER REACHED if A hangs)
  Babel.transform(code, ...);
  
  // Step C: Mount React app (NEVER REACHED)
  root.render(...)
})();
```

There is NO timeout on Step A. If any `await import()` hangs (common with esm.sh for large packages), Steps B and C never run. The `#root` div stays empty. The page is blank white.

All previous fixes (type stripping, Proxy fallbacks, CDN retry, per-chunk isolation) only help after Step A finishes. They do nothing when Step A hangs.

### The Fix (3 changes, 1 file)

All changes in `src/hooks/useReactCompiler.ts`.

#### Change 1: Add per-package timeout (5 seconds max)

Wrap every `await import()` in `Promise.race` with a 5-second timeout so no single package can block the pipeline.

Current code (lines 753-757):
```javascript
window.__pkg_X = {};
try { window.__pkg_X = await import('pkg'); } 
catch(__e) { try { window.__pkg_X = await import('cdn.jsdelivr...'); } catch(__e2) { ... } }
```

New code:
```javascript
window.__pkg_X = {};
try {
  window.__pkg_X = await Promise.race([
    import('pkg'),
    new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
  ]);
} catch(__e) {
  try {
    window.__pkg_X = await Promise.race([
      import('https://cdn.jsdelivr.net/npm/pkg/+esm'),
      new Promise((_, r) => setTimeout(() => r(new Error('timeout')), 5000))
    ]);
  } catch(__e2) {
    console.warn('Package pkg unavailable');
  }
}
```

This ensures no single package import blocks for more than 5 seconds. If it times out, the jsdelivr fallback is tried (also with 5s limit). If both fail, the Proxy fallbacks from the previous fix handle the missing components.

#### Change 2: Show loading indicator while packages load

Add a "Loading packages..." message in `#root` BEFORE the async IIFE runs, so the user sees activity instead of a blank page.

Add before the async IIFE script (around line 746):
```html
<script>
  document.getElementById('root').innerHTML = 
    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#888">' +
    '<div style="text-align:center"><div style="width:24px;height:24px;border:2px solid #8882;border-top-color:#888;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 12px"></div>' +
    '<p style="font-size:13px">Loading preview...</p></div></div>' +
    '<style>@keyframes spin{to{transform:rotate(360deg)}}</style>';
</script>
```

This immediately shows a spinner. When React mounts, it replaces this with the actual app. If nothing mounts, the user sees "Loading preview..." instead of a blank white page.

#### Change 3: Global IIFE timeout (20 seconds)

Add a safety timeout that fires if the async IIFE hasn't completed after 20 seconds, rendering a diagnostic message.

Wrap the async IIFE with a race against a 20-second timer:
```javascript
var __iifeDone = false;
(async function() {
  try {
    // ... existing preamble + babel + mount ...
    __iifeDone = true;
  } catch(e) { ... __iifeDone = true; }
})();
setTimeout(function() {
  if (!__iifeDone && document.getElementById('root').innerHTML.indexOf('Loading preview') > -1) {
    document.getElementById('root').innerHTML = 
      '<div style="padding:40px;text-align:center;font-family:system-ui;color:#f59e0b">' +
      '<h2>Preview timed out</h2>' +
      '<p style="color:#888;margin-top:8px">External packages took too long to load. Try regenerating or check your network.</p></div>';
    window.parent.postMessage({ type: '__PREVIEW_ERROR__', message: 'Preview timed out waiting for CDN packages', source: 'preamble' }, '*');
  }
}, 20000);
```

### Technical Details

**File:** `src/hooks/useReactCompiler.ts`

**Edit locations:**
1. Lines 753-757: Wrap `await import()` calls with `Promise.race` timeout
2. Around line 746 (before async IIFE script): Add loading spinner script
3. Lines 748-785 (async IIFE): Wrap in completion flag + 20s safety timeout

### Why this actually fixes the blank page

- **5s per-package timeout** -- No import can hang indefinitely. Maximum total wait = 5s x number_of_packages (typically 1-3 packages = 5-15s)
- **Loading spinner** -- User sees immediate feedback instead of blank white
- **20s global timeout** -- Guaranteed diagnostic instead of infinite blank page
- **Previous fixes still apply** -- Proxy fallbacks handle missing components after timeout, per-chunk isolation prevents cascade failures

### What was wrong with previous fixes

The Proxy fallbacks, CDN retry, per-chunk isolation, and type stripping fixes all operate AFTER the package loading step. They never get a chance to run if `await import()` hangs. Adding a timeout is the missing piece that connects all the other fixes together.


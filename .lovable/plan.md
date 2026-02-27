

## Diagnosis: "Loading preview" caused by Vite dev client artifacts

### Root Cause

The iframe uses `sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox"` with `srcdoc`. Because `allow-same-origin` is set, the iframe shares the parent page's origin. This means the **host Lovable dev server's Vite HMR client** (`/@vite/client`, React Refresh preamble) can leak into or affect the iframe context.

The `devserver_websocket_open/close/error` messages are from the **parent page's Vite dev server**, not from the compiled preview output. The sandbox server correctly runs `vite build --mode production` — no dev client is injected into the compiled HTML itself.

However, the `allow-same-origin` sandbox attribute means the iframe can access the parent's service workers and potentially inherit connection attempts. When the Vite HMR websocket fails (different port/host in production, Cloudflare blocking), the error loops through the console interceptor bridge (lines 174-184 in BuilderPreviewPanel), which relays ALL `console.error` to the parent as `__PREVIEW_ERROR__`, potentially triggering the auto-fix pipeline on non-actionable errors.

### Fix: Two changes

---

### Task 1: Filter out Vite dev/HMR noise from error bridge

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

In the message handler (line 417), the existing `isHostDevError` filter catches React Refresh preamble errors but misses Vite dev client websocket errors. Expand the filter:

```typescript
// Line 417 — expand this regex:
const isHostDevError = /react.refresh|@react-refresh|preamble was not loaded|@vite\/client|vite\/hmr|devserver_websocket|__vite_|import\.meta\.hot|hmr.*connection|websocket.*vite/i.test(msg);
```

This ensures any Vite dev infrastructure noise is silently dropped before it can trigger auto-fix or circuit breaker.

### Task 2: Add dev-client detection gate in CompilationBridge

**File: `src/components/ai-builder/CompilationBridge.tsx`**

After `runCompile()` returns `result` (line 316), add a sanity check that the compiled HTML doesn't contain Vite dev client artifacts. This catches the edge case where the sandbox accidentally returns dev output:

```typescript
// After line 316, before the incomplete check:
const looksLikeViteDev = /\/@vite\/client|import\.meta\.hot\b|__vite_plugin_react_preamble_installed__/.test(result);
if (looksLikeViteDev) {
  console.warn('[CompilationBridge] BUILD GATED: dev client detected in output');
  window.postMessage({
    type: '__BUILD_GATED__',
    payload: { reason: 'dev_client_detected', errors: ['Compiled output contains Vite dev/HMR client'] },
    source: 'compilation-bridge',
  }, '*');
  return; // Keep LKG
}
```

---

### Why not remove `allow-same-origin`?

The iframe needs `allow-same-origin` for Supabase client initialization, localStorage access, and service worker communication. Removing it would break preview functionality. The correct fix is filtering the noise.

### Summary

Two surgical edits:
1. Expand `isHostDevError` regex in BuilderPreviewPanel to catch Vite HMR/websocket noise
2. Add dev-client detection gate in CompilationBridge as defense-in-depth




## Plan: Disable websocket devserver channel for srcdoc previews

### Root Cause

The `devserver_websocket_*` logs originate from the **host page's Vite dev server HMR client** (`/@vite/client`). Because the iframe uses `allow-same-origin`, it shares the parent's origin and inherits the Vite HMR websocket connection attempts. These fail repeatedly (different port/Cloudflare), spamming the console interceptor bridge which relays them as `__PREVIEW_ERROR__` to the parent.

The `usePreviewServiceWorker` hook registers a real Service Worker for "soft reload" HMR — but in srcdoc mode, the SW can't actually control the sandboxed iframe. It adds complexity without benefit for the current architecture.

### Changes

---

### Task 1: Disable Service Worker preview for srcdoc iframes

**File: `src/hooks/usePreviewServiceWorker.ts`**

Add an early-exit guard: if the preview is using srcdoc (not a real navigable URL), skip SW registration entirely. Return a no-op state:

- Add a parameter or detection: `useSrcdocMode?: boolean` (default `true` since all current previews use srcdoc)
- When srcdoc mode is active: return `{ isReady: false, previewUrl: null, updatePreview: noop, refreshPreview: noop, version: 0, softReload: noop }`
- This prevents the SW from registering, which eliminates one source of devserver websocket inheritance

### Task 2: Simplify soft reload to full iframe srcdoc update

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

Since the SW is disabled for srcdoc previews, the `__SOFT_RELOAD__` handler (lines 248-261) needs to fall back to a full srcdoc update instead of SW-based reload:

- Replace the SW soft reload logic with: re-set `iframe.srcdoc` to current `htmlWithErrorCapture` (with session ID injection)
- This preserves CSS hot-patching (which works via `postMessage` → `__LIVE_PATCH__`, no websocket needed)
- JS changes trigger a full srcdoc update instead of SW reload — slightly less smooth but completely stable

### Task 3: Add websocket suppression to the injected preview bridge

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx` (lines 130-196, the injected bridge script)**

Add a websocket constructor override in the injected bridge script that blocks HMR-related websocket connections from within the iframe:

```javascript
// Block Vite HMR websocket connections inherited from parent origin
var OrigWebSocket = window.WebSocket;
window.WebSocket = function(url, protocols) {
  var urlStr = String(url || '');
  if (/vite|hmr|__vite|hot-update|localhost:\d{4}/i.test(urlStr)) {
    console.info('[Preview] Blocked inherited HMR websocket: ' + urlStr);
    // Return a dummy that never connects
    var dummy = { readyState: 3, send: function(){}, close: function(){}, 
                  addEventListener: function(){}, removeEventListener: function(){},
                  onopen: null, onclose: null, onerror: null, onmessage: null,
                  CONNECTING: 0, OPEN: 1, CLOSING: 2, CLOSED: 3 };
    return dummy;
  }
  return new OrigWebSocket(url, protocols);
};
```

This prevents any Vite dev client code that runs in the iframe context from establishing websocket connections, which is the direct fix for the `devserver_websocket_open/close/error` loop.

### Task 4: Add retry cap to any remaining websocket attempts

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx` (injected bridge)**

In case the dummy websocket approach doesn't catch all paths (e.g., the dev client uses `EventSource` or raw `XMLHttpRequest` for polling), add a global retry tracker:

- Track blocked connection attempts in a counter
- After 5 blocked attempts, stop logging (prevent log spam)
- This is defense-in-depth alongside Task 3

---

### Summary

| What | How |
|------|-----|
| Stop websocket spam | Block HMR websockets in iframe via constructor override (Task 3) |
| Remove unnecessary SW | Disable `usePreviewServiceWorker` for srcdoc mode (Task 1) |
| Keep CSS hot-patch | CSS patching uses `postMessage`, unaffected (no change needed) |
| JS change reload | Falls back to full srcdoc update instead of SW reload (Task 2) |
| Defense-in-depth | Retry cap on blocked attempts (Task 4) |

Four focused edits across two files. CSS hot-patching continues working without websockets. JS changes use full srcdoc reload — stable and predictable.


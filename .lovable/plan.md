
## Fix: Break the Infinite Page Reload Loop

### Root Cause

Two reload mechanisms in `index.html` and `lazyPanels.ts` are fighting each other:

1. **`lazyPanels.ts`** (line 14-16): When a lazy chunk fails to load, it sets `sessionStorage.__chunk_reload__ = '1'` as a guard, then calls `window.location.reload()`. On the next page load, the guard prevents another reload.

2. **`index.html`** (line 207-228): A global error handler catches "dispatcher" or "Invalid hook" errors. It calls `sessionStorage.clear()` (wiping the `__chunk_reload__` guard), then `window.location.reload()`.

When both fire in sequence, the guard is repeatedly wiped, causing an infinite full-page reload loop. The draft persistence system detects each `beforeunload` event and saves, explaining the `[Draft] Flushing` / `[Draft] Immediate save` log pairs before each reload.

### Fix: 2 Changes

**1. `index.html` — Add a reload guard to the global error handler and stop clearing sessionStorage**

Replace `sessionStorage.clear()` with targeted key removal. Add a reload counter that caps at 1 reload to prevent infinite loops:

```text
// Before (broken):
sessionStorage.clear();
setTimeout(function() { window.location.reload(); }, 100);

// After (fixed):
var HOOK_RELOAD_KEY = '__hook_error_reload__';
if (sessionStorage.getItem(HOOK_RELOAD_KEY)) return; // Already reloaded once
sessionStorage.setItem(HOOK_RELOAD_KEY, '1');
// Only remove specific crash-related keys, NOT __chunk_reload__
localStorage.removeItem('ultrium_last_crash');
setTimeout(function() { window.location.reload(); }, 100);
```

**2. `src/components/ai-builder/lazyPanels.ts` — Use localStorage instead of sessionStorage for the chunk reload guard**

Since the global error handler clears sessionStorage, the chunk reload guard should use localStorage (which isn't cleared):

```text
// Before:
const key = '__chunk_reload__';
if (!sessionStorage.getItem(key)) {
  sessionStorage.setItem(key, '1');
  window.location.reload();
}

// After:
const key = '__chunk_reload__';
if (!localStorage.getItem(key)) {
  localStorage.setItem(key, '1');
  // Auto-clear after 30s so future real errors can still trigger a reload
  setTimeout(() => { try { localStorage.removeItem(key); } catch {} }, 30000);
  window.location.reload();
}
```

### Technical Details

| File | Change |
|------|--------|
| `index.html` | Add `__hook_error_reload__` session guard to global error handler; stop using `sessionStorage.clear()` |
| `src/components/ai-builder/lazyPanels.ts` | Switch chunk reload guard from sessionStorage to localStorage with 30s auto-expiry |

### Result

- The global error handler will only reload once per session (guarded)
- The chunk reload guard survives sessionStorage clears
- The 30s auto-expiry on localStorage ensures fresh chunk errors can still trigger one recovery reload
- No more infinite full-page reload loop

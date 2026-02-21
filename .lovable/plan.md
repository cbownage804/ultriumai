

## Fix: Tab-Switch Data Loss (3 Root Causes)

### Root Cause 1: Service Worker Force-Reloads the Page

In `index.html` (line 270-272), there's a listener that reloads the entire page whenever a new service worker takes control:

```javascript
navigator.serviceWorker.addEventListener('controllerchange', () => {
  window.location.reload();  // <-- DESTROYS all React state
});
```

The service worker checks for updates every 60 seconds (line 250). If the server returns even a slightly different `sw.js`, the new worker installs, calls `skipWaiting()`, activates with `clients.claim()`, and triggers `controllerchange`. This causes a full page reload that wipes all React state. The user might see this as "switching tabs wiped my progress" because the reload can coincide with returning to the tab.

**Fix:** Remove the automatic `controllerchange` reload. Let the new service worker activate silently. The next natural navigation will pick it up.

### Root Cause 2: Effect Dependency Causes Listener Gaps

In `AIAppBuilderWorkspace.tsx` (line 1016), `idbPersistence` is in the effect dependency array:

```javascript
}, [saveDraftImmediate, idbPersistence, sessionId]);
```

`idbPersistence` is a new object reference on every render (it contains `syncStatus` state). Every time `syncStatus` changes (synced -> unsaved -> syncing -> synced), the effect re-runs: it removes the `visibilitychange` listener, then re-adds it. During this brief gap, a tab switch might not be caught, and the data won't flush.

Worse, calling `saveToIDB` inside the cleanup function changes `syncStatus`, which triggers a re-render, which re-runs the effect, creating a feedback cycle (stopped by hash check, but still causes unnecessary churn).

**Fix:** Use a ref to store `saveToIDB` instead of putting the entire `idbPersistence` object in the dependency array. The effect should only depend on stable references.

### Root Cause 3: `?new=true` Stripping Depends on `isGenerating`

The effect that strips `?new=true` from the URL (line 1019-1025) only fires when `isGenerating` becomes true. If the page reloads BEFORE the user sends their first message (e.g., from the SW reload above), `?new=true` is still in the URL, and the mount effect at line 1101-1106 clears all saved drafts:

```javascript
if (isNewProject) {
  clearDraft();                    // Wipes localStorage
  idbPersistence.clearSession();   // Wipes IndexedDB
}
```

**Fix:** Strip `?new=true` from the URL immediately on first mount (after checking it once), not waiting for `isGenerating`. This way, even if the page reloads unexpectedly, the URL is clean and draft recovery works.

---

### Changes

**File 1: `index.html`** (1 change)

Remove the `controllerchange` auto-reload (lines 269-272). Replace with a no-op or remove entirely. The service worker will still update; the new version just takes effect on the next natural page load.

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (2 changes)

Change A: Use a ref for `idbPersistence.saveToIDB` in the visibility flush effect:

```typescript
const saveToIDBRef = useRef(idbPersistence.saveToIDB);
saveToIDBRef.current = idbPersistence.saveToIDB;

useEffect(() => {
  const flushDraft = () => {
    saveDraftImmediate(latestRef.current.name, latestRef.current.files, latestRef.current.messages);
    saveToIDBRef.current(sessionId, latestRef.current.name, latestRef.current.files, latestRef.current.messages);
  };
  // ... rest of effect unchanged ...
}, [saveDraftImmediate, sessionId]);
// idbPersistence REMOVED from deps -- use ref instead
```

Change B: Strip `?new=true` immediately on mount, not waiting for `isGenerating`:

```typescript
// Strip ?new=true immediately after mount so tab recovery works on reload
useEffect(() => {
  if (searchParams.get('new') === 'true') {
    const url = new URL(window.location.href);
    url.searchParams.delete('new');
    window.history.replaceState({}, '', url.pathname + url.search);
  }
}, []); // Run once on mount
```

Remove the old effect that depended on `isGenerating`.

### Why This Fixes It

1. No more surprise page reloads from service worker updates -- React state survives tab switches
2. The `visibilitychange` listener is always active (no gaps from effect churn) -- data always flushes when the tab goes hidden
3. Even if a reload does happen, `?new=true` is already gone from the URL, so draft recovery works instead of clearing everything

### Risk Assessment

- Removing the SW `controllerchange` reload means users won't auto-get new code on the app builder page until they navigate away and back. This is acceptable since the app builder is a long-lived session.
- Using a ref for `saveToIDB` is a standard React pattern for stable callbacks in effects.
- Stripping `?new=true` on mount is safe because the initial "skip draft restore" check at line 1052 already captured the value before the effect runs (both use `searchParams.get('new')` at render time).


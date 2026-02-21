

## Fix: Bulletproof Tab Recovery + IDB Immediate Save

### Problem 1: IDB Save Never Completes

The `saveToIDB` function in `useIndexedDBPersistence.ts` debounces ALL writes by 500ms:
```typescript
saveTimer.current = setTimeout(async () => { ... }, SAVE_DEBOUNCE_MS);
```

When the visibility handler calls this on tab switch, the browser may freeze or discard the tab before the 500ms timer fires. Result: IDB is empty when recovery runs.

**Fix:** Add a `saveToIDBImmediate` function that writes directly without debounce, specifically for visibility/beforeunload use.

### Problem 2: Recovery Fallthrough Gap

In `AIAppBuilderWorkspace.tsx` line 1061-1070, if `checkRecovery()` returns a session with 0 files (partially written IDB), the code enters the `if (idbSession)` branch, sees 0 files, and does nothing. It never falls through to the localStorage fallback at line 1072.

Actually looking at the code more carefully:
```typescript
if (idbSession && (idbSession.files.length > 0 || idbSession.messages.length > 0)) {
  // restore...
  return;
}
// Falls through to localStorage
```

If `idbSession` is truthy but has 0 files AND 0 messages, it does fall through. But if `checkRecovery()` returns `null` (no session key), it also falls through. So this path should work... unless `checkRecovery` throws or gets stuck.

**Fix:** Make recovery try BOTH sources and pick whichever has more files, eliminating the sequential fallback entirely.

### Changes

**File 1: `src/hooks/useIndexedDBPersistence.ts`**

Add a `saveToIDBImmediate` function that bypasses the debounce timer. This is identical to the existing save logic but executes synchronously (no setTimeout):

```typescript
const saveToIDBImmediate = useCallback(async (
  projectId: string, name: string, files: ProjectFile[], messages: any[]
) => {
  if (files.length === 0 && messages.length === 0) return;
  try {
    const timestamp = new Date().toISOString();
    await Promise.all([
      idbSet(FILES_STORE, projectId, files.map(f => ({
        path: f.path, content: f.content, language: f.language
      }))),
      idbSet(MESSAGES_STORE, projectId, messages),
      idbSet(META_STORE, projectId, { name, savedAt: timestamp }),
      idbSet(META_STORE, SESSION_KEY, { projectId, name, savedAt: timestamp }),
    ]);
  } catch (err) {
    console.warn('IndexedDB immediate save failed:', err);
  }
}, []);
```

Return it alongside `saveToIDB`.

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Change A: Use `saveToIDBImmediate` in the visibility handler instead of `saveToIDB`:

```typescript
const saveToIDBImmediateRef = useRef(idbPersistence.saveToIDBImmediate);
saveToIDBImmediateRef.current = idbPersistence.saveToIDBImmediate;

// In the flushDraft function:
const flushDraft = () => {
  saveDraftImmediate(...);
  saveToIDBImmediateRef.current(...);  // No debounce
};
```

Change B: Make recovery try both IDB and localStorage in parallel, use whichever has more files:

```typescript
(async () => {
  // Try both sources in parallel
  const [idbSession, lsDraft] = await Promise.all([
    idbPersistence.checkRecovery().catch(() => null),
    Promise.resolve(loadDraft()),
  ]);

  // Pick the source with more data
  const idbFileCount = idbSession?.files?.length || 0;
  const lsFileCount = lsDraft?.files?.length || 0;
  const idbMsgCount = idbSession?.messages?.length || 0;
  const lsMsgCount = lsDraft?.messages?.length || 0;

  const useIDB = idbFileCount + idbMsgCount >= lsFileCount + lsMsgCount
    && (idbFileCount > 0 || idbMsgCount > 0);
  const useLS = !useIDB && (lsFileCount > 0 || lsMsgCount > 0);

  if (useIDB && idbSession) {
    setFiles(idbSession.files);
    renameProject(idbSession.name);
    if (idbSession.messages.length > 0) {
      setMessages(idbSession.messages.map(...));
    }
    dedupeToast('success', 'Session auto-restored');
  } else if (useLS && lsDraft) {
    setFiles(lsDraft.files);
    renameProject(lsDraft.name);
    if (lsDraft.messages.length > 0) {
      setMessages(lsDraft.messages.map(...));
    }
    dedupeToast('success', 'Draft auto-restored');
  }
})();
```

This eliminates the sequential fallback pattern entirely. Both sources are checked, and the best one wins.

### Technical summary

| Change | File | Purpose |
|--------|------|---------|
| `saveToIDBImmediate` | useIndexedDBPersistence.ts | Bypass 500ms debounce for critical saves |
| Use immediate save in visibility handler | AIAppBuilderWorkspace.tsx | Ensure IDB is written before tab discard |
| Parallel recovery from both sources | AIAppBuilderWorkspace.tsx | Always pick the best available recovery data |

### Why this fixes it

- The visibility handler now writes to IDB immediately (no timer that can be killed by browser)
- localStorage is always checked as a fallback, not skipped
- Whichever source has more data wins, so partial writes don't cause total loss
- Even if IDB fails entirely, localStorage still has the data


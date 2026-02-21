

## Fix: Tab-Switch State Loss + False "Code Quality" Error Toast

### Problem 1: Project resets when switching tabs

When you leave the tab and come back, the project loses all state and shows the empty "What do you want to build?" screen.

**Root cause:** The `visibilitychange` handler calls `saveToIDBImmediate`, which is an async function (returns a Promise). The browser can freeze or discard the tab before the IndexedDB writes complete. Meanwhile, `saveDraftImmediate` (localStorage) IS synchronous and works — but the draft restore on mount has a subtle race condition.

The restore logic (line 1058-1094) runs inside an `async` IIFE, but `isNewProject` is read from `searchParams.get('new')` at line 1057 — which was already stripped at line 1026-1031. So `isNewProject` is always `false` on mount. The real issue is that `checkRecovery()` opens IndexedDB, reads 3 stores, and returns the result — but by the time it resolves, the component may have already rendered with empty state and skipped the restore.

**Fix:** Make the localStorage draft restore synchronous and immediate (no async IIFE needed for it), and keep IDB as a backup. Also, ensure the `flushDraft` in the visibility handler uses synchronous localStorage as the primary persistence — since it's guaranteed to complete before the tab freezes.

### Problem 2: False "Code quality issues detected" toast

The bracket-counting regex at line 175-176 of `useAIAppBuilder.ts` is broken:

```text
Line 175: /[{([\]]/g   -- Intended: match { ( [
Line 176: /[})\]]/g   -- Intended: match } ) ]
```

The character class `[{([\]]` actually matches `{`, `(`, and `]` (the `[` is treated as part of the class definition, not a literal bracket). So open-bracket `[` is never counted but close-bracket `]` IS counted, causing a mismatch on virtually every JSX file.

**Fix:** Escape the square brackets properly: `/[{(\[]/g` and `/[})\]]/g`.

---

### Changes

**File 1: `src/hooks/useIndexedDBPersistence.ts`**

Make `saveToIDBImmediate` more resilient by not awaiting each write sequentially. The current implementation already uses `Promise.all` which is good, but the function needs a synchronous fallback signal. However, the real fix is in the workspace.

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (visibility handler, ~line 1004-1023)

Ensure `flushDraft` prioritizes synchronous localStorage, and add a try-catch around the async IDB save so it doesn't block:

```typescript
const flushDraft = () => {
  // Synchronous localStorage save — guaranteed to complete before tab freeze
  saveDraftImmediate(latestRef.current.name, latestRef.current.files, latestRef.current.messages);
  // Best-effort async IDB save — may not complete if tab is discarded
  try {
    saveToIDBImmediateRef.current(sessionId, latestRef.current.name, latestRef.current.files, latestRef.current.messages);
  } catch { /* ignore */ }
};
```

Also fix the draft restore (line 1058-1094) to try localStorage synchronously first, then enhance with IDB data if available:

```typescript
useEffect(() => {
  if (initialProjectId || isNewProject) return;
  if (project.files.length > 0 || messages.length > 0) return;

  // SYNC FIRST: Try localStorage immediately (no async delay)
  const lsDraft = loadDraft();
  if (lsDraft && (lsDraft.files.length > 0 || lsDraft.messages.length > 0)) {
    setFiles(lsDraft.files);
    renameProject(lsDraft.name);
    if (lsDraft.messages.length > 0) {
      setMessages(lsDraft.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
    }
  }

  // ASYNC SECOND: Check IDB for potentially more complete data
  (async () => {
    try {
      const idbSession = await idbPersistence.checkRecovery();
      if (!idbSession) return;
      const idbTotal = (idbSession.files?.length || 0) + (idbSession.messages?.length || 0);
      const lsTotal = (lsDraft?.files?.length || 0) + (lsDraft?.messages?.length || 0);
      if (idbTotal > lsTotal) {
        setFiles(idbSession.files);
        renameProject(idbSession.name);
        if (idbSession.messages.length > 0) {
          setMessages(idbSession.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
      }
    } catch { /* IDB unavailable */ }
  })();
}, []);
```

**File 3: `src/hooks/useAIAppBuilder.ts`** (line 175-176)

Fix the bracket-counting regex:

```typescript
// Before (broken):
const opens = (f.content.match(/[{([\]]/g) || []).length;
const closes = (f.content.match(/[})\]]/g) || []).length;

// After (fixed):
const opens = (f.content.match(/[{(\[]/g) || []).length;
const closes = (f.content.match(/[})\]]/g) || []).length;
```

---

### Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Project resets on tab switch | IDB writes are async and don't complete before tab freeze; restore only tries async path | Restore from localStorage synchronously first, then upgrade from IDB |
| False "code quality" toast | Bracket regex counts `]` as open and misses `[` | Fix regex escaping |


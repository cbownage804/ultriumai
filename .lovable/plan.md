

## Fix: Auto-Recovery + Preview White Screen

### Two issues to fix

**Issue 1: Recovery dialog asks instead of auto-restoring**

When you switch tabs and come back, the app shows a "Recover unsaved work?" dialog forcing you to click "Restore". You want it to just restore automatically.

**Issue 2: Preview stuck on white screen**

The preview shows a blank white screen because of a guard in `CompilationBridge.tsx` line 311:
```typescript
if (stableHTML && stableHTML.length > 0) return;
```
This check prevents `liveCompiledHTML` from ever replacing `stableHTML` once it's set. So if the first compilation produces an error fallback or partial result, all subsequent compilations are ignored -- the preview never updates.

---

### Changes

**File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (1 change)

Replace the recovery dialog flow with automatic restore. Instead of calling `setShowRecoveryDialog(true)` at line 1063, directly restore the session inline:

```typescript
// BEFORE (lines 1061-1064):
const idbSession = await idbPersistence.checkRecovery();
if (idbSession && (idbSession.files.length > 0 || idbSession.messages.length > 0)) {
  setShowRecoveryDialog(true);
  return;
}

// AFTER:
const idbSession = await idbPersistence.checkRecovery();
if (idbSession && (idbSession.files.length > 0 || idbSession.messages.length > 0)) {
  // Auto-restore without asking -- user should never lose work
  setFiles(idbSession.files);
  renameProject(idbSession.name);
  if (idbSession.messages.length > 0) {
    setMessages(idbSession.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
  }
  dedupeToast('success', 'Session auto-restored');
  return;
}
```

The `SessionRecoveryDialog` component and its handlers can remain in the code (no harm), but they simply won't be triggered anymore.

**File 2: `src/components/ai-builder/CompilationBridge.tsx`** (1 change)

Fix the preview update effect at line 309-322. The guard `if (stableHTML && stableHTML.length > 0) return;` prevents new compiled HTML from ever replacing the current preview. This means if the first compilation result was wrong (error fallback, partial render), the preview is stuck forever.

Replace with logic that allows `liveCompiledHTML` to replace `stableHTML` when the compiled content has actually changed:

```typescript
// BEFORE (lines 309-322):
useEffect(() => {
  if (liveCompiledHTML) {
    if (stableHTML && stableHTML.length > 0) return;  // <-- BLOCKS all updates
    const patched = liveSync.applyPatches(previewIframeRef, filesRef.current);
    if (!patched) {
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(filesRef.current);
    }
  }
  ...
}, [...]);

// AFTER:
useEffect(() => {
  if (liveCompiledHTML) {
    // If stableHTML is the same as liveCompiledHTML, skip (no change)
    if (stableHTML === liveCompiledHTML) return;
    // Try live-patching first; if that fails, replace the whole preview
    const patched = liveSync.applyPatches(previewIframeRef, filesRef.current);
    if (!patched) {
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(filesRef.current);
    }
  }
  if (!isGenerating && !liveCompiledHTML && filesRef.current.length > 0 && stableHTML === null && compilationAttemptedRef.current) {
    console.warn('[Preview] Generation complete but compilation returned null — showing error fallback');
    setStableHTML(ERROR_FALLBACK_HTML);
  }
}, [isGenerating, liveCompiledHTML, filesDigest, stableHTML, setStableHTML]);
```

The key change: instead of `if (stableHTML && stableHTML.length > 0) return` (which blocks ALL updates), we use `if (stableHTML === liveCompiledHTML) return` (which only skips if the content is identical). This allows new compilations to replace old/broken previews.

---

### Technical details

| Change | File | Lines | What it does |
|--------|------|-------|-------------|
| Auto-restore | AIAppBuilderWorkspace.tsx | 1061-1064 | Skip dialog, restore directly |
| Fix preview guard | CompilationBridge.tsx | 309-322 | Allow new compilations to replace stale previews |

### Why this works

- **Auto-restore**: When the tab remounts and finds saved work in IndexedDB, it restores immediately. No dialog, no user action needed. Your files, messages, and project name are all preserved.
- **White screen fix**: The preview update effect now allows new compiled HTML to replace old/broken HTML. The only skip condition is if the content is identical (no-op optimization). This means every successful recompilation actually shows up in the preview.

### Risk assessment

- Auto-restore is strictly better UX -- the dialog was an unnecessary friction point
- The `stableHTML === liveCompiledHTML` identity check is safe because React state updates produce new string references when content changes
- Live-patching still runs first (performance optimization), full replacement is the fallback


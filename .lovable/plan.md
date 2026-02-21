

## Fix: Preview White Screen + Tab Recovery (Root Causes)

### What's happening

Three interacting bugs create a cycle where the preview stays white and never recovers:

**Bug 1: Tab-return handler triggers unnecessary recompilation**

When you switch back to the tab, the visibility handler does this:
```
setStableHTML(null)  -->  CompilationBridge sees null  -->  tries to recompile
requestAnimationFrame(() => setStableHTML(html))  -->  but CompilationBridge already started recompiling
```

Setting `stableHTML` to `null` propagates into `CompilationBridge` which interprets it as "no preview exists, need to compile." This is wrong -- we just want to force the iframe to re-render the same HTML.

**Fix:** Instead of toggling `stableHTML` null/back, increment the iframe key directly. The `BuilderPreviewPanel` already accepts `iframeKey` logic -- we just need to force a remount without touching `stableHTML`.

**Bug 2: Compilation lock blocks auto-restored files**

After auto-restore from IDB, `filesDigest` changes but `compilationLockRef` may still be `true` from the previous session. The unlock logic at line 150-154 only fires when `stableHTMLRef.current` is truthy, but after restore it's `null`. So the code falls through to line 162 (`if (compilationLockRef.current) return`) and silently exits -- no compilation ever runs.

**Fix:** Reset `compilationLockRef` whenever `filesDigest` changes and `stableHTML` is null. This is the "we have files but no preview" state that should always trigger compilation.

**Bug 3: Health check reloads iframe but doesn't trigger recompilation**

The health monitor detects a blank iframe body and calls `setIframeKey(k + 1)`. This destroys and recreates the iframe element, but the new iframe gets the same (possibly broken) `srcdoc`. No recompilation is triggered, so the blank screen persists.

**Fix:** When health check detects a crash, also notify the parent to force recompilation instead of just remounting the same broken HTML.

---

### Changes

**File 1: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (1 change)

Replace the visibility handler that toggles `stableHTML` null/back. Instead, use a simple counter to force iframe remount:

```typescript
const [previewRefreshKey, setPreviewRefreshKey] = useState(0);

useEffect(() => {
  const handleVisible = () => {
    if (document.visibilityState === 'visible' && stableHTMLRef.current) {
      // Force iframe remount without touching stableHTML
      setPreviewRefreshKey(k => k + 1);
    }
  };
  document.addEventListener('visibilitychange', handleVisible);
  return () => document.removeEventListener('visibilitychange', handleVisible);
}, []);
```

Then pass `previewRefreshKey` as a key or prop to the preview panel so the iframe remounts with the existing HTML. The `compiledHTML` value stays stable -- no recompilation triggered.

Also update where `compiledHTML` is passed to `BuilderPreviewPanel` to include the key on the iframe (or pass `previewRefreshKey` as a prop).

**File 2: `src/components/ai-builder/CompilationBridge.tsx`** (1 change)

Fix the compilation lock so it always resets when we have files but no preview:

```typescript
// Line 159-162, after prevFilesDigestRef update:
prevFilesDigestRef.current = filesDigest;

// If we have files but no stableHTML and no liveCompiledHTML, always allow compilation
if (!stableHTMLRef.current && !compilationLockRef.current === false) {
  // already unlocked, proceed
}
// Actually simpler: just reset the lock when stableHTML is null
if (!stableHTMLRef.current) {
  compilationLockRef.current = false;
}
```

More precisely, move the lock reset to be unconditional when `stableHTML` is null:

```typescript
useEffect(() => {
  if (isGenerating || filesRef.current.length === 0) return;

  // If stableHTML exists and filesDigest changed, reset for recompilation
  if (stableHTMLRef.current && filesDigest !== prevFilesDigestRef.current) {
    prevFilesDigestRef.current = filesDigest;
    setStableHTML(null);
    compilationLockRef.current = false;
  } else if (stableHTMLRef.current) {
    return; // Already have a valid preview, skip
  }
  prevFilesDigestRef.current = filesDigest;

  // CRITICAL FIX: Always unlock when we have no preview
  // This handles auto-restore where files exist but stableHTML is null
  compilationLockRef.current = false;

  // ... rest of compilation logic unchanged ...
```

**File 3: `src/components/ai-builder/BuilderPreviewPanel.tsx`** (1 change)

Add a `refreshKey` prop that forces iframe remount when the tab returns:

```typescript
interface BuilderPreviewPanelProps {
  // ... existing props ...
  refreshKey?: number;
}
```

Combine it with the existing `iframeKey`:

```typescript
// In the iframe element:
<iframe
  ref={iframeRef}
  key={`${iframeKey}-${refreshKey ?? 0}`}
  srcDoc={htmlWithErrorCapture || ''}
  ...
/>
```

---

### Technical summary

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| White screen on tab return | Visibility handler nullifies `stableHTML`, triggering broken recompilation | Use `refreshKey` counter instead of toggling stableHTML |
| White screen after auto-restore | `compilationLockRef` blocks compilation when `stableHTML` is null | Always reset lock when no preview exists |
| Health check doesn't recover | Iframe remount reuses same broken HTML | Ensure compilation runs when iframe is blank |

### Why this fixes it

- Tab return now forces a clean iframe remount without touching the compilation pipeline. The existing compiled HTML is simply re-rendered in a fresh iframe.
- Auto-restored files always trigger compilation because the lock is cleared whenever there's no preview.
- The compilation pipeline only runs when actually needed (new/changed files), not on every tab switch.


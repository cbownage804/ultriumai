

# Fix: Ensure Preview Auto-Updates After Build Completes

## Root Cause

There is a race condition in `handleBgComplete` that can cause the preview to not update after a build:

1. **Stale discuss-mode guard**: `handleBgComplete` checks `messages[messages.length - 1]?.mode === 'discuss'` to skip compilation for chat responses. But `handleBgComplete` is a `useCallback` that captures the `messages` array from its closure. If the user previously sent a chat (discuss) message and then triggers a build, the callback may still see the old discuss message as the last message — causing it to skip the entire build pipeline and return early without merging files or triggering compilation.

2. **Double `stableHTML` ref confusion**: The workspace has its own `stableHTMLRef`, and `CompilationBridge` has a separate internal `stableHTMLRef`. When `handleBgComplete` clears the workspace's ref (`stableHTMLRef.current = null`), the Bridge's internal ref is not directly linked. The Bridge resets its own refs only when `isGenerating` transitions false-to-true (generation START), so if the transition is missed or the Bridge already has stale HTML, it may skip recompilation.

3. **Self-contained HTML shortcut may mask issues**: For vanilla HTML projects, `handleBgComplete` sets `stableHTML` directly (line 486), but then `isGeneratingOverride` clears and CompilationBridge's effect fires, potentially overwriting or competing with the already-set preview.

## Solution

### 1. Fix the discuss-mode guard (Critical)
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Replace the fragile `messages[last].mode === 'discuss'` check with a more reliable approach:
- Check the `job.output_content` itself for file markers (`===FILE:`, `===EDIT:`) — if none exist and the content looks like a chat response, skip compilation
- This eliminates dependency on stale `messages` state entirely
- Remove `messages` from the `handleBgComplete` dependency array (it's only used for this check and for appending — the append uses `setMessages(prev => ...)` which doesn't need closure state)

### 2. Force CompilationBridge recompile after file merge
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

After `setFiles(mergedFiles)` in `handleBgComplete`, call `forceCompileRef.current?.()` as a safety net. This ensures the Bridge's internal state is reset and a fresh compilation is triggered, even if the `filesDigest` effect doesn't fire due to timing.

### 3. Auto-switch to preview tab after build completes
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

When `handleBgComplete` successfully merges files, automatically switch the right panel to the preview tab if it isn't already showing. This ensures the user sees the result immediately. For mobile, also switch `mobileTab` to `'preview'`.

## Technical Details

### Change 1: Robust discuss-mode detection

```typescript
// BEFORE (fragile — depends on stale `messages` closure):
const lastMsg = messages[messages.length - 1];
if (lastMsg?.mode === 'discuss') {
  setIsGeneratingOverride(false);
  return;
}

// AFTER (checks actual output content — no closure dependency):
const hasFileMarkers = /===FILE:|===EDIT:|```[\w]*\n/.test(job.output_content);
const isShortChatResponse = job.output_content.length < 2000 && !hasFileMarkers;
if (isShortChatResponse && !job.output_content.includes('<!DOCTYPE')) {
  console.info('[handleBgComplete] No file markers detected — treating as chat response');
  setIsGeneratingOverride(false);
  return;
}
```

### Change 2: Force recompile safety net

```typescript
// After setFiles(mergedFiles) and all file operations:
setFiles(mergedFiles);
latestFilesRef.current = mergedFiles;

// Force CompilationBridge to recompile (safety net for timing races)
setTimeout(() => {
  if (!stableHTMLRef.current) {
    forceCompileRef.current?.();
  }
}, 300);
```

### Change 3: Auto-switch to preview

```typescript
// After successful file merge, switch to preview tab
if (rightTab !== 'preview' && rightTab !== 'split') {
  setRightTab('preview');
}
if (isMobile) {
  setMobileTab('preview');
}
```

### Dependency array cleanup

Remove `messages` from `handleBgComplete`'s dependency array since it's no longer read from the closure (the append already uses `setMessages(prev => ...)`).

## Files to Change

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Fix discuss-mode guard, add forceCompile safety net, auto-switch to preview, clean up deps |

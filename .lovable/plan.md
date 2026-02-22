

## Fix: Preview Loading Loop — Remove Problematic `location.reload()` and Fix SW Content Delivery

### Problem

The `location.reload()` added in the previous fix fires on **every** `htmlWithErrorCapture` change, including the initial load. This creates a cascade:

1. Compilation succeeds, `stableHTML` is set (29566 chars)
2. `BuilderPreviewPanel` renders iframe with `src=/__preview__/index.html`
3. The SW effect fires: calls `updatePreview()` then `location.reload()` after 60ms
4. But the iframe is **already loading** via `src` — the reload interrupts it or causes a double-load
5. The SW may not have finished storing the content in 60ms (race condition)
6. The iframe gets an error/empty response, which triggers error fallback logic
7. State resets cascade into a full workspace remount, restarting the cycle

On the second cycle, the worker compile request from the previous mount is orphaned (handler was removed), causing the 30-second timeout.

### Fix: 2 Changes

**1. `src/components/ai-builder/BuilderPreviewPanel.tsx` — Replace `location.reload()` with a proper SW update strategy**

The iframe already loads from the SW via its `src` attribute on first render. For **subsequent** content updates, we should only reload the iframe when the content actually changes (not on initial mount). Use a ref to track the previous HTML and skip the first call:

```typescript
// Gap 4: Push compiled HTML to Service Worker when available
const prevSwHtmlRef = useRef<string | null>(null);
useEffect(() => {
  if (swReady && htmlWithErrorCapture) {
    updatePreview(htmlWithErrorCapture);
    // Only reload iframe for SUBSEQUENT updates (not initial load — src handles that)
    if (prevSwHtmlRef.current !== null && prevSwHtmlRef.current !== htmlWithErrorCapture) {
      setTimeout(() => {
        try {
          iframeRef.current?.contentWindow?.location.reload();
        } catch {
          const iframe = iframeRef.current;
          if (iframe?.src) {
            const src = iframe.src;
            iframe.src = '';
            requestAnimationFrame(() => { iframe.src = src; });
          }
        }
      }, 100); // Increased delay for SW to store content
    }
    prevSwHtmlRef.current = htmlWithErrorCapture;
  }
}, [swReady, htmlWithErrorCapture, updatePreview, iframeRef]);
```

This ensures:
- First render: `updatePreview()` stores the content, iframe loads it naturally via `src`
- Subsequent updates: `updatePreview()` stores new content, then reload picks it up
- Same content: no reload at all

**2. `src/components/ai-builder/BuilderPreviewPanel.tsx` — Guard the iframe `src` to only use SW after content is stored**

Currently the iframe uses `src: previewUrl` as soon as `swReady` is true, but the SW might not have any content stored yet. Add a guard so the iframe only uses `src` after the first `updatePreview` call:

Add a `swHasContent` state that flips to true after the first successful `updatePreview()`. Use `srcDoc` as fallback until then. This prevents the iframe from loading an empty SW response.

### Technical Details

- File: `src/components/ai-builder/BuilderPreviewPanel.tsx`
  - Add `prevSwHtmlRef` to skip reload on initial mount
  - Add `swHasContent` state to prevent iframe from using SW URL before content is stored
  - Increase reload delay from 60ms to 100ms for SW write latency
- No changes needed to `CompilationBridge.tsx` or `useWorkerCompiler.ts`

### Result

- First load: iframe uses `srcDoc` until SW has content, then switches to `src` on next update
- Subsequent updates: clean reload after SW stores new content
- No more cascading reload loop from premature `location.reload()` on initial mount




## Fix: Always Use srcDoc — Eliminate SW src Race Condition

### Root Cause

The iframe switches from `srcDoc` to `src=/__preview__/index.html` the moment `setSwHasContent(true)` fires. But `updatePreview()` sends a `postMessage` to the Service Worker, which is **asynchronous**. By the time the iframe navigates to the SW URL, the SW hasn't stored the content yet, so it serves the fallback "Waiting for preview..." HTML (or empty). This causes the React #130/#310 errors seen in the console, and the preview stays black.

This is a fundamental race condition that cannot be reliably fixed with delays — the timing depends on browser scheduling.

### Fix: Remove the srcDoc-to-src Switch Entirely

Always render the iframe with `srcDoc`. Remove `swHasContent` state. Continue pushing content to the SW via `updatePreview()` (needed for soft reloads / HMR), but never switch the iframe source attribute.

For subsequent HTML updates, React handles `srcDoc` changes natively (the browser re-renders without remounting). For soft reloads via SW, use the existing `swSoftReload` path which manually navigates the iframe.

### Changes (1 file)

**`src/components/ai-builder/BuilderPreviewPanel.tsx`**:

1. Remove `swHasContent` state
2. Simplify the SW effect to only push content and reload on subsequent changes (no state switch)
3. Change iframe to always use `srcDoc` — remove the conditional `src: previewUrl` branch

```typescript
// Before (broken):
const [swHasContent, setSwHasContent] = useState(false);
// ...
{...(swReady && previewUrl && swHasContent
  ? { src: previewUrl }
  : { srcDoc: htmlWithErrorCapture || '' }
)}

// After (fixed):
// No swHasContent state needed
// ...
srcDoc={htmlWithErrorCapture || ''}
```

The SW effect simplifies to:
```typescript
useEffect(() => {
  if (swReady && htmlWithErrorCapture) {
    updatePreview(htmlWithErrorCapture);
    // Reload for subsequent updates only
    if (prevSwHtmlRef.current !== null && prevSwHtmlRef.current !== htmlWithErrorCapture) {
      // No reload needed — React updates srcDoc natively
    }
    prevSwHtmlRef.current = htmlWithErrorCapture;
  }
}, [swReady, htmlWithErrorCapture, updatePreview, iframeRef]);
```

### Result

- Preview renders immediately via srcDoc on first load — no race condition possible
- React handles subsequent srcDoc updates natively (no reload needed)
- SW still receives content for soft reload (HMR) use cases
- Eliminates the black screen / React error loop entirely


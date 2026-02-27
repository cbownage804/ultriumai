

## Plan: Non-Fatal Image Gen + Debug Logging (3 files, no shell changes)

### Edit 1 — image-generation/index.ts: Always 200 + fallback

**A.** Add `FALLBACK_PNG` constant after `corsHeaders` (line 8).

**B.** Replace "no image" branch (lines 66-76): return `{ success: false, image: FALLBACK_PNG, isFallback: true }` with status 200.

**C.** Replace 429/402 error branches (lines 46-57): keep status codes but add `image: FALLBACK_PNG, isFallback: true`.

**D.** Replace catch block (lines 87-93): return 200 with fallback PNG instead of 500.

### Edit 2 — CompilationBridge.tsx: Debug logs

**A.** After line 318 (`setStableHTMLLocal(VALIDATING_FALLBACK_HTML)`), add:
```typescript
console.info('[CompilationBridge] Showing validation fallback (render-only)', {
  htmlLength: VALIDATING_FALLBACK_HTML.length,
  stableHTMLRef: stableHTMLRef.current ? 'truthy' : 'null',
});
```

**B.** After line 395 (`setStableHTML(result)`), add:
```typescript
console.info('[CompilationBridge] Compile success', {
  runId: thisRunId,
  htmlLength: result?.length ?? 0,
  first80: result?.slice(0, 80) ?? '',
  hasDoctype: (result?.includes('<!') ?? false),
});
```

### Edit 3 — BuilderPreviewPanel.tsx: Debug log before srcdoc

At line 514 (before `iframeRef.current.srcdoc = injectSessionId(html, sid)`), add:
```typescript
console.info('[PreviewPanel] Setting srcdoc', {
  htmlLength: html?.length ?? 0,
  hasDoctype: !!html && (html.includes('<!doctype') || html.includes('<!DOCTYPE')),
  hasSessionMeta: !!html && html.includes('preview-session'),
  sessionId: sid,
});
```

### Edit 4 — Deploy edge function

Deploy `image-generation` after Edit 1.

### Files NOT touched
`App.tsx`, `main.tsx`, `index.html`, routing, layouts, non-builder pages.


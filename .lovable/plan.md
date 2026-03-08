

## The Problem

The preview panel uses **Sandpack** (CodeSandbox's in-browser bundler) to render previews — not your Vite server. Here's what happens:

1. Your Vite server compiles the project and returns HTML (works correctly)
2. CompilationBridge receives the HTML and sets `stableHTML` / `compileState = 'success'`
3. The workspace passes the Vite HTML as `html` prop and the raw files as `previewFiles` to `BuilderPreviewPanel`
4. **BuilderPreviewPanel ignores the `html` prop entirely** and renders via `SandpackProvider` + `SandpackPreview` instead (line 792-826)

Sandpack is a separate in-browser bundler from CodeSandbox. It re-compiles everything client-side, which is slower, less reliable, and completely bypasses your Vite server.

## The Fix

Replace the Sandpack rendering path with a direct **srcdoc iframe** that uses the Vite-compiled HTML. The `html` prop (from CompilationBridge/Vite) becomes the single source of truth for the preview.

### Changes to `src/components/ai-builder/BuilderPreviewPanel.tsx`

1. **Remove `SandpackProvider`/`SandpackPreview`/`SandpackConsole` imports and usage** — the entire block at lines 800-826 gets replaced with an iframe using `srcdoc={htmlWithErrorCapture}`.

2. **Simplify rendering logic** (line 792):
   - If `htmlWithErrorCapture` exists (valid Vite output) → render the srcdoc iframe
   - If generating/compiling → show `SkeletonPreview`
   - Otherwise → show the "Live Preview" placeholder

3. **Keep all existing iframe infrastructure** — the error capture injection, session IDs, hot-patching, navigation interception, health checks — all of that already exists in the component and works with srcdoc iframes. It's just not being reached because Sandpack takes priority.

4. **Remove `previewFiles` and `previewDependencies` props** from the component interface since they're no longer needed.

### Changes to `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

1. **Remove `buildSandpackFileMap`**, `extractDependencies`, `previewFiles` state, `lastKnownGoodPreviewFilesRef`, and the `previewFilesForRender` computation — all Sandpack-specific infrastructure.

2. **Remove `previewFiles` and `previewDependencies` from all `BuilderPreviewPanel` call sites** (mobile, split, preview-only layouts).

3. **Keep the `isGoldenProject` check** for showing the placeholder vs the compiled preview.

### Resulting rendering flow

```text
User prompt → AI generates files → CompilationBridge sends to Vite server
→ Vite returns compiled HTML → stableHTML set → compileState = 'success'
→ BuilderPreviewPanel receives html prop → renders in srcdoc iframe
```

No Sandpack. No client-side re-bundling. One path: Vite server output → iframe.


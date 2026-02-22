

## Fix: Preview Blank Because Broken index.html Set as "Self-Contained"

### Root Cause

When the AI generates a React project, it creates files like `index.html`, `src/main.tsx`, `src/App.tsx`, and `src/index.css`. The generated `index.html` contains:

```html
<script type="module" src="/src/main.tsx"></script>
```

This is a **local file reference** that cannot resolve inside an `srcdoc` iframe (there is no local file server).

However, `handleBgComplete` in `AIAppBuilderWorkspace.tsx` (line 313) checks:
```typescript
if (indexFile.content.includes('<!DOCTYPE html') && indexFile.content.includes('</html>'))
```

This incorrectly treats the file as "self-contained" and sets it as the preview HTML. The result: a blank black iframe. Worse, once `stableHTML` is set to this broken value, CompilationBridge thinks compilation already succeeded and never runs the worker compiler (which would correctly bundle all files into a single self-contained HTML document).

### The Fix (2 changes)

#### 1. Fix the self-contained detection in `handleBgComplete`

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (line 313)

Add a check to reject HTML that references local module scripts. A truly self-contained HTML does NOT have `<script ... src="/src/...">` or `<script type="module" src="./...">` pointing to local project files.

```typescript
// Before:
if (indexFile && indexFile.content.includes('<!DOCTYPE html') && indexFile.content.includes('</html>'))

// After:
const hasLocalModuleScripts = /src=["']\.?\/(?:src|main|app|index)\b/i.test(indexFile?.content || '');
if (indexFile && !hasLocalModuleScripts && indexFile.content.includes('<!DOCTYPE html') && indexFile.content.includes('</html>'))
```

This ensures only genuinely self-contained HTML (like a static page with inline scripts or CDN-only scripts) bypasses the compiler. React projects with file-based imports will correctly fall through to the worker compiler.

#### 2. Remove the vanilla fallback in `handleBgComplete`

The `getCompiledHTML` vanilla compiler (lines 318-332) cannot handle React/TSX projects, so it always returns `null` for them. This is harmless but adds noise. More importantly, when both the self-contained check and vanilla compile fail, `handleBgComplete` should NOT set `stableHTML` at all -- letting CompilationBridge handle it via the worker.

**No code change needed here** -- the fix in step 1 is sufficient. When the self-contained check correctly rejects the file, and vanilla compile returns null, `stableHTMLRef.current` stays null, and CompilationBridge's generation-ending effect will trigger `compileNowRef` which calls the worker compiler.

### Why This Fixes Everything

1. AI generates React project with `index.html` + `main.tsx` + `App.tsx` + `index.css`
2. `handleBgComplete` detects local script references in `index.html` -- skips "self-contained" shortcut
3. Vanilla `getCompiledHTML` returns `null` (can't handle JSX)
4. `stableHTMLRef.current` remains `null`
5. `isGeneratingOverride` is set to `false`
6. CompilationBridge's generation-ending effect fires, sees no preview
7. `compileNowRef` runs the worker compiler after 200ms
8. Worker produces correct self-contained HTML with CDN React, Babel, bundled modules
9. `setStableHTML(result)` updates React state
10. `BuilderPreviewPanel` receives valid HTML and renders the preview

### What About the Auto-Fix Loop?

The "React refresh preamble" auto-fix is already filtered in `handleAutoFixError` (line 1661). The auto-fix in the screenshots was from a previous session before the filter was added. With this fix, the preview will render correctly on the first attempt, so no errors will trigger auto-fix.


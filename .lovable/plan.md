

## Diagnosis: Blank White Preview After Generation

The screenshot shows a completed generation (landing page with hero, features, testimonials, footer) where all files were created/modified successfully, but the Sandpack preview renders blank white.

### Root Cause

The AI-generated code imports npm packages (`lucide-react`, `clsx`, `tailwind-merge`) and uses Tailwind CSS directives (`@tailwind base/components/utilities`). However:

1. **Missing Sandpack dependencies**: `BuilderPreviewPanel` hardcodes only `react` and `react-dom` in `customSetup.dependencies`. Sandpack cannot resolve `lucide-react` or any other package the AI adds, so the bundle fails silently and the iframe stays white.

2. **Tailwind CSS not supported**: Sandpack does not process `@tailwind` directives. The generated `index.css` contains `@tailwind base; @tailwind components; @tailwind utilities;` which produces no CSS output, making the page appear broken or unstyled.

### Plan

**1. Extract dependencies from project `package.json` and pass to Sandpack**

In `buildSandpackFileMap` (or a sibling function), parse the project's `package.json` file to extract its `dependencies` object. Pass these to `SandpackProvider.customSetup.dependencies` so Sandpack can resolve all imports the AI adds.

```typescript
// New helper in AIAppBuilderWorkspace.tsx
function extractDependencies(files: ProjectFile[]): Record<string, string> {
  const pkgFile = files.find(f => f.path === 'package.json');
  if (!pkgFile) return { react: "^18.3.1", "react-dom": "^18.3.1" };
  try {
    const pkg = JSON.parse(pkgFile.content);
    return { react: "^18.3.1", "react-dom": "^18.3.1", ...pkg.dependencies };
  } catch { return { react: "^18.3.1", "react-dom": "^18.3.1" }; }
}
```

Update `BuilderPreviewPanel` to accept a `dependencies` prop and use it in `customSetup`.

**2. Strip Tailwind directives from CSS for Sandpack**

Sandpack's bundler does not run PostCSS/Tailwind. The `@tailwind` directives produce nothing and may cause errors. Add a transform in `buildSandpackFileMap` that strips `@tailwind` lines from CSS files and replaces them with a minimal CSS reset. This ensures generated Tailwind utility classes won't work (they need the full Tailwind runtime), but at least the page renders without crashing.

Alternatively, since Sandpack has a `@tailwindcss/cdn` approach — we can inject a `<script src="https://cdn.tailwindcss.com">` tag into the index.html provided to Sandpack, which enables Tailwind JIT in-browser.

**Recommended approach**: Inject the Tailwind CDN script into the Sandpack index.html. This gives full Tailwind support with zero config.

```typescript
// In buildSandpackFileMap, always include an index.html with Tailwind CDN
result['/public/index.html'] = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8" />
  <script src="https://cdn.tailwindcss.com"></script>
</head><body><div id="root"></div></body></html>`;
```

And strip `@tailwind` directives from CSS (the CDN script handles this automatically via class scanning).

---

### Files to edit

- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`**: Add `extractDependencies()` helper; pass dependencies alongside `previewFilesForRender`; inject Tailwind CDN into Sandpack's index.html within `buildSandpackFileMap`.
- **`src/components/ai-builder/BuilderPreviewPanel.tsx`**: Accept `dependencies` prop; use it in `SandpackProvider.customSetup.dependencies` instead of hardcoded react-only deps.


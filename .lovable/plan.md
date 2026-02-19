

# Fix "Resource Load Error" and Auto-Fix Loop Pollution

## Root Cause

The `getCompiledHTML()` function in `useProjectFileSystem.ts` correctly **inlines** CSS and JS file contents into the HTML document (lines 276-298). However, it does **not strip** the original `<script src="main.js">` and `<link href="style.css">` tags from the AI-generated `index.html`.

So the compiled output contains **both**:
1. `<script src="main.js"></script>` -- tries to fetch over HTTP, fails with "Resource Load Error"
2. `<script>/* main.js */ ... actual code ...</script>` -- the correctly inlined version

The browser hits the first tag, fails to load it, and the error console picks it up. Then the auto-fix loop sees the error and injects an `[AUTO-FIX ATTEMPT 1/3]` prompt into the chat, wasting a credit trying to "fix" something that isn't actually broken -- the inlined code works fine.

## Plan

### 1. Strip local file references from HTML before inlining (`useProjectFileSystem.ts`)

After loading the main HTML content but **before** injecting inlined CSS/JS, strip any `<script src="...">` and `<link href="...css">` tags that reference local VFS files (not external CDN URLs).

```
// Strip <script src="main.js"> tags that match local VFS files
// Strip <link href="style.css"> tags that match local VFS files
// Keep external URLs (http://, https://, //) untouched
```

This ensures the browser only sees the inlined versions and never tries to fetch local files over HTTP.

### 2. Suppress auto-fix for "Failed to load" resource errors (`AIAppBuilderWorkspace.tsx`)

As a safety net, skip the auto-fix loop for "Failed to load" errors that reference the app's own domain. These are always caused by the compilation pipeline, not by broken user code.

## Files to Change

| File | Change |
|------|--------|
| `src/hooks/useProjectFileSystem.ts` | Add regex to strip `<script src="localfile.js">` and `<link href="localfile.css">` tags matching VFS files before inlining |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Skip auto-fix for "Failed to load" resource errors |

## Technical Details

### Stripping logic (useProjectFileSystem.ts)

Insert after line 198 (`let compiled = mainHTML.content;`), before head injections:

```typescript
// Strip local <script src> and <link href=css> tags that will be inlined
const localPaths = new Set(files.map(f => f.path));
// Remove <script src="main.js"></script> where main.js is a VFS file
compiled = compiled.replace(
  /<script\s+[^>]*src=['"]([^'"]+)['"]\s*><\/script>/gi,
  (match, src) => {
    if (src.startsWith('http') || src.startsWith('//')) return match; // keep CDN
    const normalized = src.startsWith('./') ? src.slice(2) : src;
    return localPaths.has(normalized) ? `<!-- inlined: ${normalized} -->` : match;
  }
);
// Remove <link href="style.css" rel="stylesheet"> where style.css is a VFS file
compiled = compiled.replace(
  /<link\s+[^>]*href=['"]([^'"]+\.css)['"][^>]*>/gi,
  (match, href) => {
    if (href.startsWith('http') || href.startsWith('//')) return match;
    const normalized = href.startsWith('./') ? href.slice(2) : href;
    return localPaths.has(normalized) ? `<!-- inlined: ${normalized} -->` : match;
  }
);
```

### Auto-fix filter (AIAppBuilderWorkspace.tsx)

In the error handler that calls `autoFixLoop.attemptFix`, add a guard:

```typescript
// Skip auto-fix for resource load errors (handled by compilation pipeline)
if (error.message?.includes('Failed to load')) return;
```


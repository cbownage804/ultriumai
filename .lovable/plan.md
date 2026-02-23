

## Fix: Preview Not Updating on 2nd+ Builds

### Root Cause

In `handleBgComplete` (line 317), the self-contained HTML check searches `mergedFiles` (ALL project files) instead of `parsedFiles` (only NEWLY changed files):

```text
const indexFile = mergedFiles.find(f => f.path === 'index.html');
```

On the 2nd build, the AI typically only updates a component file (e.g., `App.tsx`) -- not `index.html`. But the OLD `index.html` from the first build is still in `mergedFiles`. If that old `index.html` passes the self-contained check (no local module script references), it:

1. Sets `stableHTMLRef.current` to the OLD `index.html` content (line 323)
2. Short-circuits the worker compilation at line 330 (`!stableHTMLRef.current` is now false)
3. The preview shows the OLD content, ignoring the updated component files entirely

### Fix (single file change)

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~line 317)**

Change the self-contained HTML check to only look at NEWLY generated files, and skip it entirely if there are React component files (which require worker compilation):

```text
Before:
  const indexFile = mergedFiles.find(f => f.path === 'index.html');
  const hasLocalModuleScripts = ...
  if (indexFile && !hasLocalModuleScripts && ...) {

After:
  const hasReactFiles = mergedFiles.some(f => /\.(tsx|jsx)$/.test(f.path));
  const newIndexFile = parsedFiles.find(f => f.path === 'index.html');
  const hasLocalModuleScripts = ...
  if (newIndexFile && !hasReactFiles && !hasLocalModuleScripts && ...) {
```

Key changes:
- Move `hasReactFiles` detection BEFORE the self-contained check (currently it's after, at line 329)
- Only check `parsedFiles` (newly generated files) for index.html, not `mergedFiles`
- Skip the self-contained shortcut entirely when React files (.tsx/.jsx) exist in the project -- these always need worker compilation
- Remove the duplicate `hasReactFiles` declaration at line 329 (now declared earlier)

### Why This Works

- **1st build (vanilla HTML):** AI generates index.html, it's in `parsedFiles`, no .tsx files exist -- shortcut fires correctly
- **1st build (React):** AI generates index.html + App.tsx -- `hasReactFiles` is true, shortcut is skipped, worker compiles
- **2nd build (React, component-only change):** AI updates App.tsx only -- `newIndexFile` is null (index.html wasn't changed), shortcut is skipped, worker compiles the full project with updated component -- preview updates correctly

### Summary

| Line | Change |
|------|--------|
| ~317 | Move `hasReactFiles` check before self-contained HTML check |
| ~317 | Search `parsedFiles` instead of `mergedFiles` for index.html |
| ~319 | Add `!hasReactFiles` guard to skip shortcut for React projects |
| ~329 | Remove duplicate `hasReactFiles` (already declared above) |



## Fix: Preview Placeholder Flashing After Build Completes

### Problem
After a build finishes generating code, the preview panel briefly flashes the "Live Preview / Describe what you want to build" placeholder instead of keeping the loading skeleton visible until the compiled HTML is ready.

This happens because of a timing gap in the rendering logic:

```text
Generation ends --> isGenerating = false
                    stableHTML = null (cleared at build start)
                    isCompiling = not yet true (CompilationBridge hasn't started)
                    
Result: falls through to empty placeholder instead of skeleton
```

The condition in `BuilderPreviewPanel.tsx` (line 608-651) is:
- `html` exists --> show iframe
- `isGenerating || isCompiling` --> show SkeletonPreview
- else --> show "Live Preview" placeholder

During the gap between generation ending and compilation starting, none of the first two conditions are true, so the placeholder appears.

### Solution

Two changes to eliminate the flash:

**1. `BuilderPreviewPanel.tsx` - Add `hasFiles` awareness to prevent placeholder when files exist**

Pass a new `hasProjectFiles` prop (derived from `projectFiles.length > 0`). When files exist but `html` is null and we're not generating/compiling, show the SkeletonPreview (in compiling mode) instead of the empty placeholder. The placeholder should only appear when there are truly no files (fresh project).

Updated condition:
```
html ? <iframe>
  : (isGenerating || isCompiling || (hasProjectFiles && !html)) ? <SkeletonPreview>
  : <placeholder>
```

This way, if files exist but HTML hasn't been compiled yet, the skeleton stays visible with "Compiling preview..." text.

**2. `AIAppBuilderWorkspace.tsx` - Keep previous HTML visible during recompilation**

Instead of clearing `stableHTML` to `null` at the start of `handleBgComplete`, preserve the old compiled HTML so the previous preview stays visible while the new build compiles. Only clear it if this is the very first build (no previous HTML exists). The CompilationBridge already handles replacing it with new content when compilation finishes.

### Technical Details

**File 1: `src/components/ai-builder/BuilderPreviewPanel.tsx`**
- Line 607-651: Change the ternary so that when `projectFiles?.length > 0` and `html` is null, it shows `SkeletonPreview` with `isCompiling={true}` instead of the empty placeholder
- This is a one-line condition change

**File 2: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**
- Lines 319-321: Only clear `stableHTML` to null if there's no existing compiled HTML. If the user is rebuilding, keep the old preview visible during compilation rather than showing a blank state
- Change from unconditional `setStableHTML(null)` to conditional: only clear if no previous HTML exists



## Add Compilation Progress Indicator to Preview Panel

### Problem
When code generation finishes but compilation hasn't produced HTML yet, the preview shows the empty "Live Preview" placeholder (the decorative splash screen with floating particles). This makes it look like nothing is happening, when actually the compiler is actively working. The `GeneratingOverlay` shows a small "Compiling preview..." badge in the corner, but the main preview area gives no feedback.

### Solution
Add a dedicated "Compiling" state to the preview panel that shows between the generation skeleton and the final rendered preview. This fills the gap in the state machine:

```text
State Machine (Before):
  isGenerating=true, html=null  --> SkeletonPreview
  isGenerating=false, html=null --> Empty placeholder (BAD - looks broken)
  isGenerating=false, html=set  --> Rendered iframe

State Machine (After):
  isGenerating=true, html=null        --> SkeletonPreview
  isCompiling=true, html=null         --> CompilationProgress (NEW)
  isGenerating=false, html=null       --> Empty placeholder (only before first gen)
  isGenerating=false, html=set        --> Rendered iframe
```

### Changes

#### 1. New Component: `src/components/ai-builder/CompilationProgress.tsx`
A lightweight, CSS-only animated compilation progress screen showing:
- A pulsing "Compiling preview..." label with a spinner
- An indeterminate progress bar (CSS shimmer animation, no JS overhead)
- The file count being compiled (passed as prop)
- Subtle phase text ("Transpiling files...", "Building bundle...", "Rendering preview...")
- Uses the same dark theme as SkeletonPreview for visual continuity

#### 2. Update: `src/components/ai-builder/BuilderPreviewPanel.tsx`
- Import the new `CompilationProgress` component
- Add a new condition in the preview area (lines 448-567): when `!html && !isGenerating && isCompiling`, render `CompilationProgress` instead of the empty placeholder
- Pass `projectFiles?.length` as file count for display

The rendering priority becomes:
1. `html` exists --> render iframe (existing)
2. `isGenerating` --> render SkeletonPreview (existing)
3. `isCompiling` --> render CompilationProgress (NEW)
4. else --> render empty placeholder (existing)

### Technical Details
- The new component uses pure CSS animations (`@keyframes`) to avoid any JS animation overhead during the compilation phase when the main thread is already busy
- No polling, no refs, no intervals -- just static props and CSS
- Estimated phase labels are cosmetic only (cycle through on a CSS animation timer), not tied to actual compiler internals
- The component is intentionally simple (~60 lines) to minimize bundle impact

### Files
1. `src/components/ai-builder/CompilationProgress.tsx` -- new component
2. `src/components/ai-builder/BuilderPreviewPanel.tsx` -- add compilation state to preview area conditional


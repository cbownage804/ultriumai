

# Fix: Error #310 Crash After Generation + Chat Content Leaking

## Problem Summary

There are actually **two separate bugs**, not a streaming timeout:

1. **The stream works fine** -- edge function logs confirm generation completes successfully in ~27-31 seconds with zero errors and zero keepalive gaps. The "stuck at 30s" perception is because the app crashes immediately after generation finishes.

2. **React Error #310** ("Rendered fewer hooks than expected") crashes the entire App Builder when generation completes. The "App Builder failed to load" error screen you see is this crash caught by PanelErrorBoundary.

3. **AI planning text leaks into chat** -- text like "Design Specs:", "Working on tasks...", "Typography", "Palette", "Components" appears in the chat instead of being hidden.

## Root Cause Analysis

### Error #310

The `liveCompiledHTML` useMemo (line 1723 of AIAppBuilderWorkspace.tsx) calls `compileReactProject()` synchronously when `isGenerating` transitions to `false` and `project.files` updates with newly generated files. If the React compiler throws an exception on the new (possibly partial or malformed) files, the exception propagates up through React's render cycle. When an exception occurs mid-render in a component with 60+ hooks, React detects that fewer hooks ran than expected and throws Error #310.

The compilation error is the trigger; Error #310 is the symptom.

### Chat Content Leaking

The `getDisplayContent` function in BuilderChatPanel.tsx strips file blocks and common AI meta-sections, but doesn't strip "Design Specs:" headings or task-list-style content ("Typography", "Palette", "Components"). These are part of the AI's thinking/planning output that should be hidden from the user.

## Fix Plan (3 changes, 2 files)

### Change 1: Wrap `liveCompiledHTML` useMemo in try/catch

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`, line ~1723

Wrap the entire body of the `liveCompiledHTML` useMemo in a try/catch so compilation errors return `null` instead of throwing through React's render cycle. This prevents Error #310 entirely.

```typescript
const liveCompiledHTML = useMemo(() => {
  try {
    if (isGenerating) return null;
    if (project.files.length === 0) return null;
    if (stableHTMLRef.current) return null;
    if (isReactProject) {
      const result = compileReactProject(project.files, { ... });
      if (result.errors.length > 0) console.warn(...);
      return result.html || null;
    }
    return getCompiledHTML(...);
  } catch (e) {
    console.error('[ReactCompiler] Compilation crashed:', e);
    return null; // Graceful fallback -- preview will show error page
  }
}, [...]);
```

### Change 2: Strip "Design Specs:" and task-list content from chat display

**File**: `src/components/ai-builder/BuilderChatPanel.tsx`, in the `getDisplayContent` function

Add patterns to strip:
- "Design Specs:" headings and content that follows
- "Working on tasks..." progress lines
- Bare single-word task items like "Typography", "Palette", "Components"
- "Writing X files..." progress markers

```typescript
// After existing strip patterns, add:
.replace(/(?:\*{0,2})?Design Specs?:?\*{0,2}[\s\S]*?(?=\n===FILE|\n#{1,4}\s|$)/gi, '')
.replace(/^Working on tasks\.{0,3}\s*$/gm, '')
.replace(/^Writing \d+ files?\.{0,3}\s*$/gm, '')
```

### Change 3: Also wrap timer-based compilation in try/catch

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`, line ~1680

The timer-based compile during streaming (inside `setInterval`) should also be wrapped to prevent partial-file compilation from crashing.

This is already partially wrapped but the React compiler call itself should be in a try/catch that catches all errors, not just the outer try/catch.

## Why This Fixes Both Issues

- **Error #310**: The useMemo no longer throws, so all 60+ hooks execute on every render. React never sees a hook count mismatch.
- **Chat leaking**: The AI's planning text ("Design Specs:", task lists) is stripped before display, so only the meaningful conversational response shows.
- **No streaming changes needed**: The stream is working correctly. Previous keepalive and timeout fixes remain in place as defense-in-depth.

## Technical Risk

Low. The try/catch in useMemo is a standard React pattern for error-prone computations. The fallback path (returning null) already exists and triggers the "Compilation Error" fallback page in the preview, which is a much better UX than crashing the entire App Builder.


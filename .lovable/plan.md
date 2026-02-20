

# Fix: Browser Freeze During Generation + Chat Content Leaking

## Problem

Two issues visible in the screenshots:

1. **Firefox shows "This page is slowing down Firefox"** -- the browser CPU is saturated during generation, causing the entire page to become unresponsive around 29 seconds.

2. **Chat shows leaked content** -- "Working on tasks...", "Primary", "Background", "Accent", "Typography", "Design Tokens:", "Writing 1 file..." all appear in the chat when they should be hidden.

## Root Cause

### Browser Freeze

The `BuilderChatPanel` polls `streamingContentRef` every **300ms** and sets `localStreamContent` state. This triggers `displayMessages` to recalculate, which calls `getDisplayContent()` on the streaming message. That function:

1. Splits the **entire streaming content** (50-100KB of source code) into lines
2. Runs line-by-line pattern matching with 8 regex patterns per line
3. Then applies **25+ regex replacements** on the result, many using `[\s\S]*` which causes catastrophic backtracking on large strings
4. Then `extractPlanSteps` runs 3 more regex scans with `matchAll`
5. Then `renderAssistantMessage` processes the result through ReactMarkdown

This happens **every 300ms** for the duration of generation. At 30 seconds, the content is large enough to saturate the CPU.

### Chat Content Leaking

The `insideFile` detector in `getDisplayContent` uses heuristic "conversational patterns" to decide when a line exits a file block. Lines like blank lines inside code are skipped, and items like "Design Tokens:" or "Primary" don't match any conversational pattern, so they remain in the "inside file" state. But blank lines (`continue`) cause them to accumulate silently. The stripping regexes at lines 228-236 only catch some patterns.

## Fix (2 changes, 1 file)

### Change 1: Skip expensive content processing during streaming

During active streaming, the chat panel should show a **minimal static UI** (the task breakdown card + file progress) instead of running `getDisplayContent` on the full streaming content. The streaming content is only needed for extracting file names (for the progress card), not for displaying prose.

**File**: `src/components/ai-builder/BuilderChatPanel.tsx`

In `renderAssistantMessage`, when `isStreaming` is true, skip `getDisplayContent` entirely and instead:
- Extract file names cheaply with a single `matchAll` on the `===FILE:` pattern
- Show only the task breakdown card and file progress
- Do NOT process or display the prose text during streaming

This eliminates the 300ms CPU spike completely.

### Change 2: Reduce streaming content polling to 800ms and add size guard

**File**: `src/components/ai-builder/BuilderChatPanel.tsx`

Change the `streamingContentRef` polling interval from 300ms to 800ms, and skip setting state if content exceeds 20KB (the chat display doesn't need to process megabytes of code).

```typescript
// Lines 343-347: Change interval and add size guard
const interval = setInterval(() => {
  const current = streamingContentRef.current;
  // Skip updates for very large content -- only file names matter during streaming
  if (current.length > 20_000) return;
  setLocalStreamContent(prev => current !== prev ? current : prev);
}, 800);
```

### Change 3: Improve content stripping for non-streaming messages

After generation completes, the final message still needs `getDisplayContent`. Add these additional strip patterns to catch the remaining leaked content:

```typescript
// Add to the regex chain:
.replace(/^(?:Thinking\.{0,3})\s*$/gm, '')
.replace(/^\*{0,2}Design Tokens?:?\*{0,2}\s*$/gm, '')
.replace(/^[-•*]?\s*(?:Primary|Secondary|Background|Accent|Foreground|Muted|Border|Ring)\s*$/gm, '')
.replace(/^Loading preview\.{0,3}\s*$/gm, '')
```

## Technical Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Browser freeze | `getDisplayContent` runs 25+ regexes on 50-100KB content every 300ms | Skip prose processing during streaming; reduce poll rate |
| Chat leaking | Strip patterns don't cover all AI planning terms | Add missing strip patterns for design tokens, color names |
| "Slowing down Firefox" | Catastrophic regex backtracking on large `[\s\S]*` patterns | Size guard prevents processing content > 20KB |

## Expected Result

- No more browser freezing during generation
- Chat shows only the task breakdown card and file progress during streaming
- After generation, the final message displays clean conversational text without leaked planning content



# Fix: Preview Stuck on Skeletons Due to Main Thread Blocking

## Problem

The preview permanently shows "Loading preview..." skeletons because the main thread is blocked by excessive re-renders in the 2700-line `AIAppBuilderWorkspace` component. Firefox explicitly warns "This page is slowing down Firefox." The generation timer freezes at "27.8s" and never advances, proving the main thread is stalled. This means ALL JavaScript timeouts (the 55s wall-clock, 120s force-compile, 3-minute cap) never fire.

## Root Cause

Every streaming token triggers `setMessages()` inside `requestAnimationFrame`, which re-renders the entire `AIAppBuilderWorkspace` component (2700 lines, ~180 hooks, dozens of memos and effects). Even with rAF batching, this component is too expensive to re-render at streaming frequency. Firefox throttles the page, blocking all timers.

## Fix Strategy: Two surgical changes

### Fix A: Allow compilation during generation (remove the `isGenerating` block)

The `liveCompiledHTML` memo (line 1811) has `if (isGenerating) return null` which blocks ALL compilation while streaming. This was originally added to prevent "Resource Load Errors" from incomplete files, but it causes the preview to show skeletons for the entire generation duration (potentially minutes with continuation rounds).

**Change**: Replace the hard block with a conditional: compile when `completedFileCount >= 3` (meaning at least 3 files have been fully streamed). This gives users a live preview that updates as files arrive, while still avoiding compilation of a single half-written file.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (line 1807-1811)

```typescript
// BEFORE:
if (isGenerating) return null;

// AFTER:
// Allow compilation once enough files are complete, even during generation
if (isGenerating && completedFileCount < 3) return null;
```

### Fix B: Throttle `setMessages` more aggressively during streaming

Currently `setMessages` fires every `requestAnimationFrame` (~16ms). For a 2700-line component, this is too frequent. Throttle to every 200ms during streaming.

**File**: `src/hooks/useAIAppBuilder.ts` (lines 1225-1264)

Change the `upsertAssistant` function to use a 200ms throttle instead of rAF:

```typescript
let lastUpdateTime = 0;
const UPDATE_THROTTLE_MS = 200;
let throttleTimer: ReturnType<typeof setTimeout> | null = null;

const upsertAssistant = (content: string) => {
  fullContent = content;
  const now = Date.now();
  
  const doUpdate = () => {
    lastUpdateTime = Date.now();
    const currentContent = fullContent;
    
    let planSteps: PlanStep[] | undefined;
    try {
      if (currentContent.length > 200) {
        planSteps = parsePlanSteps(currentContent);
      }
    } catch {}

    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last?.role === 'assistant') {
        return prev.map((m, i) => i === prev.length - 1
          ? { ...m, content: currentContent, ...(planSteps ? { planSteps } : {}) }
          : m
        );
      }
      return [...prev, { id: assistantMsgId, role: 'assistant' as const, content: currentContent, timestamp: new Date(), ...(planSteps ? { planSteps } : {}) }];
    });

    if (currentContent.length - lastParsedLength >= 500) {
      lastParsedLength = currentContent.length;
      streaming.parseIncremental(currentContent);
    }
  };

  if (now - lastUpdateTime >= UPDATE_THROTTLE_MS) {
    doUpdate();
  } else if (!throttleTimer) {
    throttleTimer = setTimeout(() => {
      throttleTimer = null;
      doUpdate();
    }, UPDATE_THROTTLE_MS - (now - lastUpdateTime));
  }
};
```

### Fix C: Update stableHTML effect to accept generation-time compilation

The `stableHTML` effect (line 1831) currently requires `!isGenerating` to update. With Fix A allowing compilation during generation, we need to also accept updates while generating.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (line 1831-1846)

```typescript
// BEFORE:
if (!isGenerating && liveCompiledHTML) { ... }

// AFTER:
if (liveCompiledHTML) {
  // During generation, only do full reloads (no hot-patching incomplete code)
  if (isGenerating) {
    setStableHTML(liveCompiledHTML);
  } else {
    const patched = liveSync.applyPatches(previewIframeRef, project.files);
    if (!patched) {
      setStableHTML(liveCompiledHTML);
      liveSync.resetSnapshot(project.files);
    }
  }
}
```

## Technical Details

| File | Lines | Change |
|------|-------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | ~1811 | Allow compilation when completedFileCount >= 3 during generation |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | ~1831-1846 | Accept compilation results during generation |
| `src/hooks/useAIAppBuilder.ts` | ~1225-1264 | Throttle setMessages to 200ms instead of rAF (16ms) |

## Expected Result

- Preview shows a live draft within ~15-20 seconds (after 3 files complete) instead of waiting for entire generation to finish
- Main thread stays responsive (5x fewer React re-renders during streaming)
- Firefox "slowing down" warning eliminated
- All safety timers (wall-clock, 3-min cap) can fire reliably because the main thread isn't blocked

## Risk

- **Low**: Fix A may show a brief flash if files 1-3 have compile errors, but the user sees progress instead of an eternal skeleton. The `completedFileCount >= 3` threshold ensures at least index.html + a CSS + a component are present before first compile.
- **Low**: Fix B reduces chat update frequency from ~60fps to ~5fps during streaming. The code editor already reads from `partialFiles` directly, so users still see code appearing in real-time.


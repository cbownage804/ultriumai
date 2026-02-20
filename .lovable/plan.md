

# Fix: Main Thread Blocking During Streaming (Firefox "Slowing Down" Warning)

## Problem

Despite the 200ms throttle on `setMessages`, the preview stays stuck on skeletons and Firefox shows "This page is slowing down Firefox." The generation timer freezes, proving the main thread is stalled and ALL timeouts (55s wall-clock, 120s force-compile, 3-min cap) never fire.

## Root Cause

Each `setMessages()` call triggers a full re-render of `AIAppBuilderWorkspace` (2700 lines, ~180 hooks, dozens of effects). At 200ms throttle, that is 5 renders/second. But each render takes longer than 200ms due to:

- ~180 hooks re-evaluating
- Multiple `useEffect` hooks with `messages` in their dependency arrays (auto-save to cloud, IDB, localStorage, latestRef assignment)
- Dozens of `useMemo` recomputations
- The entire JSX tree (2700 lines) re-diffing

Result: the main thread is blocked 100% of the time during streaming. No timers fire, no compilation happens, preview stays as skeleton.

## Solution: Use a Ref for Streaming Content, Stop Re-rendering the Workspace

During streaming, store the assistant's content in a `useRef` instead of calling `setMessages`. Only the chat panel needs to display the streaming text -- and it can read from a separate, lightweight "streaming content" signal. The workspace component never re-renders during streaming.

### Change 1: Add a streaming content ref to `useAIAppBuilder`

**File**: `src/hooks/useAIAppBuilder.ts`

Add a `streamingContentRef` and a `streamingVersion` counter (a simple number state that increments at most every 300ms to let the chat panel know there is new content to display):

```typescript
const streamingContentRef = useRef<string>('');
const [streamingVersion, setStreamingVersion] = useState(0);
```

### Change 2: Replace `setMessages` with ref writes during streaming

**File**: `src/hooks/useAIAppBuilder.ts`

In `upsertAssistant`, instead of calling `setMessages` (which re-renders the entire workspace), write to `streamingContentRef.current` and bump `streamingVersion` at most every 300ms:

```typescript
const upsertAssistant = (content: string) => {
  fullContent = content;
  streamingContentRef.current = content;
  
  // Still parse for file streaming (lightweight, no React state)
  if (content.length - lastParsedLength >= 500) {
    lastParsedLength = content.length;
    streaming.parseIncremental(content);
  }
  
  // Bump version counter at most every 300ms for chat display
  const now = Date.now();
  if (now - lastUpdateTime >= 300) {
    lastUpdateTime = now;
    setStreamingVersion(v => v + 1);
  }
};
```

Then in the `finally` block (stream end), do a single `setMessages` call to commit the final content.

### Change 3: Pass streamingContentRef to BuilderChatPanel

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

Pass `streamingContentRef` and `streamingVersion` to `BuilderChatPanel`. The chat panel reads `streamingContentRef.current` when `isGenerating` is true and `streamingVersion` changes, displaying the live text without re-rendering the workspace.

### Change 4: Update BuilderChatPanel to use the streaming ref

**File**: `src/components/ai-builder/BuilderChatPanel.tsx` (or wherever it is defined)

When `isGenerating` is true, append a virtual assistant message from `streamingContentRef.current` to the displayed messages. This is computed locally inside the chat panel, so only the chat panel re-renders.

### Change 5: Remove `messages` from heavy dependency arrays

The auto-save effects (lines 1074-1100) already skip during `isGenerating`, but they still re-run their setup/teardown because `messages` is in the dependency array. Since `messages` won't change during streaming anymore (only `streamingVersion` changes), these effects stay dormant.

## Impact

| Metric | Before | After |
|--------|--------|-------|
| Workspace re-renders during streaming | ~5/sec (200ms throttle) | 0 (ref-only writes) |
| Chat panel re-renders during streaming | ~5/sec (coupled) | ~3/sec (independent, 300ms) |
| Main thread blocked | 100% during streaming | <10% |
| Timers fire reliably | No | Yes |
| Preview compilation | Never starts (thread blocked) | Starts after 3 files complete |

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAIAppBuilder.ts` | Add `streamingContentRef`, `streamingVersion`; rewrite `upsertAssistant` to use ref; single `setMessages` on stream end |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Pass `streamingContentRef` and `streamingVersion` to `BuilderChatPanel` |
| `src/components/ai-builder/BuilderChatPanel.tsx` | Read streaming content from ref instead of `messages` prop during generation |

## Risk

- **Low**: The only behavioral change is that `messages` state doesn't update during streaming. All consumers that need streaming content (chat display) get it from the ref. All consumers that skip during streaming (auto-save, IDB, drafts) already guard with `if (isGenerating) return`. The final `setMessages` call at stream end commits everything, so post-stream behavior is identical.


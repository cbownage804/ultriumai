

# Fix: Move partialFiles to Refs + Timer-Based Compilation

## Problem

The preview is STILL stuck on skeletons (screenshots show timer frozen at 39.8s for 3+ minutes). The root cause is that `useStreamingPreview` uses React **state** for `partialFiles` and `completedFileCount`. These flow through `useAIAppBuilder` into `AIAppBuilderWorkspace`, causing full workspace re-renders every 500 chars of streamed content. Worse, `liveCompiledHTML` has `partialFiles` in its dependency array, so the expensive React compiler runs synchronously on every single update, completely blocking the main thread.

## Chain of events (why everything freezes)

```text
Stream token arrives
  -> upsertAssistant() writes to ref (no re-render, good)
  -> every 500 chars: streaming.parseIncremental()
    -> setPartialFiles([...]) -- STATE CHANGE
    -> setCompletedFileCount(n) -- STATE CHANGE
      -> AIAppBuilderWorkspace re-renders (2700 lines, 180 hooks)
        -> liveCompiledHTML useMemo recomputes (partialFiles in deps)
          -> compileReactProject() runs synchronously (100-500ms)
            -> Main thread blocked
              -> ALL timers dead, preview skeleton forever
```

## Solution: Two changes

### Change 1: Convert useStreamingPreview to ref-based storage

In `src/hooks/useStreamingPreview.ts`, replace `useState` for `partialFiles` and `completedFileCount` with `useRef`. This eliminates ALL workspace re-renders during streaming from this source.

Keep one lightweight state: a `version` counter that only GeneratingOverlay and the editor can poll locally (NOT consumed by the workspace directly).

Expose `partialFilesRef` and `completedFileCountRef` instead of state values.

### Change 2: Timer-based compilation in AIAppBuilderWorkspace

Replace the `liveCompiledHTML` useMemo (which runs synchronously on every partialFiles change) with a `setInterval`-based approach during generation:

- Every 3 seconds during generation, check `partialFilesRef.current`
- If `completedFileCountRef.current >= 3` and we haven't compiled yet, compile once and set `stableHTML`
- After first successful compile, stop the timer (no need to recompile every 3s)
- When generation ends, do one final compilation from `project.files` as before

This decouples compilation from the render cycle entirely.

### Change 3: Update consumers to use refs

- `editorFile` memo: Use a local polling approach (like BuilderChatPanel) to read from `partialFilesRef`
- `GeneratingOverlay`: Pass the ref and poll locally for file names/count display
- `120s force-compile` effect: Read from ref instead of state

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useStreamingPreview.ts` | Convert `partialFiles` and `completedFileCount` to refs; expose refs |
| `src/hooks/useAIAppBuilder.ts` | Expose refs instead of state values |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Replace `liveCompiledHTML` useMemo with timer-based compilation; update `editorFile` to poll ref; update GeneratingOverlay props |
| `src/components/ai-builder/GeneratingOverlay.tsx` | Accept ref + poll locally for display |

## Expected Result

| Metric | Before | After |
|--------|--------|-------|
| Workspace re-renders during streaming | Every 500 chars | 0 |
| Compiler runs during streaming | Every 500 chars (sync, blocking) | Once, 3s after 3 files complete |
| Main thread blocked | 100% | Less than 5% |
| Preview appears | Never (frozen) | Within 15-20s of generation start |

## Risk

**Low**: The behavioral change is that `partialFiles` is no longer reactive state. All UI consumers that need it (overlay, editor) poll from refs locally, so they still update -- just independently, without triggering workspace re-renders.




# Fix App Builder Preview Getting Stuck on "Loading preview..."

## Problem

The App Builder preview gets stuck showing skeleton placeholders and "Loading preview..." indefinitely. The generation appears to be running but never completes, so the preview iframe never receives compiled HTML.

## Root Cause Analysis

There are **two interacting issues**:

### Issue 1: Edge function stream termination race condition

The `ai-app-builder` edge function wraps the AI gateway's stream in a `TransformStream` (lines 727-744). When the Supabase edge function runtime shuts down (60s limit), the `TransformStream` writer's catch block tries to write `data: [DONE]` — but this can fail silently if the writable stream is already closed by the runtime. The client's `readStream` then hangs waiting for more data.

The 15-second stall detector should catch this, but `lastChunkTime` gets reset by every chunk — if the AI was actively streaming right up until the shutdown, the stall detector won't fire for another 15 seconds. Meanwhile, the 55-second wall-clock timer may have already passed if we're on a continuation round.

### Issue 2: Wall-clock timer not reset per continuation round

The `WALL_CLOCK_MAX_MS` timer (55s) is set once at the start of `sendMessage` (line 1383) but only cleared inside the continuation loop for continuation rounds (line 1854 per-round). The main wall-clock timer from line 1383 could fire during a continuation round and abort a valid stream.

However, the bigger issue is that for the **first round**, the wall-clock starts at 55s. The edge function has a 50s gateway timeout + boot time. These are very close, meaning the client-side wall-clock may fire before the stream naturally completes, causing an abort and triggering continuation — then the continuation round gets its own wall-clock but the same pattern repeats.

## Fix Plan

### Fix 1: Add a client-side heartbeat timeout to `readStream`

Add a per-read timeout inside the stream loop. If `reader.read()` takes longer than 20 seconds without returning any data, force-break the loop. This catches the case where the edge function dies without sending `[DONE]`.

**File**: `src/hooks/useAIAppBuilder.ts`
**Change**: In the `readStream` function, wrap `reader.read()` with a Promise.race against a 20-second timeout, so a dead stream is detected faster than the existing 15-second stall checker (which only runs every 5 seconds).

```typescript
// Inside the while loop in readStream:
const readPromise = reader.read();
const timeoutPromise = new Promise<{done: true, value: undefined}>((resolve) => 
  setTimeout(() => resolve({done: true, value: undefined}), 20_000)
);
const { done, value } = await Promise.race([readPromise, timeoutPromise]);
```

### Fix 2: Reset wall-clock timer for each round

Move the wall-clock timer reset into each continuation round so it gets a fresh 55-second budget.

**File**: `src/hooks/useAIAppBuilder.ts`
**Change**: Clear and re-set `wallClockTimer` at the top of the `readStream` or at the start of each fetch call, not just once.

### Fix 3: Edge function stream termination hardening

Ensure the `TransformStream` always sends `[DONE]` when the stream terminates, even on runtime shutdown.

**File**: `supabase/functions/ai-app-builder/index.ts`
**Change**: Add a Deno-compatible `addEventListener('beforeunload')` or use `AbortSignal` from the request to detect shutdown and force-flush `[DONE]` to the stream.

### Fix 4: Fail-safe in `finalizeStream` for empty content

If `fullContent` is empty after streaming completes (edge function died before any data came through), skip the continuation loop and show a user-friendly error instead of leaving `isGenerating` in a limbo state.

**File**: `src/hooks/useAIAppBuilder.ts`
**Change**: At the top of `finalizeStream`, check if `fullContent.trim()` is empty and return early with an error message.

### Fix 5: Force compile after generation even if `liveCompiledHTML` is null

The `stableHTML` effect (line 1607) only runs when `!isGenerating && liveCompiledHTML`. If compilation produces `null` (e.g., no `index.html` found), the preview stays as skeleton forever. Add a fallback that shows an error state in the preview.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Change**: After `isGenerating` transitions to `false`, if `liveCompiledHTML` is still `null` but `project.files.length > 0`, set `stableHTML` to a simple error HTML page: "Compilation failed - check console for errors."

## Technical Details

| File | Lines | Change |
|------|-------|--------|
| `src/hooks/useAIAppBuilder.ts` | ~1275 | Add `Promise.race` read timeout in stream loop |
| `src/hooks/useAIAppBuilder.ts` | ~1383 | Reset wall-clock timer per continuation round |
| `src/hooks/useAIAppBuilder.ts` | ~1395 | Guard against empty `fullContent` in `finalizeStream` |
| `supabase/functions/ai-app-builder/index.ts` | ~727-744 | Harden TransformStream termination |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | ~1606-1627 | Add fallback when compilation returns null after build |

## Risk

- **Low-Medium**: These are defensive guards that only activate in failure paths. Normal generation flow is untouched.
- Fix 1 (read timeout) is the highest impact — it directly prevents the "stuck forever" scenario.
- Fix 3 requires edge function redeployment.


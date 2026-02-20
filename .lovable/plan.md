

# Fix: Stream Dying Mid-Generation Due to Client-Side Timeouts

## Root Cause

The stream dies at ~30s because of two interacting problems:

1. **Edge function keepalive stops too early**: The keepalive only sends SSE comments BEFORE the first chunk. Once any data arrives, it stops. But the AI model often pauses for 15-30 seconds BETWEEN files (e.g., "thinking" after generating `tailwind.config.js` before starting `main.tsx`).

2. **Client-side stall detector is too aggressive**: The 15-second stall timer and 20-second read timeout fire during these natural pauses, aborting a stream that is still alive on the server side.

Evidence: The edge function logs show it ran for 98 seconds without errors. The stream is alive on the server -- the client kills it prematurely.

## Fix (2 files)

### Step 1: Edge Function -- Continuous Keepalive (not just pre-first-chunk)

**File**: `supabase/functions/ai-app-builder/index.ts`

Change the keepalive logic to track "time since last upstream chunk" and send keepalive comments whenever the gap exceeds 8 seconds, throughout the ENTIRE stream (not just before the first chunk).

```text
Current logic:
  - keepaliveInterval sends `: keepalive\n\n` every 8s
  - STOPS once receivedFirstChunk = true

New logic:
  - Track lastUpstreamChunkTime
  - keepaliveInterval checks if (now - lastUpstreamChunkTime > 7000)
  - Sends keepalive if yes, regardless of whether first chunk was received
  - Only stops when stream is done (sentDone = true)
```

This ensures the response stream never goes idle for more than 8 seconds, even during long "thinking" pauses between files.

### Step 2: Client -- Increase Stall Timeout

**File**: `src/hooks/useAIAppBuilder.ts`

- Increase `STREAM_STALL_MS` from 15,000ms to 25,000ms (line 1219)
- Increase the read timeout `Promise.race` from 20,000ms to 30,000ms (line 1262)

These are still aggressive enough to detect truly dead streams, but won't fire during natural 10-20 second pauses when the AI model is thinking between files.

## Technical Details

### Edge function changes (index.ts, lines 692-720)

Replace:
```typescript
let receivedFirstChunk = false;
// ...
const keepaliveInterval = setInterval(async () => {
  if (receivedFirstChunk || sentDone) {
    clearInterval(keepaliveInterval);
    return;
  }
  // send keepalive
}, 8_000);
// ...
if (!receivedFirstChunk) {
  receivedFirstChunk = true;
  clearInterval(keepaliveInterval);
}
```

With:
```typescript
let lastUpstreamTime = Date.now();
// ...
const keepaliveInterval = setInterval(async () => {
  if (sentDone) {
    clearInterval(keepaliveInterval);
    return;
  }
  if (Date.now() - lastUpstreamTime > 7_000) {
    try {
      await writer.write(encoder.encode(': keepalive\n\n'));
    } catch {
      clearInterval(keepaliveInterval);
    }
  }
}, 8_000);
// ...
// On each chunk: update lastUpstreamTime instead of clearing keepalive
lastUpstreamTime = Date.now();
```

### Client changes (useAIAppBuilder.ts, lines 1219 and 1262)

```typescript
// Line 1219: 15s -> 25s
const STREAM_STALL_MS = 25_000;

// Line 1262: 20s -> 30s
setTimeout(() => resolve({ done: true, value: undefined as any }), 30_000)
```

## Why This Fixes the 30s Stuck Issue

- The AI model naturally pauses 10-20s between files while planning the next one
- Previously: no keepalive during pause, client stall detector fires at 15s, stream aborted
- Now: keepalive continues throughout, client tolerates 25s pauses, stream survives


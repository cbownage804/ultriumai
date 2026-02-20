

# Fix: Stream Freeze at ~30 Seconds

## Root Cause

The `Promise.race` read timeout at line 1261 in `useAIAppBuilder.ts` is **dangling and never cleaned up**. Here's what happens:

```text
1. Each iteration of the read loop creates a NEW 30-second setTimeout
2. When reader.read() returns data, Promise.race settles, but the 30s timer is NEVER cleared
3. After ~30 seconds of streaming, that first timer fires
4. It resolves with { done: true, value: undefined }
5. But critically: the reader is NEVER canceled and the controller is NEVER aborted
6. The response body connection is left DANGLING in the browser
7. This causes downstream hangs in finalization and prevents clean completion
```

The stall detector (25s) already handles dead streams properly -- it aborts the controller AND cancels the reader. The read timeout is redundant, buggy (no cleanup), and is the direct cause of the ~30s freeze.

## Fix (2 files, 1 deployment)

### Step 1: Remove the buggy `Promise.race` read timeout entirely

**File**: `src/hooks/useAIAppBuilder.ts`, lines 1258-1264

The stall detector (5s interval, 25s threshold) already catches dead streams. The read timeout is redundant and actively harmful.

Replace:
```typescript
const readPromise = reader.read();
const timeoutPromise = new Promise<ReadableStreamReadResult<Uint8Array>>((resolve) =>
  setTimeout(() => resolve({ done: true, value: undefined as any }), 30_000)
);
const { done, value } = await Promise.race([readPromise, timeoutPromise]);
```

With:
```typescript
const { done, value } = await reader.read();
```

Also remove the dead log at line 1266-1268 that references "Read timeout (20s)":
```typescript
if (done) {
  // no special handling needed -- stall detector handles dead streams
  break;
}
```

### Step 2: Make edge function keepalive more aggressive and add logging

**File**: `supabase/functions/ai-app-builder/index.ts`, lines 710-722

Change the keepalive from 8s/7s to 4s/3s to ensure the Supabase platform proxy never sees an idle connection:

```typescript
const keepaliveInterval = setInterval(async () => {
  if (sentDone) {
    clearInterval(keepaliveInterval);
    return;
  }
  if (Date.now() - lastUpstreamTime > 3_000) {
    try {
      await writer.write(encoder.encode(': keepalive\n\n'));
      console.log(`[${requestId}] Keepalive sent (gap: ${Date.now() - lastUpstreamTime}ms)`);
    } catch {
      clearInterval(keepaliveInterval);
    }
  }
}, 4_000);
```

Also add a timing log when the upstream reader completes to track actual execution time:

```typescript
// After the while(true) loop in the async IIFE:
console.log(`[${requestId}] Upstream stream completed after ${Date.now() - lastUpstreamTime}ms since last chunk`);
```

### Step 3: Redeploy edge function

Force-redeploy `ai-app-builder` to ensure the latest keepalive logic is live.

## Why This Fixes It

- The `Promise.race` created a ticking 30s bomb on every read iteration
- When the first bomb detonated, it broke out of the read loop without cleaning up the reader or connection
- The dangling connection/reader caused the finalization path to hang
- Removing it leaves just the stall detector, which properly aborts and cancels on timeout
- More aggressive keepalives (4s) ensure no proxy/platform timeouts during model thinking pauses

## Technical Details

### What the stall detector already does correctly (no changes needed):
```typescript
// Lines 1248-1255 -- this is the CORRECT timeout mechanism
const stallChecker = setInterval(() => {
  if (Date.now() - lastChunkTime > STREAM_STALL_MS && !streamDone) {
    controller.abort();           // Signals the fetch to terminate
    reader.cancel().catch(() => {}); // Cleans up the reader
    streamDone = true;            // Breaks the while loop
  }
}, 5000);
```

This properly cleans up everything. The `Promise.race` timeout does NOT do this cleanup.


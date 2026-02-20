

# Fix: App Builder Builds Not Finishing

## What's Actually Wrong (Root Cause Confirmed)

The edge function `ai-app-builder` sets a **120-second gateway timeout** but the Supabase platform kills edge functions at **~60 seconds**. Every build that takes longer than 60s gets silently terminated mid-stream. The client then waits another 30 seconds (stall detector) before giving up -- but the partial content IS applied thanks to existing recovery code at line 1282/1592.

The fix is straightforward: make all the timeouts consistent so the AI finishes its response before the platform kills the connection.

## Changes

### 1. Edge Function: Reduce Gateway Timeout (Primary Fix)

**File:** `supabase/functions/ai-app-builder/index.ts`  
**Line 476:** `GATEWAY_TIMEOUT_MS` from `120_000` to `50_000`

This ensures the AI gateway call completes well within the ~60s edge function limit. If the AI can't finish in 50s, it returns a timeout error instead of getting silently killed.

### 2. Client: Faster Stall Detection

**File:** `src/hooks/useAIAppBuilder.ts`  
**Line 1148:** `STREAM_STALL_MS` from `30_000` to `15_000`  
**Line 1289:** `FETCH_TIMEOUT_MS` from `90_000` to `60_000`

If the stream does die, detect it in 15s instead of 30s. The fetch timeout (90s) also exceeds the edge function limit -- reduce to 60s.

### 3. Client: Wall-Clock Safety Net

**File:** `src/hooks/useAIAppBuilder.ts`  
After line 1313 (where `streaming.startStreaming()` is called), add a 55-second maximum timer. If the build hasn't completed by then, abort the controller. The existing code path (lines 1591-1592) will still call `finalizeStream()` with whatever partial content was received.

### 4. Stall Detector: Show Actionable Toast

**File:** `src/hooks/useAIAppBuilder.ts`  
**Lines 1205-1212:** When stall is detected, show a toast: "Generation stalled -- partial results applied" instead of silently closing.

### 5. UI: Present-Tense Labels During Streaming

**File:** `src/components/ai-builder/BuilderChatPanel.tsx`  
**Line 572:** Change from always showing "Updated X files" to showing "Generating X files..." while `isStreaming` is true.  
**Line 580:** Fix `isFileDone` so files only show green checkmarks when streaming is actually complete.

## Why This Will Work

The existing code already has partial content recovery (line 1282) and `finalizeStream()` is already called after `readStream()` returns (line 1592) regardless of whether the stream completed cleanly. The problem is purely that the timeouts are set higher than the platform allows, causing silent disconnects. Aligning the numbers fixes the disconnect. The safety net and faster stall detection are defense-in-depth.

## Files Changed

| File | What |
|---|---|
| `supabase/functions/ai-app-builder/index.ts` | Gateway timeout 120s to 50s |
| `src/hooks/useAIAppBuilder.ts` | Stall 30s to 15s, fetch 90s to 60s, add 55s safety net, actionable stall toast |
| `src/components/ai-builder/BuilderChatPanel.tsx` | Present-tense labels during streaming |

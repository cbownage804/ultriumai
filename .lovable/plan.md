

# Fix: App Builder Builds Not Finishing — Chunked Generation (Lovable Parity)

## Root Cause

The problem isn't just timeouts — it's the **architecture**. Right now, every prompt (even "build a todo app") asks the AI to generate the **entire app in a single streaming response**. With a 50s gateway timeout and ~60s edge function limit, the AI simply runs out of time for anything beyond trivial apps.

The phase planner only kicks in for prompts with 800+ characters and structured headings — which means every simple "build me X" prompt tries to generate 5-10 files in one shot and gets killed.

Lovable solves this by building incrementally: generate a scaffold, show it, then automatically continue with remaining files. We need the same approach.

## Solution: Auto-Continuation Loop

Instead of hoping the AI finishes everything in one call, the client will **detect incomplete output and automatically send follow-up requests** to continue generation. This is transparent to the user — they see files appearing one by one, just like Lovable.

## Changes

### 1. System Prompt: Instruct AI to Prioritize Core Files First

**File:** `supabase/functions/ai-app-builder/index.ts`

Add to `BASE_SYSTEM_PROMPT` after the OUTPUT FORMAT section:

```
CHUNKING: Output the MOST IMPORTANT files first (index.html, then main app file, then styles).
If you run out of space, end with ===CONTINUE=== on its own line — the system will
automatically send a follow-up request for remaining files. Do NOT rush or truncate files
to fit everything in one response. Quality over completeness.
```

This tells the AI it's okay to not finish — the system will ask for more.

### 2. Client: Detect `===CONTINUE===` Marker and Auto-Send Follow-Up

**File:** `src/hooks/useAIAppBuilder.ts`

In `finalizeStream()` (after line 1331 where output is parsed), add continuation detection:

```
After finalizeStream() applies files and updates the UI:
1. Check if fullContent ends with ===CONTINUE=== (or stream was aborted/stalled)
2. If files were generated but the marker is present, OR the stream was killed mid-file:
   - Apply the partial files immediately (already happening)
   - Show the preview (already happening)  
   - Auto-send a continuation prompt: "[CONTINUE] You previously generated: [list of file paths]. Continue generating the remaining files for this project. Pick up exactly where you left off."
   - Show a toast: "Generating remaining files..."
3. Cap at 4 continuation rounds maximum to prevent infinite loops
4. After final round (or no ===CONTINUE=== marker), show completion status
```

### 3. Client: Track Continuation State

**File:** `src/hooks/useAIAppBuilder.ts`

Add a `continuationCountRef` (useRef) that:
- Resets to 0 when a new user message is sent
- Increments each time an auto-continuation is triggered
- Caps at 4 (safety valve — show "Generation complete" even if AI keeps saying CONTINUE)

### 4. Edge Function: Remove Retry Loops That Burn the Timeout Budget

**File:** `supabase/functions/ai-app-builder/index.ts`

Lines 562-606 have a retry loop that attempts up to 3 retries with model fallback on 500/502/503 errors. Each retry includes a 1.5s-4.5s delay PLUS a full AI gateway call — all within the same 50s edge function timeout. By the second retry, the edge function is already past 40s and will get killed.

Remove the in-function retry loop for streaming responses. The client already has its own retry logic (lines 1482-1546) that creates fresh edge function invocations with their own 50s budgets.

### 5. UI: Show Continuation Progress

**File:** `src/components/ai-builder/BuilderChatPanel.tsx`

Update the streaming status to show which round of generation is active:
- Round 1: "Generating core files..."
- Round 2+: "Generating remaining files... (round 2/4)"
- Final: "Updated X files"

### 6. Stall/Timeout Recovery Feeds Into Continuation

**File:** `src/hooks/useAIAppBuilder.ts`

When the stall detector or wall-clock safety net fires, instead of just showing a warning toast:
1. Apply partial files (already happening)
2. Check if any `===FILE:` blocks were received
3. If yes, trigger auto-continuation (same as `===CONTINUE===` detection)
4. If no files at all, show the error toast as before

This means even when the AI gets killed mid-stream, the system recovers by asking for the rest.

## How It Works End-to-End

```text
User: "Build me a project management app"
                    |
          [Round 1: Edge function, 50s budget]
                    |
    AI outputs: index.html, app.js, styles.css
    AI outputs: ===CONTINUE===
                    |
    Client: applies 3 files, shows preview
    Client: auto-sends continuation
                    |
          [Round 2: Fresh edge function, 50s budget]  
                    |
    AI outputs: components/TaskList.js, components/Board.js
    AI outputs: ===CONTINUE===
                    |
    Client: merges 2 new files, updates preview
    Client: auto-sends continuation
                    |
          [Round 3: Fresh edge function, 50s budget]
                    |
    AI outputs: components/Modal.js, utils/api.js
    (No ===CONTINUE=== marker)
                    |
    Client: merges final files, shows "Updated 7 files"
    Done.
```

## Files Changed

| File | What |
|---|---|
| `supabase/functions/ai-app-builder/index.ts` | Add CHUNKING instruction to system prompt; remove in-function retry loop for streaming |
| `src/hooks/useAIAppBuilder.ts` | Add `===CONTINUE===` detection, auto-continuation loop (max 4 rounds), stall recovery feeds into continuation |
| `src/components/ai-builder/BuilderChatPanel.tsx` | Show continuation round progress during streaming |

## Why This Will Actually Work

1. **Each round gets a fresh 50s budget** — no more fighting the edge function timeout
2. **Partial results are shown immediately** — the user sees progress after every round
3. **The AI is told it's okay to chunk** — no more rushing to fit everything in one response
4. **Stalls and timeouts trigger continuation** — instead of failing, they become round boundaries
5. **4-round cap prevents infinite loops** — worst case, you get a partial app you can iterate on


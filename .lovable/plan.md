

# Fix AI Builder Token Overflow and False Health Warnings

## Problem Analysis

The edge function logs show the exact error: **"The input token count exceeds the maximum number of tokens allowed 1048576"** (Gemini's 1M token limit). Here's why:

1. **The system prompt is massive (~660 lines, ~250K+ chars / ~60K+ tokens)** -- it lives in `BASE_SYSTEM_PROMPT` inside the edge function and contains extensive instructions for coding, design, CRUD patterns, schema design, storage, auth, realtime, edge functions, etc.
2. **Client sends up to 2.5M chars of message context** on top of the system prompt
3. **Server-side retry uses 800K char limit** -- but combined with the ~250K system prompt, this can still exceed 1M tokens
4. **The "AI service may be slow" toast** still fires on first load because `HEAD` requests to edge functions fail with CORS/auth errors that get caught by the `catch` block

## Root Causes

| Issue | Cause |
|-------|-------|
| "Provider returned error" 400 | System prompt (~60K tokens) + messages exceed Gemini's 1M token limit |
| Server retry still fails | Retry at 800K chars + 250K system prompt = still over limit |
| Client retry still fails | Client retries at 200K/100K chars but server still adds the 250K prompt |
| False "AI slow" warning | `HEAD` request to edge function throws a network error (CORS), caught as "unreachable" |

## Plan

### 1. Trim the system prompt (edge function)

The `BASE_SYSTEM_PROMPT` is bloated with examples, code templates, and repetitive instructions. Condense it from ~660 lines to ~200 lines by:
- Removing verbose code examples (router patterns, CRUD patterns, storage examples) -- the model already knows these
- Removing repetitive "CRITICAL" rules that say the same thing multiple ways
- Condensing the design philosophy into a compact checklist instead of prose
- Keeping the essential output format rules (===FILE:, ===EDIT:, ===MIGRATION:, ===EDGE_FUNCTION:)

Target: reduce from ~250K chars to ~80K chars (~20K tokens), freeing ~40K tokens of headroom.

### 2. Fix server-side retry budget (edge function)

Currently the retry uses 800K chars for messages. With a trimmed ~80K system prompt:
- Primary attempt: 2M chars messages + 80K prompt = well within 4M char / 1M token limit
- Retry attempt: reduce to **400K chars** (not 800K) to guarantee success even with overhead

### 3. Fix the health check (client)

Replace the `HEAD` fetch (which fails on CORS) with a simpler approach: just set `gatewayHealthy = true` by default and only mark it false if a real request fails with a network error. The pre-flight check adds latency and false positives without value -- the actual request will fail with a proper error code anyway.

### 4. Add system prompt size logging (edge function)

Add a `console.log` for system prompt size so future debugging is easier:
```
console.log(`System prompt: ${systemPrompt.length} chars`);
```

## Files to Change

1. **`supabase/functions/ai-app-builder/index.ts`**
   - Condense `BASE_SYSTEM_PROMPT` from ~660 lines to ~200 lines
   - Reduce retry message budget from 800K to 400K chars
   - Add system prompt size logging

2. **`src/hooks/useAIAppBuilder.ts`**
   - Remove the pre-flight `checkGatewayHealth()` function entirely
   - Remove the health check call and "AI slow" toast before requests
   - Keep the smart error classifier for actual request failures (it already handles all error types well)

## Technical Details

### System Prompt Trimming Strategy

Sections to **keep** (essential for correct output):
- Output format rules (===FILE:, ===EDIT:, ===MIGRATION:, ===EDGE_FUNCTION: delimiters)
- Request complexity router (simple/medium/complex classification)
- Fix mode diagnostics format
- React mode directive
- Supabase/Stripe addon blocks (these are conditional and small)

Sections to **remove or condense**:
- Router code example (~20 lines of JS) -- model knows how to write routers
- CRUD delete pattern example (~10 lines) -- model knows filter/splice
- Storage upload pattern (~15 lines) -- model knows Supabase Storage API
- Realtime subscription patterns (~40 lines) -- model knows these
- Drag-and-drop HTML example -- unnecessary
- Presence and broadcast examples -- unnecessary
- 10-point pre-output validation checklist -- condense to 3 key rules
- Repeated "CRITICAL" and "NON-NEGOTIABLE" emphasis -- once is enough
- Anti-patterns list -- model already knows these
- Design philosophy prose -- condense to bullet points

### Health Check Removal

The current flow:
1. User clicks "Send"
2. `checkGatewayHealth()` fires a HEAD request
3. HEAD fails (CORS) -> toast "AI may be slow"
4. Actual request fires and works fine

New flow:
1. User clicks "Send"
2. Request fires directly
3. If it fails, the error classifier handles it with specific guidance

This is simpler, faster (no extra network request), and eliminates false positives entirely.


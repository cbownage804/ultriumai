
# Fix: Chat Mode Routing and Preview Behavior

## Problems Identified

### Problem 1: Chat mode goes through the heavy build pipeline
When the user is in Chat mode (1cr), every message still routes through:
- `sendMessage()` in `useAIAppBuilder.ts`
- Edge function `ai-builder-background` (creates a DB job row, polls, streams)
- Edge function `ai-app-builder` (which does use the correct discuss prompt, but the entire pipeline is overkill)
- Compilation bridge triggers after generation completes (trying to compile nothing)

This is massively wasteful — a simple chat response should NOT create background jobs, poll databases, or trigger compilation. It should call a lightweight chat endpoint directly.

### Problem 2: Preview shows placeholder after chat responses
After a discuss-mode response completes, `handleBgComplete` fires and the compilation bridge triggers. Since no files were generated, the preview shows the default "Live Preview / Describe what you want to build" placeholder. This is confusing.

### Problem 3: Auto-escalation regex is too aggressive
The `shouldAutoEscalate` function's `integrationSignals` pattern matches common words like "add", "api", "auth", "database" which appear in casual conversation. Even benign follow-up messages can get escalated to Agent mode. The word "add" alone on line 1680 (`add.*and.*and`) combined with integration signals makes casual conversation trigger build mode.

### Problem 4: Browser freeze
The workspace initializes 100+ hooks, and every chat message triggers the full build pipeline (version snapshots, file context scoring, import graph computation, token budget calculations) — even when no code generation is needed. This causes the browser to freeze, especially when Lovable is running in the same tab.

## Solution

### 1. Add a lightweight chat path in `handleSend`
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

When mode is `discuss` (and auto-escalation does NOT trigger), skip the full `sendMessage()` pipeline entirely. Instead:
- Call `vanguard-general-chat` edge function directly (already exists, lightweight, no background jobs)
- Append the response as a message with `mode: 'discuss'`
- Skip all file context computation, version snapshots, compilation, and preview updates
- This reduces a discuss-mode message from ~15 operations to 1 API call

### 2. Suppress compilation after discuss-mode responses
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

In the compilation bridge / `handleBgComplete` flow:
- Check if the last message has `mode: 'discuss'`
- If so, skip compilation entirely — no files changed, no preview update needed
- Keep the existing preview state unchanged (show whatever was last built, or the placeholder if nothing was built yet)

### 3. Tighten auto-escalation signals
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Make `shouldAutoEscalate` much more conservative:
- Require at least 2 signal matches before escalating (currently 1 is enough)
- Remove overly broad terms from `integrationSignals` (like standalone "api" or "add")
- Add a minimum input length threshold (e.g. 50 chars) — short questions should never escalate
- Respect the user's explicit mode choice more strongly

### 4. Skip heavy context computation in discuss mode
**File: `src/hooks/useAIAppBuilder.ts`**

In `sendMessage`, when `effectiveMode === 'discuss'`:
- Skip `buildFileContext()` (the expensive file scoring, import graph, manifest building)
- Skip version snapshot creation
- Skip `setPreviousFiles` / `setLatestFiles`
- This eliminates the main-thread computation that causes freezing

## Technical Details

### Lightweight Chat Path (new flow)
```text
User types in Chat mode
  -> handleSend detects mode === 'discuss' && !shouldAutoEscalate
  -> Calls supabase.functions.invoke('vanguard-general-chat')
     with conversationHistory from messages
  -> Appends response as assistant message with mode: 'discuss'
  -> No compilation, no preview update, no background job
  -> Response time: ~1-2s instead of ~10-15s
```

### File Changes Summary

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Add lightweight chat path in `handleSend`; tighten `shouldAutoEscalate` regex; skip compilation for discuss-mode |
| `src/hooks/useAIAppBuilder.ts` | Skip heavy file context computation when mode is discuss |

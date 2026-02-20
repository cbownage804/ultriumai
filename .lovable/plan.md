

# Bulletproof the Continuation Loop — Remaining Bugs

After reviewing the implementation, there are **5 concrete bugs** that will cause failures. Fixing these should make generation reliable.

---

## Bug 1: Wrong AbortController checked in continuation rounds

**File:** `src/hooks/useAIAppBuilder.ts`, line 1465

`wasInterrupted` checks `controller.signal.aborted` — but `controller` is the round-1 controller from line 1151. In continuation rounds, the active controller is `contController` (line 1651). So if round 2+ gets aborted by the wall-clock timer, `wasInterrupted` is always `false` and the loop silently stops instead of continuing.

**Fix:** Move `controller` to a mutable `let` and update it when creating `contController`:

```typescript
// Line 1151: change const to let
let controller = new AbortController();

// Line 1651 (continuation loop): reassign instead of creating new variable
controller = new AbortController();
abortRef.current = controller;
```

This way `finalizeStream`'s `controller.signal.aborted` check always references the active controller.

---

## Bug 2: `===CONTINUE===` marker leaks into last file's content

**File:** `src/hooks/useAIAppBuilder.ts`, line 1340

`parseMultiFileOutput(fullContent)` parses the raw stream output, but `===CONTINUE===` isn't stripped beforehand. If the AI outputs:

```
===FILE: app.js===
const app = ...
===CONTINUE===
```

The parser treats `===CONTINUE===` as part of `app.js`'s content since it doesn't match any delimiter pattern.

**Fix:** Strip the continue marker before parsing:

```typescript
const cleanedContent = fullContent.replace(/\n?===CONTINUE===\s*$/g, '');
const { files: parsedFiles, ... } = parseMultiFileOutput(cleanedContent);
```

---

## Bug 3: Retry path bypasses the continuation loop

**File:** `src/hooks/useAIAppBuilder.ts`, lines 1568-1577

When a request fails and the retry succeeds, it calls `finalizeStream()` but then immediately `return`s — never entering the `while` continuation loop. So retried builds that need multiple rounds will only ever get round 1.

**Fix:** Store the result and fall through to the continuation loop instead of returning:

```typescript
if (retryResp.ok && retryResp.body) {
  toast.success('Retry successful!', { duration: 2000 });
  setThinkingPhase(null);
  streaming.startStreaming();
  fullContent = '';
  await readStream(retryResp.body);
  const retryResult = await finalizeStream();
  // Fall through to continuation loop below instead of returning
  // (set continuationResult so the while loop picks it up)
  continuationResult = retryResult;
  break; // exit retry loop, continue to while loop
}
```

Then restructure the code so the `while` continuation loop runs after both the happy path and the retry path.

---

## Bug 4: Continuation messages lose original prompt context

**File:** `src/hooks/useAIAppBuilder.ts`, lines 1656-1660

The continuation prompt sends `apiMessages.slice(0, 2)` — just the system prompt and the first user message. But on follow-up requests (not initial builds), the user's actual request is the *last* message, not the second. So the AI in round 2+ has no idea what was originally requested.

**Fix:** Include the original user prompt explicitly:

```typescript
const originalUserMsg = apiMessages[apiMessages.length - 1];
const contMessages = [
  apiMessages[0], // system prompt
  { role: 'assistant', content: `[Generated ${continuationResult.generatedPaths.length} files: ${continuationResult.generatedPaths.join(', ')}]` },
  { role: 'user', content: `[CONTINUE] Original request: "${typeof originalUserMsg.content === 'string' ? originalUserMsg.content.slice(0, 500) : '[multimodal]'}"\n\nYou previously generated: ${continuationResult.generatedPaths.join(', ')}. Continue generating the remaining files. If more remain, end with ===CONTINUE===` },
];
```

---

## Bug 5: Edge function token-limit retry has no timeout

**File:** `supabase/functions/ai-app-builder/index.ts`, lines 530-561

When a 400 "token limit exceeded" error triggers a retry with reduced context, that retry fetch has no timeout or abort controller. If the retry itself takes 40+ seconds, the edge function will be killed by the platform with no response.

**Fix:** Reuse the same timeout pattern:

```typescript
const retryController = new AbortController();
const retryTimer = setTimeout(() => retryController.abort(), 25_000); // 25s budget for retry
try {
  const retryResp = await fetch(url, { ...opts, signal: retryController.signal });
  // ...
} finally {
  clearTimeout(retryTimer);
}
```

---

## Summary

| Bug | Impact | Fix |
|---|---|---|
| Wrong controller in continuation | Rounds 2+ never detect interruption, loop stops early | Reassign `controller` variable |
| `===CONTINUE===` leaks into files | Last file gets corrupted with marker text | Strip marker before parsing |
| Retry bypasses continuation loop | Retried builds limited to 1 round | Fall through to while loop |
| Continuation loses original prompt | AI in rounds 2+ doesn't know what to build | Include original prompt in continuation message |
| Edge fn retry has no timeout | Platform kills edge fn during retry | Add 25s abort controller |

## Files Changed

| File | What |
|---|---|
| `src/hooks/useAIAppBuilder.ts` | Fix controller reference, strip continue marker, retry flow, continuation prompt |
| `supabase/functions/ai-app-builder/index.ts` | Add timeout to token-limit retry |


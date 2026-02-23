

## Fix: AI Builder "Provider returned error" 400 + Improve Retry Resilience

### Root Cause

The Lovable AI gateway at `ai.gateway.lovable.dev` returned HTTP 400 with body `"Provider returned error"`. This happens when the upstream model provider (e.g., Gemini) rejects the request for non-token-related reasons (content policy, temporary model issue, malformed multimodal input, etc.).

The current code in `ai-app-builder/index.ts` (lines 646-689) only auto-retries 400 errors when the message matches `/token|exceeds|maximum/`. For all other 400 errors like "Provider returned error," it passes the raw error through to the client, causing the build to fail with a confusing message.

### Fix

**File: `supabase/functions/ai-app-builder/index.ts` (lines ~646-689)**

Expand the 400 error handler to also retry on generic provider errors:

1. After the existing token-limit retry block, add a second retry path for "Provider returned error" or any generic non-token 400:
   - Retry once with the fallback model (`google/gemini-2.5-flash`)
   - If the fallback also fails, return a user-friendly error message: "The AI model couldn't process this request. Try rephrasing or simplifying your prompt."
   - Log the original error for debugging

2. Improve the user-facing error message for all 400s — instead of showing raw gateway JSON like `{"error":"Provider returned error","requestId":"..."}`, show a clean message.

### Technical Details

```text
Current 400 handler flow:
  400 received -> is token error? -> yes: retry with reduced context
                                  -> no: pass raw error to client

New 400 handler flow:
  400 received -> is token error? -> yes: retry with reduced context
                -> is provider error? -> yes: retry with fallback model
                -> else: return clean user-friendly error
```

Changes:
- Add a `/provider|upstream|internal/i` regex check after the token-limit check
- On match, retry with the fallback model (`google/gemini-2.5-flash`) using full context (not reduced, since it's not a token issue)
- If retry succeeds, return the response
- If retry fails, return: "The AI provider encountered an error. Please try again."
- For ALL 400 error paths, sanitize the error message to never expose raw JSON to the user

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/ai-app-builder/index.ts` (lines 646-689) | Add fallback model retry for generic provider 400 errors, sanitize user-facing error messages |

### No frontend changes needed
The client already displays the error message from the edge function response. Improving the server-side error handling and retry logic will fix both the build failure and the confusing error message.




## Fix: "Provider returned error" Build Failures + Raw JSON in Error Messages

### Root Cause

There are **two layers** of the problem:

1. **`ai-builder-background/index.ts`** (the orchestrator) calls `ai-app-builder` (the AI gateway wrapper). When `ai-app-builder` returns a 400, the background function on line 493 does:
   ```
   throw new Error(`AI builder returned ${resp.status}: ${errText.slice(0, 500)}`);
   ```
   This dumps the raw JSON response (`{"error":"Provider returned error","requestId":"..."}`) into the `error_message` column, which flows directly to the chat UI and toast.

2. **`ai-builder-background/index.ts`** only retries on 500/408/504 errors (line 484). It does NOT retry on 400 errors at all -- so even though `ai-app-builder` now has retry logic for provider errors, the background function doesn't give it a chance to use a different model because it treats ALL non-ok responses below 500 as fatal.

3. The **client-side error classifier** (`classifyError` in `useAIAppBuilder.ts`) doesn't have a case for "provider error" 400s -- they fall into the generic "unknown" bucket with the raw error string as the message.

### Fix (3 files)

**1. `supabase/functions/ai-builder-background/index.ts` (line 484-493)**

Add 400 to the retryable status codes when the error text matches `/provider|upstream|internal/i`. Also sanitize the error text before throwing so the database never stores raw JSON:

- Line 484: Change the retry condition from `resp.status >= 500 || resp.status === 408 || resp.status === 504` to also include `resp.status === 400` when the error text matches provider-related patterns
- Line 493: Parse the error text -- if it's JSON, extract the `error` field. Always produce a clean human-readable string.

**2. `src/hooks/useAIAppBuilder.ts` (line 38-42, 58-62)**

Add a classifier case for provider/upstream 400 errors so the user sees a friendly message instead of raw JSON:

- Add a new case after the `payload_too_large` check:
  ```
  if (status === 400 && /provider|upstream|internal|encountered an issue/i.test(errorMsg))
  ```
  Returns category `server`, retryable `true`, with message "The AI provider encountered a temporary issue."

- Update the fallback "unknown" case to strip any JSON from the error message before displaying.

**3. `src/hooks/useBackgroundGeneration.ts` (line 130)**

Sanitize the `error_message` before displaying in the toast -- strip JSON wrapper and requestId to show only the human-readable part:

```typescript
const cleanMsg = job.error_message?.replace(/\{"error":"([^"]+)".*\}/, '$1')
  ?.replace(/AI builder returned \d+:\s*/, '')
  ?.slice(0, 100) || 'Unknown error';
toast.error(`Build failed: ${cleanMsg}`);
```

### Cookie Warnings

The `__cf_bm` cookie warnings in the console are cosmetic Cloudflare cookie-domain mismatches when loading chunks from `ultriumai.app`. They do NOT affect functionality and cannot be fixed from the application code (they're a Cloudflare infrastructure behavior). No action needed.

### Summary

| File | Change |
|---|---|
| `supabase/functions/ai-builder-background/index.ts` (~line 484-493) | Retry 400s with provider errors, sanitize error text before storing |
| `src/hooks/useAIAppBuilder.ts` (~line 38-62) | Add classifier case for provider 400 errors |
| `src/hooks/useBackgroundGeneration.ts` (~line 130) | Sanitize error_message before displaying in toast |


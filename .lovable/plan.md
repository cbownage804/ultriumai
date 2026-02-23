
## Fix: Provider Error Fallback Using Cross-Provider Model

### Problem

The logs show the exact failure chain:
1. Primary model (`google/gemini-3-flash-preview`) returns 400 "Provider returned error"
2. Fallback model (`google/gemini-2.5-flash`) ALSO returns 400 -- because it's the same Gemini provider
3. Background orchestrator retries 3 times, but each retry hits the same dead provider
4. Result: 100% build failure when Google's Gemini API has issues

### Root Cause

Both the primary and fallback models are Google Gemini. When the Gemini provider is down or rejecting requests, retrying with another Gemini model accomplishes nothing.

### Fix

**File: `supabase/functions/ai-app-builder/index.ts` (~lines 687-721)**

Change the provider-error fallback model from `google/gemini-2.5-flash` to `openai/gpt-5-mini` (a different provider entirely). This ensures that when Gemini is failing, the system falls back to OpenAI instead of retrying the same broken provider.

Additionally, add a **second fallback tier**: if the first fallback (OpenAI) also fails, try one more model (`google/gemini-2.5-pro`) as a last resort, since different Gemini model tiers can have independent availability.

```text
Current fallback chain:
  google/gemini-3-flash-preview (primary)
  -> google/gemini-2.5-flash (fallback) -- SAME PROVIDER, fails identically

New fallback chain:
  google/gemini-3-flash-preview (primary)
  -> openai/gpt-5-mini (1st fallback) -- DIFFERENT PROVIDER
  -> google/gemini-2.5-pro (2nd fallback) -- different Gemini tier as last resort
```

Changes:
- Line 651: Change `FALLBACK_MODEL` to `"openai/gpt-5-mini"` (used for token-limit retries too)
- Lines 688-721: After the first provider-error fallback fails, add a second try with `google/gemini-2.5-pro`
- Log which fallback succeeded for debugging

### Technical Details

| File | Change |
|---|---|
| `supabase/functions/ai-app-builder/index.ts` (lines 651, 687-726) | Switch fallback to cross-provider model (openai/gpt-5-mini), add second-tier fallback (google/gemini-2.5-pro) |

No frontend or background function changes needed -- the background function already retries the `ai-app-builder` endpoint, which will now internally cascade across providers.

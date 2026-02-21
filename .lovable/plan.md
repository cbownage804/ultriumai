

# Fix Potential Errors in Domain Auto-Connect

## Issues Found

### 1. CORS Header Mismatch (will cause failures in some browsers)
The `detect-registrar` edge function uses incomplete CORS headers. It's missing headers that the Supabase JS client automatically sends (`x-supabase-client-platform`, etc.). This can cause preflight request failures.

**Fix**: Update `supabase/functions/detect-registrar/index.ts` CORS headers to match the standard set used by other edge functions.

### 2. Analyzing overlay shows wrong registrar name during initial add
During `handleAddDomain`, the analyzing overlay tries to show the detected provider name via `domains.find(d => d.domain === analyzingDomain)?.registrar?.name`. But the domain entry isn't added to `domains` state until **after** analysis completes -- so the registrar name will always be missing during the initial add flow.

**Fix**: Store the detected registrar in a separate `detectedRegistrar` state variable during analysis, and reference that in the overlay instead of looking it up from `domains`.

### 3. No cleanup if modal closes mid-analysis
If the user closes the modal while the analyzing animation is running, the state (`isAnalyzing`, `analysisStep`, etc.) remains dirty. Reopening the modal could show a stale analyzing overlay.

**Fix**: Add a `useEffect` cleanup that resets analysis state when `open` changes to `false`.

### 4. No error state for failed edge function calls
If the `detect-registrar` call fails (network error, timeout), the user sees no feedback -- the animation just finishes silently.

**Fix**: Add a try/catch toast in `handleAddDomain` so if detection throws, the user sees a warning and falls back gracefully to manual setup.

---

## Technical Changes

| File | Change |
|------|--------|
| `supabase/functions/detect-registrar/index.ts` | Update CORS `Access-Control-Allow-Headers` to include `x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version` |
| `src/components/ai-builder/ProjectSettingsModal.tsx` | (a) Add `detectedRegistrar` state, use it in the overlay for step 2 label. (b) Add `useEffect` to reset analysis state when `open` becomes false. (c) Improve error handling in the analysis flow. |


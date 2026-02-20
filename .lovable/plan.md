

# 20-Phase Reliability Hardening Plan

After a deep review of the entire build pipeline (`useAIAppBuilder.ts`, `ai-app-builder/index.ts`, preview panel, smoke tests, auto-fix loop, and validation hooks), here are 20 concrete fixes to make builds succeed 100% of the time.

---

## Phase 1: Stall Detector Should Trigger Continuation, Not Just Cancel

**Problem:** The 15s stall detector (line 1216) calls `reader.cancel()` but doesn't set `controller.signal.aborted = true`. So `finalizeStream` sees `wasInterrupted = false` and doesn't trigger continuation for partial output.

**Fix (`useAIAppBuilder.ts`):** After stall detection, also call `controller.abort()` before `reader.cancel()` so `wasInterrupted` is correctly set.

---

## Phase 2: Race Condition Between rAF Flush and `finalizeStream`

**Problem:** The rAF-batched `upsertAssistant` (line 1175) may still have a pending frame when `readStream` returns. `finalizeStream` then calls `streaming.parseIncremental(fullContent)`, but the `messages` state may not yet reflect the final content.

**Fix (`useAIAppBuilder.ts`):** After `readStream` completes, cancel any pending rAF and do a synchronous final flush of `fullContent` into `messages` state before calling `finalizeStream`.

---

## Phase 3: `parseMultiFileOutput` Doesn't Handle Windows Line Endings

**Problem:** The parser splits on `\n`, but if the AI model or edge function proxy introduces `\r\n`, the `===FILE:` regex won't match lines ending in `\r`.

**Fix (`useAIAppBuilder.ts`):** Normalize line endings at the top of `parseMultiFileOutput`: `raw = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n')`.

---

## Phase 4: Conversation Memory Sent to Continuation Rounds

**Problem:** Continuation rounds (line 1727) include `apiMessages[0]` which is the consolidated system prompt with conversation memory, tone detection, and preferences. This is wasteful and can push continuation rounds over the token limit. Continuation only needs the base system prompt + file list.

**Fix (`useAIAppBuilder.ts`):** For continuation messages, construct a minimal system prompt containing only the base coding instructions (not conversation memory/tone/preferences). Store the original system prompt separately.

---

## Phase 5: Edge Function Has No Request Timeout for Branding Scrape

**Problem:** `scrapeBranding` (line 153 of edge fn) calls Firecrawl with `waitFor: 3000` but no `AbortController`. If Firecrawl takes 20s, the edge function burns most of its 60s budget on scraping, leaving insufficient time for the AI gateway call.

**Fix (`ai-app-builder/index.ts`):** Add a 5s `AbortController` timeout to the Firecrawl fetch. If it times out, skip branding and proceed with the build.

---

## Phase 6: File Hash Cache Grows Unbounded Across Sessions

**Problem:** `fileHashCache` (line 13) is a module-level `Map` that's never cleared. After many builds, it grows to thousands of entries for files that no longer exist, causing stale `getChangedFiles` results.

**Fix (`useAIAppBuilder.ts`):** In `clearChat`, also clear `fileHashCache`. In `updateFileHashes`, prune entries for paths not in the current file set.

---

## Phase 7: Auto-Rollback Fires on Non-Critical Errors

**Problem:** The rollback listener (line 1452) listens for `preview-error` messages with `critical: true`, but the preview panel sends ALL errors as messages. The `critical` flag isn't reliably set by the error injection script.

**Fix (`BuilderPreviewPanel.tsx`):** Ensure the preview error bridge only sets `critical: true` for uncaught exceptions and syntax errors (not console.warn or network 404s). Add a classification step in the injected script.

---

## Phase 8: Duplicate Request Fingerprint Blocks Retries

**Problem:** The dedup guard (line 697) hashes `input + imageUrls` and blocks requests within 3s. But `retryLastMessage` sends the same input, hitting the dedup guard if the user retries quickly.

**Fix (`useAIAppBuilder.ts`):** Exempt retry/auto-fix calls from the dedup check. Add a `skipDedup` parameter or reset `lastRequestFingerprint` in `retryLastMessage`.

---

## Phase 9: `estimateTokens` Underestimates Multimodal Content

**Problem:** `estimateTokens` (line 652) uses `text.length / 4`, but images are ~1K tokens each regardless of size. Combined text+image messages get inaccurate estimates.

**Fix (`useAIAppBuilder.ts`):** Use the same `estimateChars` function used for budget enforcement (line 1086) which correctly counts image blocks as 4000 chars.

---

## Phase 10: Version Snapshot Stores Full File Array by Reference

**Problem:** `setVersions` pushes `[...mergedFiles]` (shallow copy), but `mergedFiles` contains objects that are shared references. If a later round mutates a file object's `content`, the version snapshot is silently corrupted.

**Fix (`useAIAppBuilder.ts`):** Deep-copy file objects when creating version snapshots: `files: mergedFiles.map(f => ({ ...f }))`.

---

## Phase 11: Smart Fix Prompt Doesn't Include Error Stack Trace

**Problem:** `tryToFix` (line 1826) builds a fix prompt with just `error.message` and the source file. It doesn't include the stack trace, which is critical for debugging runtime errors like "Cannot read properties of undefined".

**Fix (`useAIAppBuilder.ts`):** Extend the `error` parameter type to include `stack?: string` and include it in the fix prompt. Update the preview error bridge to capture `error.stack`.

---

## Phase 12: `isConversationalLine` False-Positives on JSX Comments

**Problem:** The prose detector (line 343) matches lines starting with "This" or "I" — but JSX comments like `{/* This renders the header */}` and variable names like `This.component` trigger false positives, causing legitimate code to be stripped.

**Fix (`useAIAppBuilder.ts`):** Add an exclusion: if the line starts with `{/*` or is inside a template literal or string, skip the conversational check.

---

## Phase 13: Smoke Test Doesn't Run Automatically After Builds

**Problem:** `usePostBuildSmokeTest` exists but is never called from `finalizeStream`. It's only available as a standalone hook. Smoke test results don't feed into the auto-fix pipeline.

**Fix (`useAIAppBuilder.ts` + workspace orchestrator):** Call `runSmokeTest(mergedFiles)` at the end of `finalizeStream`. If errors are found, inject them into the `inlineError` field of the assistant message and trigger `onAutoFixError` for the first critical error.

---

## Phase 14: Edge Function Returns 503 Without Retry-After Header

**Problem:** When the AI gateway returns 500/502/503, the edge function wraps it as 503 (line 575) but doesn't include a `Retry-After` header. The client retries immediately, likely hitting the same issue.

**Fix (`ai-app-builder/index.ts`):** Add `"Retry-After": "5"` to the 503 response headers. In the client, respect this header by waiting before retrying.

---

## Phase 15: `applyHunkPatch` Silently Succeeds with Wrong Line Numbers

**Problem:** `applyHunkPatch` (line 374) only checks `start > lines.length` as out-of-bounds. If `startLine` is valid but `endLine` exceeds the file length, `splice` silently removes fewer lines than expected, producing corrupted output.

**Fix (`useAIAppBuilder.ts`):** Clamp `endLine` to `lines.length` and log a warning when the hunk doesn't match the expected range. If the content at `startLine` doesn't match the expected original content (fuzzy check), skip the hunk and warn.

---

## Phase 16: Build Mode Detection Overrides User's Explicit Choice

**Problem:** `detectIntent` (line 632) auto-switches mode based on keywords. If a user manually sets "discuss" mode but types "build a button", it silently switches to "build" mode.

**Fix (`useAIAppBuilder.ts`):** Only auto-detect intent on the first message of a conversation. After the user has explicitly set a mode, respect it unless they use a clear mode-switch phrase like "switch to build mode".

---

## Phase 17: Self-Review Instruction Not Injected into System Prompt

**Problem:** `useSelfReviewPass` exists with a well-crafted self-review instruction, but it's never actually injected into the system prompt sent to the AI. The self-review is dead code.

**Fix (`useAIAppBuilder.ts`):** Import and call `buildSelfReviewInstruction()` and append it to the `systemParts` array before building `apiMessages`.

---

## Phase 18: `deleteButtonAutoPatcher` Not Called After Builds

**Problem:** `useDeleteButtonAutoPatcher` implements 7 deterministic fixes for common broken patterns, but it's never called from the build pipeline. It's dead code.

**Fix (workspace orchestrator):** Call `patchDeleteButtons(mergedFiles)` after `finalizeStream` completes. If patches are applied, update `latestFiles` with the patched result and show a toast noting the auto-fixes.

---

## Phase 19: Gateway Model Fallback on Repeated Failures

**Problem:** If the default model (`gemini-3-flash-preview`) is having an outage, every retry uses the same model. There's no fallback to an alternative model.

**Fix (`ai-app-builder/index.ts`):** On the token-limit retry path (line 530), switch to a model with a larger context window or different provider. Add a `FALLBACK_MODEL` constant (e.g., `google/gemini-2.5-flash`) used only for retry attempts.

---

## Phase 20: Preview Error Bridge Doesn't Capture Unhandled Promise Rejections

**Problem:** The injected error capture script in `BuilderPreviewPanel` catches `window.onerror` and `console.error`, but doesn't catch `unhandledrejection` events. Async errors (failed fetch, Supabase queries) silently disappear without triggering the auto-fix pipeline.

**Fix (`BuilderPreviewPanel.tsx`):** Add `window.addEventListener('unhandledrejection', ...)` to the injected script that forwards the rejection reason as a preview error to the parent frame.

---

## Summary

| Phase | Issue | Impact | Fix Location |
|-------|-------|--------|-------------|
| 1 | Stall detector doesn't trigger continuation | Partial builds stop early | useAIAppBuilder.ts |
| 2 | rAF race with finalizeStream | Final content may be missed | useAIAppBuilder.ts |
| 3 | Windows line endings break parser | Files not detected on some models | useAIAppBuilder.ts |
| 4 | Full context sent to continuation rounds | Token limit exceeded on round 2+ | useAIAppBuilder.ts |
| 5 | Branding scrape has no timeout | AI gateway starved of time | ai-app-builder/index.ts |
| 6 | File hash cache grows unbounded | Stale incremental context | useAIAppBuilder.ts |
| 7 | Auto-rollback fires on non-critical errors | Good builds get reverted | BuilderPreviewPanel.tsx |
| 8 | Dedup blocks retries | Retry button doesn't work within 3s | useAIAppBuilder.ts |
| 9 | Token estimate wrong for images | Budget enforcement inaccurate | useAIAppBuilder.ts |
| 10 | Version snapshots are shallow copies | Rollback restores corrupted state | useAIAppBuilder.ts |
| 11 | Fix prompt missing stack trace | Auto-fix can't diagnose runtime errors | useAIAppBuilder.ts |
| 12 | Prose detector strips JSX comments | Legitimate code removed | useAIAppBuilder.ts |
| 13 | Smoke test never runs | Known issues not caught | useAIAppBuilder.ts |
| 14 | No Retry-After header on 503 | Client retries too fast | ai-app-builder/index.ts |
| 15 | Hunk patch silent corruption | Edits produce wrong output | useAIAppBuilder.ts |
| 16 | Mode detection overrides user choice | Discuss mode ignored | useAIAppBuilder.ts |
| 17 | Self-review instruction is dead code | AI doesn't self-check | useAIAppBuilder.ts |
| 18 | Delete button patcher is dead code | Known fix patterns not applied | Workspace orchestrator |
| 19 | No model fallback on outages | All retries fail together | ai-app-builder/index.ts |
| 20 | Unhandled rejections not captured | Async errors invisible | BuilderPreviewPanel.tsx |

## Files Changed

| File | Phases |
|------|--------|
| `src/hooks/useAIAppBuilder.ts` | 1, 2, 3, 4, 6, 8, 9, 10, 11, 12, 13, 15, 16, 17 |
| `supabase/functions/ai-app-builder/index.ts` | 5, 14, 19 |
| `src/components/ai-builder/BuilderPreviewPanel.tsx` | 7, 20 |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | 13, 18 |


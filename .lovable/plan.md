
# Final Round: Remaining Failure Points and Reliability Issues

After a full-stack audit of the workspace (2,611 lines), the `useAIAppBuilder` hook (2,070 lines), and the `ai-app-builder` edge function (776 lines), here are the remaining issues that cause failures, freezes, and broken previews.

---

## Issue 22: `handleSave` Calls `getCompiledHTML` Synchronously (4th redundant compilation)

**File**: `AIAppBuilderWorkspace.tsx`, line 1512

```typescript
const handleSave = useCallback(async () => {
  ...
  const html = getCompiledHTML(supabaseConfig, stripeConfig, envVars, ...);
  if (projectId && html) {
    captureAndUpload(html, projectId).catch(() => {});
  }
}, [...]);
```

Every manual save triggers a full synchronous `getCompiledHTML()` call for thumbnail capture, even though `compiledForHosting` or `stableHTML` already contain the exact same output. This is the FOURTH compilation path (after `liveCompiledHTML`, `compiledForHosting`, and the timer-based path).

**Fix**: Replace `getCompiledHTML(...)` with `compiledForHosting || stableHTML`.

---

## Issue 23: `upsertFile` Loop Still Exists in Conflict Resolution Path

**File**: `AIAppBuilderWorkspace.tsx`, line 686

```typescript
const nonConflicting = latestFiles.filter(f => !dirtyFiles.has(f.path));
for (const file of nonConflicting) upsertFile(file.path, file.content);
```

The Issue 6 fix only handles the non-conflict case. When there ARE dirty file conflicts, the non-conflicting files still go through the per-file `upsertFile` loop. For a 15-file project with 1 conflict, that is 14 sequential state updates.

**Fix**: Batch-merge non-conflicting files into a single `setFiles()` call, same as the non-conflict path.

---

## Issue 24: `stableHTML` Is Never Cleared Between Builds

**File**: `AIAppBuilderWorkspace.tsx`, line 1699

`stableHTML` is set during generation and after generation, but it is never reset to `null` when a NEW generation starts. This means the Issue 10 guard (`if (stableHTMLRef.current) return null;` in `liveCompiledHTML`) will skip compilation permanently after the first successful build, even when the files have changed in subsequent builds.

**Fix**: Reset `stableHTML` to `null` at the start of each generation. Add a `useEffect` that detects the `isGenerating` transition from false to true and calls `setStableHTML(null)`.

---

## Issue 25: Companion File Generation Uses Per-File `upsertFile` Loop

**File**: `AIAppBuilderWorkspace.tsx`, line 802

```typescript
companions.forEach(f => upsertFile(f.path, f.content));
```

After generation, the deferred `setTimeout` block generates companion test files and applies them one by one via `upsertFile`. This triggers N additional state updates and recompilations after the build just completed.

**Fix**: Batch companion files into a single `setFiles()` merge, or skip companion file generation if it triggers recompilation.

---

## Issue 26: Delete Auto-Patcher Uses Per-File `upsertFile` Loop

**File**: `AIAppBuilderWorkspace.tsx`, line 795

```typescript
patchResult.files.forEach(f => upsertFile(f.path, f.content));
```

Same per-file loop problem as Issue 25. The auto-patcher can patch multiple files, each triggering a state update and recompilation.

**Fix**: Batch patched files into a single `setFiles()` merge.

---

## Issue 27: `sendMessage` Creates New Closures on Every Call Due to `messages` Dependency

**File**: `useAIAppBuilder.ts`, line 1901

```typescript
}, [messages, isGenerating, mode, totalRemaining, deductCredits]);
```

The `sendMessage` callback depends on `messages`. Every time messages change (which happens during streaming, after generation, on auto-save, etc.), the callback is recreated. This causes every component that receives `sendMessage` as a prop to re-render. More critically, the `handleSend`, `handleFixError`, `handleSmartFixError`, `handlePhaseAdvance`, and ~15 other callbacks that depend on `sendMessage` are also recreated.

**Fix**: Use a ref to read `messages` inside `sendMessage` instead of including it in the dependency array. This is safe because `messages` is only read (not used for conditional logic).

---

## Issue 28: Edge Function Has No `max_tokens` / `temperature` Control

**File**: `supabase/functions/ai-app-builder/index.ts`, line 625

```typescript
body: JSON.stringify({
  model: selectedModel,
  messages: [...],
  stream,
}),
```

The edge function sends no `max_tokens`, `temperature`, or `top_p` parameters. This means:
- The AI model uses its default temperature (often 1.0), leading to inconsistent/creative code
- No output length cap, which contributes to gateway timeouts on long generations
- Different models have different defaults, causing behavioral inconsistency

**Fix**: Add `temperature: 0.3` (for deterministic code), `max_tokens: 16384` (prevent runaway), and `top_p: 0.95`.

---

## Issue 29: Edge Function Scrape-Then-Generate is Sequential (Adds 5-10s Latency)

**File**: `supabase/functions/ai-app-builder/index.ts`, lines 532-560

When a clone intent is detected, the edge function awaits `scrapeBranding()` (up to 5s timeout) BEFORE calling the AI gateway. This adds 5-10 seconds of latency to clone requests. The client ALSO scrapes via `firecrawl-scrape` (line 872 in `useAIAppBuilder.ts`), so the URL is scraped TWICE.

**Fix**: Remove the server-side scrape entirely. The client already injects scraped content into the message. The edge function should trust the client-side context.

---

## Issue 30: `isCompiling` State Flicker

**File**: `AIAppBuilderWorkspace.tsx`, lines 708-712

```typescript
setIsCompiling(true);
requestAnimationFrame(() => {
  setIsCompiling(false);
});
```

This sets `isCompiling` to `true` and immediately schedules setting it to `false` on the next animation frame. This causes a 1-frame flicker where `isCompiling` is true, which triggers UI updates in the `GeneratingOverlay` and status bar, only to immediately reverse them. It's effectively a no-op that wastes a render cycle.

**Fix**: Remove the `setIsCompiling(true)` / `requestAnimationFrame` block entirely. If compilation tracking is needed, tie it to actual compilation work.

---

## Summary

| Issue | Type | Impact | Fix |
|-------|------|--------|-----|
| 22. handleSave redundant compilation | Wasted CPU | 200-500ms on every manual save | Reuse compiledForHosting |
| 23. Conflict path upsertFile loop | Batching bug | N state updates for non-conflicting files | Single setFiles merge |
| 24. stableHTML never cleared | Logic bug | Preview never updates after first build | Reset on generation start |
| 25. Companion files per-file upsert | Batching bug | N state updates for test files | Single setFiles merge |
| 26. Auto-patcher per-file upsert | Batching bug | N state updates for patched files | Single setFiles merge |
| 27. sendMessage recreated on every message | Prop cascade | ~15 callbacks + child components re-render | Use messages ref |
| 28. No model params in edge function | Quality bug | Inconsistent/creative code, no output cap | Add temperature/max_tokens |
| 29. Double URL scraping | Latency bug | 5-10s added to clone requests | Remove server-side scrape |
| 30. isCompiling flicker | Wasted render | 1-frame UI flicker | Remove no-op block |

## Implementation Plan

### Step 1: Fix stableHTML lifecycle (Issue 24 -- CRITICAL)
Add a `useEffect` that resets `stableHTML` to `null` when `isGenerating` transitions from `false` to `true`. This is the most impactful fix -- without it, subsequent builds never recompile.

### Step 2: Batch remaining upsertFile loops (Issues 23, 25, 26)
- Conflict path: merge non-conflicting files with existing files in a single `setFiles()` call
- Companion files: collect into array and merge via `setFiles()`
- Auto-patcher: same batch merge pattern

### Step 3: Reuse compiled HTML in handleSave (Issue 22)
Replace `getCompiledHTML(...)` with `compiledForHosting || stableHTML` in the save handler.

### Step 4: Stabilize sendMessage callback (Issue 27)
Add a `messagesRef` that tracks current messages. Replace `messages` reads inside `sendMessage` with `messagesRef.current`. Remove `messages` from the dependency array.

### Step 5: Add model parameters to edge function (Issue 28)
Add `temperature: 0.3`, `max_tokens: 16384`, `top_p: 0.95` to the gateway request body.

### Step 6: Remove server-side URL scraping (Issue 29)
Delete the `scrapeBranding()` call and URL extraction logic from the edge function. The client already handles this.

### Step 7: Remove isCompiling flicker (Issue 30)
Delete the `setIsCompiling(true)` + `requestAnimationFrame` block.

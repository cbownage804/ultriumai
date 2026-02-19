

# True Speed Parity with Lovable — Eliminate All Remaining Bottlenecks

## Problem

After the previous optimizations (removing fake delays, gating scraping, skipping context for fresh projects), the app is still noticeably slower than Lovable. The remaining bottlenecks are in the **streaming hot loop** and **pre-request context building**.

## Root Causes (3 categories)

### A. Streaming Hot Loop: 2-3 `setMessages` calls per SSE token

Every single SSE token (hundreds per second) triggers:
1. `upsertAssistant()` which calls `setMessages()` — full React state update
2. `streaming.parseIncremental(fullContent)` — re-parses ALL content from scratch
3. Every ~2KB: `parsePlanSteps()` + another `setMessages()` call

This means React is reconciling the entire message list 200-500 times per second.

### B. Import Graph Rebuilt Per-File During Scoring

In `buildFileContext` (line 938), `buildImportGraph(files)` is called **inside** the `scored.map()` callback. This means for a project with 15 files, the import graph is rebuilt 15 times instead of once.

### C. Redundant Context Layers

The context pipeline runs 4 separate passes over the file list:
1. `trimForContext()` — scores and trims files
2. `getChangedFiles()` — hashes all files
3. `buildFileManifest()` — iterates all files again
4. `scored.map()` — scores files a second time with import graph

---

## Plan (4 changes, 1 file)

All changes are in `src/hooks/useAIAppBuilder.ts`.

### Change 1: Throttle Streaming UI Updates

Instead of calling `setMessages()` on every SSE delta, batch updates using `requestAnimationFrame`. This reduces React state updates from hundreds/second to ~60/second (one per frame).

**How:** Replace the `upsertAssistant` function with a batched version:
- Accumulate content into `fullContent` immediately (for parsing)
- Only call `setMessages()` inside a `requestAnimationFrame` callback
- Use a flag to prevent queuing multiple rAFs

This alone eliminates ~80% of the React reconciliation work during streaming.

### Change 2: Throttle `parseIncremental` Calls

`streaming.parseIncremental(fullContent)` re-parses the entire accumulated content on every token. For a 50KB response, this means scanning 50KB of text hundreds of times.

**How:** Only call `parseIncremental` when a meaningful amount of new content has arrived (every ~500 characters instead of every token). This reduces parse calls from hundreds to ~100 total.

### Change 3: Hoist Import Graph Out of the Scoring Loop

Move `buildImportGraph(files)` from inside the `scored.map()` callback (line 938) to before the loop, computing it once. Pass the pre-built graph into the scoring logic.

**How:** Add `const importGraph = buildImportGraph(files);` before the `scored` array creation, then reference it directly inside the map callback instead of rebuilding it.

### Change 4: Merge Plan Step Parsing Into the Batched Update

Instead of a separate `setMessages` call for plan steps every ~2KB, fold the plan step computation into the same `requestAnimationFrame` batch as the content update. This eliminates the second `setMessages` call entirely.

---

## Technical Detail

```text
BEFORE (per SSE token):
  fullContent += delta
  setMessages(...)           -- React reconciliation #1
  parseIncremental(50KB)     -- full re-parse
  [every 2KB]: parsePlanSteps() + setMessages(...)  -- React reconciliation #2

AFTER (per SSE token):
  fullContent += delta       -- just string concatenation
  [every frame via rAF]:
    setMessages(...)          -- 1 React reconciliation per 16ms
    parseIncremental(...)     -- only if 500+ new chars
    parsePlanSteps(...)       -- folded into same update
```

## Expected Impact

| Bottleneck | Before | After | Improvement |
|---|---|---|---|
| setMessages calls/sec | 200-500 | ~60 (rAF) | 70-88% reduction |
| parseIncremental calls | ~500 per response | ~100 | 80% reduction |
| Import graph builds | 15x per request | 1x | 93% reduction |
| Plan step setMessages | Separate call every 2KB | Merged into rAF batch | Eliminated |

Combined with the previous optimizations (no fake delays, gated scraping, condensed prompt, deferred suggestions), this should bring the perceived speed very close to Lovable's.

## Files to Change

| File | Changes |
|---|---|
| `src/hooks/useAIAppBuilder.ts` | Throttle streaming updates via rAF, throttle parseIncremental, hoist import graph, merge plan step updates |


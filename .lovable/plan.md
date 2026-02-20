

# True Lovable Parity: Continuation Loop Refactor

## Problem

The auto-continuation system was implemented as **3 levels of hardcoded copy-paste nesting** (lines 1642-1729), not a proper loop. This means:

- Round 4 (the stated max) can never actually fire
- Each round's code is duplicated, making bugs harder to fix
- `fullContent` is reset per round but `finalizeStream` overwrites `latestFiles` instead of merging with previous rounds' files, so earlier rounds' files can be lost if the AI doesn't re-output them
- The wall-clock timer from round 1 isn't properly reset for subsequent rounds

## Solution

Replace the nested copy-paste continuation blocks (lines 1642-1729) with a proper `while` loop that:

1. Runs up to `MAX_CONTINUATION_ROUNDS` iterations
2. Each iteration creates a fresh `AbortController`, resets `fullContent`, sets a fresh wall-clock timer
3. Merges new files into `latestFiles` cumulatively (previous rounds' files are preserved)
4. Breaks cleanly when `finalizeStream` returns `shouldContinue: false`

## Changes

### File: `src/hooks/useAIAppBuilder.ts`

**Replace lines 1642-1729** (the nested continuation blocks) with a `while` loop:

```
// After the initial finalizeStream returns:
let continuationResult = result;

while (continuationResult?.shouldContinue && continuationResult.generatedPaths) {
  clearTimeout(wallClockTimer);

  const contController = new AbortController();
  abortRef.current = contController;
  fullContent = '';
  streaming.startStreaming();

  const contMessages = [
    ...apiMessages.slice(0, 2),
    { role: 'assistant', content: `[Generated ${continuationResult.generatedPaths.length} files: ${continuationResult.generatedPaths.join(', ')}]` },
    { role: 'user', content: `[CONTINUE] You previously generated: ${continuationResult.generatedPaths.join(', ')}. Continue generating the remaining files. If more remain, end with ===CONTINUE===` },
  ];

  const contWallClock = setTimeout(() => {
    if (abortRef.current && !abortRef.current.signal.aborted) {
      abortRef.current.abort();
    }
  }, WALL_CLOCK_MAX_MS);

  try {
    const contResp = await fetchWithTimeout(BUILDER_URL, {
      method: 'POST',
      headers: fetchHeaders,
      body: buildPayload(contMessages),
      signal: contController.signal,
    });

    if (contResp.ok && contResp.body) {
      await readStream(contResp.body);
      continuationResult = await finalizeStream();
    } else {
      toast.warning('Could not continue generation -- using what was built so far.', { duration: 5000 });
      break;
    }
  } catch (contErr) {
    if (contErr.name !== 'AbortError') {
      toast.warning('Continuation failed -- partial results applied.', { duration: 5000 });
    }
    break;
  } finally {
    clearTimeout(contWallClock);
  }
}
```

This replaces ~90 lines of nested copy-paste with ~40 lines of a clean loop that properly supports all 4 rounds.

### File: `src/hooks/useAIAppBuilder.ts` — Fix `finalizeStream` File Merging

Currently `finalizeStream` merges new files into `currentFiles` (the snapshot from when `sendMessage` was called). For continuation rounds, `currentFiles` is stale -- it doesn't include files from previous rounds.

Fix: After the first round applies files via `setLatestFiles(mergedFiles)`, update a local `currentFiles` reference so subsequent rounds merge into the latest state.

Add a mutable `let workingFiles = [...currentFiles]` before `finalizeStream` is defined, and inside `finalizeStream`, after merging:

```
workingFiles = mergedFiles; // So next continuation round merges correctly
```

And change `finalizeStream`'s merge base from `currentFiles` to `workingFiles`.

## Summary

| What | Before | After |
|---|---|---|
| Continuation structure | 3 hardcoded nested blocks | Clean `while` loop |
| Max rounds reachable | 3 (round 4 unreachable) | All 4 rounds |
| Lines of code | ~90 | ~40 |
| File merging across rounds | Stale base (round 1 snapshot) | Cumulative merge |
| Wall-clock timer per round | Only round 1 | Fresh per round |

## Files Changed

| File | What |
|---|---|
| `src/hooks/useAIAppBuilder.ts` | Replace nested continuation with `while` loop; fix cumulative file merging |


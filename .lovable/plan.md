
# Fix: Agent "Task Complete" Before Build Actually Finishes

## Problem
Two related bugs visible in your screenshots:

1. **"Task complete" shows while still building** -- The agent panel shows "Completed 4 of 4 tasks / All done" while the build log still says "Building..." and the "Analyzing your request..." overlay is still active.
2. **Changes never applied** -- The logo wasn't replaced because the agent finished its verify step before any code was actually generated.

## Root Cause

The `sendMessage` function in `useAIAppBuilder.ts` submits a background job and **returns immediately** (line ~1296). It fires a `bg-job-started` event and exits. The agent mode (`useAgentMode.ts` line 348) does `await sendMessage(...)` expecting it to block until the build is done -- but it doesn't. So the agent instantly moves through verify and complete steps before any files are generated.

```text
CURRENT (broken):
  sendMessage() ---> submits job ---> returns immediately
  Agent: "Code generated!" (nothing generated yet)
  Agent: "Verifying..." (no files to verify)
  Agent: "Task complete!" (preview unchanged)
  ...meanwhile, background job is still streaming...

FIXED:
  sendMessage() ---> submits job ---> waits for bg-job-completed event
  ...background job streams, files are applied...
  Agent: "Code generated!" (files exist now)
  Agent: "Verifying..." (checks real output)
  Agent: "Task complete!" (preview shows changes)
```

## Solution

Make `sendMessage` return a Promise that resolves only when the background job actually completes (or fails). This requires:

### File: `src/hooks/useAIAppBuilder.ts`
- After dispatching the `bg-job-started` event, instead of returning immediately, listen for a corresponding `bg-job-completed` or `bg-job-failed` custom event.
- Wrap this in a Promise with a timeout (e.g., 3 minutes to match the existing `TOTAL_BUILD_MAX_MS`).
- When the job completes, resolve the Promise. When it fails or times out, reject/throw.
- The workspace already fires completion logic via `onComplete` in `useBackgroundGeneration` -- we need it to also emit a `bg-job-completed` event.

### File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
- In the `onComplete` callback of `useBackgroundGeneration`, dispatch a `bg-job-completed` custom event with the job ID.
- Similarly, in `onError`, dispatch a `bg-job-failed` event.

### No changes needed to `useAgentMode.ts`
The agent already correctly `await`s `sendMessage` -- it just needs `sendMessage` to actually wait.

## What This Fixes
- "Task complete" will only show after all files are generated and applied
- The verify step will check real output, not empty state
- Auto-fix will trigger on actual errors, not phantom ones
- The entire agent Plan-Execute-Verify-Fix loop will work as designed

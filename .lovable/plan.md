

## Problem

The "Compilation Error" screen appears because the 15-second safety timeout fires before the React compiler finishes. This happens because the browser's main thread is overloaded -- the agent's "Verifying output" step and the compilation are fighting for CPU time. When you hit back and return, compilation runs without contention and succeeds.

The core issue is that the `ERROR_FALLBACK_HTML` is treated as final -- once shown, there's no recovery path unless the user navigates away and back.

## Solution

Two changes to `src/components/ai-builder/CompilationBridge.tsx`:

### 1. Increase compilation timeout from 15s to 45s

The current 15s timeout is too aggressive for heavy React projects, especially when the browser is under load from the agent verification step. Increasing to 45s gives the compiler enough headroom.

### 2. Add auto-retry on compilation timeout

Instead of immediately showing the error fallback when the timeout fires, retry compilation once after a 2-second pause (letting the browser cool down). Only show the error fallback if the retry also fails.

Flow:
```text
Compilation starts
  |
  +-- 45s timeout fires
       |
       +-- First failure? --> Wait 2s, retry compilation
       |
       +-- Second failure? --> Show "Compilation Error"
```

### Technical Details

- Add a `compilationRetryCount` ref initialized to 0
- In the safety timeout handler (line 267-274): instead of immediately setting `ERROR_FALLBACK_HTML`, check if `compilationRetryCount < 1`. If so, increment the counter, unlock compilation (`compilationLockRef = false`, `compilationAttemptedRef = false`), and trigger a recompile by clearing the previous files digest. This causes the main effect to re-run.
- Reset `compilationRetryCount` to 0 at the start of each new compilation cycle
- Change `COMPILE_TIMEOUT_MS` from `15_000` to `45_000`


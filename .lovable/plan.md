

## Problem

The "Compilation Error" keeps appearing because of two bugs in `CompilationBridge.tsx`:

1. **Broken retry mechanism**: The retry (added in the last fix) tries to trigger a React effect re-run by calling `setLiveCompiledHTML(null)`, but `liveCompiledHTML` is not in the effect's dependency array. The effect depends on `[filesDigest, supabaseConfig, stripeConfig, isReactProject, isGenerating]` -- none of which change when `liveCompiledHTML` is set. So the retry never actually executes.

2. **Compilation startup is too fragile**: The chain of `500ms debounce -> requestAnimationFrame -> setTimeout(100ms) -> await setTimeout(0)` means compilation doesn't even start for 600ms+. When the browser is under load (from the agent's verification step running concurrently), `requestAnimationFrame` callbacks can be starved entirely by Firefox, preventing compilation from ever starting.

3. **Browser freeze from agent contention**: The agent's "Verifying output" step (`waitForPreviewErrors`) starts immediately after generation ends and runs concurrent with compilation. Both compete for the main thread, causing Firefox to show "This page is slowing down Firefox."

## Solution

Three changes, all in `src/components/ai-builder/CompilationBridge.tsx`:

### 1. Fix the retry mechanism -- call `runCompilation()` directly

Instead of trying to re-trigger the React effect (which doesn't work), the timeout handler will directly call `runCompilation()` again after a 2-second cooldown. This bypasses the effect system entirely and guarantees the retry executes.

### 2. Replace `requestAnimationFrame` with direct `setTimeout`

Remove the `requestAnimationFrame` wrapper that Firefox throttles under load. Use a single `setTimeout(50)` instead of `rAF + setTimeout(100)`. This cuts 550ms+ off the compilation start time and removes the browser-throttleable rAF dependency.

### 3. Reduce the safety timeout from 45s to 20s

With the retry now actually working, we can use a shorter timeout. First attempt times out at 20s, waits 2s, retries. If retry also fails at 20s, show the error. Total worst case: 42s (vs current 90s that never retries).

### Technical Details

**File: `src/components/ai-builder/CompilationBridge.tsx`**

- Change `COMPILE_TIMEOUT_MS` from `45_000` to `20_000` (line 9)
- In the safety timeout handler (lines 269-292): replace the broken effect-based retry with a direct `setTimeout(() => runCompilation(), 2000)` call
- Replace `requestAnimationFrame` + `setTimeout(100)` (lines 356-362) with a single `setTimeout(runCompilation, 50)`
- Remove the `cancelAnimationFrame` from cleanup since rAF is no longer used


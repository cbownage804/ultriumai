

# Fix: Eliminate Mid-Generation Compilation Freeze

## Problem

The browser freezes at ~40s during code generation. The root cause is `CompilationBridge.tsx` running `compileReactProject()` **during active streaming** via a 5-second polling timer (line 116). This function is a heavy synchronous operation that:

- Builds a module map with regex scans of every file
- Topologically sorts files via dependency graph construction
- Runs 20+ regex replacements per file for transpilation
- Assembles a large HTML string

Even though the `attempted` flag limits it to one call, that single call on 3-5 partial files can freeze the main thread for 2-5 seconds, triggering the "page is slowing down" browser warning. A second identical freeze point exists at the 120-second timeout (line 217).

## Solution

Remove both mid-generation compilation calls entirely. The preview already shows a skeleton overlay during generation -- attempting to compile incomplete, partially-streamed files is unreliable and causes the freeze. Compilation should only happen **after** generation completes, via the existing `liveCompiledHTML` useMemo which is already gated by `if (isGenerating) return null`.

## Changes (1 file)

**File**: `src/components/ai-builder/CompilationBridge.tsx`

### Change 1: Remove the 5-second timer-based compilation effect (lines 112-164)

Delete the entire `useEffect` that polls `partialFilesRef` every 5 seconds and calls `compileReactProject` during generation. This is the primary freeze source.

### Change 2: Remove the 120-second timeout compilation effect (lines 216-261)

Delete the entire `useEffect` that force-compiles partial files after 120 seconds. This is a secondary freeze source with the same heavy synchronous call.

### Change 3: Simplify the fallback error page logic

The null-compilation fallback (line 203-206) that shows "Compilation Error" when generation finishes but `liveCompiledHTML` is null -- this stays intact as it handles the post-generation case correctly.

## What Stays the Same

- `liveCompiledHTML` useMemo (line 167): Compiles AFTER generation ends -- this is the correct compilation point
- `compiledForHosting` useMemo (line 89): Also gated by `if (isGenerating) return null` -- safe
- GeneratingOverlay skeleton during streaming -- provides visual feedback without compilation
- Post-generation error fallback page -- catches compilation failures after streaming

## Technical Details

The removed effects total ~100 lines of complex async compilation logic. They are replaced by... nothing. The existing `liveCompiledHTML` useMemo already handles compilation after generation, and the skeleton overlay already handles the "during generation" UI. The mid-generation compilation was an optimization that backfired by freezing the browser.

## Expected Result

- Zero browser freezes during generation
- Preview shows skeleton during streaming (same as current visual)
- Compilation happens once, instantly after generation ends
- No more "This page is slowing down your browser" warnings

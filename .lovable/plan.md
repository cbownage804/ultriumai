
# Fix "Loading preview..." Stuck Permanently

## Problem

The App Builder preview stays stuck on skeleton "Loading preview..." forever. Screenshots show it persisting from 10:23 AM through 10:38 AM (15+ minutes) even though the AI finished writing files.

## Root Cause

There are two compounding issues:

### Issue 1: `isGenerating` stays `true` too long during continuation rounds

The continuation loop (up to 4 rounds x 55s wall-clock each = 220 seconds max) keeps `isGenerating` true the entire time. During this period, the `liveCompiledHTML` memo explicitly returns `null` (line 1811: `if (isGenerating) return null`), so the preview stays as skeleton. Additionally, if the stream stalls between continuation rounds, each round's 20s read timeout + 15s stall detector adds more wait time.

### Issue 2: No progress indicator during streaming

While `isGenerating` is `true`, the preview shows only static skeletons with no indication that files are being received. The "Loading preview..." text is static and gives users no feedback about progress, making it appear frozen even when the system is working correctly.

## Fix Plan

### Fix 1: Show a live progress overlay instead of static skeletons during generation

Instead of showing static skeleton placeholders during the entire generation, show a dynamic progress overlay that displays:
- Number of files received so far (from `completedFileCount`)  
- File names being generated (from `partialFiles`)
- A progress bar tied to the streaming state
- The continuation round number if applicable

This uses data already available from `useStreamingPreview` (`partialFiles`, `completedFileCount`, `isStreamingPreview`) — no new hooks needed.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Change**: In the preview area, when `isGenerating` is true, replace the static `SkeletonPreview` with a `GeneratingOverlay` component that shows real-time file generation progress.

### Fix 2: Add a maximum total generation time limit

Add a hard 3-minute cap across ALL continuation rounds combined (not per-round). If the total time exceeds 3 minutes, force-break the continuation loop and compile whatever files have been received.

**File**: `src/hooks/useAIAppBuilder.ts`  
**Change**: Add a `totalBuildStart` timestamp at the top of `sendMessage`. In the continuation `while` loop (line 1828), add a check: `if (Date.now() - totalBuildStart > 180_000) break;`

### Fix 3: Compile partial files for preview during generation

Instead of blocking ALL compilation while `isGenerating`, allow compilation of completed files (from `partialFiles` via `useStreamingPreview`) as a "live preview" that updates during streaming. This means the user can see the app taking shape while it's being built.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`  
**Change**: Add a secondary `useMemo` that compiles `partialFiles` when `isGenerating && completedFileCount > 0`, and use it to populate a "draft preview" visible to the user. The existing `stableHTML` logic stays untouched — this is purely additive.

### Fix 4: Force `stableHTML` update with a timeout fallback

If `isGenerating` has been `true` for more than 2 minutes but `partialFiles` has files, force-compile them and set `stableHTML` anyway, breaking the deadlock.

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`  
**Change**: Add a `useEffect` that starts a 120-second timer when `isGenerating` becomes `true`. If it fires while still generating and `partialFiles.length > 0`, compile partial files into `stableHTML` and display them.

## Technical Details

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Add progress overlay during generation, add 2-min timeout fallback for stableHTML, add partial file preview |
| `src/hooks/useAIAppBuilder.ts` | Add 3-minute total build time cap |

## Implementation Priority

Fix 2 (3-minute cap) is the most critical — it prevents the infinite-feeling wait. Fix 1 (progress overlay) is the most impactful UX improvement. Fix 3 and 4 are enhancements that make the wait feel productive.

## Risk

- **Low**: All fixes are additive safety mechanisms. The existing compilation and streaming logic is untouched.
- Fix 3 runs compilation during streaming which could cause brief UI jank, but it's throttled by the `completedFileCount` dependency.



## Fix: Compilation Loop Caused by Recovery Setting `isGeneratingOverride` for Already-Completed Jobs

### Root Cause

The loop has two contributing factors:

1. **`checkPendingJobs` treats completed jobs the same as active jobs.** When a recently-completed job is found (lines 406-426 of `useBackgroundGeneration.ts`), it calls `handleBgComplete` immediately AND returns the job ID. The caller in `AIAppBuilderWorkspace.tsx` (line 504-506) then sets `isGeneratingOverride = true` — but the job is already finished. This flips `isGenerating` back to `true` for CompilationBridge, which resets its internal state.

2. **`processedJobIdsRef` resets on remount.** It's a `useRef` inside the hook, so if the workspace component remounts (triggered by the iframe srcdoc change), the Set is empty again and the same completed job gets reprocessed.

The sequence each cycle:
```text
Mount -> recoverJobs() -> checkPendingJobs()
  -> finds completed job -> handleBgComplete() -> starts async compile
  -> returns job.id -> setIsGeneratingOverride(true)  // WRONG for completed jobs
  -> CompilationBridge sees isGenerating=true -> resets state
  -> compile finishes -> setIsGeneratingOverride(false) -> preview loads
  -> iframe srcdoc change -> remount -> processedJobIdsRef is empty -> repeat
```

### Fix (2 changes)

**1. `src/hooks/useBackgroundGeneration.ts` — Move `processedJobIdsRef` to module scope**

Move the `processedJobIdsRef` Set from inside the hook to module-level so it persists across component remounts. This is the primary defense against reprocessing the same job.

```typescript
// Module scope (outside the hook function)
const processedJobIds = new Set<string>();

// Inside the hook, replace processedJobIdsRef.current with processedJobIds
```

**2. `src/hooks/useBackgroundGeneration.ts` — Return a discriminated value for completed vs active jobs**

Change `checkPendingJobs` to return `{ type: 'active', id }` for in-progress jobs and `{ type: 'completed', id }` for already-finished jobs. This lets the caller distinguish them.

**3. `src/components/ai-builder/AIAppBuilderWorkspace.tsx` — Only set `isGeneratingOverride` for active jobs**

Update the recovery effect to only set `isGeneratingOverride(true)` when the recovered job is still active (pending/processing/streaming), NOT when it's already completed. Completed jobs are handled entirely by `handleBgComplete` which manages its own `setIsGeneratingOverride(false)` via `compilePromise.finally()`.

```typescript
const recovered = await backgroundGen.checkPendingJobs(userId);
if (recovered && !cancelled && recovered.type === 'active') {
  setIsGeneratingOverride(true);
}
```

### Result

- Completed jobs found on mount/tab-return are processed once by `handleBgComplete` without flipping `isGenerating` back to true
- Even if the component remounts, the module-level Set prevents reprocessing
- Active (in-progress) jobs still correctly set `isGeneratingOverride` for the overlay


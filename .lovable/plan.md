

# Fix Browser Freezing During Code Generation

## Root Cause

The streaming hot-reload effect (line 1136) calls `upsertFile()` for every partial file on **every single SSE token** received from the AI. Each `upsertFile` triggers a full React state update of `project.files`, which causes:

- Re-evaluation of every `useMemo` and `useEffect` that depends on `project.files` (dozens of them)
- Full React reconciliation of a 2800-line component with 100+ state variables and 50+ hooks
- This happens hundreds of times per second during streaming

Even though compilation and auto-saves are now guarded, the sheer volume of state updates from the streaming loop overwhelms the browser.

## Solution: Stop updating project files during streaming entirely

The streaming file updates into `project.files` serve no critical purpose during generation -- the code editor can display `partialFiles` directly, and compilation is already deferred. The final files arrive via `latestFiles` when generation completes (line 938-981), which is the canonical source.

### Changes (1 file)

**`src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

1. **Remove the streaming upsertFile loop** (lines 1136-1144): Delete the `useEffect` that calls `upsertFile` for every partial file during streaming. This eliminates hundreds of unnecessary state updates per second.

2. **Feed the code editor from `partialFiles` during streaming**: Update the code editor's file source so that while `isStreamingPreview` is true, the editor reads from `partialFiles` instead of `project.files`. This preserves the live code display without triggering state cascades.

3. **Track active streaming file without state updates**: Use a ref instead of calling `setActiveFile` during streaming. The editor tab can read the streaming file path from the already-computed `streamingFilePath` variable (line 1132).

### Technical Detail

```text
BEFORE (per SSE token):
  parseIncremental() -> setPartialFiles()
  useEffect triggers -> upsertFile(file1) -> setProject()
                     -> upsertFile(file2) -> setProject()
                     -> setActiveFile()   -> setProject()
  = 4+ React state updates per token x hundreds of tokens = FREEZE

AFTER (per SSE token):
  parseIncremental() -> setPartialFiles()
  (no useEffect, no upsertFile, no setProject)
  = 1 React state update per token = SMOOTH
```

### What the user will see

- Code editor still shows files being written in real-time (via partialFiles)
- Skeleton preview still displays during generation (unchanged)
- When generation completes, `latestFiles` syncs everything into `project.files` as before
- Preview compiles and renders after generation ends (unchanged)
- No more browser freezing


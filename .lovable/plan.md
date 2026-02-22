

## Fix: Browser Freeze During Generation

### Root Cause

The `AIAppBuilderWorkspace` component is **3096 lines** with **100+ hooks** (useState, useMemo, useCallback, useEffect). During streaming generation, `setFiles()` is called every 3 seconds (throttled) from `handleStreamDelta`. Each call triggers a **full re-render** of the entire workspace component, which means:

- All 100+ hooks re-evaluate their dependencies
- The `commandActions` useMemo (line 2325) depends on `project.files` and rebuilds its entire action list on every file change
- The `bundleForBrowser` useCallback depends on `astBundler` and `incrementalCompiler`, creating new function references
- Dozens of useEffect dependency arrays are checked
- The entire JSX tree (3096 lines of components, panels, dialogs) is re-diffed by React

With files changing every 3 seconds during a 30-60 second generation, that is 10-20 full re-renders of a monster component, each taking 200-500ms, freezing the browser.

### Fix (3 targeted changes)

#### 1. Skip `setFiles` during streaming -- use refs instead

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (lines 390-406)

The `handleStreamDelta` callback currently calls `setFiles(mergedFiles)` during streaming to show files appearing in the editor. Instead, we should defer this to refs and only call `setFiles` once when generation completes (in `handleBgComplete`). The streaming file display already works via `partialFilesRef` and `StreamingCodeEditor` -- the `setFiles` call during streaming is redundant and only serves to trigger expensive re-renders.

```typescript
// In handleStreamDelta, replace setFiles(mergedFiles) with a no-op during streaming:
// The files will be properly set in handleBgComplete when generation finishes.
// StreamingCodeEditor already reads from partialFilesRef for live file display.
```

#### 2. Remove `project.files` from `commandActions` dependencies

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (line 2343)

The `commandActions` useMemo depends on `project.files`, but the only actions that use files (code smells, gen-readme) can read them at click time from a ref instead. This prevents the entire command action list from being rebuilt on every file change.

```typescript
// Store project.files in a ref
const projectFilesRef = useRef(project.files);
projectFilesRef.current = project.files;

// In commandActions, read from ref instead of closure:
// action: () => { const smells = codeSmellDetector.analyzeFiles(projectFilesRef.current); ... }
// Remove project.files from the dependency array
```

#### 3. Guard `handleStreamDelta` to not call `setFiles` at all

**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (lines 376-407)

Remove the `setFiles` call entirely from the streaming path. The streaming code editor already uses `partialFilesRef` for live display. The final authoritative file state is set in `handleBgComplete` when the job finishes. Calling `setFiles` during streaming provides no user-visible benefit but causes catastrophic re-renders.

### Technical Detail

The streaming architecture already has a ref-based path for displaying partial files:
- `useStreamingPreview` stores files in `partialFilesRef` (no state, no re-renders)
- `StreamingCodeEditor` polls `partialFilesRef` at 3-second intervals with local state
- `GeneratingOverlay` reads from `partialFilesRef` and `completedFileCountRef`

The only reason `setFiles` was being called during streaming was to update the file tree sidebar, but this is not visible during generation (the overlay covers it). The fix simply stops calling `setFiles` during streaming and lets `handleBgComplete` set the final file state once.

### Expected Result

- No more browser freezes during generation
- Streaming overlay continues to show file progress (via refs)
- Files are set once when generation completes
- Preview compilation runs once after generation, not during


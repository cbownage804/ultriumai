

# Full Diagnosis: It's Not Just Re-renders

After deep-diving into the code, I found **at least 5 distinct problems** that collectively keep the preview stuck on skeletons. Re-renders were one, and you've mostly fixed those. But the remaining issues are just as critical.

---

## Issue 1: `setThinkingPhase` Still Re-renders the Workspace During Streaming

**File**: `src/hooks/useAIAppBuilder.ts`, line 1291

Inside the streaming loop, every time a `===FILE:` marker appears in the content:
```
setThinkingPhase('writing');
setTimeout(() => setThinkingPhase(null), 500);
```

`thinkingPhase` is `useState` inside `useAIAppBuilder`, which is consumed by the workspace. This fires repeatedly during streaming, causing workspace re-renders that you spent the last several rounds eliminating.

**Fix**: Gate this so it only fires once (use a ref flag), or remove it entirely since the overlay already shows progress.

---

## Issue 2: `editorStreamFiles` Polling Re-renders the Workspace Every 400ms

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`, lines 1057-1068

```typescript
const [editorStreamFiles, setEditorStreamFiles] = useState<ProjectFile[]>([]);
useEffect(() => {
  const interval = setInterval(() => {
    const files = partialFilesRef.current;
    setEditorStreamFiles(prev => prev !== files ? files : prev);
  }, 400);
  ...
}, [isStreamingPreview, partialFilesRef]);
```

This is `useState` **inside the workspace component itself**. Every 400ms during streaming, if partialFilesRef changed (which it does on every parse), this triggers a full workspace re-render. This defeats all the ref-based optimizations.

**Fix**: Move the editor file display to a child component with its own local state, or use a ref here too and only update the CodeEditor directly.

---

## Issue 3: Vanilla HTML Projects Can Never Compile During Streaming

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`, line 1847

In the timer-based compilation, the vanilla (non-React) branch calls:
```typescript
const html = getCompiledHTML(supabaseConfig, ...);
```

But `getCompiledHTML` reads from `project.files`, which is **empty during initial generation**. Files only get populated when `setLatestFiles` triggers the `latestFiles` effect (line 858-903) at the END of streaming. So for non-React projects, the 3-second timer will check every 3 seconds and always get `null` -- the preview never appears until generation fully completes.

**Fix**: Pass `pFiles` (from `partialFilesRef`) to a temporary file system or compile vanilla HTML directly from the partial files array, just like the React path already does.

---

## Issue 4: Post-Generation "Wall of Work" Blocks the Main Thread

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`, lines 858-1000

When generation ends and `setLatestFiles` fires, the `latestFiles` effect runs **synchronously** and triggers:

1. `upsertFile()` for every single file (individual state updates)
2. `updateBranchFiles()`
3. `codeSmellDetector.analyzeFiles()` -- analyzes ALL files
4. TypeScript validation (`tsValidator.validate()`)
5. Smoke tests (`smokeTest.runSmokeTest()`)
6. Dependency conflict detection
7. Lighthouse audit
8. Bundle size analysis
9. Delete button auto-patcher
10. Auto-generate companion test files
11. `compileReactProject()` or `getCompiledHTML()` for the preview

This is hundreds of milliseconds (possibly seconds) of synchronous work that blocks the preview from appearing even AFTER generation completes.

**Fix**: Defer non-critical work (`codeSmellDetector`, `lighthouseAudit`, `bundleSize`, `fileScaffolding`) to `requestIdleCallback` or `setTimeout(..., 0)`. Prioritize compilation first.

---

## Issue 5: Multiple `setMessages` Calls During Finalization

**File**: `src/hooks/useAIAppBuilder.ts`, lines 1327 and 1589

`finalizeStream()` calls `setMessages` twice:
- Line 1327: Commits the final assistant content
- Line 1589: Adds `filesGenerated`, `buildSummary`, `migrations`, etc.

Each `setMessages` call re-renders the workspace. Plus line 1636 does a THIRD call to add suggestions.

**Fix**: Merge all updates into a single `setMessages` call, or defer the enrichment call with `requestAnimationFrame` (the suggestions one already does this, but the line 1589 one doesn't).

---

## Summary Table

| Issue | Type | Impact | Fix Difficulty |
|-------|------|--------|----------------|
| 1. `setThinkingPhase` in stream loop | State change during streaming | Workspace re-renders on every FILE marker | Easy -- gate with ref flag |
| 2. `editorStreamFiles` polling | State change every 400ms | Workspace re-renders 2.5x/sec | Medium -- extract to child component |
| 3. Vanilla HTML can't compile during streaming | Logic bug | Non-React previews never appear until stream ends | Medium -- pass pFiles to compiler |
| 4. Post-generation wall of synchronous work | Main thread blocking | Preview delayed 1-3s after generation ends | Medium -- defer non-critical work |
| 5. Multiple `setMessages` in finalization | State changes | 2-3 workspace re-renders at stream end | Easy -- merge calls |

## Implementation Plan

### Step 1: Fix `setThinkingPhase` (Issue 1)
In `useAIAppBuilder.ts`, add a `thinkingPhaseSetRef` boolean ref. Only call `setThinkingPhase('writing')` once, then never again during the same stream.

### Step 2: Extract editor streaming to a child component (Issue 2)
Create a thin wrapper around CodeEditor that owns the `editorStreamFiles` state and polling interval. The workspace passes `partialFilesRef` and `isStreamingPreview` as props; the child does its own 400ms poll with local state.

### Step 3: Fix vanilla compilation path (Issue 3)
In the timer-based compilation effect, for the non-React branch, temporarily set `project.files` from `pFiles` before calling `getCompiledHTML`, or better: build a standalone vanilla compiler function that accepts a files array directly (like `compileReactProject` already does).

### Step 4: Defer post-build work (Issue 4)
Wrap non-critical analyses (`codeSmellDetector`, `lighthouseAudit`, `bundleSize`, `fileScaffolding`, `deleteAutoPatcher`) in `setTimeout(() => { ... }, 100)` so compilation and preview update happen first.

### Step 5: Merge `setMessages` calls (Issue 5)
Combine the two `setMessages` calls in `finalizeStream` into one that includes both the content and the metadata enrichment.




# Remaining Issues Beyond Re-renders

After reviewing the full codebase, here are 6 additional problems that contribute to freezes and preview failures -- none of which are re-render related.

---

## Issue 6: `upsertFile()` Loop Causes N State Updates for N Files

**File**: `AIAppBuilderWorkspace.tsx`, line 880

When generation completes and `latestFiles` fires, the effect does:
```typescript
for (const file of latestFiles) upsertFile(file.path, file.content);
```

Each `upsertFile` call individually updates the `project.files` state. For a 15-file project, that is 15 sequential state updates, each triggering a re-render and a `liveCompiledHTML` recomputation. The first render (line 877) uses `setFiles(latestFiles)` for empty projects, but for iterative builds (existing project + new files), it falls into the loop.

**Fix**: Batch all file updates into a single `setFiles()` call by merging existing files with new ones in one pass, instead of calling `upsertFile` per file.

---

## Issue 7: 120s Force-Compile Fallback Still Uses `project.files` for Vanilla

**File**: `AIAppBuilderWorkspace.tsx`, line 1939

The 120-second safety net attempts vanilla compilation via:
```typescript
const html = getCompiledHTML(supabaseConfig, ...);
```

But `getCompiledHTML` reads from `project.files`, which is still empty during initial generation. The Issue 3 fix was applied to the 3-second timer, but this 120-second fallback was missed. It will always return `null` for new vanilla projects.

**Fix**: Use `partialFilesRef.current` for the vanilla fallback path too, same as the 3-second timer.

---

## Issue 8: `streamingFilePath` State Lives in the Workspace

**File**: `AIAppBuilderWorkspace.tsx`, line 1064

```typescript
const [streamingFilePath, setStreamingFilePath] = useState<string | null>(null);
const handleStreamingFileChange = useCallback((path: string | null) => {
  setStreamingFilePath(path);
}, []);
```

The `StreamingCodeEditor` child calls `onStreamingFileChange` every 400ms when the active streaming file changes. This updates `streamingFilePath` state in the workspace, triggering a full re-render. This partially undoes the benefit of extracting the editor to a child component.

**Fix**: Move `streamingFilePath` to a ref, or keep it entirely inside `StreamingCodeEditor` and pass it to the `FileTabBar` via a separate lightweight child.

---

## Issue 9: 400+ Panel Accessor/Setter Variables Recreated on Every Render

**File**: `AIAppBuilderWorkspace.tsx`, lines 368-792

The component creates ~200 boolean accessors (`const showX = !!panels.showX`) and ~200 setter functions (`const setShowX = sp('showX')`) on every render. The `sp` callback (line 579) depends on `panels`, so whenever ANY panel toggles, all 200 setters are recreated.

This is not a streaming issue, but it adds significant overhead to every render -- each render has to allocate and garbage-collect 400+ closures. During rapid state changes (like generation ending), this compounds the problem.

**Fix**: Replace the 200 individual boolean variables with direct `panels.showX` reads in JSX. Replace `sp()` setters with a single `togglePanel(key)` function. This eliminates 400 variable allocations per render.

---

## Issue 10: `liveCompiledHTML` Runs Synchronously When Generation Ends

**File**: `AIAppBuilderWorkspace.tsx`, line 1866

```typescript
const liveCompiledHTML = useMemo(() => {
  if (isGenerating) return null;
  if (project.files.length === 0) return null;
  if (isReactProject) {
    const result = compileReactProject(project.files, ...);
    return result.html || null;
  }
  return getCompiledHTML(...);
}, [project.files, ..., isGenerating]);
```

When `isGenerating` flips from `true` to `false`, this memo immediately runs the compiler synchronously on the full file set. For React projects with 15+ files, `compileReactProject` can take 200-500ms, blocking the main thread at exactly the moment the user expects to see the preview.

But the timer-based compilation (lines 1814-1863) should have ALREADY produced a `stableHTML` during generation. The issue is that `liveCompiledHTML` runs again anyway (because `isGenerating` changed), and the `useEffect` on line 1890 overwrites `stableHTML` with the (identical) new result. This is redundant work.

**Fix**: Skip the `liveCompiledHTML` recomputation if `stableHTML` is already set from the timer-based path. Only recompile from `project.files` if `stableHTML` is still `null` when generation ends.

---

## Issue 11: `setFiles` for Initial Projects Doesn't Trigger Preview Compilation

**File**: `AIAppBuilderWorkspace.tsx`, line 878

For brand-new projects (`project.files.length === 0`), the effect calls:
```typescript
setFiles(latestFiles);
```

This updates `project.files` in one batch (good). But the `liveCompiledHTML` memo depends on `project.files`, so it runs the compiler synchronously in the same render. Meanwhile, `stableHTML` may already contain a valid preview from the timer-based compilation. The `useEffect` on line 1890 then overwrites `stableHTML` with the `liveCompiledHTML` result, causing a potentially unnecessary iframe reload.

**Fix**: In the `useEffect` on line 1890, skip updating `stableHTML` if it already has content and the new `liveCompiledHTML` is equivalent (same length or hash check).

---

## Summary

| Issue | Type | Impact | Fix |
|-------|------|--------|-----|
| 6. upsertFile loop | Batching bug | N state updates + N compiler runs | Single setFiles() merge |
| 7. 120s fallback uses project.files | Logic bug | Vanilla preview never appears at 120s | Use partialFilesRef |
| 8. streamingFilePath in workspace | State leak | Workspace re-renders during streaming | Move to ref or child |
| 9. 400+ panel variables per render | Allocation overhead | ~5ms per render wasted on closures | Use panels object directly |
| 10. Redundant compilation at generation end | Wasted CPU | 200-500ms blocked main thread | Skip if stableHTML exists |
| 11. Unnecessary iframe reload | UX bug | Preview flickers when generation ends | Skip duplicate stableHTML write |

## Implementation Plan

### Step 1: Batch upsertFile into single setFiles (Issue 6)
In the `latestFiles` effect, merge existing `project.files` with `latestFiles` into a single array and call `setFiles(merged)` once, eliminating the per-file loop.

### Step 2: Fix 120s fallback for vanilla (Issue 7)
In the 120s force-compile effect, replace the vanilla `getCompiledHTML()` call with the same inline CSS/JS approach used in the 3-second timer (reading from `partialFilesRef`).

### Step 3: Move streamingFilePath to ref (Issue 8)
Convert `streamingFilePath` from `useState` to `useRef`. Only the `FileTabBar` needs it, and it can read from the ref directly or receive it from `StreamingCodeEditor`.

### Step 4: Eliminate panel variable explosion (Issue 9)
Replace all `const showX = !!panels.showX` with direct `panels.showX` in JSX. Create a single `togglePanel` function instead of 200 individual setters.

### Step 5: Skip redundant compilation (Issue 10)
Add a guard to `liveCompiledHTML`: if `stableHTML` is already set when `isGenerating` goes to `false`, return `stableHTML` instead of recompiling.

### Step 6: Prevent duplicate stableHTML writes (Issue 11)
In the `useEffect` that syncs `liveCompiledHTML` to `stableHTML`, skip the write if `stableHTML` already has content.


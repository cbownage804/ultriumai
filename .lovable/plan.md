

## Fix: Project Auto-Naming Not Persisting + Thumbnail Not Capturing

### Issue 1: Project Auto-Naming Doesn't Persist to Database

**Root cause**: `renameProject` in `useProjectFileSystem.ts` (line 156) only updates React state -- it never writes to the database. So when the auto-name logic fires after the first build, the name shows in the UI momentarily but reverts to "Untitled Project" in the dashboard because the DB row was never updated.

**Fix**: After `renameProject()` is called in the auto-name block (line 1177 of `AIAppBuilderWorkspace.tsx`), immediately persist the new name to the database if `currentProjectId` exists.

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~line 1176-1179)**
- After `renameProject(projectName)`, add a direct Supabase update:
  ```
  if (currentProjectId) {
    supabase.from('builder_projects')
      .update({ name: projectName })
      .eq('id', currentProjectId)
      .then(() => console.log('Project auto-named:', projectName));
  }
  ```

---

### Issue 2: Thumbnail Never Captures After Build

**Root cause**: The auto-capture effect (line 2102) fires when `isGenerating` flips from true to false, and reads `compiledForHosting`. But `compiledForHosting` is set by `CompilationBridge` asynchronously AFTER the generation completes, so it is still `null` when the effect runs. The `if (html)` check silently fails.

**Fix**: Instead of relying on `compiledForHosting` (which lags behind), listen for the `stableHTML` ref which is set directly in `handleBgComplete`. Use a longer delay and read from the ref.

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~line 2100-2112)**
- Change the auto-capture effect to use `stableHTMLRef.current` (already set in `handleBgComplete`) instead of `compiledForHosting` state
- Increase the timeout from 2000ms to 4000ms to allow compilation to finish for React projects
- Add a fallback: if `stableHTMLRef.current` is still null at 4s, try `compiledForHostingRef.current`

```
useEffect(() => {
  if (wasGeneratingRef.current && !isGenerating && project.files.length > 0 && currentProjectId) {
    setTimeout(() => {
      const html = compiledForHostingRef.current || stableHTMLRef.current;
      if (html) {
        captureAndUpload(html, currentProjectId).catch(() => {});
      }
    }, 4000);
  }
  wasGeneratingRef.current = isGenerating;
}, [isGenerating, project.files.length, currentProjectId, captureAndUpload]);
```

Note: Removing `compiledForHosting` from the dependency array prevents the effect from re-running every time compilation finishes (which was causing additional no-op invocations).

---

### Summary

| File | Change |
|---|---|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~line 1176) | Persist auto-generated name to DB immediately after renaming |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~line 2100) | Fix thumbnail capture to use ref instead of stale state, increase delay |


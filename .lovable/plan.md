

## Diagnosis: Blank White Preview on New Projects

The screenshot shows Sandpack rendering a blank white iframe. The golden template files ARE being loaded into Sandpack, but the preview is white. This is caused by two issues:

### Issue 1: Sandpack initialization race condition

`previewFiles` is initialized via `useState(() => buildSandpackFileMap(project.files))` — but `project.files` starts as `[]` (empty array from `DEFAULT_PROJECT`). So on first render, `previewFiles = {}` (empty object). The golden template init `useEffect` fires *after* the first render, setting files, which then triggers the sync effect. But `SandpackProvider` has already mounted with empty files and shows a white iframe.

### Issue 2: Sandpack shows loading/white while downloading dependencies

Even after files arrive, Sandpack downloads `react` and `react-dom` from its CDN on every mount. During this time it shows a white/loading state. There's no loading indicator configured.

### Issue 3: `previewFilesForRender` may resolve to empty LKG

`lastKnownGoodPreviewFilesRef` is initialized from the empty initial `previewFiles`, so even the fallback is empty.

---

### Plan

**1. Initialize `previewFiles` with golden template immediately (not after mount effect)**

In `AIAppBuilderWorkspace.tsx`, change the `useState` initializer:

```typescript
const [previewFiles, setPreviewFiles] = useState<SandpackFileMap>(
  () => buildSandpackFileMap(project.files.length > 0 ? project.files : getGoldenProjectFiles())
);
```

And similarly for `lastKnownGoodPreviewFilesRef`.

**2. Add Sandpack loading state UI**

In `BuilderPreviewPanel.tsx`, use Sandpack's `useSandpack` hook or wrap `SandpackPreview` with a loading overlay so users see a "Loading preview..." indicator instead of a blank white box while Sandpack downloads dependencies.

**3. Show the placeholder empty-state for golden projects instead of Sandpack**

Currently the condition `previewFiles && Object.keys(previewFiles).length > 0` is true even for golden projects, so it renders Sandpack instead of the "Live Preview / Describe what you want to build" placeholder. The `isGoldenProject` prop exists but isn't used to gate Sandpack rendering.

Change the rendering logic:

```
{previewFiles && Object.keys(previewFiles).length > 0 && !isGoldenProject ? (
  <SandpackProvider ...>
    ...
  </SandpackProvider>
) : isGenerating || isCompiling ? (
  <SkeletonPreview ... />
) : (
  // placeholder UI
)}
```

This shows the friendly placeholder for new projects and only activates Sandpack once the user generates something.

---

### Files to edit

- `src/components/ai-builder/AIAppBuilderWorkspace.tsx` — Fix `previewFiles` initialization to use golden files as default; ensure LKG ref is also seeded.
- `src/components/ai-builder/BuilderPreviewPanel.tsx` — Gate Sandpack rendering on `!isGoldenProject`; add a loading indicator inside the Sandpack container for non-golden projects.




# Steps 2, 6, 9, 18 — Next Batch Implementation

## Step 2: Duplicate Compile Suppression

**Problem**: The `filesDigest` effect in `CompilationBridge.tsx` (line ~761) can fire multiple times for the same content due to StrictMode double-effects and the `recompileNeededRef` path.

**Changes**:
- In `CompilationBridge.tsx`, add a `lastCompiledDigestRef` that stores the digest of the last successfully started compile along with a timestamp.
- Before entering the compile debounce timer (line ~822), check: if `filesDigest === lastCompiledDigestRef.current.digest` and within 2 seconds, skip entirely.
- Set `lastCompiledDigestRef` when compile starts (line ~863).
- Reset it on force-compile and generation-start.

**Files**: `CompilationBridge.tsx`

---

## Step 6: Context Window Optimization

**Problem**: `useContextBudget.ts` treats all files equally. Large CSS/config files consume budget meant for component code. No "skeleton mode" for large files.

**Changes to `useContextBudget.ts`**:
- Add file-type scoring: CSS files (`*.css`) get -20 score, config files (`tailwind.config.*`, `postcss.*`, `vite.config.*`, `package.json`) get -15 score.
- Add "skeleton mode": for files over 3000 chars that don't fit full budget and have score < 50, send first 50 lines + last 20 lines with a `// ... {N} lines omitted` comment instead of manifest-only mode. This preserves imports/exports context.
- Never omit (always include full content) for files with score >= 50 (active file, mentioned in prompt), even if over budget.

**Files**: `useContextBudget.ts`

---

## Step 9: Post-Generation Diff Summary

**Problem**: Users don't know what the AI changed. A "change hero image" prompt might silently rewrite other files.

**Changes**:
- After generation completes in `AIAppBuilderWorkspace.tsx`, compute a diff summary using `lkgDiff` (already wired at line ~1300). Produce a summary: files modified, files added, files removed, approximate lines changed.
- Append an automatic system-style message to the chat with this summary (collapsible). Add a `diffSummary` field to `BuilderMessage` type in `useAIAppBuilder.ts`.
- In `BuilderChatPanel.tsx`, render `diffSummary` messages as a compact collapsible card showing file names and change counts.

**Files**: `AIAppBuilderWorkspace.tsx`, `useAIAppBuilder.ts` (type), `BuilderChatPanel.tsx`

---

## Step 18: Deploy Gate Enforcement

**Problem**: `useDeployGate` exists and runs smoke tests, but `PublishPanel` calls `onPublish` directly without checking results.

**Changes to `PublishPanel.tsx`**:
- Accept a new prop `previewIframeRef` from parent.
- Accept `runSmokeTests` from parent (or import `useDeployGate` directly).
- Before calling `onPublish`, run smoke tests. Show a "Running pre-deploy checks..." state with a spinner.
- If smoke tests fail, show the specific failures in a red alert box and block publish with a "Fix these issues first" message. Allow a "Publish anyway" escape hatch.
- If smoke tests pass, show green checkmarks and proceed.

**Changes to `AIAppBuilderWorkspace.tsx` / `WorkspacePanelLayer.tsx`**:
- Pass `previewIframeRef` and `runSmokeTests` down to `PublishPanel`.

**Files**: `PublishPanel.tsx`, `WorkspacePanelLayer.tsx`, `AIAppBuilderWorkspace.tsx`

---

## Technical Summary

| Step | Files Modified | Complexity |
|------|---------------|------------|
| 2 — Dedup compiles | CompilationBridge.tsx | Low |
| 6 — Context optimization | useContextBudget.ts | Low |
| 9 — Diff summary | AIAppBuilderWorkspace.tsx, useAIAppBuilder.ts, BuilderChatPanel.tsx | Medium |
| 18 — Deploy gate | PublishPanel.tsx, WorkspacePanelLayer.tsx, AIAppBuilderWorkspace.tsx | Medium |


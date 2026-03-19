

# Lovable Parity — Wave 3

Six improvements targeting the remaining experience gaps. Focus: generation accuracy, developer confidence, and workflow polish.

---

## 1. Per-File Accept/Reject in Generation Output

**Gap**: After AI generates code, all files are applied atomically. Lovable lets users review each file and selectively accept or reject individual files before they're applied. The `AgentDiffReviewModal` exists but is only used for agent mode, not standard generations.

**Fix**: After generation completes, if more than 1 file was changed, show a lightweight inline diff review in the chat message (expand the existing diff summary card). Add per-file "Accept" / "Reject" checkboxes. Only apply accepted files; rejected files are discarded. Reuse the `DiffReviewPanel` pattern.

**Files**: `BuilderChatPanel.tsx` (inline review UI), `AIAppBuilderWorkspace.tsx` (deferred file application)

---

## 2. Persistent File Tabs with Reorder

**Gap**: Open file tabs reset on refresh. Lovable remembers which files are open, their order, and which tab is active. Tab order can be changed via drag-and-drop.

**Fix**: Persist open tabs + active tab to `localStorage` keyed by project ID. Restore on mount. Add basic drag-to-reorder using native HTML5 drag events (no library needed). Save order on every change.

**Files**: `FileTabBar.tsx` (drag reorder + persist), `AIAppBuilderWorkspace.tsx` (restore on mount)

---

## 3. Smart Follow-Up Prompts from Build Errors

**Gap**: When a build fails, the user sees the error and a "Try to fix" button. Lovable also suggests specific follow-up prompts based on the error type (e.g., "Install missing package X", "Add the missing import for Y").

**Fix**: In the error display area of `BuilderChatPanel.tsx`, parse the `ParsedViteError` to generate 2-3 specific actionable chips (e.g., "Add missing import for `useState`", "Create file `src/utils/helpers.ts`"). Clicking a chip sends it as a prompt.

**Files**: `BuilderChatPanel.tsx` (error-specific suggestion chips), `parseViteErrors.ts` (extract actionable info)

---

## 4. Generation Diff Preview Before Apply

**Gap**: Currently files are applied immediately as soon as the AI finishes streaming. Lovable shows a "Review changes" step where users can see exactly what will change before committing. This is especially important for large refactors.

**Fix**: Add an optional "Review before apply" mode (toggleable in settings or auto-triggered when >5 files change). When active, parsed files are staged but not applied. A compact diff card shows what will change. User clicks "Apply all" or reviews per-file. Falls back to auto-apply for small changes (1-2 files).

**Files**: `AIAppBuilderWorkspace.tsx` (staging logic), `BuilderChatPanel.tsx` (review card UI)

---

## 5. Intelligent Model Picker in Chat Input

**Gap**: The model selector exists in settings but not inline. Lovable lets users pick the AI model directly from the chat input area, seeing which model will handle their next message. This is especially useful when switching between fast (small) and capable (large) models.

**Fix**: Add a small model badge/dropdown to the left of the send button in `BuilderChatPanel.tsx`. Show the current model name abbreviated (e.g., "Gemini 2.5"). Clicking opens a dropdown to switch. The `selectedModel` and `onModelChange` props are already declared but unused in the UI.

**Files**: `BuilderChatPanel.tsx` (model picker widget near input)

---

## 6. Auto-Save Indicator with Conflict Detection

**Gap**: Users have no visibility into when their project was last saved or whether there are unsaved changes. Lovable shows a persistent save indicator ("Saved 2s ago" / "Saving..." / "Unsaved changes").

**Fix**: Surface the existing `lastSaved` timestamp and `isDirty` state as a small indicator in the top bar. Show "Saving..." during debounce, "Saved Xs ago" after save, and "Unsaved" with a warning dot if persistence fails. Use the existing `useProjectPersistence` and `useDraftPersistence` hooks.

**Files**: `WorkspaceTopBar.tsx` (save status indicator)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 5 — Model picker in input | High (daily UX) | Low |
| 3 — Error follow-up prompts | High (fix success) | Low |
| 6 — Save indicator | Medium (confidence) | Low |
| 2 — Persistent file tabs | Medium (DX) | Low |
| 1 — Per-file accept/reject | High (control) | Medium |
| 4 — Diff preview before apply | High (safety) | High |

All changes are independent and can be shipped in any order.


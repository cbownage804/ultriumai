

## Phase 5: Final Cleanup — Dead Code and Unused Imports

All major visual/UX parity gaps (1-22, 24) are complete. This phase cleans up orphaned files, dead imports, and the two minor items (23 and 25) you previously skipped.

---

### Task 1: Delete Orphaned Component Files

The following files are no longer imported anywhere but still exist on disk:
- `src/components/ai-builder/WorkspaceBottomBar.tsx`
- `src/components/ai-builder/WorkspaceStatusBar.tsx`

**Action:** Delete both files.

---

### Task 2: Clean Unused Imports in BuilderChatPanel.tsx

Several icons and modules imported at the top are no longer used after Gaps 16-22 removed their consumers:
- Icons likely unused: `Bot`, `User`, `Lightbulb`, `Zap`, `MessageCircle`, `Wand2`, `ImagePlus`, `Check`, `Pencil`, `ExternalLink`
- `AnimatePresence` (no longer used after suggestion chips removal)
- `DropdownMenu` family (no dropdown menus remain in the component)
- `Dialog`/`DialogContent`/`DialogHeader`/`DialogTitle` (no dialogs remain)
- `BuildSummary` type import (build summary card removed)
- `detectSupabaseIntents`, `analyzeConversationComplexity`, `detectCommunicationStyle`, `detectWebSearchIntent`, `detectURLCloneIntent` (unused analysis functions)

**Action:** Remove all unused imports.

---

### Task 3: Clean Unused Props in BuilderChatPanel

Several props are no longer consumed after the simplification:
- `onForkFromMessage`, `onRevertToMessage` (fork/revert removed in Gap 16)
- `onOpenEditHistory` (edit history removed)
- `onReview` (review button removed)
- `selectedModel`, `onModelChange` (model selector removed in Gap 7)

**Action:** Remove from interface and destructuring.

---

### Files Modified
- `BuilderChatPanel.tsx` (Tasks 2-3)

### Files Deleted
- `WorkspaceBottomBar.tsx`
- `WorkspaceStatusBar.tsx`


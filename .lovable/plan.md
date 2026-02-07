

# AI Studio App Builder -- Production Refinements

## Overview

The builder now has all major IDE features wired up. This next phase focuses on **production polish**, **missing micro-interactions**, and **workflow features** that make the difference between a capable tool and a delightful one.

---

## 1. Inline Code Minimap and Find/Replace

Monaco editor supports a minimap and built-in find/replace, but the current configuration doesn't explicitly enable them. Additionally, there's no in-editor find/replace shortcut -- only a file-level search panel.

**Changes:**
- `CodeEditor.tsx`: Enable Monaco minimap (small, right-side scrollbar overview) and ensure Cmd+F triggers the editor's built-in find/replace widget rather than browser search. Configure word wrap, bracket matching, and auto-closing brackets for a polished editing experience.

---

## 2. Streaming Progress Indicator with File List

During AI generation, the workspace shows "generating..." text but doesn't show which files are being written in real-time. Lovable shows a file-by-file progress list.

**Changes:**
- `GeneratingOverlay.tsx`: Upgrade from a simple spinner to a live file progress list. Show each file being generated with a checkmark when complete, using `partialFiles` and `completedFileCount` from the workspace. Add a subtle progress bar showing overall completion.

---

## 3. Chat Message Actions (Copy, Retry, Edit)

Chat messages currently have no action buttons. Lovable allows copying responses, retrying failed generations, and editing previous prompts.

**Changes:**
- `BuilderChatPanel.tsx`: Add hover action buttons to each message:
  - **Copy**: Copy message content to clipboard
  - **Retry**: Re-send the same prompt (user messages only)
  - **Edit**: Click to edit a previous user message, then re-send (replaces messages after it)

---

## 4. Status Bar at the Bottom

Professional IDEs have a status bar showing cursor position, language, encoding, etc. The builder currently has the console panel but no persistent status information.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add a thin (20px) status bar at the very bottom showing: current file language, line/column position (from CodeEditor cursor), file count, branch name, and save status. Wire cursor position via a new callback from CodeEditor.
- `CodeEditor.tsx`: Add an `onCursorPositionChange` callback that reports `{ line, column }` on cursor movement.

---

## 5. File Tab Drag Reordering

The file tab bar shows open files but doesn't support drag-to-reorder, which is standard in IDEs.

**Changes:**
- `FileTabBar.tsx`: Add drag-and-drop reordering to file tabs using native HTML drag events (no library needed for a simple horizontal reorder). Update `openFilePaths` order on drop.
- `useProjectFileSystem.ts`: Add a `reorderOpenFiles` method that updates the `openFilePaths` array.

---

## 6. Unsaved Changes Indicator

There's no visual indication when a file has been edited but not saved/committed. This is critical for preventing data loss.

**Changes:**
- `useProjectFileSystem.ts`: Track a `dirtyFiles` set -- files modified since last AI generation or save.
- `FileTabBar.tsx`: Show a dot indicator on tabs with unsaved changes.
- `AIAppBuilderWorkspace.tsx`: Clear dirty state on save and on AI file generation.

---

## 7. Collapsible Chat Sidebar

On smaller screens or when focusing on code, users might want to collapse the chat panel entirely (not just resize it).

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add a collapse toggle button on the chat panel edge. When collapsed, show only a thin vertical bar with a chat icon that expands on click. Persist the collapsed state.

---

## 8. Toast Notification for AI Completion

When a long AI generation finishes and the user has scrolled away or switched tabs, there's no notification that work is done.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add a `useEffect` that watches `isGenerating` transitioning from `true` to `false`. When it does, fire a toast with the number of files generated and a "View changes" action button that switches to the preview.

---

## Technical Details

| File | Changes |
|------|---------|
| `CodeEditor.tsx` | Enable minimap, bracket matching, word wrap; add cursor position callback |
| `GeneratingOverlay.tsx` | Upgrade to file-by-file progress list with checkmarks |
| `BuilderChatPanel.tsx` | Add copy/retry/edit actions to messages |
| `AIAppBuilderWorkspace.tsx` | Status bar, chat collapse, AI completion toast, dirty file tracking |
| `FileTabBar.tsx` | Drag reorder tabs, unsaved dot indicator |
| `useProjectFileSystem.ts` | Add `reorderOpenFiles` and `dirtyFiles` tracking |

### Estimated scope
- 6 files modified, 0 new files
- Focused on micro-interactions and polish that make the builder feel professional


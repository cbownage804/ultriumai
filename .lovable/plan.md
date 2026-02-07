

# AI Studio App Builder -- Next Level Polish

## Overview

The wiring phase is complete. The next push focuses on **missing core features** and **UX improvements** that separate a prototype from a production-grade builder like Lovable.

---

## 1. New File Creation from the File Tree

Currently, users can only get files through AI generation. There's no way to manually create a new file -- a basic IDE feature.

**Changes:**
- `ProjectFileTree.tsx`: Add a "New File" button (+ icon) at the top of the explorer. When clicked, show an inline input for the filename. On submit, call a new `onCreateFile(path)` callback with starter content based on extension.
- `AIAppBuilderWorkspace.tsx`: Pass a `handleCreateFile` callback that calls `upsertFile(path, starterContent)` and switches to code view.

---

## 2. Split View -- Code and Preview Side by Side

Lovable shows code and preview simultaneously. Currently, users must toggle between "Preview" and "Code" tabs. This is a major workflow friction.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add a third tab option `'split'` to `rightTab`. When active, render a nested `ResizablePanelGroup` with the preview on the left and the code editor on the right, both visible at once.
- Add a split-view toggle button (e.g., `Columns` icon) in the toolbar alongside Preview and Code.

---

## 3. Auto-Fix Errors with One Click

The error console has a "Fix" button, but the flow could be more automated. When a preview error occurs, offer a prominent "Auto-fix" banner that sends the error plus relevant file context to the AI automatically.

**Changes:**
- `BuilderPreviewPanel.tsx`: When errors are detected, show a floating "AI can fix this" banner at the top of the preview with a one-click button. The banner auto-dismisses after a fix is attempted.
- Pass the relevant file content along with the error message for better AI context.

---

## 4. File Rename Support

Users can delete files but cannot rename them -- another basic IDE feature.

**Changes:**
- `ProjectFileTree.tsx`: Add a rename action (double-click or context menu). Show an inline input pre-filled with the current filename. On confirm, call `onRenameFile(oldPath, newPath)`.
- `AIAppBuilderWorkspace.tsx`: Add `handleRenameFile` that creates the new file, copies the content, and deletes the old one.

---

## 5. Drag-and-Drop File Upload

Allow users to drag files (HTML, CSS, JS, images) directly into the file tree or workspace to import them.

**Changes:**
- `ProjectFileTree.tsx`: Wrap the tree in a drop zone that accepts file drops. Read file contents via `FileReader` and call `onCreateFile`.
- Support text files (HTML/CSS/JS/JSON/MD) by reading as text, and images by reading as data URLs stored in the asset manager.

---

## 6. Improved AI Context -- Send Active File with Errors

When the AI tries to fix an error, it currently receives all project files. This wastes tokens. Instead, prioritize the file where the error occurred.

**Changes:**
- `BuilderPreviewPanel.tsx` / `ErrorConsole.tsx`: Parse the error's `source` field to identify which file caused it. When calling `onSmartFixError`, include only the relevant file(s) plus the error trace, not the entire project.
- `AIAppBuilderWorkspace.tsx`: Update `handleSmartFixError` to include targeted file context.

---

## 7. Keyboard Shortcut Help Panel

Lovable has a keyboard shortcut reference. The builder has shortcuts (Cmd+K, Cmd+Z, Cmd+S, Cmd+Shift+F) but no discoverability.

**Changes:**
- Create a new `KeyboardShortcutsPanel.tsx` component that lists all available shortcuts in a modal dialog.
- Add a `?` or keyboard icon button in the top bar that opens it.
- Accessible via Cmd+/ as well.

---

## 8. Download Single File

Users can export the entire project as ZIP, but sometimes they just want to download a single file. Add a download option to the file context menu.

**Changes:**
- `ProjectFileTree.tsx`: Add a download icon button alongside the delete button (visible on hover). Clicking it triggers a browser download of that single file.

---

## Technical Details

| File | Changes |
|------|---------|
| `ProjectFileTree.tsx` | New file button, rename, drag-and-drop upload, single file download |
| `AIAppBuilderWorkspace.tsx` | Split view mode, create/rename file handlers, improved error context |
| `BuilderPreviewPanel.tsx` | Auto-fix error banner, targeted error file detection |
| `KeyboardShortcutsPanel.tsx` | New component -- keyboard shortcut reference modal |

### Estimated scope
- 3 files modified, 1 new file created
- Focused on core IDE features that make the builder genuinely usable day-to-day



# AI Studio App Builder -- Advanced Features & Final Parity

## Overview

The builder has solid foundations: streaming preview, split view, file management, collaborative presence, error fixing, and all the micro-interactions. This phase adds the **last missing features** that separate it from Lovable: real-time responsive preview controls, intelligent file context in prompts, chat persistence, and several UX refinements.

---

## 1. Chat History Persistence

Chat messages are lost on page reload. Lovable persists conversations alongside projects so users can continue where they left off.

**Changes:**
- `useProjectPersistence.ts`: Save `messages` alongside project files when saving. Load them back when loading a project.
- `AIAppBuilderWorkspace.tsx`: Pass messages to `saveProject` and restore them from `loadProject`. Add a `setMessages` export from `useAIAppBuilder`.
- `useAIAppBuilder.ts`: Export a `setMessages` setter so the workspace can restore saved messages.

---

## 2. Responsive Preview with Live Resize Handle

The `DevicePresetPicker` only has fixed presets. Lovable allows free-form resizing of the preview by dragging the edges. This lets users test any arbitrary width.

**Changes:**
- `BuilderPreviewPanel.tsx`: Wrap the iframe container in a resizable wrapper with drag handles on the left and right edges. Show the current width/height as a live badge while dragging. Keep presets as quick shortcuts.

---

## 3. Multi-Tab Terminal / Console with Tabs

The `ConsolePanel` shows console output but has no concept of separate log streams. Add tabs for "Console", "Network", and "Problems" like VS Code.

**Changes:**
- `ConsolePanel.tsx`: Add a tab bar with Console (current), Problems (filtered errors/warnings only), and Network (tracks fetch/XHR from the iframe). The Problems tab shows a count badge. Network tab captures `__NETWORK_LOG__` messages from an injected fetch wrapper.
- `BuilderPreviewPanel.tsx`: Inject a `fetch` wrapper into the preview HTML that posts `__NETWORK_LOG__` messages with URL, status, and timing.

---

## 4. Breadcrumb-Based Folder Navigation

The `FileBreadcrumb` shows the current file path but isn't interactive. Make each segment clickable to navigate the file tree.

**Changes:**
- `FileBreadcrumb.tsx`: Make each path segment a clickable button that filters the file tree to that folder. Add a dropdown on each segment showing sibling files/folders for quick navigation (like VS Code breadcrumbs).

---

## 5. AI Context Window Indicator

Users have no visibility into how much context the AI can "see." When projects get large, context truncation causes poor results. Show a visual indicator of context usage.

**Changes:**
- `BuilderChatPanel.tsx`: Below the input, show a small bar indicating "Context: X/Y tokens" based on the current project file sizes. Warn when nearing the limit (e.g., >80% of 128K tokens). This helps users understand when to simplify prompts or reduce project scope.

---

## 6. Quick Actions Bar Above Input

Lovable has quick-action chips above the input for common operations like "Make responsive", "Add dark mode", "Improve performance". These appear contextually based on the current project state.

**Changes:**
- `BuilderChatPanel.tsx`: Add a horizontal scrollable row of contextual action chips above the textarea. Show different chips depending on project state:
  - No files: Show starter prompts (already exists, move above input)
  - Has files: Show refinement chips like "Add animations", "Make responsive", "Improve accessibility", "Add loading states"
  - After errors: Show "Fix all errors" chip

---

## 7. Inline Image Preview in Chat

When users upload an image with their prompt, the image preview disappears after sending. Show the uploaded image inline in the chat message.

**Changes:**
- `BuilderChatPanel.tsx`: When rendering user messages that have `imageUrl`, show the image as a small thumbnail above the message text. Already tracked on the message object, just not rendered.

---

## 8. Project Search Across All Saved Projects

The `ProjectManager` lists saved projects but has no search. When users accumulate many projects, finding the right one is hard.

**Changes:**
- `ProjectManager.tsx`: Add a search input at the top of the project list that filters by project name. Show file count and last-modified date for each project.

---

## Technical Details

| File | Changes |
|------|---------|
| `useAIAppBuilder.ts` | Export `setMessages` for restoring saved chat |
| `useProjectPersistence.ts` | Save/load messages with projects |
| `AIAppBuilderWorkspace.tsx` | Wire message persistence on save/load |
| `BuilderPreviewPanel.tsx` | Resizable preview container, inject network logger |
| `ConsolePanel.tsx` | Multi-tab (Console/Problems/Network) |
| `FileBreadcrumb.tsx` | Clickable segments with sibling dropdown |
| `BuilderChatPanel.tsx` | Context indicator, quick action chips, inline image preview |
| `ProjectManager.tsx` | Search input for saved projects |

### Estimated scope
- 8 files modified, 0 new files
- Focuses on workflow intelligence and discoverability features


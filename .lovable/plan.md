

# Lovable Parity — Wave 11

Six improvements targeting collaboration, debugging depth, and production readiness.

---

## 1. Image/Screenshot Attachment in Chat Input

**Gap**: The `ChatFileUpload` component exists but isn't wired into `BuilderChatPanel`'s main chat input. Users can attach images in Visual Edit mode but not in the primary chat. Lovable lets users paste or drag screenshots directly into chat to say "make it look like this."

**Fix**: Wire `ChatFileUpload` into the main chat input area of `BuilderChatPanel.tsx`. Support clipboard paste (Ctrl+V with image data) and drag-and-drop onto the input. Attached image data URLs get prepended to the prompt as context for the AI.

**Files**: `BuilderChatPanel.tsx` (integrate ChatFileUpload, add paste/drop handlers)

---

## 2. Per-File Undo (Granular Revert)

**Gap**: Undo/redo operates on the entire project snapshot. Lovable supports reverting a single file to its previous version without affecting other files. The `EnhancedVersionDiffViewer` has cherry-pick rollback UI but there's no quick "undo last edit to this file" action in the editor tab bar.

**Fix**: Track per-file edit history (last 10 versions per file) in a lightweight ref. Add an "Undo file changes" action to the file tab context menu and the editor toolbar. Reverting replaces only that file's content without touching the global undo stack.

**Files**: New `usePerFileHistory.ts`, `FileTabBar.tsx` (context menu action), `AIAppBuilderWorkspace.tsx` (wire hook)

---

## 3. Build Error Quick-Fix Suggestions

**Gap**: When a build fails, the auto-heal loop retries but the user gets no actionable suggestions. Lovable shows specific fix suggestions (e.g., "Missing import — click to add") as clickable chips in the error console.

**Fix**: Enhance `parseViteErrors.ts` to classify common errors (missing import, undefined variable, type mismatch, missing dependency) and generate one-click fix actions. Display these as chips in `ConsolePanel.tsx` and the error overlay. Clicking a fix either applies it directly (for simple imports) or sends a targeted prompt.

**Files**: `parseViteErrors.ts` (error classification + fix suggestions), `ConsolePanel.tsx` (render fix chips), `AIAppBuilderWorkspace.tsx` (handle fix actions)

---

## 4. Live Collaboration Awareness

**Gap**: `CollaborativePresence` and `LiveCursors` exist but aren't connected to real presence data. Lovable shows who else is viewing/editing the project with cursor positions and active file indicators.

**Fix**: Wire `CollaborativePresence` to Supabase Realtime Presence channel keyed by project ID. Broadcast the current user's active file, cursor position, and selection. Render other users' avatars in the top bar with their active file tooltip, and show their cursors in the editor via the existing `remoteCursors` prop.

**Files**: `CollaborativePresence.tsx` (Supabase Realtime integration), `AIAppBuilderWorkspace.tsx` (broadcast local state, pass remote cursors to editor)

---

## 5. Dependency Auto-Install from Import

**Gap**: When AI-generated code uses a new npm package, users must manually add it via Package Manager. Lovable detects unresolved imports and auto-suggests adding the package.

**Fix**: After each generation, scan new/modified files for import statements. Cross-reference against the project's existing CDN packages. For unresolved imports of known npm packages, show a notification: "New dependency detected: `framer-motion` — Add to project?" with one-click install that adds it to the CDN package list.

**Files**: New `useAutoDepInstall.ts` (import scanning + matching), `AIAppBuilderWorkspace.tsx` (post-generation hook), `BuildNotificationCenter.tsx` (install prompt)

---

## 6. Chat Message Search and Filter

**Gap**: Long conversations become hard to navigate. Lovable lets users search through chat history with keyword filtering and jump-to-message navigation.

**Fix**: Add a search icon in the chat panel header that expands a search input. Filter messages by content match, highlighting matched terms. Show result count and prev/next navigation arrows. Support filtering by role (user/assistant) and by messages that contain code changes.

**Files**: `BuilderChatPanel.tsx` (search bar, filtering logic, scroll-to-match)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 1 — Image attachment in chat | High (vision) | Low |
| 3 — Build error quick-fixes | High (debugging) | Medium |
| 5 — Auto dep install | Medium (DX) | Low |
| 2 — Per-file undo | Medium (safety) | Low |
| 6 — Chat message search | Medium (navigation) | Low |
| 4 — Live collaboration | Low (multiplayer) | Medium |




# Lovable Parity — Wave 6

Six improvements targeting the remaining UX and workflow gaps.

---

## 1. Streaming File-by-File Progress Indicators

**Gap**: During generation, the user sees a generic "Generating..." spinner. Lovable shows live progress as each file is written — file names appear with checkmarks as they complete.

**Fix**: In `BuilderChatPanel.tsx`, during streaming, parse the accumulated stream content for `===FILE:` markers and render a live file list with spinner → checkmark transitions. Reuse the existing `streamingContentRef` from `useAIAppBuilder.ts` to poll parsed file names.

**Files**: `BuilderChatPanel.tsx` (streaming file list UI), `useAIAppBuilder.ts` (expose parsed-so-far file names via ref)

---

## 2. Context Window Usage Indicator

**Gap**: Users have no visibility into how much of the AI context window they've consumed. Lovable shows a visual indicator so users know when to start a new conversation.

**Fix**: The `contextBudget` prop already exists in `BuilderChatPanel` but isn't prominently displayed. Add a compact progress bar near the chat input (green → amber → red) showing % used. When >85%, show a "Start new chat" shortcut. Use the existing `ContextBudgetInfo` type.

**Files**: `BuilderChatPanel.tsx` (context bar near input)

---

## 3. One-Click Project Cloning from URL

**Gap**: Users can start from templates but can't paste a URL to clone/remix an existing site. Lovable supports "clone this site" workflows.

**Fix**: Detect URL-pasting in the chat input. When a URL is detected with clone-intent keywords ("clone", "copy", "replicate", "make something like"), fetch the page via the existing scraping logic and inject the HTML/structure into the AI prompt as reference context. Show a "Cloning from URL..." indicator.

**Files**: `AIAppBuilderWorkspace.tsx` (URL detection + fetch), `BuilderChatPanel.tsx` (clone indicator)

---

## 4. Multi-File Search and Replace

**Gap**: Monaco search works within a single file. Lovable supports project-wide find-and-replace across all files simultaneously.

**Fix**: Add a "Search in Project" panel (Cmd+Shift+F) that searches across all project files, shows results grouped by file with line numbers, and supports bulk replace. Wire results to `setActiveFile` for navigation.

**Files**: New `ProjectSearchPanel.tsx`, `AIAppBuilderWorkspace.tsx` (keyboard shortcut + panel toggle)

---

## 5. AI Token/Cost Display per Generation

**Gap**: The total token counter exists but per-generation cost isn't shown. Lovable displays token usage and estimated cost for each AI response.

**Fix**: After each generation completes, show a small token badge on the assistant message (e.g., "~2.4K tokens"). Calculate from the response content length estimate. Display in the message footer next to the diff summary.

**Files**: `BuilderChatPanel.tsx` (per-message token badge)

---

## 6. Drag-to-Reorder File Tabs

**Gap**: File tabs persist but can't be reordered. Lovable supports drag-to-reorder for open file tabs.

**Fix**: Add HTML5 drag events to `FileTabBar.tsx` tab elements. On drop, reorder the `openFilePaths` array and persist to localStorage. No library needed — native `draggable`, `onDragStart`, `onDragOver`, `onDrop`.

**Files**: `FileTabBar.tsx` (drag reorder handlers)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 1 — Streaming file progress | High (UX feedback) | Low |
| 2 — Context window indicator | High (prevents failures) | Low |
| 5 — Per-generation token display | Medium (transparency) | Low |
| 6 — Tab drag reorder | Medium (DX) | Low |
| 4 — Project-wide search | High (DX) | Medium |
| 3 — URL cloning | Medium (onboarding) | Medium |


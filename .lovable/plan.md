
# GPT Builder Parity: Mirror App Builder Polish Features

## Overview
Bring all the UX polish features from the App Builder into the GPT Builder workspace so both builders feel like the same product. The GPT Builder is currently missing ~12 features that were added to the App Builder.

---

## Phase 1 -- Workspace-Level Features

### A. Build Completion Chime
Wire `useBuildChime` into `GPTBuilderWorkspace.tsx` to play the two-tone chime when `isGenerating` transitions from true to false.

**Changes in `GPTBuilderWorkspace.tsx`**:
- Import and call `useBuildChime`
- Track `soundEnabled` state (persisted to localStorage as `gpt-builder-sound-enabled`)
- Call `onGeneratingChange(isGenerating)` in a useEffect

### B. Build Counter + Status Bar
Add a minimal status bar at the bottom of the GPT Builder showing build count and save status.

**Changes in `GPTBuilderWorkspace.tsx`**:
- Add `buildCount` state, increment on each generation completion
- Render a compact status bar (h-6) below the main content area showing: Ready/Building status dot, message count, build count, save status

### C. Confetti Milestones
Fire `canvas-confetti` and a toast at milestones (10, 25, 50 builds).

**Changes in `GPTBuilderWorkspace.tsx`**:
- Import `canvas-confetti`
- After incrementing buildCount, check for milestones and celebrate

### D. Keyboard Shortcut Overlay (Cmd+/)
Bind `Cmd+/` to toggle the `KeyboardShortcutsPanel`.

**Changes in `GPTBuilderWorkspace.tsx`**:
- Add `Cmd+/` to the existing keyboard handler
- Add `showShortcuts` state and render `KeyboardShortcutsPanel`

### E. GPT Settings Modal
Create a GPT-specific settings modal (adapted from `ProjectSettingsModal`) with tabs: General (name, theme color, category), Embed (style, domains), Advanced (sound toggle, delete GPT).

**Changes**:
- Create `GPTSettingsModal.tsx` adapted for GPT context
- Wire from a new Settings button in the header (or reuse the existing Config panel button)

---

## Phase 2 -- Chat Panel Enhancements

### F. Message Pinning
Add pin toggle to GPT builder chat messages and a collapsible "Pinned" section at the top.

**Changes in `GPTBuilderChatPanel.tsx`**:
- Add `pinnedIds` local state (Set of message IDs)
- Add a pin icon button on hover for each message
- Render a collapsible "Pinned" section above the message list showing pinned messages with click-to-scroll

### G. Message Search
Add a search bar toggle in the chat header that filters and highlights matching messages.

**Changes in `GPTBuilderChatPanel.tsx`**:
- Add `searchQuery` state and a search icon toggle in the header area
- Filter visible messages or highlight matches with `<mark>` tags
- Show "X of Y" match counter

### H. New Conversation Button
Add a "New conversation" button that clears messages but preserves the current GPT config (unlike the existing "Reset" which clears everything).

**Changes**:
- In `useGPTBuilderChat.ts`, add a `clearMessages` function that only resets `messages` to `[]` without touching `config` or `savedGptId`
- In `GPTBuilderChatPanel.tsx` or `GPTBuilderWorkspace.tsx`, add a "New chat" button in the header

### I. Prompt Templates in "+" Menu
Add quick-start prompt cards accessible from the image upload button area or a new "+" menu.

**Changes in `GPTBuilderChatPanel.tsx`**:
- Add a popover/dropdown on the ImagePlus button (or add a separate "+" button) with template cards:
  - "Add personality and tone"
  - "Define knowledge boundaries"  
  - "Set up guardrails"
  - "Add conversation starters"
  - "Configure for customer support"
  - "Make it multilingual"

### J. Copy Code Block Button
Add a copy button to fenced code blocks in AI responses.

**Changes in `GPTBuilderChatPanel.tsx`**:
- Add a custom `code` component to the ReactMarkdown renderer that shows a "Copy" button in the top-right corner of code blocks

### K. Credit Cost Indicator
Show "2 credits" badge near the send button when input has text.

**Changes in `GPTBuilderChatPanel.tsx`**:
- When `input.trim()` is non-empty, show a small "2 credits" label above or beside the send button

---

## Phase 3 -- Preview Panel Enhancement

### L. Publish/Share Status Badge
Show the GPT's save/publish status in the header.

**Changes in `GPTBuilderWorkspace.tsx`**:
- Next to the GPT name, show a green dot + "Saved" or amber dot + "Unsaved" based on whether `savedGptId` exists and config has changed since last save

---

## Technical Details

### File Changes Summary

| File | Changes |
|------|---------|
| `GPTBuilderWorkspace.tsx` | Build chime, build counter, confetti, status bar, Cmd+/ shortcut, settings modal, new conversation, save status badge |
| `GPTBuilderChatPanel.tsx` | Message pinning + pinned section, search bar + highlighting, prompt templates, copy code button, credit cost badge |
| `useGPTBuilderChat.ts` | Add `clearMessages` function (reset messages only) |
| `GPTSettingsModal.tsx` (new) | GPT-specific tabbed settings dialog |

### Priority Order
1. Build completion chime (A) -- instant delight, reuses existing hook
2. New conversation button (H) -- solves real pain (Reset clears config)
3. Credit cost indicator (K) -- transparency
4. Copy code block button (J) -- quality of life
5. Message pinning (F) -- power user feature
6. Message search (G) -- findability
7. Prompt templates (I) -- engagement
8. Build counter + status bar (B) -- productivity feel
9. Save status badge (L) -- clarity
10. Confetti milestones (C) -- fun polish
11. GPT settings modal (E) -- organization
12. Keyboard shortcut overlay (D) -- discoverability

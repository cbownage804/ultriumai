

# Next-Level Parity: The Remaining Feature Sweep

## Overview
After auditing all 250+ components and hooks, here are the genuinely missing or incomplete features organized into actionable tiers.

---

## Tier 1 -- Completion Sounds and Haptics

### A. Build Completion Sound
Lovable plays a subtle chime when generation finishes. We have no audio feedback.

**Changes**:
- Add a tiny audio chime (Web Audio API oscillator, no file needed -- ~10 lines)
- Play on `isGenerating` transitioning from `true` to `false` in `AIAppBuilderWorkspace.tsx`
- Add a "Mute sounds" toggle in project settings, persisted to localStorage

---

## Tier 2 -- Consolidated Project Settings Modal

### B. Tabbed Settings Dialog (Still Missing)
`ProjectSettingsModal.tsx` was planned but never created. Settings are currently scattered across the dropdown and bottom bar.

**Changes**:
- Create `ProjectSettingsModal.tsx` with tabs: **General** (name, description, avatar), **Domains** (custom domain panel), **Integrations** (Supabase/Stripe/GitHub status), **Advanced** (hide badge, remix toggle, delete, transfer)
- Wire from the project dropdown "Settings" item
- Move the "Hide Badge" toggle into the Advanced tab

---

## Tier 3 -- Chat UX Gaps

### C. Message Pinning / Bookmarks
Let users pin important AI responses (e.g., architecture decisions) so they can find them later without scrolling.

**Changes**:
- Add a `pinned` boolean to `BuilderMessage` type
- Add a pin icon to message action bar (next to thumbs up/down)
- Render pinned messages in a collapsible "Pinned" section at the top of the chat
- Persist pins in the message array (already saved to cloud)

### D. "New Conversation" Button (Context Reset)
When context is full, users must clear everything. Add a "New conversation" option that keeps the project files but resets messages and context budget.

**Changes**:
- Add a "New conversation" button in the chat header (next to clear)
- On click, clear messages array but keep project files intact
- Reset context budget counter

### E. Message Search
Let users search through chat history with Cmd+F scoped to the chat panel.

**Changes**:
- Add a search input toggle in the chat header
- Filter and highlight matching messages with a "X of Y" navigator

---

## Tier 4 -- Preview Enhancements

### F. Multi-Page Route Navigation
Lovable shows a URL bar in the preview that lets you navigate between routes. We have a URL display but no editable navigation.

**Changes**:
- Make the preview URL bar editable -- typing a path and pressing Enter navigates the iframe via `postMessage`
- Add forward/back browser buttons that track iframe navigation history
- Already partially wired (`previewCurrentUrl` state exists)

### G. Preview Console Log Viewer (Enhanced)
The `ErrorConsole` shows errors but not general `console.log` output. Add a full console panel visible in the preview area.

**Changes**:
- Extend the iframe `message` listener to capture `console.log`, `console.warn`, `console.info` (not just errors)
- Add a "Console" tab in the preview footer alongside "Errors"
- Show log entries with level icons and timestamps

---

## Tier 5 -- Developer Experience

### H. AI Commit Messages
When saving/publishing, auto-generate a commit-style summary of what changed.

**Changes**:
- After generation completes, compare `previousFiles` vs `latestFiles` to build a diff summary
- Auto-generate a one-line commit message (e.g., "Add login page and auth hook")
- Show in the version timeline and publish dialog

### I. File Diff on Hover in File Tree
In the file tree, show a green/amber dot for new/modified files since last generation.

**Changes**:
- Compare current files against `previousFiles` snapshot
- Add colored indicators next to file names in `ProjectFileTree`
- Green dot = new file, amber dot = modified, no dot = unchanged

### J. Keyboard Shortcut Cheat Sheet Overlay
`Cmd+/` opens a visual overlay showing all keyboard shortcuts, grouped by category.

**Changes**:
- Create a styled overlay component triggered by `Cmd+/`
- Group shortcuts: Navigation, Editing, Build, Preview, Panels
- Already have `KeyboardShortcutsPanel` but it's a side panel -- this is a quick-reference overlay

---

## Tier 6 -- Engagement and Polish

### K. Build Streak / Usage Stats
Show a small "builds today" counter in the status bar to give users a sense of productivity.

**Changes**:
- Track build count per session in `AIAppBuilderWorkspace.tsx`
- Show in status bar: "5 builds today"
- Optionally show a confetti animation on milestone builds (10, 25, 50)

### L. Prompt Templates / Quick Actions
Pre-built prompt templates for common tasks (add auth, make responsive, add dark mode, etc.) accessible from the "+" menu.

**Changes**:
- Add a "Templates" section in the plus menu with 8-10 pre-built prompts
- Already have `/slash` commands but these would be visual cards with descriptions
- Categories: Design, Backend, Features, Polish

### M. Export as Figma-Ready Design Tokens
Export the project's color palette, typography, and spacing as a JSON design token file.

**Changes**:
- Parse Tailwind classes from all project files to extract colors, fonts, spacing
- Generate a `design-tokens.json` file
- Add an "Export Design Tokens" option in the export menu

---

## Technical Details

### File Changes Summary

| File | Changes |
|------|--------|
| `AIAppBuilderWorkspace.tsx` | Build completion sound, build counter, new conversation handler, settings modal wiring |
| `ProjectSettingsModal.tsx` (new) | Tabbed settings dialog with General/Domains/Integrations/Advanced tabs |
| `BuilderChatPanel.tsx` | Pin messages, message search, new conversation button, prompt template cards in plus menu |
| `BuilderPreviewPanel.tsx` | Editable URL bar, console.log capture, console tab |
| `ProjectFileTree.tsx` | File diff indicators (new/modified dots) |
| `WorkspaceStatusBar.tsx` | Build counter display |
| `useAIAppBuilder.ts` | Add `pinned` field to `BuilderMessage`, auto-commit message generation |
| `VersionTimelineSlider.tsx` | Show auto-generated commit messages |

### Priority Order
1. Build completion sound (A) -- instant delight, 10 lines
2. New conversation button (D) -- solves real pain point
3. File diff indicators in tree (I) -- high visibility, low effort
4. Consolidated settings modal (B) -- organization
5. Message pinning (C) -- power user feature
6. Editable preview URL bar (F) -- multi-page apps
7. Console log viewer (G) -- debugging
8. AI commit messages (H) -- polish
9. Message search (E) -- quality of life
10. Keyboard shortcut overlay (J) -- discoverability
11. Prompt templates (L) -- engagement
12. Build counter (K) -- fun
13. Design tokens export (M) -- advanced


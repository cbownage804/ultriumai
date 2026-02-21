

# Final Polish: Remaining Parity Gaps

## Overview
After auditing everything implemented so far, here are the genuinely remaining gaps -- features that were planned but not yet wired, plus a few new ideas to truly finish the builder.

---

## Already Done (No Work Needed)
- Build completion chime (useBuildChime)
- New conversation button (wired in chat header)
- Message pinning (pin icon in chat actions)
- File diff indicators in ProjectFileTree (green/amber dots)
- Auto commit message generation (useAICommitMessages + wired in workspace)
- Consolidated ProjectSettingsModal (created and wired)
- Prompt templates in "+" menu
- Console log capture from iframe (__CONSOLE_LOG__ already intercepted and shown in ConsolePanel)
- Editable URL bar with back/forward navigation
- Build counter in WorkspaceStatusBar
- Cost badge near send button
- Context warning toast at 80%

---

## What's Still Missing

### 1. Version Timeline: Show Commit Messages
The `VersionTimelineSlider` displays "label" and "type" but never shows the auto-generated `commitMessage` from each build. The data is generated and stored on messages, but the timeline snapshots don't carry it.

**Changes**:
- Add an optional `commitMessage?: string` field to `TimelineSnapshot`
- When creating snapshots in `useVersionTimeline`, pass the commit message from the corresponding `BuilderMessage`
- In `VersionTimelineSlider.tsx`, display the commit message below the snapshot label (e.g., "feat(auth): add login page")

### 2. Keyboard Shortcut Cheat Sheet Overlay (Cmd+/)
The `KeyboardShortcutsPanel` exists as a dialog but there's no `Cmd+/` binding to open it from within the builder workspace. The `GlobalKeyboardShortcuts` component uses `Shift+?` but that's for the global app, not the builder-specific context.

**Changes**:
- In `AIAppBuilderWorkspace.tsx`, add a `Cmd+/` keydown listener that toggles a `showShortcutsOverlay` state
- Render `KeyboardShortcutsPanel` with that state
- Add builder-specific shortcuts to the panel (Build, Preview, Panels)

### 3. Message Search Highlighting
The search bar exists in the chat header, but matched messages aren't visually highlighted with the search term emphasized in the text.

**Changes**:
- In `BuilderChatPanel.tsx`, when search is active and a message matches, wrap matching text spans in a `<mark>` tag with a highlight style
- Add "X of Y" match counter next to the search input
- Add up/down arrows to navigate between matches

### 4. Console Tab in Preview Footer
Console logs are captured and shown in the standalone `ConsolePanel`, but the `ErrorConsole` at the bottom of the preview only shows errors/warnings. Add a "Console" tab alongside "Errors" directly in the preview panel footer.

**Changes**:
- In `BuilderPreviewPanel.tsx`, listen for `__CONSOLE_LOG__` messages and store them in local state
- Add a tab toggle ("Errors" | "Console") in the preview footer
- Show `console.log/info` entries with level icons and timestamps in the Console tab

### 5. Design Tokens Export Button
The `useDesignTokenExport` hook was created but never wired to the UI.

**Changes**:
- Add an "Export Design Tokens" option in the `ExportButton` dropdown menu
- Call `useDesignTokenExport().exportTokens(files)` and trigger a JSON file download

### 6. Build Streak Milestones with Confetti
The build counter exists but the confetti celebration at milestones (10, 25, 50 builds) was planned but not implemented.

**Changes**:
- In `AIAppBuilderWorkspace.tsx`, after incrementing `buildCount`, check for milestones
- Use `canvas-confetti` (already installed) to fire a celebration animation
- Show a toast: "10 builds today! You're on fire!"

### 7. Pinned Messages Section at Chat Top
The pin toggle button exists on messages, but there's no dedicated "Pinned" section rendering at the top of the chat scroll area.

**Changes**:
- In `BuilderChatPanel.tsx`, filter messages where `pinned === true`
- Render a collapsible "Pinned" section above the message list
- Each pinned item shows a compact preview with a click-to-scroll-to-original action

---

## Technical Details

### File Changes Summary

| File | Changes |
|------|---------|
| `VersionTimelineSlider.tsx` | Display commit messages from snapshots |
| `useVersionTimeline.ts` | Add `commitMessage` field to `TimelineSnapshot` |
| `AIAppBuilderWorkspace.tsx` | Cmd+/ shortcut, confetti milestones, pass commit messages to timeline |
| `BuilderChatPanel.tsx` | Search highlighting with mark tags, pinned messages section |
| `BuilderPreviewPanel.tsx` | Console tab in preview footer |
| `ExportButton.tsx` | Wire design tokens export |

### Priority Order
1. Version timeline commit messages -- data already generated, just needs display
2. Pinned messages section -- UI gap, pin button already works
3. Search highlighting -- search bar exists, needs visual feedback
4. Console tab in preview -- logs captured, needs tab UI
5. Keyboard shortcut overlay -- quick win
6. Build streak confetti -- fun polish
7. Design tokens export -- advanced feature




# Ultimate Lovable Parity: Everything We Can Do

## Overview
A comprehensive sweep of every remaining gap between our builder and Lovable's production experience. Organized by priority tier.

---

## Tier 1 -- High-Impact UX Polish

### A. "Editing X files..." Inline Chat Indicator
During generation, Lovable shows a live "Editing 3 files..." counter with file names directly inside the AI message bubble (not just in the overlay corner badge).

**Changes**:
- In `BuilderChatPanel.tsx`, when `isStreaming` is true for the latest AI message, render a compact inline file-progress widget below the streaming text
- Poll `streamingContentRef` to extract file names being generated and show them as an animated list with checkmarks

### B. Hide "Powered by" Badge Toggle
Lovable has a "Hide Lovable Badge" setting. We have no equivalent toggle.

**Changes**:
- Add a `hideBadge` boolean to project settings schema in `ProjectSettings.tsx`
- When publishing via `usePreviewHosting`, conditionally strip the badge/watermark from compiled HTML
- Surface the toggle in the project dropdown menu under settings

### C. Keyboard Shortcut Discoverability
Lovable shows `Cmd+K` prominently. We have a command palette but it's not as discoverable.

**Changes**:
- Add a subtle `Cmd+K` hint badge next to the search area in the top bar
- Ensure the `EnhancedCommandPalette` opens on `Cmd+K` globally (verify binding exists)

### D. Project Rename Inline (Click-to-Edit)
Lovable lets you click the project name directly to rename. We have it in the dropdown but not inline.

**Changes**:
- In `ProjectDropdownMenu.tsx`, add a pencil icon on hover of the project name that triggers inline editing directly in the top bar (already partially wired via `onRename`)

---

## Tier 2 -- Generation Experience

### E. Streaming Progress in Chat Bubble
Show a "Building your app..." card with a progress bar and file list directly in the chat message area during generation, matching Lovable's in-chat build indicator.

**Changes**:
- In `BuilderChatPanel.tsx`, when the latest message is streaming, render a `GenerationProgressCard` component showing:
  - Phase label (Thinking / Analyzing / Writing)
  - File count and progress bar
  - Elapsed time
- Reuse data from `streamingContentRef` and phase props already passed to the panel

### F. Build Cost Preview
Before sending a build-mode message, show "This will use ~1 credit" near the send button (already partially done with "1 credit/msg" label, but make it more prominent like Lovable's).

**Changes**:
- In `BuilderChatPanel.tsx`, when `mode === 'build'` and input has text, show a small `Coins` icon badge on the send button or directly above it: "1 credit"
- For discuss mode, show "Free" label

---

## Tier 3 -- Settings and Project Management

### G. Consolidated Project Settings Modal
Lovable has a unified settings dialog accessible from the dropdown with tabs: General, Domains, Integrations, Danger Zone.

**Changes**:
- Create `ProjectSettingsModal.tsx` with tab sections:
  - **General**: Project name, description, icon/avatar
  - **Domains**: Custom domain connection (reuse `CustomDomainPanel`)
  - **Integrations**: Supabase, Stripe, GitHub toggles
  - **Advanced**: Hide badge, remix toggle, transfer project, delete project
- Wire it from the project dropdown "Settings" action

### H. Project Avatar/Icon
Lovable shows a project icon in the dropdown. We just show text.

**Changes**:
- Add project avatar/icon upload to settings
- Show the icon in `ProjectDropdownMenu` next to the project name
- Store in project settings or as a base64 string in localStorage

---

## Tier 4 -- Developer Experience

### I. Expandable Inline Diffs Per File
Diffs are already shown in chat, but make them expandable/collapsible per file with a "View changes" toggle, matching Lovable's accordion-style diff display.

**Changes**:
- In `BuilderChatPanel.tsx`, wrap each `CodeDiffViewer` in a collapsible accordion
- Default to collapsed with a summary line: "+12 / -3 lines in Header.tsx"
- Click to expand the full diff

### J. "What changed" Summary
After a build, Lovable shows a brief human-readable summary of what changed (e.g., "Added login page, updated navigation, created auth hook").

**Changes**:
- In `BuilderChatPanel.tsx`, after a completed build message, render a `BuildSummary` card listing:
  - Files created (green)
  - Files modified (blue)
  - Files deleted (red)
- Data already available from the message's `filesSnapshot` vs `previousFiles`

### K. Copy Code Block Button
In AI response markdown, add a "Copy" button to each code block (Lovable has this).

**Changes**:
- In the `ReactMarkdown` renderer in `BuilderChatPanel.tsx`, add a custom `code` component that renders a copy button in the top-right corner of fenced code blocks

---

## Tier 5 -- Advanced Parity

### L. Screenshot-to-Code from Preview
Lovable's "Take a screenshot" in the plus menu captures the current preview and sends it as context. Wire the existing placeholder.

**Changes**:
- In `BuilderChatPanel.tsx`, the "Take a screenshot" button currently does nothing
- Use `html2canvas` (already installed) to capture the preview iframe
- Convert to base64 and attach to the message as an image reference

### M. Token/Context Window Indicator Enhancement
Show a more visible warning when approaching context limits (already have the bar, but add a toast warning at 80%).

**Changes**:
- In `BuilderChatPanel.tsx`, when `contextBudget.percentUsed > 80`, show a one-time amber toast: "Context window 80% full -- consider starting a new conversation"

### N. Publish Status Badge in Dropdown
Lovable shows whether the project is published or not in the dropdown with a status indicator.

**Changes**:
- In `ProjectDropdownMenu.tsx`, show a green dot + "Live" or gray dot + "Draft" next to the project name based on `publishedUrl` prop

---

## Technical Details

### File Changes Summary

| File | Changes |
|------|---------|
| `BuilderChatPanel.tsx` | Inline generation progress card, collapsible diffs, copy code button, screenshot capture, build cost label, context warning toast |
| `ProjectDropdownMenu.tsx` | Publish status badge, inline rename hint |
| `ProjectSettings.tsx` | Hide badge toggle |
| `ProjectSettingsModal.tsx` (new) | Consolidated tabbed settings modal |
| `WorkspaceTopBar.tsx` | Cmd+K hint badge |
| `GeneratingOverlay.tsx` | Already done -- no changes needed |
| `AIAppBuilderWorkspace.tsx` | Wire new settings modal, pass publishedUrl to dropdown |

### Priority Order
1. Inline generation progress in chat (E) -- highest visual impact
2. Expandable diffs per file (I) -- developer UX
3. Build summary card (J) -- clarity
4. Copy code block button (K) -- quality of life
5. Screenshot-to-code (L) -- complete the plus menu
6. Consolidated settings modal (G) -- organization
7. Hide badge toggle (B) -- feature parity
8. Publish status badge (N) -- polish
9. Build cost preview (F) -- transparency
10. Cmd+K hint (C) -- discoverability
11. Project avatar (H) -- visual polish
12. Inline rename (D) -- minor UX
13. Context warning toast (M) -- safety




# AI Studio App Builder -- Lovable Parity Phase 4: Deep IDE Intelligence

## Overview

The builder now has the core IDE shell: file management, split view, multi-tab console, chat persistence, error fixing, visual edits, and collaborative features. This phase tackles the **deeper behavioral patterns** that make Lovable feel intelligent and trustworthy -- real-time URL-based deployment, conversation-driven project forking, intelligent error recovery loops, and a polished settings/integrations experience.

---

## 1. Deployment Preview URL with Live Reload

Lovable gives every project a live preview URL (e.g., `project-name.lovable.app`) that updates on each change. Currently, publishing requires a manual click and uploads to Supabase Storage. Add a persistent preview URL concept and auto-refresh on publish.

**Changes:**
- `DeployDialog.tsx`: Redesign as a two-step flow: (1) Preview environment (auto-generated slug URL shown always), (2) Production publish with custom domain input. Show the preview URL prominently with a copy button and external link.
- `AIAppBuilderWorkspace.tsx`: Generate a stable preview slug from the project name on first save. Show the preview URL in the top bar next to the project name.

---

## 2. Error Recovery Loop with Retry Counter

When "Try to Fix" fails, Lovable automatically retries up to 3 times with increasing context. Currently, the builder fires one fix attempt and stops.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Track `fixAttemptCount` per error. If the same error persists after a fix, automatically retry with additional context (include the previous fix attempt in the prompt). Cap at 3 retries, then show "Unable to auto-fix -- try describing the issue differently."
- `BuilderPreviewPanel.tsx`: Show retry count on the auto-fix banner (e.g., "Attempt 2/3").

---

## 3. Conversation-Based Project Forking

Lovable lets users fork a project mid-conversation to try a different approach without losing the original. Currently, "Remix" only works from the project manager.

**Changes:**
- `BuilderChatPanel.tsx`: Add a "Fork from here" action on assistant messages. Clicking it saves the current state as a snapshot, creates a new project with the conversation history up to that point, and opens it.
- `AIAppBuilderWorkspace.tsx`: Add `handleForkFromMessage(messageId)` that saves current project, creates a new project copy with truncated message history, and switches to it.

---

## 4. Integrated Terminal with Command Execution Simulation

Lovable has a terminal panel. While we can't run real commands, we can simulate common build tool outputs and provide a "Run" button for the preview.

**Changes:**
- `ConsolePanel.tsx`: Add a "Terminal" tab alongside Console/Problems/Network. Show simulated build output when files change (e.g., "Compiling... Done in 0.3s", "Hot reload: 4 modules updated"). Add a command input at the bottom that handles pseudo-commands like `clear`, `help`, and `build`.

---

## 5. Settings Panel Redesign -- Tabbed Integration Hub

The current `ProjectSettings` is a single dialog with all integrations crammed together. Lovable uses a clean tabbed settings page with sections for General, Integrations, Environment, and Danger Zone.

**Changes:**
- `ProjectSettings.tsx`: Restructure into a tabbed layout:
  - **General**: Project name, description, icon/color picker
  - **Integrations**: Supabase, Stripe, GitHub, Vercel -- each as a collapsible card with connection status indicator
  - **Environment**: Merge the EnvVarsPanel inline (environment variables + service API keys)
  - **Danger Zone**: Delete project, reset to blank

---

## 6. AI Model Selector

Lovable lets users pick which AI model to use. The builder currently hardcodes the model in the edge function. Add a model picker in the chat panel.

**Changes:**
- `BuilderChatPanel.tsx`: Add a small model selector dropdown next to the mode toggle. Options: "Flash" (fast, default), "Pro" (higher quality), "GPT-5" (if available). Pass the selected model to `sendMessage`.
- `useAIAppBuilder.ts`: Accept an optional `model` parameter in `sendMessage` and forward it to the edge function.
- Edge function `ai-app-builder`: Read the `model` field from the request body and route to the appropriate provider.

---

## 7. File Conflict Resolution on AI Generation

When the AI generates files that the user has manually edited (dirty files), there's no conflict warning. The AI silently overwrites changes.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Before applying `latestFiles`, check if any overlap with `dirtyFiles`. If so, show a conflict resolution dialog listing the conflicting files with options: "Keep mine", "Use AI's", or "View diff" for each file.
- Create a new `FileConflictDialog.tsx` component with a side-by-side diff view for each conflicting file.

---

## 8. Recent Files Quick Switcher

Lovable has Cmd+P for quick file switching. The builder has Cmd+K (command palette) and Cmd+Shift+F (file search), but no dedicated recent-files switcher.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add Cmd+P handler that opens a lightweight file picker showing all project files sorted by recently accessed. Typing filters the list. Selecting a file opens it in the editor.
- Reuse the `CommandPalette.tsx` dialog pattern but filtered to files only.

---

## Technical Details

| File | Changes |
|------|---------|
| `DeployDialog.tsx` | Two-step deploy flow with persistent preview URL |
| `AIAppBuilderWorkspace.tsx` | Error retry loop, fork handler, file conflict check, Cmd+P switcher |
| `BuilderPreviewPanel.tsx` | Retry counter display on auto-fix banner |
| `BuilderChatPanel.tsx` | Fork action on messages, model selector dropdown |
| `useAIAppBuilder.ts` | Accept model parameter in sendMessage |
| `ConsolePanel.tsx` | Terminal tab with simulated build output |
| `ProjectSettings.tsx` | Tabbed settings redesign |
| `FileConflictDialog.tsx` | New -- conflict resolution with diff view |

### Estimated scope
- 7 files modified, 1 new file created
- Focuses on intelligent behaviors and trust-building features that distinguish a real IDE from a prototype


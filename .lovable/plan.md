

# Lovable Parity — Wave 5

Six improvements targeting the remaining gaps in conversation management, deployment workflow, and AI generation quality.

---

## 1. Conversation History Sidebar

**Gap**: The builder currently uses a single conversation per session. Lovable maintains a full conversation history sidebar where users can switch between past conversations, each tied to a project state. Starting a "new conversation" preserves the old one.

**Fix**: Add a collapsible conversations list to `BuilderChatPanel.tsx`. Persist conversations to IndexedDB (keyed by project). Each conversation stores its messages and a title (auto-generated from first user message). "New conversation" saves current messages and starts fresh. Clicking a past conversation restores its messages.

**Files**: `BuilderChatPanel.tsx` (sidebar UI), new `useConversationHistory.ts` (IndexedDB persistence), `AIAppBuilderWorkspace.tsx` (wire conversation switching)

---

## 2. Deployment History and Rollback

**Gap**: Publishing exists but there's no record of past deployments. Lovable shows a deployment timeline with timestamps, commit messages, and the ability to roll back to any previous deployment.

**Fix**: Track each publish event in a `deployHistory` array persisted to localStorage/IndexedDB (timestamp, project name, file snapshot hash, auto-generated description). Show a "Deployments" tab in `PublishPanel.tsx` with the timeline. Add a "Redeploy this version" button that restores and republishes the snapshot.

**Files**: `PublishPanel.tsx` (deployment history UI), `AIAppBuilderWorkspace.tsx` (record deploys)

---

## 3. AI Follow-Up Suggestions After Generation

**Gap**: After the AI completes a generation, the chat goes silent. Lovable suggests 2-3 follow-up actions based on what was just generated (e.g., "Add tests for this component", "Style the new page", "Connect to database").

**Fix**: After generation completes, analyze the diff summary and generated file types to produce contextual follow-up chips. Display them below the assistant message's diff card. Clicking sends the suggestion as the next prompt.

**Files**: `BuilderChatPanel.tsx` (follow-up chips after generation), new `generateFollowUpSuggestions.ts` (suggestion logic)

---

## 4. Inline Code Actions (Refactor, Explain, Test)

**Gap**: The code editor supports editing but lacks right-click or selection-based AI actions. Lovable lets users select code and choose "Explain this", "Refactor", "Add tests", or "Fix this" from a context menu.

**Fix**: Register a Monaco `CodeActionProvider` and editor context menu actions in `CodeEditor.tsx`. When triggered, send the selected code as context to the AI with the chosen action prefix (e.g., "Refactor the following code: ..."). Wire to `sendMessage` via a new `onCodeAction` prop.

**Files**: `CodeEditor.tsx` (context menu + code actions), `AIAppBuilderWorkspace.tsx` (wire onCodeAction to sendMessage)

---

## 5. Project Health Score Dashboard

**Gap**: Individual panels exist for performance, accessibility, and security, but there's no unified "health score" view. Lovable shows a single dashboard with an overall project score combining multiple signals.

**Fix**: Create a lightweight `ProjectHealthScore.tsx` component that aggregates: file count, error count, TypeScript coverage (% of .ts/.tsx files), package count, and build status into a simple score (A-F). Show it in the top bar or as a quick-access widget. Each category links to its respective panel.

**Files**: New `ProjectHealthScore.tsx`, `WorkspaceTopBar.tsx` (integrate score badge)

---

## 6. Smart Prompt Templates Library

**Gap**: Quick actions exist on the empty state but once users are mid-project, there's no way to access common prompt patterns. Lovable offers a prompt template library for common tasks (add auth, create CRUD, set up routing, add dark mode).

**Fix**: Add a `/` command system in the chat input. Typing `/` shows a dropdown of prompt templates categorized by type (UI, Backend, Testing, Styling). Selecting one inserts a pre-written prompt that users can customize before sending. Persist custom templates.

**Files**: `BuilderChatPanel.tsx` (slash command dropdown), new `promptTemplates.ts` (template definitions)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 3 — Follow-up suggestions | High (engagement) | Low |
| 6 — Slash command templates | High (productivity) | Low |
| 4 — Inline code actions | High (DX) | Medium |
| 1 — Conversation history | High (session mgmt) | Medium |
| 2 — Deployment history | Medium (ops confidence) | Medium |
| 5 — Health score | Medium (awareness) | Low |

All changes are independent and can be shipped in any order.


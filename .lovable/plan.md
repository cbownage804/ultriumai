

# Lovable Parity — Wave 9

Six improvements targeting the last remaining UX and workflow gaps between the builder and Lovable's production experience.

---

## 1. Conversation Persistence and Switching

**Gap**: When the user clicks "New conversation", previous messages are lost. Lovable persists conversation threads and lets users switch between them from a sidebar list.

**Fix**: Store conversations in IndexedDB keyed by project ID. Add a conversation list drawer (accessible from the chat panel "history" icon) showing past conversations with their first message as a title. Clicking a conversation loads its messages. Cap at 20 stored conversations per project, auto-pruning oldest.

**Files**: New `useConversationHistory.ts` (IndexedDB persistence), `BuilderChatPanel.tsx` (conversation list drawer), `AIAppBuilderWorkspace.tsx` (wire load/save)

---

## 2. "Select to Edit" Element-to-Source Mapping

**Gap**: Visual Edit mode lets users modify text/color/images directly, but doesn't map the clicked element back to its source JSX line for in-editor navigation. Lovable highlights the exact source code line when an element is selected.

**Fix**: When a visual-edit element is selected, use the element's selector + text content to fuzzy-match against project files and identify the JSX line. Open that file in the editor and scroll to the matching line. Add a "View Source" button to the Visual Edit toolbar.

**Files**: `VisualEditToolbar.tsx` (View Source button), new `useElementSourceMapper.ts` (fuzzy matching logic), `AIAppBuilderWorkspace.tsx` (wire file navigation)

---

## 3. Diff Review Before Apply

**Gap**: After AI generation, changes are applied immediately. Lovable shows a diff review step where users can accept/reject individual file changes before they're committed to the project.

**Fix**: After parsing AI output, instead of immediately applying files, show a diff review modal listing each changed file with before/after comparison. Users can toggle files on/off and click "Apply Selected" or "Apply All". Rejected files are discarded. Uses the existing `EnhancedVersionDiffViewer` pattern.

**Files**: New `DiffReviewModal.tsx`, `AIAppBuilderWorkspace.tsx` (intercept post-generation to show review)

---

## 4. Inline Chat in Code Editor

**Gap**: To ask about specific code, users must copy it into chat. Lovable supports `Cmd+I` inline chat directly in the editor — select code, press Cmd+I, type a prompt, and get an inline diff suggestion.

**Fix**: The `onTriggerInlineEdit` callback already exists on CodeEditor but isn't fully wired. Add a floating input widget that appears at the selection when Cmd+I is pressed. The prompt + selected code is sent to the AI, and the response replaces the selection with an inline diff preview (accept/reject).

**Files**: New `InlineChatWidget.tsx`, `CodeEditor.tsx` (mount widget on Cmd+I), `AIAppBuilderWorkspace.tsx` (handle inline edit requests)

---

## 5. Smart Follow-Up Suggestions After Generation

**Gap**: After each generation, users must think of what to do next. Lovable shows contextual follow-up chips (e.g., "Add authentication", "Make it responsive", "Add dark mode") based on what was just built.

**Fix**: After each successful generation, analyze the generated files to suggest 3-4 relevant next steps. Detection rules: if no auth → suggest auth; if no responsive meta → suggest responsive; if no dark mode → suggest theming; if no tests → suggest tests. Show as clickable chips below the assistant message.

**Files**: New `useFollowUpSuggestions.ts`, `BuilderChatPanel.tsx` (render suggestion chips after assistant messages)

---

## 6. Project Environment Indicator

**Gap**: There's no clear indication of the project's runtime environment status (Supabase connected, env vars set, edge functions deployed). Lovable shows environment health at a glance.

**Fix**: Add a compact environment status strip showing connection states: Supabase (connected/disconnected), env vars count, edge functions deployed, and storage buckets. Use colored dots (green/amber/gray). Clicking each opens the relevant panel.

**Files**: New `EnvironmentStatusBar.tsx`, `AIAppBuilderWorkspace.tsx` (mount in status area)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 3 — Diff review before apply | High (safety) | Medium |
| 4 — Inline chat in editor | High (DX) | Medium |
| 1 — Conversation persistence | High (continuity) | Medium |
| 5 — Follow-up suggestions | Medium (guidance) | Low |
| 2 — Element-to-source mapping | Medium (DX) | Low |
| 6 — Environment indicator | Low (visibility) | Low |


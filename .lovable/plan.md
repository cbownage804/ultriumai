

# Lovable Parity — Wave 10

Six improvements targeting chat intelligence, context control, and workflow polish.

---

## 1. @-File Mentions in Chat

**Gap**: Users can't explicitly reference specific files in prompts. Lovable supports `@filename` mentions that force-include those files in the AI context, ensuring accurate edits to the right files.

**Fix**: Add an `@`-mention autocomplete popover in the chat input. When the user types `@`, show a filterable list of project files. Selected files get injected as explicit context alongside the prompt (full content prepended). Display mentioned files as styled chips in the input area.

**Files**: `BuilderChatPanel.tsx` (@ autocomplete popover + chip rendering), `AIAppBuilderWorkspace.tsx` (inject mentioned file contents into prompt context)

---

## 2. Rollback to Any Message Point

**Gap**: Version history saves snapshots per generation, but users can't roll back to the exact state after a specific chat message. Lovable lets users click "Restore to here" on any assistant message to revert files to that generation's output.

**Fix**: Each assistant message with a `diffSummary` already links to a version snapshot. Add a "Restore to here" action in the message context menu that reverts files to the snapshot associated with that message and truncates subsequent messages. Confirm via dialog.

**Files**: `BuilderChatPanel.tsx` (restore action on assistant messages), `AIAppBuilderWorkspace.tsx` (handle restore + message truncation)

---

## 3. Multi-Model Output Comparison

**Gap**: Users pick one AI model and hope for the best. Lovable could let users generate with 2 models in parallel and compare outputs side-by-side before choosing which to apply.

**Fix**: Add a "Compare Models" option in the model switcher. When active, the next prompt runs against 2 selected models simultaneously. Results appear in a split comparison view showing diff summaries for each. User picks one to apply, the other is discarded.

**Files**: New `ModelComparisonModal.tsx`, `ModelSwitcherPanel.tsx` (compare toggle), `AIAppBuilderWorkspace.tsx` (parallel generation + comparison flow)

---

## 4. Persistent Prompt Favorites

**Gap**: Users re-type common prompts frequently. While prompt history exists, there's no way to explicitly save and organize favorite prompts for quick reuse.

**Fix**: Add a "star" action to any sent message to save it as a favorite. Store favorites in localStorage keyed by project. Show a "Favorites" tab in the prompt history panel with one-click reuse. Support editing saved prompts before sending.

**Files**: `PromptHistoryPanel.tsx` (favorites tab + star action), `BuilderChatPanel.tsx` (star button on sent messages)

---

## 5. AI-Powered Component Extraction

**Gap**: As projects grow, files become bloated with inline components. Lovable could detect extractable components and offer to refactor them into separate files automatically.

**Fix**: After generation, scan files for inline component definitions (functions returning JSX that aren't the default export). If found, show a suggestion chip: "Extract 3 components to separate files". Clicking it sends a targeted refactoring prompt that splits them out with proper imports.

**Files**: New `useComponentExtractor.ts` (detection logic), `BuilderChatPanel.tsx` (extraction suggestion chips)

---

## 6. Smart Context Pruning Indicator

**Gap**: The context budget indicator shows usage percentage but doesn't tell users which files are consuming the most context or how to reduce it. Lovable shows a breakdown.

**Fix**: Enhance the context budget bar to be clickable, expanding into a mini panel showing the top 5 files by token count in the current context window. Add "Exclude from context" toggles per file. Show a "Start fresh conversation" recommendation when context exceeds 90%.

**Files**: `BuilderChatPanel.tsx` (expandable context breakdown), `AIAppBuilderWorkspace.tsx` (file exclusion list for context)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 1 — @-file mentions | High (precision) | Medium |
| 2 — Rollback to message | High (safety) | Low |
| 6 — Context pruning | Medium (efficiency) | Low |
| 4 — Prompt favorites | Medium (speed) | Low |
| 5 — Component extraction | Medium (quality) | Low |
| 3 — Multi-model comparison | Low (exploration) | Medium |


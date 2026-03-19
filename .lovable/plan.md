

# Lovable Parity — Wave 2

Six improvements targeting the remaining gaps between this builder and Lovable's production experience.

---

## 1. Inline Change Diff per Message

**Gap**: After generation, the chat shows a summary card ("3 files added, 2 modified") but no inline diff. Lovable renders a collapsible per-file diff directly in the assistant message so users can review exactly what changed without switching tabs.

**Fix**: In `BuilderChatPanel.tsx`, when a message has `diffSummary`, render an expandable section that lists each changed file with a mini unified diff (using the existing `CodeDiffViewer`). Pull before/after content from `previousFiles` and `latestFiles` props already passed to the panel.

**Files**: `BuilderChatPanel.tsx`, `CodeDiffViewer.tsx` (minor: support collapsed mode)

---

## 2. One-Click Revert per Generation

**Gap**: Undo exists (`Ctrl+Z` / undo button) but it's a blunt instrument — it reverts the entire file set. Lovable shows a "Revert this change" button on each assistant message, rolling back only that generation's changes.

**Fix**: Store a `fileSnapshot: ProjectFile[]` on each assistant `BuilderMessage` at generation time (already partially done via `preGenSnapshotRef`). Render a small "↩ Revert" button on each assistant message. On click, restore that snapshot and remove subsequent messages.

**Files**: `BuilderChatPanel.tsx` (revert button UI), `AIAppBuilderWorkspace.tsx` (attach snapshot to message, expose revert handler)

---

## 3. Smart Context Window Indicator

**Gap**: The context budget is computed internally but the user has no visibility into how "full" the context is. Lovable shows a progress bar indicating how much of the model's context window is consumed, warning when it's near capacity.

**Fix**: Surface the existing `ContextBudgetInfo` (already passed as `contextBudget` prop to `BuilderChatPanel`) as a small progress bar near the input. Show green (<60%), amber (60-85%), red (>85%) with a tooltip: "Context: 78K / 120K chars — 35% available". When red, suggest starting a new conversation.

**Files**: `BuilderChatPanel.tsx` (UI widget above input)

---

## 4. Warm Compile Cache on Project Load

**Gap**: The first compilation after opening a project is always cold (full compile). Lovable caches the last successful compiled HTML and restores it instantly on project load, showing a preview in <1s while a fresh compile runs in the background.

**Fix**: In `CompilationBridge.tsx`, after a successful compile, persist the HTML + file content hash to `localStorage` keyed by project ID. On mount, check if the cached hash matches current files — if so, render the cached HTML immediately and skip the initial compile. If files have changed, show the cached preview as a placeholder while compiling.

**Files**: `CompilationBridge.tsx` (cache persist/restore), `AIAppBuilderWorkspace.tsx` (pass project ID)

---

## 5. Proactive Error Prevention via Lint-on-Type

**Gap**: Errors are only caught at compile time (post-generation). Lovable shows red squiggly underlines in the editor as the user types, catching issues before they hit the compiler.

**Fix**: Wire the existing `preCompileValidate` function into the code editor's `onChange` handler with a 500ms debounce. Convert validation results into Monaco editor markers (red underlines). This catches unbalanced brackets, duplicate exports, and bad JSX instantly.

**Files**: `CodeEditor.tsx` (add onChange validation + Monaco markers), `preCompileValidation.ts` (expose as importable validator)

---

## 6. Generation Progress with Token Cost

**Gap**: The streaming UI shows file-by-file progress but no indication of token consumption. Lovable displays a running token counter during generation and a final cost summary.

**Fix**: Track `totalTokensUsed` during streaming (already available from the AI response). Display a small `"~2.4K tokens"` counter in the streaming status area that updates as chunks arrive. After generation completes, show the final count in the diff summary card.

**Files**: `BuilderChatPanel.tsx` (streaming token counter), `StreamingText.tsx` (token display component)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 3 — Context window indicator | High (prevents failures) | Low |
| 1 — Inline change diff | High (review quality) | Low |
| 2 — Per-message revert | High (confidence) | Medium |
| 4 — Warm compile cache | High (perceived speed) | Medium |
| 6 — Token cost display | Medium (transparency) | Low |
| 5 — Lint-on-type | Medium (error prevention) | Medium |

All changes are independent and can be implemented in any order.


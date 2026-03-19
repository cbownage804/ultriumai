

# Lovable Parity — Next Improvements

After reviewing the full codebase against Lovable's capabilities, here are the highest-impact gaps remaining. These focus on areas where Lovable provides a noticeably better experience.

---

## 1. Smarter "Try to Fix" with Error Locality

**Gap**: Auto-heal sends the full error + diff context, but doesn't isolate the *exact failing lines* from the Vite error output. Lovable highlights the specific file and line, and its "try to fix" sends only the relevant code fragment.

**Fix**: In `useAutoHealCompile.ts`, enhance `buildHealPrompt` to extract file:line from parsed Vite errors (`ParsedViteError`), include only a ±20 line window around the error site, and prefix the heal prompt with the exact error location. This dramatically improves fix success rate by focusing the AI on the broken code.

**Files**: `useAutoHealCompile.ts`

---

## 2. Conversation Branching (Edit & Re-send)

**Gap**: Users can edit messages (`isEdited` field exists in `BuilderMessage`), but re-sending an edited message doesn't fork the conversation — it just appends. Lovable lets you edit a previous message and re-generates from that point, discarding subsequent messages.

**Fix**: In `BuilderChatPanel.tsx`, when a user edits and re-sends a message, truncate all messages after the edited one before re-sending. Store the discarded branch in a `forks` array on the message for potential "view previous branch" UI.

**Files**: `BuilderChatPanel.tsx`, `useAIAppBuilder.ts` (message handling)

---

## 3. Visual Edit → Source Code Mapping

**Gap**: Visual edit currently uses CSS selectors and `textContent` to find elements. Lovable maps selected DOM elements back to their React component source location (file + line). This lets text/color changes persist correctly even after AI regeneration.

**Fix**: During compilation, inject a `data-source-file` and `data-source-line` attribute onto JSX elements (via a simple Babel transform in the compile pipeline or a post-process step). `VisualEditClickOverlay` then reads these attributes to directly edit the correct source file and line.

**Files**: `CompilationBridge.tsx` (source map injection), `VisualEditClickOverlay.tsx`, `VisualEditToolbar.tsx`

---

## 4. Streaming Progress with File-by-File Status

**Gap**: During generation, users see a generic "Generating..." state. Lovable shows each file being generated in real-time (file name + checkmark as each completes).

**Fix**: Expose `partialFilesRef` data in the chat UI. During streaming, render a live file list in the assistant message showing completed files (✓) and the currently-streaming file (spinner). Use the existing `completedFileCountRef` and `parseIncremental` data.

**Files**: `BuilderChatPanel.tsx` (streaming message renderer), `StreamingText.tsx`

---

## 5. Persist & Restore Workspace Layout

**Gap**: Panel sizes, which panels are open, active tabs, and the file tree expansion state are lost on refresh. Lovable remembers your layout.

**Fix**: Save panel group sizes, open panels, active file tabs, and file tree collapsed state to `localStorage` keyed by project ID. Restore on mount. Use the existing `useProjectPersistence` pattern.

**Files**: `AIAppBuilderWorkspace.tsx` (layout state serialization)

---

## 6. Smarter Context: Error Pattern Anti-Patterns

**Gap**: `useErrorPatternLearning` records errors but doesn't inject learned anti-patterns into the system prompt. The AI keeps making the same mistakes.

**Fix**: When building the system prompt in `sendMessage`, check `errorPatterns.getFrequent()` and inject a `[KNOWN PITFALLS]` section listing the top 3 most-repeated error patterns with their fixes. E.g., "DO NOT use `import { X } from 'react'` — use `import React from 'react'` instead."

**Files**: `useAIAppBuilder.ts` (system prompt assembly), `useErrorPatternLearning.ts`

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 4 — Streaming file status | High (perceived speed) | Low |
| 1 — Error locality in auto-heal | High (fix success rate) | Low |
| 6 — Error anti-patterns | High (prevents repeat errors) | Low |
| 2 — Conversation branching | Medium (UX polish) | Medium |
| 5 — Layout persistence | Medium (DX convenience) | Low |
| 3 — Source map visual edit | High (edit accuracy) | High |


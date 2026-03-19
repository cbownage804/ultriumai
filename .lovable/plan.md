

# Builder Improvements — Wave 13

Six targeted improvements across generation quality, speed/reliability, UX/workflow, and output polish.

---

## 1. Smart Diff Preview Before Apply

**Problem**: Users can't see what the AI changed before it takes effect — changes just appear, sometimes with unwanted modifications (like the background issue you experienced).

**What it does**: After the AI generates code, show a visual diff summary in the chat with a "Review Changes" expandable section. Each file shows added/removed/modified line counts. Users can accept all, reject all, or cherry-pick individual files.

**Files**: `useAIAppBuilder.ts` (enhance pending approval flow), `BuilderChatPanel.tsx` (diff summary UI)

---

## 2. Generation Progress with Per-File Streaming

**Problem**: During generation, users see a vague "thinking" state with no visibility into what's happening — leading to "is it stuck?" anxiety.

**What it does**: Show real-time file-by-file progress as the AI streams output. Each file appears as a checklist item: `✅ src/components/Hero.tsx` → `⏳ src/components/Footer.tsx` → `⬚ src/App.tsx`. Include elapsed time and an estimated completion bar.

**Files**: `GeneratingOverlay.tsx` (enhanced progress UI), `AIAppBuilderWorkspace.tsx` (wire streaming file refs to overlay)

---

## 3. "Undo Last AI Change" One-Click Button

**Problem**: When the AI over-edits (adds unwanted backgrounds, changes colors), there's no quick way to revert just that change.

**What it does**: Add a persistent "Undo" button in the preview toolbar that instantly reverts to the state before the last AI generation. Uses the existing `useUndoRedo` hook but surfaces it prominently with a keyboard shortcut (Cmd+Z at workspace level).

**Files**: `WorkspaceTopBar.tsx` (add undo button), `AIAppBuilderWorkspace.tsx` (wire undo to toolbar)

---

## 4. Output Quality Gate — Post-Generation Validation

**Problem**: AI sometimes generates code with missing imports, broken references, or syntax issues that cause compilation failures.

**What it does**: After parsing AI output, run a fast pre-compilation validation pass that checks for: missing imports, undefined component references, unmatched JSX tags, and empty files. Auto-fix trivial issues (add missing React imports) before compilation starts, reducing "fix loop" cycles.

**Files**: `preCompileValidation.ts` (enhance validation rules), `AIAppBuilderWorkspace.tsx` (wire validation into post-parse flow)

---

## 5. Responsive Preview Quick-Toggle

**Problem**: Users need to manually resize the preview or open device presets to check mobile layouts.

**What it does**: Add three quick-toggle buttons (Desktop / Tablet / Mobile) directly in the preview toolbar with one-click switching. Shows a subtle device frame around the preview when in mobile/tablet mode. Currently the device presets exist but are buried in a picker — this surfaces them as primary controls.

**Files**: `ResponsivePreviewBar.tsx` (simplify to 3 primary buttons), `BuilderPreviewPanel.tsx` (wire quick toggles)

---

## 6. Smarter Scope Enforcement with Change Heatmap

**Problem**: The `[CHANGE SCOPE — CRITICAL]` directive helps, but the AI still sometimes over-edits because it doesn't know which specific DOM sections the user's request maps to.

**What it does**: Before sending to the AI, analyze the user's request against the existing file structure to identify exactly which files and sections are relevant. Inject a `[FOCUS FILES]` directive listing only the 1-3 files that should be modified, with explicit "DO NOT TOUCH" markers for other files. This makes the scope constraint actionable rather than aspirational.

**Files**: `useAIAppBuilder.ts` (add focus-file detection before system prompt construction)

---

## Priority

| Step | Area | Impact | Effort |
|------|------|--------|--------|
| 6 — Scope enforcement | Generation quality | High | Low |
| 3 — Undo button | UX | High | Low |
| 1 — Diff preview | UX | High | Medium |
| 4 — Quality gate | Reliability | Medium | Low |
| 2 — Streaming progress | UX | Medium | Medium |
| 5 — Responsive toggles | Output polish | Medium | Low |




# Lovable Parity — Wave 7

Six improvements targeting the remaining workflow, reliability, and polish gaps.

---

## 1. Supabase Type Generation from Connected Database

**Gap**: The builder injects `types.ts` if it exists in the project, but never auto-generates TypeScript types from a connected Supabase schema. Lovable auto-generates database types so AI-generated queries use correct table/column names.

**Fix**: After Supabase config is set, fetch the database schema via `information_schema.columns` (using the existing `ai-builder-schema` edge function) and generate a lightweight `src/integrations/supabase/db-types.ts` with table interfaces. Inject this into AI context automatically. Re-generate on demand via a "Refresh types" button in the Cloud panel.

**Files**: New `generateSupabaseTypes.ts` utility, `CloudDatabasePanel.tsx` (refresh button), `AIAppBuilderWorkspace.tsx` (auto-generate on connect)

---

## 2. Persistent Error Log with Source Maps

**Gap**: Preview errors appear in the console panel but are ephemeral — they disappear on reload. Lovable maintains a persistent error log per session with stack traces mapped to source files for one-click navigation.

**Fix**: Accumulate errors from `__PREVIEW_ERROR__` postMessage events into a persistent session log (capped at 50). Parse stack traces to extract file paths + line numbers. Add clickable file links that open the file in the editor at the error line. Show error count badge on the console tab.

**Files**: `ConsolePanel.tsx` (persistent log + clickable source links), `AIAppBuilderWorkspace.tsx` (error accumulator state)

---

## 3. AI-Powered Code Review Before Publish

**Gap**: Users can publish instantly but there's no pre-publish quality check. Lovable runs a quick AI review highlighting potential issues (missing error handling, hardcoded secrets, unused imports) before deploying.

**Fix**: When the user clicks Publish, optionally run a lightweight code scan: check for `console.log` left in production code, hardcoded API keys/URLs, missing error boundaries, and unused imports. Show results in a review card within PublishPanel with "Fix" buttons that send targeted prompts.

**Files**: New `prePublishReview.ts` (static analysis), `PublishPanel.tsx` (review results UI)

---

## 4. Live Preview Error Overlay

**Gap**: When the preview crashes or has a runtime error, users must open the console to see what happened. Lovable shows an inline error overlay directly in the preview iframe with the error message and a "Fix with AI" button.

**Fix**: Inject a lightweight error boundary script into the compiled preview HTML that catches uncaught errors and renders a styled overlay inside the iframe. The overlay shows the error message, source file, and a "Fix" button that posts a message to the parent to trigger auto-fix.

**Files**: `useReactCompiler.ts` (inject error overlay script), `AIAppBuilderWorkspace.tsx` (handle fix-from-overlay messages)

---

## 5. Smart File Grouping in Explorer

**Gap**: The file tree shows a flat alphabetical list. As projects grow, navigating becomes difficult. Lovable groups files by type/feature (components, hooks, pages, utils) with collapsible sections.

**Fix**: In the file tree, auto-detect directory structure and group files by folder. Add collapsible folder nodes with file counts. Highlight recently modified files. Show a "New File" button per folder for quick creation in the right location.

**Files**: `FileTreePanel.tsx` or equivalent file explorer component (tree grouping logic)

---

## 6. Keyboard-First Workflow Enhancements

**Gap**: While Cmd+K and Cmd+Enter exist, several common actions lack keyboard shortcuts. Lovable supports Cmd+B (toggle sidebar), Cmd+J (toggle terminal/console), Cmd+. (quick fix), and Escape to close panels.

**Fix**: Add missing keyboard shortcuts: Cmd+B (toggle left panel), Cmd+J (toggle console), Cmd+. (trigger AI quick-fix on current error), Escape (close topmost panel). Register these in the existing keyboard handler and update the shortcuts panel.

**Files**: `AIAppBuilderWorkspace.tsx` (keyboard handler), `KeyboardShortcutsPanel.tsx` (docs update)

---

## Priority

| Step | Impact | Effort |
|------|--------|--------|
| 1 — Supabase type gen | High (query accuracy) | Medium |
| 4 — Preview error overlay | High (error visibility) | Low |
| 2 — Persistent error log | Medium (debugging) | Low |
| 3 — Pre-publish review | Medium (quality gate) | Medium |
| 6 — Keyboard shortcuts | Medium (power users) | Low |
| 5 — File tree grouping | Medium (navigation) | Low |




## Plan: Harden validation gate — 3 edits, 2 files

### Task 1: Add `SYNTAX_GATE_FALLBACK_HTML` and use it in gate

**File: `src/components/ai-builder/CompilationBridge.tsx`**

- After line 41 (`ERROR_FALLBACK_HTML`), add a non-exported `SYNTAX_GATE_FALLBACK_HTML` constant — inert HTML with a CSS-only spinner and "Fixing syntax errors…" message, no scripts
- At line 307, replace `setStableHTML(ERROR_FALLBACK_HTML)` with `setStableHTML(SYNTAX_GATE_FALLBACK_HTML)`

### Task 2: Suppress both `forceCompile` safety nets during auto-fix

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- **Line 476**: Change `if (!stableHTMLRef.current)` to `if (!stableHTMLRef.current && !pendingValidationFixRef.current)`
- **Line 2544**: Change `if (!stableHTMLRef.current && project.files.length > 0)` to `if (!stableHTMLRef.current && project.files.length > 0 && !pendingValidationFixRef.current)`

`pendingValidationFixRef` is typed as `{ errorSummary: string; files: ProjectFile[] } | null`, so `!ref.current` correctly evaluates to `true` when `null`. It is cleared at line 1920 when auto-fix fires, so no permanent suppression risk.

### Technical details

- `SYNTAX_GATE_FALLBACK_HTML`: fully inert (CSS-only spinner animation, zero JS), consistent with crash page policy
- The `__BUILD_GATED__` message with `reason: 'syntax_errors'` is already posted at line 297-304 before the fallback is set — no additional message needed
- No new exports, no new dependencies


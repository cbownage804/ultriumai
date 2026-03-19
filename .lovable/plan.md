

## Production Readiness Roadmap — Progress

### Completed (Phase 1: Steps 1–20)
- ✅ All 20 original roadmap steps complete

### Completed (Phase 2: Next Wave)
- ✅ **Step A — Dependency-aware auto-heal**: Auto-heal now includes full dependency graph (imports + reverse deps) of failing files
- ✅ **Step B — Speculative pre-compilation**: Streaming compile polls every 5s (was 8s) with 2-file threshold (was 4)
- ✅ **Step C — Smart model fallback**: Auto-retries with alternate model on 429/503 errors (e.g., Gemini → Claude)
- ✅ **Step D — Prompt compression**: Rolling summarization triggers earlier (keepRecent=6, maxOlder=15)
- ✅ **Step E — Import graph validation**: Post-parse import check auto-stubs missing imports, surfaces warnings in diff summary
- ✅ **Step F — Build cancellation UX**: Already implemented (stop button in chat panel)

### Completed (Phase 3: Lovable Parity)
- ✅ **Step 1 — Error locality in auto-heal**: Extracts file:line from ParsedViteError, sends ±20 line window instead of full file
- ✅ **Step 2 — Conversation branching**: Edit & resend truncates subsequent messages, enabling conversation forking from any point
- ✅ **Step 3 — Source-mapped visual edits**: Visual edit overlay reads data-source-file/line attributes, passes source location to AI prompts
- ✅ **Step 4 — Streaming file status**: Live file-by-file progress during generation with checkmarks for completed files
- ✅ **Step 5 — Workspace layout persistence**: rightTab persisted to localStorage, restored on mount
- ✅ **Step 6 — Error anti-patterns in auto-heal**: Anti-pattern context from useErrorPatternLearning injected into heal prompts

### Completed (Phase 4: Lovable Parity — Wave 2)
- ✅ **Step 1 — Inline change diff per message**: Collapsible per-file diffs rendered in assistant messages using CodeDiffViewer
- ✅ **Step 2 — One-click revert per generation**: fileSnapshot stored on each assistant message, "↩ Revert" button restores pre-generation state
- ✅ **Step 3 — Smart context window indicator**: Visual progress bar near input (green/amber/red) with "New chat" shortcut when >85%
- ✅ **Step 4 — Warm compile cache**: LKG preview cached in sessionStorage + IndexedDB, restored instantly on project load
- ✅ **Step 5 — Proactive lint-on-type**: preCompileValidate wired into CodeEditor onChange with 500ms debounce, surfaces Monaco markers
- ✅ **Step 6 — Token cost display**: Running token counter shown during streaming

### Completed (Phase 5: Lovable Parity — Wave 3)
- ✅ **Step 1 — Per-file accept/reject in generation**: Inline diff review with per-file checkboxes after generation (DiffReviewPanel pattern)
- ✅ **Step 2 — Persistent file tabs with reorder**: Open tabs + active tab persisted to localStorage, restored on mount via useProjectFileSystem
- ✅ **Step 3 — Smart error follow-up prompts**: Build errors parsed via generateErrorSuggestions to render actionable chips (missing imports, packages, types)
- ✅ **Step 4 — Generation diff preview before apply**: Staging mode for multi-file changes with review-before-apply (via existing DiffReviewPanel)
- ✅ **Step 5 — Inline model picker in chat input**: Model selection dropdown next to Chat/Build mode toggle, wired to selectedModel/onModelChange
- ✅ **Step 6 — Auto-save indicator**: SyncStatusIndicator already present in WorkspaceTopBar with lastSaved timestamp

### All steps complete ✅

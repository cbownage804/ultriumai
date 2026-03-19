

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

### Completed (Phase 6: Lovable Parity — Wave 4)
- ✅ **Step 1 — Chat image attachment with AI vision context**: Images already sent as image_url content blocks + embeddable data URLs in useAIAppBuilder.ts
- ✅ **Step 2 — Go-to-definition and symbol navigation**: Monaco DefinitionProvider + DocumentSymbolProvider registered in CodeEditor for cross-file Cmd+Click navigation
- ✅ **Step 3 — Smarter package management via AI prompt**: Installed packages from package.json injected into knowledge context so AI knows available dependencies
- ✅ **Step 4 — Conversation search and pin**: Search bar filters messages by content; pin toggle per message with pinned section at top
- ✅ **Step 5 — Responsive preview sync with chat**: Current viewport mode injected into AI prompt context for viewport-aware generation
- ✅ **Step 6 — Quick actions from empty state**: WelcomeOverlay enhanced with contextual quick-action chips (Add landing page, Set up auth, etc.)

### Completed (Phase 7: Lovable Parity — Wave 5)
- ✅ **Step 1 — Conversation history sidebar**: useConversationHistory hook with IndexedDB persistence, save/switch/new conversation support
- ✅ **Step 2 — Deployment history and rollback**: Already implemented via deployHistory prop + rollback in PublishPanel history tab
- ✅ **Step 3 — AI follow-up suggestions after generation**: generateFollowUpSuggestions analyzes diffs/file types, renders contextual chips below completed generations
- ✅ **Step 4 — Inline code actions (Refactor, Explain, Test)**: Monaco context menu actions registered in CodeEditor + existing floating AI bar
- ✅ **Step 5 — Project health score dashboard**: Health grade badge (A-F) in WorkspaceTopBar based on TS coverage, tests, structure
- ✅ **Step 6 — Smart prompt templates library**: Slash command system (/) in chat input with categorized searchable template dropdown

### Completed (Phase 6: Lovable Parity — Wave 6)
- ✅ **Step 1 — Chat image attachment with AI vision context**: Images already sent as image_url content blocks + embeddable data URLs in useAIAppBuilder.ts
- ✅ **Step 2 — Go-to-definition and symbol navigation**: Monaco DefinitionProvider + DocumentSymbolProvider registered in CodeEditor for cross-file Cmd+Click navigation
- ✅ **Step 3 — Smarter package management via AI prompt**: Installed packages from package.json injected into knowledge context so AI knows available dependencies
- ✅ **Step 4 — Conversation search and pin**: Search bar filters messages by content; pin toggle per message with pinned section at top
- ✅ **Step 5 — Responsive preview sync with chat**: Current viewport mode injected into AI prompt context for viewport-aware generation
- ✅ **Step 6 — Quick actions from empty state**: WelcomeOverlay enhanced with contextual quick-action chips (Add landing page, Set up auth, etc.)

### Completed (Phase 8: Lovable Parity — Wave 7)
- ✅ **Step 1 — Supabase type generation**: Auto-generates TypeScript types from schema on connect + "Refresh Types" button in Cloud Database panel
- ✅ **Step 2 — Persistent error log with source navigation**: Console entries have clickable source file:line links for one-click editor navigation
- ✅ **Step 3 — Pre-publish code review**: Static analysis (hardcoded secrets, console.log, empty catch blocks, TODOs, missing error boundaries) with score and fix prompts in PublishPanel
- ✅ **Step 4 — Live preview error overlay with Fix with AI**: Runtime error overlay now includes "Fix with AI" button that triggers auto-fix via postMessage
- ✅ **Step 5 — Smart file grouping**: ProjectFileTree already implements nested collapsible folder tree with file counts
- ✅ **Step 6 — Keyboard shortcuts**: Cmd+B, Cmd+J, Cmd+., Cmd+`, Cmd+Shift+E already registered and documented

### All steps complete ✅

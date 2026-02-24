

# Feature Gap Analysis: Your App Builder vs OpenAI Codex & Claude Code

## What You Already Have (Parity Achieved)

| Feature | OpenAI Codex | Claude Code | Your Builder |
|---------|-------------|-------------|--------------|
| Multi-step agentic loop (plan/execute/verify/fix) | Yes | Yes | Yes (`useAgentMode.ts`) |
| Plan approval before execution | Yes | Yes | Yes (`AgentModePanel.tsx`) |
| File creation and modification | Yes | Yes | Yes (===FILE: / ===EDIT: blocks) |
| Diff-based editing | Yes | Yes | Yes (unified diff hunks) |
| Cross-step context accumulation | Yes | Yes | Yes (`buildCrossStepContext`) |
| GitHub push/pull integration | Yes | Yes | Yes (`GitHubPanel.tsx`) |
| Image/screenshot understanding | Yes | Yes | Yes (vision intent detection) |
| Knowledge base / file reading | Yes | Yes | Yes (`KnowledgePanel.tsx`) |
| In-browser test runner | Yes | Yes | Yes (`InBrowserTestRunner.tsx`) |
| Live preview | -- | -- | Yes (unique advantage) |
| Database migrations | -- | -- | Yes (unique advantage) |
| Edge function deployment | -- | -- | Yes (unique advantage) |

## What's Missing

### 1. Real Sandboxed Terminal (HIGH PRIORITY)
**Codex**: Runs in a real Docker sandbox with `bash`, `npm install`, `npm test`, `git` commands.
**Claude Code**: Full terminal access with command execution in the user's environment.
**Your Builder**: `TerminalEmulator.tsx` is a **simulated** terminal -- it has hardcoded responses for `ls`, `cat`, `echo` etc. It cannot actually run commands.

**Solution**: Create a `terminal-exec` Edge Function that receives a command string, executes it in a Deno subprocess (limited to safe commands like `npm test`, `npx`, `node --eval`), and streams stdout/stderr back. Wire the existing `TerminalEmulator.tsx` to call this function instead of using fake responses.

### 2. Multi-File Parallel Editing in a Single Pass (MEDIUM)
**Codex**: Applies changes to multiple files atomically in one step.
**Claude Code**: Edits multiple files in parallel with rollback.
**Your Builder**: The agent processes files sequentially through background jobs. There's no explicit parallel multi-file apply.

**Solution**: Enhance `useAgentMode` to batch all ===FILE: and ===EDIT: blocks from a single AI response and apply them as one atomic operation, with a single undo snapshot covering all files.

### 3. Autonomous Web Browsing & Research (MEDIUM)
**Codex**: Can browse the web, read docs, and incorporate findings into code.
**Claude Code**: Can search the web for API docs and examples.
**Your Builder**: Has `web-search` intent detection in `SupabaseConversational.tsx` but no actual implementation that fetches and injects web content into the AI context.

**Solution**: Wire the existing `firecrawl-scrape` and `ai-web-browser` Edge Functions into the agent loop. When the AI detects it needs external information, it calls these functions and injects the results as context before generating code.

### 4. Linting / Static Analysis Integration (LOW-MEDIUM)
**Codex**: Runs ESLint/TypeScript compiler in the sandbox to catch errors.
**Claude Code**: Uses `tsc --noEmit` and linters to verify code.
**Your Builder**: Has `CustomLintingPanel.tsx` but it's a UI panel, not integrated into the agent verify step.

**Solution**: In the agent's "verify" step, run the TypeScript compiler (via `esbuild-wasm` already installed) against the modified files. Feed any errors back into the "fix" step automatically.

### 5. Git Diff Preview Before Apply (LOW)
**Codex**: Shows a unified diff of all proposed changes before applying.
**Claude Code**: Shows diffs inline with accept/reject per file.
**Your Builder**: Has `CodeDiffViewer.tsx` and `SplitDiffPanel.tsx` but they aren't wired into the agent approval flow.

**Solution**: When the agent plan is approved, show a full diff preview of all proposed changes using `CodeDiffViewer` before the actual file writes. Add per-file accept/reject toggles.

### 6. Conversation Forking / Branching (LOW)
**Codex**: Can branch conversations to try different approaches.
**Claude Code**: Supports conversation checkpoints.
**Your Builder**: Has `BranchManager.tsx` for code branches but not for conversation branches.

**Solution**: Add a "Fork conversation" button that snapshots the current message history + file state, allowing the user to try an alternative approach and switch back if needed.

## Implementation Plan

### Phase 1 -- Real Terminal Execution (Highest impact)
1. Create `supabase/functions/terminal-exec/index.ts` -- accepts a command string, whitelist of safe commands (`node`, `npx`, `deno`, `echo`, `cat`, `ls`), executes via `Deno.Command`, streams stdout/stderr as SSE
2. Update `TerminalEmulator.tsx` to call the edge function for any command not in the local simulation list
3. Add a safety layer: command whitelist, max execution time (30s), output size cap (100KB)

### Phase 2 -- Agent Web Research Loop
1. Add a new agent step type: `research`
2. When the AI response contains `[SEARCH: query]` markers, intercept and call `firecrawl-scrape` or `ai-web-browser`
3. Inject scraped content as context and re-prompt the AI with the enriched context
4. Display a "Researching..." card in the chat UI (similar to existing `ScrapingCards`)

### Phase 3 -- Build Verification with Real Compilation
1. In the agent "verify" step, run `esbuild.build()` (already available via `esbuild-wasm`) against all modified `.ts`/`.tsx` files
2. Capture any TypeScript/syntax errors
3. If errors found, automatically transition to the "fix" step with the error messages as context
4. Show a compilation status badge in `AgentModePanel`

### Phase 4 -- Diff Preview in Agent Flow
1. Before applying file changes in the agent execute step, generate unified diffs for all files
2. Show them in a modal using the existing `CodeDiffViewer` component
3. Add per-file checkboxes to accept/reject individual changes
4. Only apply accepted changes

### Phase 5 -- Atomic Multi-File Apply
1. Collect all ===FILE: and ===EDIT: blocks from a single AI response into a batch
2. Take one undo snapshot before applying any changes
3. Apply all changes in a single React state update
4. If any file fails to apply (e.g., bad diff), roll back all changes in the batch

## Technical Notes

- The terminal execution Edge Function must be carefully sandboxed. Deno's `Deno.Command` API supports this, but we should restrict to a whitelist of executables and set resource limits.
- Web research integration reuses existing `firecrawl-scrape` (already deployed) and `ai-web-browser` (already deployed) Edge Functions, so no new infrastructure is needed.
- The `esbuild-wasm` package is already installed as a dependency, so compilation verification requires no new packages.
- All changes are additive -- nothing breaks existing functionality.

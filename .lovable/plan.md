

# Remaining Parity Gaps: What's Still Needed

After auditing the full codebase against OpenAI Codex and Claude Code, here are the features still missing to make this the definitive best-in-class AI builder.

## Gap 1: Parallel Task Execution (HIGH)

**What Codex/Claude do**: Execute multiple independent subtasks concurrently (e.g., create 3 components simultaneously).

**Current state**: `useAgentMode.ts` processes tasks sequentially -- `getNextQueuedTask()` picks one at a time, `isAnyRunning` blocks the queue.

**Fix**: When the agent plan identifies independent steps (e.g., "create Header", "create Footer", "create Sidebar"), fork them into parallel `sendMessage` calls and merge results. Add a `parallel` step type.

**Files to change**:
- `src/hooks/useAgentMode.ts` -- add parallel execution logic with `Promise.allSettled`
- `src/components/ai-builder/AgentModePanel.tsx` -- show parallel steps side-by-side

---

## Gap 2: Tool/Function Calling (MCP-style) (HIGH)

**What Codex/Claude do**: The AI can call structured tools (read file, write file, run command, search) rather than relying on text markers like `[SEARCH: ...]` or `===FILE:`.

**Current state**: The system uses regex parsing of text markers. No structured tool/function calling exists.

**Fix**: Add a tool-calling layer where the AI receives a tools schema (read_file, write_file, run_terminal, web_search, list_files) and returns structured `tool_call` JSON. The agent loop dispatches each call and feeds results back.

**Files to change**:
- `src/hooks/useAgentMode.ts` -- add tool dispatch loop
- New file: `src/hooks/useAgentTools.ts` -- tool definitions and executor
- Update the system prompt in `useAIAppBuilder.ts` to include tool schemas

---

## Gap 3: Streaming Agent Steps (MEDIUM)

**What Codex/Claude do**: Show real-time token streaming within each agent step, so users see code appearing as it's generated.

**Current state**: The agent uses `sendMessage()` which triggers a background Edge Function job. The chat panel shows streaming text, but the **AgentModePanel** step cards only show "running" -> "done" with no intermediate progress.

**Fix**: Pipe the streaming content ref into the agent step UI so each step card shows a live code preview or progress indicator while generating.

**Files to change**:
- `src/components/ai-builder/AgentModePanel.tsx` -- add streaming preview to step cards
- Wire `streamingContentRef` from `useAIAppBuilder` into agent step rendering

---

## Gap 4: Per-Step Rollback UI (MEDIUM)

**What Codex/Claude do**: Users can roll back to any specific step in the agent run, not just undo the entire operation.

**Current state**: `preSnapshot` is stored on each step, and `rollbackToSnapshot` exists, but there's **no UI** to trigger it. Users can only undo via the global undo stack.

**Fix**: Add a "Revert to this step" button on each completed step in `AgentModePanel`. When clicked, restore `preSnapshot` files.

**Files to change**:
- `src/components/ai-builder/AgentModePanel.tsx` -- add rollback button per step
- Wire the `rollbackToSnapshot` callback through the workspace

---

## Gap 5: Agent Memory / Learning Across Sessions (MEDIUM)

**What Codex/Claude do**: Remember user preferences, coding patterns, and project conventions across conversations (CLAUDE.md, project memory).

**Current state**: `usePromptMemory` exists but only stores prompt-level memory within a session. `useErrorPatternLearning` tracks error patterns. Neither persists long-term project conventions.

**Fix**: Add a `PROJECT_MEMORY.md` auto-generated file that the agent reads on every run. It accumulates: preferred libraries, coding style decisions, architecture patterns, common errors and fixes.

**Files to change**:
- New file: `src/hooks/useAgentMemory.ts` -- persistent project memory manager
- `src/hooks/useAgentMode.ts` -- inject project memory into system prompt
- `src/components/ai-builder/KnowledgePanel.tsx` -- add "Agent Memory" tab for user editing

---

## Gap 6: Cost/Token Transparency Per Agent Run (LOW)

**What Codex/Claude do**: Show token usage and estimated cost for each operation.

**Current state**: `useContextBudget` tracks percentage usage. `TokenUsageIndicator.tsx` exists. But there's no per-run breakdown showing "Plan: 2K tokens, Execute: 15K tokens, Fix: 3K tokens".

**Fix**: Track tokens consumed per step and display a cost breakdown in the agent run summary.

**Files to change**:
- `src/hooks/useAgentMode.ts` -- add `tokensUsed` to `AgentStep` type
- `src/components/ai-builder/AgentModePanel.tsx` -- show token count per step

---

## Gap 7: Interactive File Explorer in Agent Context (LOW)

**What Codex/Claude do**: The AI can autonomously read any file it needs to understand context, rather than receiving all files upfront.

**Current state**: The agent sends the entire file tree as text in the prompt. For large projects, this wastes context and may miss files excluded by truncation.

**Fix**: Instead of dumping all files, give the agent a `read_file` tool (ties into Gap 2). The AI requests specific files as needed, keeping context lean and focused.

**Files to change**: Same as Gap 2 (tool-calling infrastructure)

## Summary

| Gap | Priority | Effort | Impact |
|-----|----------|--------|--------|
| Parallel task execution | HIGH | Medium | Faster builds, professional feel |
| Tool/function calling (MCP) | HIGH | Large | Dramatically better accuracy |
| Streaming agent steps | MEDIUM | Small | Better UX feedback |
| Per-step rollback UI | MEDIUM | Small | User control and confidence |
| Agent memory across sessions | MEDIUM | Medium | Smarter builds over time |
| Token transparency per run | LOW | Small | Power user feature |
| Interactive file explorer | LOW | N/A (part of tool calling) | Context efficiency |

## Recommended Order

1. **Tool/function calling** -- this is the single biggest architectural upgrade; it replaces fragile regex parsing with structured tool dispatch and enables both interactive file reading and web research in a unified way
2. **Parallel task execution** -- immediate performance win
3. **Per-step rollback UI** -- already built in the backend, just needs UI buttons
4. **Streaming agent steps** -- quick UX polish
5. **Agent memory** -- builds long-term value
6. **Token transparency** -- finishing touch


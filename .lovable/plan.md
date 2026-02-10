

# Codex-Style Autonomous Agent for AI App Builder

## Overview

Upgrade the existing Agent Mode in the AI App Builder from a simulated step tracker into a real autonomous coding agent with async task queuing, multi-file reasoning, self-correction loops, and background execution -- inspired by OpenAI Codex but built on top of the existing architecture.

## What Changes

### 1. Async Task Queue System
- Users can submit multiple prompts that queue up and execute sequentially in the background
- A task queue panel shows pending, running, and completed tasks with progress
- Users can continue chatting or editing while tasks run
- Tasks can be cancelled, reordered, or retried

### 2. Real Self-Correction Loop (Plan > Execute > Verify > Fix)
- Replace the current simulated `useAgentMode` with actual AI-driven steps:
  - **Plan**: Send the prompt to the AI with a "planning only" instruction, get back a structured plan (files to create/modify, approach)
  - **Execute**: Send the plan + files to the AI for code generation (existing streaming flow)
  - **Verify**: Inject generated code into the preview iframe and capture console errors automatically
  - **Fix**: If errors are detected, automatically re-prompt the AI with the error context (up to 3 retries, leveraging the existing `useAutoErrorRecovery` hook)
- Each step updates the AgentModePanel in real-time

### 3. Enhanced Agent Mode Panel
- Expand the existing `AgentModePanel` to show:
  - The task queue with status indicators
  - Expandable step details (plan text, files modified, errors caught)
  - Elapsed time per step
  - A "Files Changed" summary with file paths
  - Cancel/Retry buttons per task

### 4. Multi-File Awareness in Planning
- The planning step analyzes the full project file tree and identifies which files need changes
- The execution step sends only relevant files as context (not the entire project) for efficiency
- Changed files are highlighted in the file tree after completion

### 5. Background Execution with Notifications
- Tasks run via the existing edge function (`ai-app-builder`) with the same streaming approach
- On completion, a toast notification + build notification center entry is created
- Users can click the notification to see the diff

## Technical Details

### New/Modified Files

**`src/hooks/useAgentMode.ts`** (major rewrite)
- Add `AgentTask` type with queue position, prompt, status, results
- Add `taskQueue` state array
- Replace `simulateAgentExecution` with `executeAgentTask` that:
  1. Calls AI with planning-mode system prompt to get a structured plan
  2. Executes the plan via `sendMessage` (existing streaming)
  3. Waits for preview errors via a `postMessage` listener on the iframe
  4. If errors found, calls `sendMessage` again with error context (up to 3 retries)
  5. Marks task complete and advances queue
- Add `enqueueTask`, `cancelTask`, `retryTask`, `reorderQueue` methods
- Add `processQueue` that auto-advances to next task when current completes

**`src/components/ai-builder/AgentModePanel.tsx`** (enhanced UI)
- Show task queue list (not just current run steps)
- Each task expandable to show its steps
- Show elapsed time, files modified count, error count
- Add queue management controls (cancel, retry, clear completed)

**`src/hooks/useAgentMode.ts` -- Verification Logic**
- After code generation completes and files are injected into preview:
  - Listen for `__PREVIEW_ERROR__` messages from the iframe (already wired in ConsolePanel)
  - Wait 2 seconds for errors to surface
  - If errors detected, trigger fix step automatically
  - If no errors after timeout, mark verify as done

**`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (integration)
- Wire the new `enqueueTask` to the chat panel's send handler when agent mode is active
- Pass iframe ref to agent mode for error detection
- Connect build notification center to agent task completions

**`src/components/ai-builder/BuilderChatPanel.tsx`** (minor)
- Add an "Agent Mode" toggle button in the input area
- When active, submitted prompts go to the task queue instead of direct chat
- Show a small queue indicator badge

### Self-Correction Flow

```text
User Prompt
    |
    v
[PLAN] -- AI analyzes project, returns structured plan
    |
    v
[EXECUTE] -- AI generates/modifies code via streaming
    |
    v
[VERIFY] -- Preview iframe loads, errors captured (2s window)
    |
    +---> No errors --> [DONE]
    |
    +---> Errors found --> [FIX] (re-prompt with error + code context)
                              |
                              v
                           [VERIFY] again (up to 3 retries)
                              |
                              +---> Still failing --> Mark as "needs attention"
```

### Edge Function Changes
- No new edge functions needed -- the existing `ai-app-builder` function handles all AI calls
- The planning step uses the same endpoint with a modified system prompt instruction ("return only a plan, no code yet")

### What We Keep
- Existing streaming infrastructure (`useStreamingPreview`, SSE parsing)
- Existing error recovery hook (`useAutoErrorRecovery`) -- integrated into the verify/fix loop
- Existing `AgentModePanel` component structure -- extended, not replaced
- Existing `ConsolePanel` error capture via `postMessage`
- Existing build notification system

## Scope
- ~6 files modified
- No new dependencies needed
- No database changes
- No new edge functions


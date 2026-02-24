

# Wiring the Missing Integration Layer

All five Phase features (terminal exec, web research, build verification, diff review, atomic apply) have their **standalone hooks and components built** but are **not connected** into the actual agent loop or workspace. This plan focuses on wiring everything together and adding the one remaining feature: conversation forking.

## Current State

| Feature | Hook/Component | Wired into Agent? |
|---------|---------------|-------------------|
| Real Terminal | `terminal-exec` edge fn + `TerminalEmulator.tsx` | Yes (working) |
| Web Research | `useAgentWebResearch.ts` | No -- never imported or called |
| Build Verification | `useAgentBuildVerifier.ts` | No -- never imported or called |
| Atomic Multi-File Apply | `useAtomicFileApply.ts` | No -- never imported or called |
| Diff Review Modal | `AgentDiffReviewModal.tsx` | No -- never rendered |
| Conversation Forking | `ForkingPanel.tsx` (project forking only) | No conversation-level forking exists |

## Changes Required

### 1. Wire Web Research into Agent Loop
**File: `src/hooks/useAgentMode.ts`**

- Import `useAgentWebResearch`
- After the Execute step completes (line ~383), scan the AI response for `[SEARCH: ...]` markers using `detectResearchNeeded()`
- If markers are found, add a dynamic `research` step to the run
- Call `executeResearch()` for each query, build enriched context via `buildResearchContext()`
- Re-send the prompt with injected research context, then continue to Verify

### 2. Wire Build Verification into Agent Loop
**File: `src/hooks/useAgentMode.ts`**

- Import `useAgentBuildVerifier`
- After the Verify step's `waitForPreviewErrors()` call (line ~398), also run `verifyBuild()` against modified files
- Merge esbuild compilation errors with preview runtime errors
- Feed combined errors into the Fix step if any exist
- Add a `compile` step to the run's step list when compilation runs

### 3. Wire Atomic File Apply into Workspace
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Import `useAtomicFileApply`
- In `handleBgComplete`, when processing batched `===FILE:` and `===EDIT:` blocks, use `applyBatch()` instead of sequential `upsertFile()` calls
- This ensures a single undo snapshot covers all files and enables rollback on partial failure

### 4. Wire Diff Review Modal into Agent Flow
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Import and render `AgentDiffReviewModal`
- Add state: `agentDiffChanges` and `showAgentDiffReview`
- Before the agent's execute step applies file changes, populate `agentDiffChanges` with before/after content for each file
- Show the modal, wait for user selection
- Only apply the files the user selected via checkboxes

### 5. Add Conversation Forking
**File: `src/hooks/useAIAppBuilder.ts`**

- Add a `forkConversation()` function that:
  - Snapshots current `messages` array and current `project.files`
  - Stores them in a `conversationForks` state array
  - Allows the user to switch between forks (restorable branches)

**File: `src/components/ai-builder/BuilderChatPanel.tsx`**

- Add a "Fork Conversation" button in the chat header (next to existing controls)
- Display a small fork indicator showing how many forks exist
- Add a dropdown to switch between conversation branches

### 6. Connect Everything in the Workspace Orchestrator
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Initialize `useAgentWebResearch()`, `useAgentBuildVerifier()`, `useAtomicFileApply()`
- Pass research/verify/atomic callbacks into the `executeAgentTask` call
- Render `AgentDiffReviewModal` in the JSX tree with proper state bindings

## Technical Details

### Research Integration Flow
```text
Agent Execute step completes
  -> Scan response for [SEARCH: query] markers
  -> If found: add "research" step, call firecrawl-scrape
  -> Inject results as context, re-prompt AI
  -> Continue to Verify
```

### Build Verification Flow
```text
Agent Verify step starts
  -> Run waitForPreviewErrors() (runtime errors)
  -> Run verifyBuild() via esbuild-wasm (compile errors)
  -> Merge both error lists
  -> If errors: proceed to Fix step with combined context
```

### Diff Review Flow
```text
Agent Execute produces file changes
  -> Compute diffs (old vs new for each file)
  -> Show AgentDiffReviewModal
  -> User selects/deselects files
  -> Only apply selected files via applyBatch()
```

### Conversation Fork Data Model
```text
ConversationFork {
  id: string
  label: string
  messages: Message[]
  filesSnapshot: ProjectFile[]
  createdAt: Date
}
```

## File Summary

| File | Action |
|------|--------|
| `src/hooks/useAgentMode.ts` | Import and call research + build verifier hooks |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Initialize hooks, render diff modal, wire atomic apply |
| `src/hooks/useAIAppBuilder.ts` | Add `forkConversation` and `switchFork` functions |
| `src/components/ai-builder/BuilderChatPanel.tsx` | Add fork button + fork switcher UI |

No new files needed. No new dependencies. All changes build on existing, tested hooks and components.


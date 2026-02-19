

# Full Plan: Clone Lovable's Architecture for a Production-Grade App Builder

This is a phased roadmap to bring your AI App Builder to full parity with Lovable's capabilities. Each phase builds on the previous one and targets a specific weakness.

---

## Current State Assessment

**Already Implemented (strong foundation):**
- Streaming AI responses with SSE parsing
- Multi-file output parsing (===FILE: / ===DELETE:)
- Incremental context (file hashing, only sending changed files)
- Smart file scoring by relevance
- 3-phase token budget enforcement (2.5M char limit)
- Retry with progressive context reduction (2 attempts)
- Stream stall detection (30s timeout)
- Gateway health check and error classification
- Agent mode with Plan > Execute > Verify > Fix loop
- Post-generation syntax validation
- Auto-rollback on preview crash
- Live preview sync (CSS hot-patching)
- Version timeline with snapshots
- Conversation compression and memory
- URL scraping via Firecrawl
- Visual intelligence (image analysis)

**Critical Gaps (what breaks the experience):**

1. The builder generates vanilla HTML/CSS/JS only -- no React/component framework support
2. No real dependency resolution or module bundling (just concatenation)
3. Preview runs in a srcdoc iframe -- no sandbox isolation or error boundary
4. No persistent file system (files live only in React state)
5. No real deployment pipeline (publish is just uploading HTML to Supabase Storage)
6. No collaborative editing or real-time sync
7. Agent mode uses the same sendMessage as manual chat -- no dedicated planning API
8. No diff-based editing (AI rewrites entire files instead of surgical patches)
9. Console/network error capture from preview is fragile (postMessage only)
10. No "Try to Fix" button that automatically diagnoses and fixes errors

---

## Phase 1: Bulletproof Preview & Error Recovery
**Goal:** Make the preview never crash and automatically recover from bad AI output.

### 1A. Sandboxed Preview with Error Boundary
- Wrap the preview iframe content with a global error handler script that catches uncaught exceptions, unhandled rejections, and syntax errors
- Inject a `window.onerror` and `window.onunhandledrejection` handler that posts structured error messages back to the parent via postMessage
- Add a `<div id="__error_overlay__">` that displays a friendly error screen inside the iframe when a fatal error occurs, instead of a blank white page

### 1B. "Try to Fix" Auto-Diagnosis
- When a preview error is captured, automatically extract the error message, stack trace, and affected file
- Add a "Try to Fix" button to the error display in the chat panel
- When clicked, construct a targeted fix prompt that includes: the error message, the source file content, and surrounding context
- Send this as an `isAutoFix: true` request (no credit cost) with only the broken file(s) in context
- Cap at 3 auto-fix attempts with escalating strategies (targeted fix -> function rewrite -> full file rewrite)

### 1C. Preview Health Monitor
- Add a periodic (every 2s) iframe health check using the existing `checkIframeHealth` from `useHotModuleRecovery`
- If the iframe is unresponsive for 3 consecutive checks, trigger auto-rollback to `lastGoodSnapshot`
- Show a toast: "Preview crashed -- rolled back to last working version"

**Files to modify:**
- `src/hooks/useProjectFileSystem.ts` -- inject error handler script into `getCompiledHTML`
- `src/hooks/useAIAppBuilder.ts` -- add "Try to Fix" logic
- `src/components/ai-builder/BuilderChatPanel.tsx` -- add "Try to Fix" button UI
- `src/components/ai-builder/BuilderPreviewPanel.tsx` -- add health monitor loop

---

## Phase 2: Surgical Edits (Diff-Based File Updates)
**Goal:** Stop regenerating entire files. Make the AI edit only the lines that need to change.

### 2A. Edit Mode Detection
- When the user's request targets a specific file or component (e.g., "change the header color", "fix the login button"), detect this as an EDIT request vs. a BUILD request
- Add an `===EDIT: path===` marker format that supports line-range patches instead of full file replacement:
  ```
  ===EDIT: styles.css===
  @@ 15-18 @@
  .header { background: #1a1a2e; }
  ```

### 2B. Patch Parser
- Extend `parseMultiFileOutput` to handle `===EDIT:` blocks
- Parse `@@ lineStart-lineEnd @@` markers and apply patches to the existing file content
- Fall back to full-file replacement if the patch doesn't apply cleanly

### 2C. System Prompt Update
- Add edit-mode instructions to the edge function system prompt telling the AI to use `===EDIT:` for small changes and `===FILE:` for new files or major rewrites
- Include the current file content with line numbers so the AI can reference specific lines

**Files to modify:**
- `src/hooks/useAIAppBuilder.ts` -- add edit detection, patch parser
- `supabase/functions/ai-app-builder/index.ts` -- add edit-mode system prompt instructions

---

## Phase 3: Smart Context Window (Conversation Summarization)
**Goal:** Prevent token overflow on long conversations by intelligently summarizing history.

### 3A. Automatic Conversation Summarizer
- When conversation exceeds 15 messages, automatically summarize older messages into a compact context block
- Summarization preserves: key decisions made, files created/modified, errors encountered and fixed, user preferences detected
- Replace messages 1-N with a single `[CONVERSATION SUMMARY]` system message

### 3B. File Manifest Optimization
- Instead of sending file contents for unchanged files, send only a structured manifest:
  ```
  FILE_MANIFEST:
  - index.html (1.2KB, last modified: msg #3) [HTML structure: header, hero, features, footer]
  - styles.css (3.4KB, last modified: msg #5) [CSS: 12 rules, dark theme, responsive]
  - app.js (2.1KB, last modified: msg #7) [JS: 4 functions, 2 event listeners]
  ```
- Only send full content for files the AI is likely to modify (based on relevance scoring)

### 3C. Context Budget Dashboard
- Add a small indicator in the chat panel showing current context usage (e.g., "Context: 45% used")
- Warn the user when approaching limits
- Show which files are included in context and which are omitted

**Files to modify:**
- `src/hooks/useAIAppBuilder.ts` -- summarizer logic, manifest optimization
- `src/components/ai-builder/SupabaseConversational.tsx` -- enhance `compressConversationHistory`
- `src/components/ai-builder/BuilderChatPanel.tsx` -- context budget indicator

---

## Phase 4: Real Error Capture from Preview
**Goal:** Capture console errors, network failures, and rendering issues from the preview iframe reliably.

### 4A. Injected Console Interceptor
- Inject a script into the compiled HTML that overrides `console.error`, `console.warn`, and `console.log`
- Each intercepted call posts a structured message to the parent: `{ type: '__CONSOLE_LOG__', level, message, stack, timestamp }`
- Also intercept `fetch` and `XMLHttpRequest` to capture network errors

### 4B. Error-to-Chat Pipeline
- Automatically forward captured errors to the chat as inline annotations on the last assistant message
- Group similar errors (deduplicate by message) and show count
- Add a "Fix this" button on each error that pre-fills a fix prompt

### 4C. Network Request Inspector
- Capture all fetch/XHR requests from the preview and display them in the DevTools panel
- Show request URL, method, status code, response time, and body preview
- Highlight failed requests (4xx, 5xx) with red badges

**Files to modify:**
- `src/hooks/useProjectFileSystem.ts` -- inject console/network interceptor scripts
- `src/components/ai-builder/ConsolePanel.tsx` -- display captured logs
- `src/components/ai-builder/PreviewDevToolsPanel.tsx` -- network request display
- `src/hooks/useAIAppBuilder.ts` -- error-to-chat forwarding

---

## Phase 5: Intelligent Build Pipeline
**Goal:** Make builds faster, more reliable, and show progress like Lovable does.

### 5A. Build Progress with Task Cards
- Parse the AI's plan steps from streaming output (already started with `parsePlanSteps`)
- Display them as visual task cards in the chat: each step shows pending/active/done status
- Animate transitions between states

### 5B. Incremental File Application
- Apply files to the preview AS they complete during streaming (not waiting for the entire response)
- Each `===FILE:` block that finishes should immediately update the preview
- CSS files can be hot-patched; HTML/JS trigger a rebuild

### 5C. Build Timing and Analytics
- Track and display: total build time, files generated, tokens used, context size
- Show this in a compact "build summary" card after each generation
- Persist build analytics for the project health dashboard

**Files to modify:**
- `src/hooks/useAIAppBuilder.ts` -- incremental file application during streaming
- `src/hooks/useStreamingPreview.ts` -- real-time file extraction
- `src/components/ai-builder/BuilderChatPanel.tsx` -- task card UI, build summary

---

## Phase 6: Robust Deployment Pipeline
**Goal:** Make publishing reliable with proper hosting, custom domains, and version management.

### 6A. Versioned Deployments
- Each publish creates a versioned deployment (v1, v2, v3...) stored in Supabase Storage
- Add a deployment history panel showing all published versions with timestamps
- Allow instant rollback to any previous deployment

### 6B. Deploy Preview
- Before publishing, show a deploy preview dialog that displays:
  - The compiled HTML in a sandboxed preview
  - File count and total size
  - Any detected issues (missing images, broken links)
- Require user confirmation before publishing

### 6C. Custom Domain Integration
- The domain management system already exists (`CustomDomainPanel`, `verify-domain` edge function)
- Ensure the full flow works: DNS configuration guidance, verification, SSL, and serving

**Files to modify:**
- `src/hooks/useProjectPersistence.ts` -- versioned deployment storage
- `src/components/ai-builder/PublishPanel.tsx` -- deployment history and rollback
- `src/components/ai-builder/DeployDialog.tsx` -- deploy preview

---

## Phase 7: Agent Mode Hardening
**Goal:** Make the autonomous agent reliable enough for hands-off multi-step builds.

### 7A. Dedicated Planning API Call
- Before executing, make a separate lightweight API call to get a structured plan (JSON)
- Display the plan to the user for approval before proceeding
- Parse the plan to determine which files will be created/modified

### 7B. Per-Step File Snapshots
- Take a file snapshot before each agent step
- If a step fails, roll back to the pre-step snapshot (not the entire project)
- Show per-step diffs in the agent panel

### 7C. Cross-Step Context Threading
- Thread context between agent steps: each step receives the output/changes from the previous step
- Prevent the agent from losing track of what it already built
- Add a "context window" that shows the agent what files it has modified so far

**Files to modify:**
- `src/hooks/useAgentMode.ts` -- planning API, snapshots, context threading
- `src/components/ai-builder/AgentModePanel.tsx` -- plan approval UI
- `supabase/functions/ai-app-builder/index.ts` -- lightweight planning endpoint

---

## Phase 8: Polish and UX Parity
**Goal:** Match Lovable's UI polish and developer experience.

### 8A. Thinking Indicator
- Replace the simple "Analyzing... Planning... Writing..." text with Lovable-style animated thinking indicator
- Show elapsed time during generation: "Thought for 12s"
- Collapse the thinking section after completion

### 8B. Message Actions
- Add a "..." dropdown on each message with: Copy, View Snapshot, Retry, Edit & Resend, Branch From Here
- The Edit & Resend already exists in `useAIAppBuilder` but needs UI wiring

### 8C. Empty State and Onboarding
- The WelcomeOverlay exists but ensure it provides clear starter templates and example prompts
- Add template categories: Landing Pages, Dashboards, E-commerce, Portfolios, SaaS

### 8D. Keyboard Shortcuts
- Cmd+Enter to send message
- Cmd+Z / Cmd+Shift+Z for undo/redo file changes
- Cmd+K for command palette
- Escape to stop generation

**Files to modify:**
- `src/components/ai-builder/BuilderChatPanel.tsx` -- thinking indicator, message actions
- `src/components/ai-builder/StreamingText.tsx` -- elapsed timer refinements
- `src/components/ai-builder/WelcomeOverlay.tsx` -- template categories

---

## Implementation Priority Order

```text
Phase 1 (Preview Safety)        -- Highest impact, prevents user frustration
Phase 4 (Error Capture)         -- Enables all debugging features
Phase 3 (Context Management)    -- Prevents "too large" errors
Phase 5 (Build Pipeline)        -- Better UX during generation
Phase 2 (Surgical Edits)        -- Reduces token usage and errors
Phase 8 (Polish)                -- Professional feel
Phase 7 (Agent Hardening)       -- Advanced feature
Phase 6 (Deployment)            -- Production readiness
```

Each phase is designed to be independently shippable -- you can approve and implement them one at a time, and each one will immediately improve the builder.


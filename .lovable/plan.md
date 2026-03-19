

# Next Wave: Build Quality Improvements

With all 20 roadmap steps complete, here are the highest-impact areas remaining. These focus on **generation quality**, **user confidence**, and **operational efficiency**.

---

## A. Smarter Auto-Heal with Dependency Context

**Problem**: The auto-heal loop sends the error message + diff to the AI, but doesn't include the *dependency graph* of the failing file. The AI often fixes the symptom but breaks an import chain.

**Fix**: When auto-heal triggers, use the existing `buildDependencyGraph` to include the full content of files that import or are imported by the failing file. This gives the AI enough context to fix without introducing new breakage.

**Files**: `AIAppBuilderWorkspace.tsx` (auto-heal wiring), `useAutoHealCompile.ts`

---

## B. Speculative Pre-compilation

**Problem**: Compilation only starts after the AI finishes streaming. For large generations (10+ files), this adds 3-5s of idle waiting.

**Fix**: During streaming, when a `===FILE:===` block is fully received (next delimiter seen), immediately add it to a "ready queue." Start a speculative Vite compile with completed files every 5 seconds during streaming. The final compile replaces the speculative one, but users see progress sooner.

**Files**: `CompilationBridge.tsx`, `AIAppBuilderWorkspace.tsx`

---

## C. Smart Model Fallback

**Problem**: When the selected AI model returns a 429 (rate limit) or 503 (overloaded), the build fails entirely. Users must manually switch models and retry.

**Fix**: On retryable model errors (429/503), automatically fall back to an alternate model (e.g., Claude Sonnet → GPT-4o) for one retry attempt. Show a toast: "Primary model busy, using fallback." If fallback succeeds, continue normally.

**Files**: `useAIAppBuilder.ts` (sendMessage error handling)

---

## D. Prompt Compression for Long Conversations

**Problem**: After 20+ messages, the conversation history consumes most of the 120K context budget, leaving little room for file context. The existing `compressConversationHistory` only kicks in at 200 messages.

**Fix**: Implement rolling summarization: after every 10 messages, summarize the oldest 10 into a single "conversation summary" message. Keep the last 10 messages verbatim. This keeps conversation context under 20K chars while preserving intent.

**Files**: `useAIAppBuilder.ts` (context assembly in sendMessage)

---

## E. Import Graph Validation

**Problem**: The AI often generates files that import from paths that don't exist in the project (e.g., `import { Button } from '@/components/ui/button'` when no such file exists). This only surfaces at compile time.

**Fix**: After parsing AI output but before compilation, run a fast import resolution check: for each `import ... from './...'` or `from '@/...'`, verify the target file exists in the project. If missing, either auto-generate a stub (using the existing `generateMissingImportStubs`) or flag it as a warning in the diff summary.

**Files**: `AIAppBuilderWorkspace.tsx` (post-parse, pre-compile), `generateMissingImportStubs.ts`

---

## F. Build Cancellation UX

**Problem**: Users can't cancel a long-running AI generation. The abort controller exists but there's no visible cancel button during generation.

**Fix**: Add a "Stop generating" button in the chat input area (visible only during generation). On click, abort the stream, keep any fully-parsed files, and show "Generation stopped — {N} files were saved."

**Files**: `BuilderChatPanel.tsx`, `AIAppBuilderWorkspace.tsx`

---

## Recommended Priority

| Step | Impact | Effort |
|------|--------|--------|
| E — Import graph validation | High (prevents common failures) | Low |
| D — Prompt compression | High (better output on long sessions) | Low |
| A — Dependency-aware auto-heal | High (better fix rate) | Medium |
| F — Build cancellation UX | Medium (user control) | Low |
| C — Smart model fallback | Medium (resilience) | Low |
| B — Speculative pre-compilation | Medium (perceived speed) | High |

All changes are additive and independent — can be shipped in any order.




# 40 More App Builder Hardening Phases (Phases 21-60)

A comprehensive sweep across the parser, React compiler, preview engine, error pipeline, system prompt, edge function, and workspace orchestrator to close every remaining reliability gap.

---

## Category A: Parser and File Handling (Phases 21-27)

### Phase 21: JSON File Content Corrupted by Prose Detector
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** `isConversationalLine` runs on all file types, but JSON files often have top-level keys like `"This"` or `"name"` that match prose patterns. JSON files get truncated.
**Fix:** Skip prose detection entirely for `.json`, `.svg`, and `.md` files — only run it on `.html`, `.css`, `.js/.ts/.jsx/.tsx` files.

### Phase 22: Duplicate File Paths Across Rounds Cause Overwrite Wars
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** If the AI outputs `===FILE: styles.css===` in both round 1 and round 2, the round-2 version replaces round-1 entirely — even if round 2's version is a smaller continuation fragment.
**Fix:** Before merging, detect if a continuation-round file has fewer lines than the existing file for the same path. If so, append the new content instead of replacing, or skip the merge and warn.

### Phase 23: `===EDIT:` Blocks Silently Ignored When File Was Just Created
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** If the AI outputs `===FILE: App.tsx===` followed by `===EDIT: App.tsx===` in the same response, the edit references the just-created file. But `applyHunkPatch` looks in `workingFiles` (pre-generation), not `filesToApply`. The edit is silently skipped.
**Fix:** After parsing full files and before applying edits, merge `filesToApply` into a temporary lookup so edits can target same-response files.

### Phase 24: File Path Normalization Inconsistency
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** The AI sometimes outputs `===FILE: ./src/App.tsx===` or `===FILE: /App.tsx===` while the project stores paths as `src/App.tsx`. The leading `./` or `/` causes a duplicate file entry instead of an update.
**Fix:** Normalize paths after parsing: strip leading `./` and `/`, collapse `//` into `/`.

### Phase 25: SVG Files Treated as Code by Bracket Balance Check
**File:** `src/hooks/useAIAppBuilder.ts` (validation + truncation detection)
**Problem:** SVG files have angle brackets `<>` that don't follow HTML tag patterns. The bracket-balance validator flags them as "mismatched HTML tags" and the truncation detector may incorrectly remove the last SVG file.
**Fix:** Exclude `.svg` files from HTML tag-balance checks and from the truncation detector's bracket analysis.

### Phase 26: Markdown Files Stripped by Prose Detector
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** Markdown (`.md`) files start with `#` headings which match `isConversationalLine`'s markdown heading pattern. Entire README files get stripped as "prose."
**Fix:** Add file extension awareness to the parser loop — when `currentPath` ends in `.md` or `.mdx`, never apply prose detection.

### Phase 27: SCSS/LESS Files Not Handled by Language Detection
**File:** `src/hooks/useAIAppBuilder.ts` (parseMultiFileOutput `langMap`)
**Problem:** `.less` and `.sass` extensions are missing from `langMap`, causing them to get `plaintext` language tag. No syntax highlighting in the editor.
**Fix:** Add `less: 'less'`, `sass: 'scss'` to the `langMap` in both `parseMultiFileOutput` and the `flush` function.

---

## Category B: React Compiler Hardening (Phases 28-33)

### Phase 28: React Compiler Silently Fails Without Error Surfacing
**File:** `src/hooks/useReactCompiler.ts`
**Problem:** When Babel transpilation fails, the error is caught and pushed to `result.errors[]`, but the preview shows a blank page with no user-facing feedback.
**Fix:** When `result.errors.length > 0`, inject an error overlay into the compiled HTML that displays the errors with file/line info, styled as a red error box.

### Phase 29: Import Resolution Fails for Aliased Paths (`@/`)
**File:** `src/hooks/useReactCompiler.ts`
**Problem:** AI-generated React code uses `import { Button } from '@/components/ui/button'`. The module map doesn't resolve `@/` prefix aliases, causing "module not found" at runtime.
**Fix:** In `buildModuleMap`, add alias resolution: strip `@/` prefix and map to the equivalent relative path. Also map `@/lib/utils` to `lib/utils`.

### Phase 30: Tailwind CDN Fails Silently on Network Issues
**File:** `src/hooks/useReactCompiler.ts`
**Problem:** The React compiler injects `<script src="https://cdn.tailwindcss.com">`. If the CDN is slow or offline, Tailwind classes render unstyled with no warning.
**Fix:** Add an `onerror` handler on the Tailwind script tag that injects a minimal set of utility CSS as a fallback and shows a warning banner.

### Phase 31: Type Stripping Breaks Generic Components
**File:** `src/hooks/useReactCompiler.ts` (`stripTypeAnnotations`)
**Problem:** The regex-based type stripper can break on complex generics like `const fn = <T extends Record<string, unknown>>(arg: T) => ...` — it incorrectly strips the generic parameter as JSX.
**Fix:** Before stripping, detect arrow function generics (`= <T...>(`) and preserve them by temporarily replacing with a marker, then restoring after type stripping.

### Phase 32: Missing Error Boundary in React Preview
**File:** `src/hooks/useReactCompiler.ts`
**Problem:** React runtime errors crash the entire preview with a blank screen. Unlike the HTML preview which has error capture scripts, the React preview has no `ErrorBoundary` wrapper.
**Fix:** Inject a React `ErrorBoundary` component that catches render errors and displays them inline. Also post the error to parent frame via `window.parent.postMessage`.

### Phase 33: Hot Module Patching Not Working for React Projects
**File:** `src/hooks/useLivePreviewSync.ts`
**Problem:** The `__LIVE_PATCH__` system patches CSS and HTML body content, but React projects use a single compiled `<script>` — CSS patches work, but component changes require a full reload.
**Fix:** For React projects, detect when only CSS files changed and apply CSS-only hot patches. For JS/TSX changes, trigger a full iframe reload instead of attempting HTML body patching.

---

## Category C: Preview Engine and Error Pipeline (Phases 34-40)

### Phase 34: Error Console Floods with Duplicate Errors
**File:** `src/components/ai-builder/BuilderPreviewPanel.tsx`
**Problem:** The same error (e.g., "Cannot read property of undefined") fires repeatedly on every re-render, filling the error console with 50+ identical entries and triggering multiple auto-fix attempts.
**Fix:** Deduplicate errors by message content within a 2-second window. If the same error message fires more than twice within 2 seconds, only keep the first occurrence.

### Phase 35: Auto-Fix Cooldown Races with Generation End Detection
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** The 3-second cooldown (`generationEndedAt.current`) uses `Date.now()` in `handleAutoFixError`, but the compilation step after generation can take 1-2 seconds. Errors from the compilation itself (legitimate errors) get swallowed by the cooldown.
**Fix:** Start the cooldown from when compilation finishes (when `compiledHTML` updates), not when `isGenerating` becomes false. Track `compilationEndedAt` separately.

### Phase 36: Preview Iframe Doesn't Reset Scroll Position on New Builds
**File:** `src/components/ai-builder/BuilderPreviewPanel.tsx`
**Problem:** After a new generation, the preview iframe retains the previous scroll position. If the user was scrolled to the bottom, the new app appears blank until they scroll up.
**Fix:** After `iframeKey` changes or `html` updates, scroll the iframe content to top: `iframeRef.current?.contentWindow?.scrollTo(0, 0)`.

### Phase 37: Preview Breaks When AI Generates `<iframe>` Inside App
**File:** `src/hooks/useProjectFileSystem.ts` (`getCompiledHTML`)
**Problem:** If the AI generates an app that contains `<iframe>` tags (e.g., embedded videos, maps), the nested iframe breaks the parent's error capture and message handling.
**Fix:** Add `sandbox="allow-scripts allow-same-origin allow-popups"` to any `<iframe>` tags in the generated HTML. Also wrap the error capture script to only listen to same-origin messages.

### Phase 38: Console Log Interceptor Breaks `console.log` Object Formatting
**File:** `src/components/ai-builder/BuilderPreviewPanel.tsx`
**Problem:** The injected console interceptor uses `Array.from(arguments).join(' ')`, which converts objects to `[object Object]` instead of preserving structure. This makes debugging impossible.
**Fix:** Use `JSON.stringify` for object arguments (with try/catch for circular refs): `typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)`.

### Phase 39: Network Log Interceptor Doesn't Capture POST Bodies
**File:** `src/components/ai-builder/BuilderPreviewPanel.tsx`
**Problem:** The fetch interceptor logs method, URL, status, and duration, but not the request body or response body. When debugging API calls (e.g., Supabase queries), the user can't see what data was sent or received.
**Fix:** Capture `init.body` (stringified, truncated to 500 chars) and `response.clone().text()` (truncated) in the `__NETWORK_LOG__` message.

### Phase 40: Error Source Mapping Shows Wrong File for React Projects
**File:** `src/components/ai-builder/BuilderPreviewPanel.tsx`
**Problem:** React runtime errors report `source: ""` or `source: "about:srcdoc"` because the compiled HTML is a single `srcdoc`. There's no way to map errors back to the original `.tsx` file.
**Fix:** Inject source map comments in the compiled React output that map to virtual file paths. In the error handler, parse the stack trace to extract the original component name and report it as the source.

---

## Category D: System Prompt and AI Output Quality (Phases 41-47)

### Phase 41: System Prompt Doesn't Enforce Consistent Import Patterns
**File:** `supabase/functions/ai-app-builder/index.ts` (BASE_SYSTEM_PROMPT)
**Problem:** The AI sometimes uses `import React from 'react'` (default import) and sometimes `import { useState } from 'react'` (named import) in the same project, or mixes CommonJS `require()` with ESM `import`.
**Fix:** Add to system prompt: `"IMPORTS: Always use ESM (import/export). Always destructure React hooks: import { useState, useEffect } from 'react'. Never use require()."`

### Phase 42: AI Generates Duplicate Component Names Across Files
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** When generating multi-file React projects, the AI sometimes creates `export default function App()` in both `App.tsx` and `components/Dashboard.tsx`, causing import conflicts.
**Fix:** Add to system prompt: `"NAMING: Each file must export a uniquely named component matching its filename. App.tsx exports App, Header.tsx exports Header. Never duplicate export names across files."`

### Phase 43: AI Omits `key` Props on `.map()` Outputs
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** Despite the self-review instruction mentioning key props, the AI frequently omits them on generated `.map()` JSX, causing React warnings that flood the console.
**Fix:** Add to BASE_SYSTEM_PROMPT near the REACT section: `"CRITICAL: EVERY .map() that returns JSX MUST have a unique key prop. Use item.id or index as fallback. Missing keys cause React warnings."`

### Phase 44: AI Generates Tailwind Classes That Don't Exist
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The AI sometimes hallucinates Tailwind classes like `text-primary-500` or `bg-accent-100` that don't exist in default Tailwind. These render as unstyled.
**Fix:** Add to system prompt: `"TAILWIND: Only use default Tailwind utility classes. Do NOT invent custom classes like 'text-primary-500'. Use exact values: text-blue-500, bg-gray-100, etc. For custom colors, define them in a <style> block using CSS custom properties."`

### Phase 45: AI Generates `async` Event Handlers Without Error Handling
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The AI wraps Supabase calls in `async` handlers but omits `try/catch`, causing unhandled promise rejections that crash the preview silently.
**Fix:** Already mentioned in self-review but not enforced in system prompt. Add to CRUD section: `"ASYNC: Every async event handler MUST have try/catch. Show toast.error() on failure. Never leave async operations uncaught."`

### Phase 46: AI Doesn't Generate Loading States for Async Operations
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** Apps with Supabase queries show raw undefined data or empty screens while loading. The AI doesn't add `isLoading` states.
**Fix:** Add to SUPABASE_ADDON: `"UX: Every data-fetching component MUST have a loading state (spinner or skeleton). Initialize data as empty array, not undefined. Show error state if query fails."`

### Phase 47: Discuss Mode AI Generates Code Despite Instructions
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The discuss mode system prompt says "DO NOT output any code", but the AI sometimes outputs `===FILE:` blocks anyway, which get parsed and applied.
**Fix:** In `parseMultiFileOutput`, if the mode is `discuss`, return empty files/edits even if `===FILE:` blocks are found. Pass `mode` through to the parser.

---

## Category E: State Management and Persistence (Phases 48-53)

### Phase 48: Version Restore Doesn't Update File Hash Cache
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** After `restoreVersion`, the file hash cache still contains hashes from the current files. The next build sends wrong incremental context because `getChangedFiles` thinks restored files are "unchanged."
**Fix:** Call `updateFileHashes(version.files)` inside `restoreVersion` after setting files.

### Phase 49: `editAndResend` Doesn't Reset Continuation State
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** If the user edits and resends a message while a multi-round generation was in progress, `continuationCountRef` and `accumulatedFilesRef` retain stale state from the previous generation.
**Fix:** Reset `continuationCountRef.current = 0`, `accumulatedFilesRef.current = []`, and `setContinuationRound(0)` at the start of `editAndResend`.

### Phase 50: Project Persistence Race Condition on Rapid Saves
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** Auto-save fires on every `latestFiles` change. During continuation rounds, latestFiles updates 2-4 times in rapid succession, causing concurrent Supabase upserts that can corrupt the saved state.
**Fix:** Debounce the auto-save with a 2-second delay. Cancel pending saves when a new one starts. Use a save-in-progress flag to prevent overlapping writes.

### Phase 51: Undo/Redo Stack Doesn't Capture File Deletions
**File:** `src/hooks/useUndoRedo.ts` (used in workspace)
**Problem:** When the AI outputs `===DELETE: styles.css===`, the file is removed from `latestFiles`, but the undo stack only captures file content changes, not deletions. Undoing doesn't restore deleted files.
**Fix:** Push the full file array (including deleted files) to the undo stack before applying deletions.

### Phase 52: Message History Grows Unbounded
**File:** `src/hooks/useAIAppBuilder.ts`
**Problem:** `messages` state array grows indefinitely. After 100+ messages in a session, React re-renders become sluggish because every `setMessages` call diffs a large array.
**Fix:** Cap messages at 200 entries. When limit is reached, compress older messages (keep first 5 + last 50, summarize middle).

### Phase 53: `latestFiles` and `project.files` Can Desync
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** `useAIAppBuilder` sets `latestFiles` directly, but the workspace reads from `project.files` (via `useProjectFileSystem`). There's an effect that syncs them, but during rapid updates (streaming), the two can be out of sync causing the preview to show stale content.
**Fix:** Consolidate to a single source of truth. Remove the dual-state and have the builder write directly to the project file system.

---

## Category F: Edge Function and Gateway Resilience (Phases 54-57)

### Phase 54: Edge Function Doesn't Validate Message Content Types
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The edge function passes messages directly to the gateway without validating that `content` is either a string or a valid multimodal array. Malformed content (e.g., `null`, number) causes a gateway 400.
**Fix:** Add content validation: filter out messages with null/undefined content, convert numbers to strings, ensure multimodal arrays only contain valid block types.

### Phase 55: Gateway Model String Not Validated
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The `model` parameter is passed from the client without validation. If the user selects a model that doesn't exist on the gateway, it returns a cryptic error.
**Fix:** Maintain a `VALID_MODELS` set and validate/fallback: `const selectedModel = VALID_MODELS.has(model) ? model : DEFAULT_MODEL`.

### Phase 56: Streaming Response Not Flushed on Edge Function Timeout
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** If the gateway aborts mid-stream due to `gatewayController`, the partially streamed response body is sent to the client as a readable stream, but the stream is never properly closed. The client's reader hangs waiting for more data.
**Fix:** Wrap the response body in a `TransformStream` that detects abortion and sends a proper stream termination (`data: [DONE]`).

### Phase 57: System Prompt Size Not Logged for Debugging
**File:** `supabase/functions/ai-app-builder/index.ts`
**Problem:** The base system prompt size is logged, but the final system prompt (after addons, services, branding) isn't. When builds fail with token errors, there's no way to know how large the final prompt was.
**Fix:** Log `finalMessages` total char count before sending to gateway: `console.log('Final payload: ${estimateTotalChars(finalMessages)} chars, ${finalMessages.length} messages')`.

---

## Category G: Workspace Orchestration (Phases 58-60)

### Phase 58: Post-Build Hooks Run Twice (Effect + LatestFiles Watcher)
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** Smoke test and delete auto-patcher run in both the `isGenerating` transition effect (line 1440) AND the `latestFiles` watcher (line 1038). On every generation, they execute twice, doubling build log entries and potentially double-patching files.
**Fix:** Remove the duplicate from one location. Keep the `isGenerating` transition effect as the primary trigger (it runs once per generation), and remove the quality checks from the `latestFiles` watcher.

### Phase 59: Companion Test File Generation Creates Stale Tests
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** `fileScaffolding.generateCompanionFiles` creates test files after every build, but if the component changes on the next build, the test files become stale. They're never updated — only created if missing.
**Fix:** Track which test files were auto-generated (vs user-created). On subsequent builds, regenerate auto-generated test files if their source component changed.

### Phase 60: Build Analytics Records Wrong Credit Count
**File:** `src/components/ai-builder/AIAppBuilderWorkspace.tsx`
**Problem:** `buildAnalytics.recordBuild` hardcodes `creditsUsed: 3` regardless of the actual mode (discuss = 1 credit, build = 3 credits) or whether credits were deducted at all (auto-fix is free).
**Fix:** Pass the actual credit cost from the builder. Either expose it from `useAIAppBuilder` or compute it in the workspace based on mode + isAutoFix.

---

## Summary Table

| Phase | Category | Issue | Impact | File |
|-------|----------|-------|--------|------|
| 21 | Parser | JSON files corrupted by prose detector | JSON/config files broken | useAIAppBuilder.ts |
| 22 | Parser | Duplicate paths across rounds overwrite | Round 2 replaces round 1 content | useAIAppBuilder.ts |
| 23 | Parser | EDIT blocks can't target same-response files | Edits silently skipped | useAIAppBuilder.ts |
| 24 | Parser | Path normalization (`./`, `/`) | Duplicate file entries | useAIAppBuilder.ts |
| 25 | Parser | SVG files flagged by bracket balance | False truncation detection | useAIAppBuilder.ts |
| 26 | Parser | Markdown files stripped as prose | README files destroyed | useAIAppBuilder.ts |
| 27 | Parser | Missing SCSS/LESS language mapping | No syntax highlighting | useAIAppBuilder.ts |
| 28 | React | Compiler errors show blank page | User sees nothing | useReactCompiler.ts |
| 29 | React | `@/` import alias not resolved | Module not found errors | useReactCompiler.ts |
| 30 | React | Tailwind CDN fails silently | Unstyled preview | useReactCompiler.ts |
| 31 | React | Type stripper breaks generics | Compilation fails | useReactCompiler.ts |
| 32 | React | No ErrorBoundary in React preview | Blank screen on errors | useReactCompiler.ts |
| 33 | React | Hot patching doesn't work for React | Full reload needed every time | useLivePreviewSync.ts |
| 34 | Preview | Duplicate errors flood console | Multiple auto-fix triggers | BuilderPreviewPanel.tsx |
| 35 | Preview | Cooldown races with compilation | Legitimate errors swallowed | AIAppBuilderWorkspace.tsx |
| 36 | Preview | Scroll position not reset | New builds appear blank | BuilderPreviewPanel.tsx |
| 37 | Preview | Nested iframes break error capture | Errors from embeds lost | useProjectFileSystem.ts |
| 38 | Preview | Console objects show [object Object] | Debugging impossible | BuilderPreviewPanel.tsx |
| 39 | Preview | Network logs missing request/response body | Can't debug API calls | BuilderPreviewPanel.tsx |
| 40 | Preview | Error source unknown in React projects | Can't identify broken component | BuilderPreviewPanel.tsx |
| 41 | Prompt | Inconsistent import patterns | Module resolution errors | ai-app-builder/index.ts |
| 42 | Prompt | Duplicate component names | Import conflicts | ai-app-builder/index.ts |
| 43 | Prompt | Missing key props on .map() | React console warnings | ai-app-builder/index.ts |
| 44 | Prompt | Hallucinated Tailwind classes | Unstyled elements | ai-app-builder/index.ts |
| 45 | Prompt | Async handlers without try/catch | Silent failures | ai-app-builder/index.ts |
| 46 | Prompt | No loading states for async data | Blank screens while loading | ai-app-builder/index.ts |
| 47 | Prompt | Discuss mode leaks code | Unwanted file changes | useAIAppBuilder.ts |
| 48 | State | Version restore doesn't update hashes | Stale incremental context | useAIAppBuilder.ts |
| 49 | State | editAndResend doesn't reset continuation | Ghost continuation rounds | useAIAppBuilder.ts |
| 50 | State | Rapid auto-saves corrupt persistence | Lost project data | AIAppBuilderWorkspace.tsx |
| 51 | State | Undo doesn't capture deletions | Can't undo file removal | AIAppBuilderWorkspace.tsx |
| 52 | State | Messages array grows unbounded | Sluggish re-renders | useAIAppBuilder.ts |
| 53 | State | latestFiles vs project.files desync | Stale preview content | AIAppBuilderWorkspace.tsx |
| 54 | Edge Fn | Message content not validated | Gateway 400 errors | ai-app-builder/index.ts |
| 55 | Edge Fn | Model string not validated | Cryptic error messages | ai-app-builder/index.ts |
| 56 | Edge Fn | Stream not terminated on abort | Client reader hangs | ai-app-builder/index.ts |
| 57 | Edge Fn | Final prompt size not logged | Impossible to debug token errors | ai-app-builder/index.ts |
| 58 | Workspace | Post-build hooks run twice | Double patching and log spam | AIAppBuilderWorkspace.tsx |
| 59 | Workspace | Auto-generated tests become stale | Misleading test results | AIAppBuilderWorkspace.tsx |
| 60 | Workspace | Build analytics hardcodes credits | Inaccurate usage tracking | AIAppBuilderWorkspace.tsx |

## Files Changed

| File | Phases |
|------|--------|
| `src/hooks/useAIAppBuilder.ts` | 21-27, 47, 48, 49, 52 |
| `src/hooks/useReactCompiler.ts` | 28, 29, 30, 31, 32 |
| `src/hooks/useLivePreviewSync.ts` | 33 |
| `src/hooks/useProjectFileSystem.ts` | 37 |
| `src/components/ai-builder/BuilderPreviewPanel.tsx` | 34, 36, 38, 39, 40 |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | 35, 50, 51, 53, 58, 59, 60 |
| `supabase/functions/ai-app-builder/index.ts` | 41, 42, 43, 44, 45, 46, 54, 55, 56, 57 |


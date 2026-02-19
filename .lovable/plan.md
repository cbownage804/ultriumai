

# Phase 71-83: Perfect App Generation -- The Final Gap Analysis

After a deep audit of every file in the builder pipeline, here are the remaining issues that prevent the App Builder from generating apps perfectly every time. These are categorized by impact on actual build quality.

---

## Category A: Compiler Bugs That Break Generated Apps

### Phase 71: Fix `transpileFile` Losing Default Export Registration

**Problem**: In `useReactCompiler.ts` (lines 171-178), `export default function App` is transformed to just `function App`, and the module registration at line 198-201 tries to check `typeof App !== 'undefined'`. However, the entire file is wrapped in an IIFE `(function() { ... })()` at line 207, so `App` is scoped inside and the registration code runs inside the same IIFE — this works. BUT: when the default export is an arrow function like `export default () => <div>...</div>` (anonymous), there is no name to register, so the root component becomes `undefined` and the preview shows "No root component found."

**Fix**:
- Detect anonymous default exports: `export default (props) =>` or `export default function(`
- Assign them a synthetic name: `const __DefaultExport = (props) => ...`
- Register as `__modules['path'].default = __DefaultExport`

### Phase 72: Fix Import Map `data:` Shim Missing React Hooks

**Problem**: The `data:text/javascript` shim for React (line 392) re-exports specific named hooks. If the AI generates code using `React.startTransition`, `React.use`, `React.useOptimistic`, or any hook not in the explicit export list, it will be `undefined` at runtime. The shim is a fragile allowlist.

**Fix**:
- Replace the explicit destructuring shim with a Proxy-based approach:
  ```
  data:text/javascript,const R=window.React;export default R;
  export const{useState,useEffect,...}=R;
  // Add: catch-all via re-exporting everything
  for(const k in R) if(!(k in exports)) exports[k]=R[k];
  ```
- OR: Use `https://esm.sh/react@18.3.1?bundle` with the UMD global hint so esm.sh doesn't load a second copy

### Phase 73: Fix Type Stripping Breaking Actual Code

**Problem**: `stripTypeAnnotations` in `useReactCompiler.ts` (lines 74-88) uses regex to remove TypeScript. This breaks real code:
- `const x: string[] = []` becomes `const x = []` (correct)
- `const x: Record<string, any> = {}` — the regex `Record<[^>]+>` works
- BUT: `interface Props { children: React.ReactNode }` removal regex `^(?:export\s+)?(?:interface|type|enum)\s+\w+[\s\S]*?^\}` uses multiline `^}` which can match the closing brace of a FUNCTION body if the interface is followed by a function without a blank line separator

**Fix**:
- Use a bracket-depth counter instead of regex for interface/type removal
- Track `{` depth from the `interface` keyword and only remove up to the matching `}`
- Add a unit test for: `interface Props { x: string }\nfunction App() { return <div /> }` to ensure the function is NOT stripped

### Phase 74: Fix CSS-in-JS and Tailwind `cn()` Breaking in Preview

**Problem**: When AI generates code using `cn()` (from `clsx` + `tailwind-merge`), the preview needs both packages available. `clsx` is in the CDN registry but `tailwind-merge` is NOT, so `import { twMerge } from 'tailwind-merge'` fails silently. The common pattern `const cn = (...inputs) => twMerge(clsx(inputs))` crashes.

**Fix**:
- Add `tailwind-merge` to `DEFAULT_PACKAGES` in `cdnPackageRegistry.ts`
- Add commonly used utility packages: `tailwind-merge`, `class-variance-authority`
- Auto-detect `cn(` usage in generated code and inject both dependencies

---

## Category B: Context & Prompt Issues That Cause Bad Generations

### Phase 75: Fix Context Budget Not Using `trimForContext`

**Problem**: `useContextBudget` is imported and `trimForContext` is destructured in `useAIAppBuilder.ts` (line 683), but it is **never called** anywhere in `sendMessage`. The actual context trimming still uses the old inline logic (`getChangedFiles`, `scored` relevance, `FILE_BUDGET_CHARS`). The new budget hook is dead code.

**Fix**:
- Call `trimForContext(currentFiles, activeFilePath, mentionedPaths)` before `buildFileContext`
- Use its output (prioritized files with manifest for omitted ones) instead of the inline scoring
- OR: Remove `useContextBudget` import if the inline logic is preferred, to avoid confusion

### Phase 76: Fix System Prompt Bloat

**Problem**: `sendMessage` injects up to 10+ system messages before the user message (knowledge context, Supabase context, conversation memory, tone detection, preferences, workflow detection, visual intelligence, web search intent, URL clone instructions, asset priority). On complex prompts, this can exceed 50K chars of system context alone, leaving less room for file context and causing truncation of actual code.

**Fix**:
- Merge all system injections into a SINGLE system message
- Prioritize: (1) code generation instructions, (2) file context, (3) conversation memory
- Cap total system context at 20K chars
- Move tone/preferences/workflow hints into the user message as a brief prefix instead of separate system messages

### Phase 77: Fix Conversational Prose Leaking Into Generated Files

**Problem**: `isConversationalLine` in `useAIAppBuilder.ts` (lines 361-384) catches many patterns but misses:
- Lines starting with "I" (e.g., "I added a dark mode toggle")
- Lines starting with numbers followed by text: "2 new components added"
- Lines with markdown links: "[Click here](http://...)"
- Lines that are just emoji without text
- The check triggers on `blankLineStreak >= 1` which is too aggressive — a single blank line in CSS or JSX followed by a comment like `// This component...` can prematurely end file parsing

**Fix**:
- Increase blank line threshold to `>= 2` before checking for conversational prose
- Add missing patterns to `isConversationalLine`
- Add a "confidence score" — only cut if 2+ consecutive conversational lines are detected
- Add unit tests for edge cases

---

## Category C: Missing Runtime Features

### Phase 78: Fix `usePanelManager` Never Wired (Phase 61 Incomplete)

**Problem**: `usePanelManager.ts` exists but is never imported into `AIAppBuilderWorkspace.tsx`. The workspace still has 80+ individual `useState<boolean>` calls (lines 254-384) and a manual `openPanel` function (lines 1371-1392) that manually sets each one. This causes cascading re-renders on every panel toggle.

**Fix**:
- Import `usePanelManager` and initialize with all panel names
- Replace `useState<boolean>` calls with `panelManager.isOpen('panelName')`
- Replace `setShow*` calls with `panelManager.toggle('panelName')` or `panelManager.open('panelName')`
- Replace the `openPanel` function with `panelManager.exclusiveOpen('panelName')`

### Phase 79: Fix URL Bar Not Updating from Preview Navigation

**Problem**: The URL bar in the header (line 1561-1564) is hardcoded to show `/` and never updates. Although `BuilderPreviewPanel` has `currentUrl` state and `__PREVIEW_NAV__` listener, the URL is not surfaced to the parent workspace. The header renders its own static URL bar instead of using the preview panel's state.

**Fix**:
- Lift `currentUrl` from `BuilderPreviewPanel` to `AIAppBuilderWorkspace` via a callback prop `onUrlChange`
- Update the header URL bar to display the current preview URL
- Make the URL bar editable — typing a path and pressing Enter should postMessage `__NAVIGATE__` to the iframe

### Phase 80: Fix Streaming Preview Auto-Switch Not Working for Preview Tab

**Problem**: The streaming file auto-switch (line 644-648) only switches the active file tab when `rightTab === 'code'`. When the user is on the Preview tab (the default), streaming files are upserted but the tab doesn't switch and there's no visual indication that files are being written. The user sees a stale preview until generation completes.

**Fix**:
- Show a "Writing files..." overlay on the preview panel during streaming (with file count)
- When streaming completes, trigger a preview recompile immediately instead of waiting for the `isGenerating` flag
- Add a progress bar showing `completedFileCount / totalEstimatedFiles`

---

## Category D: Edge Function & Backend Gaps

### Phase 81: Fix `ai-app-builder` Edge Function System Prompt

**Problem**: The edge function at `supabase/functions/ai-app-builder/` handles the AI requests. The system prompt it sends to the model determines the quality of generated code. If the system prompt doesn't enforce the `===FILE:` delimiter format strictly, or doesn't instruct proper React patterns, the generated code will be broken.

**Fix**:
- Audit the edge function's system prompt
- Ensure it mandates: `===FILE: path===` format, proper JSX/TSX, Tailwind classes, no markdown fences around file content
- Add examples of correct output format
- Add instruction to avoid `===EDIT:` for first-time generations (only for modifications)

### Phase 82: Fix Migration & Edge Function Deployment Pipeline

**Problem**: `ai-builder-migrate` and `ai-builder-deploy-fn` edge functions exist, but the workspace's `MigrationApprovalCard` and `EdgeFunctionCard` call them with hardcoded Supabase URLs/keys from the config. If the user's connected Supabase project has different permissions or the service role key is missing, migrations silently fail.

**Fix**:
- Add explicit error handling and user feedback when migration/deployment fails
- Validate the service role key before attempting migration
- Show a "Connect Supabase" prompt if config is missing when a migration block appears

### Phase 83: Add Missing Test Coverage

**Problem**: The existing tests (`useStreamingPreview.test.ts`, `cdnPackageRegistry.test.ts`) cover parsing and CDN resolution but miss the critical paths:
- `transpileFile` — no tests for import resolution, type stripping, export registration
- `parseMultiFileOutput` — no tests for edge cases (prose leaking, nested delimiters, empty files)
- `compileReactProject` — no integration test verifying the full HTML output

**Fix**:
- Add `useReactCompiler.test.ts` with tests for:
  - Anonymous default export handling
  - Import resolution (local modules, external packages, React)
  - Type annotation stripping edge cases
  - Full `compileReactProject` output containing expected script tags
- Add `parseMultiFileOutput.test.ts` with tests for:
  - Basic multi-file parsing
  - Prose stripping at file boundaries
  - `===EDIT:` hunk parsing
  - `===DELETE:` handling
  - Empty/malformed input

---

## Implementation Priority

```text
CRITICAL (causes broken previews):
Phase 71 (Anonymous Default Export)    -- Preview shows "No root component"
Phase 72 (Import Map Hook Coverage)    -- Missing hooks = runtime crash
Phase 73 (Type Stripping Bug)          -- Can delete real code
Phase 75 (Context Budget Dead Code)    -- trimForContext never called

HIGH (causes bad generations):
Phase 76 (System Prompt Bloat)         -- File context truncated
Phase 77 (Prose Leak Fix)              -- AI text in code files
Phase 74 (cn/tailwind-merge Missing)   -- Common utility crashes
Phase 81 (Edge Fn System Prompt)       -- Output format issues

MEDIUM (UX gaps):
Phase 78 (Panel Manager Wiring)        -- 80+ useStates, re-render cascade
Phase 79 (URL Bar Update)              -- Static, non-functional
Phase 80 (Streaming Preview UX)        -- No feedback during generation

MAINTENANCE:
Phase 82 (Migration Error Handling)    -- Silent failures
Phase 83 (Test Coverage)               -- No compiler tests
```

---

## Technical Details

### Phase 71 -- Anonymous Default Export Fix

In `transpileFile`, after the existing default export regex (line 171-178), add:

```typescript
// Handle anonymous default exports: export default () => ... or export default function(
code = code.replace(
  /^export\s+default\s+((?:\([^)]*\)|[a-zA-Z_$]\w*)\s*=>)/gm,
  'const __DefaultExport = $1'
);
code = code.replace(
  /^export\s+default\s+function\s*\(/gm,
  'const __DefaultExport = function('
);
// Then register: __modules[path].default = __DefaultExport
```

### Phase 75 -- Wire trimForContext

In `sendMessage`, before `buildFileContext`:

```typescript
// Use proactive context budget trimming
const mentionedPaths = files
  .filter(f => lowerInput.includes(f.path.toLowerCase()))
  .map(f => f.path);
const trimmedFiles = trimForContext(currentFiles, activeFilePath, mentionedPaths);
// Use trimmedFiles instead of currentFiles in buildFileContext
```

### Phase 76 -- System Prompt Consolidation

Merge all system messages into one:

```typescript
const systemParts = [
  knowledgeContext,
  supabaseContext,
  memoryContext,
  tonePrompt,
  prefsContext,
  visualContext,
].filter(Boolean);

const consolidatedSystem = systemParts.join('\n\n---\n\n');
if (consolidatedSystem) {
  apiMessages.push({ role: 'system', content: consolidatedSystem.slice(0, 20000) });
}
```

### Phase 74 -- CDN Registry Addition

```typescript
// In cdnPackageRegistry.ts DEFAULT_PACKAGES:
{ name: 'tailwind-merge', version: '2.5.2', cdnUrl: `${ESM_SH}/tailwind-merge@2.5.2` },
{ name: 'class-variance-authority', version: '0.7.1', cdnUrl: `${ESM_SH}/class-variance-authority@0.7.1` },
{ name: '@radix-ui/react-slot', version: '1.1.0', cdnUrl: `${ESM_SH}/@radix-ui/react-slot@1.1.0?external=react`, peerDeps: ['react'] },
```



# Phase 41-57: Production Hardening and True Wiring Parity

## The Core Problem

Phases 24-40 created many standalone files (hooks, components, utilities) but **most are not wired into the workspace**. The builder has "feature files" that exist on disk but are never imported, never rendered, and never connected to the data flow. This plan closes every gap to make the builder production-ready and flawless.

---

## Category A: Unwired Features (Critical — Features exist but are dead code)

### Phase 41: Wire CDN Import Map into React Compiler

**Problem**: `cdnPackageRegistry.ts` exists with `generateImportMap()` and `resolveBareImport()` but `useReactCompiler.ts` never imports or uses them. External package imports like `lucide-react` still resolve to `// [external] lucide-react` comments — they silently fail.

**Fix**:
- Import `generateImportMap`, `buildPackageLookup`, `resolveBareImport` from `cdnPackageRegistry.ts` into `useReactCompiler.ts`
- In `compileReactProject()`, inject a `<script type="importmap">` tag into the HTML `<head>` with all registered packages
- Update the `transpileFile()` function to resolve external bare imports to CDN URLs instead of commenting them out
- Add `react-router-dom` detection: when imports from `react-router-dom` are found, wrap the mount script in `<MemoryRouter>`

### Phase 42: Wire Device Frame Overlay into Preview

**Problem**: `DeviceFrameOverlay.tsx` exists but is never imported or rendered in `AIAppBuilderWorkspace.tsx` or `BuilderPreviewPanel.tsx`.

**Fix**:
- Import `DeviceFrameOverlay` into `BuilderPreviewPanel.tsx`
- Wrap the iframe in `<DeviceFrameOverlay>` when a non-desktop viewport is selected
- Connect rotation toggle to the `ResponsivePreviewBar` viewport switcher

### Phase 43: Wire Performance Monitor and Accessibility Audit

**Problem**: `PerformanceMonitorPanel.tsx` and `AccessibilityAuditPanel.tsx` exist but are never imported or rendered.

**Fix**:
- Add "Performance" and "Accessibility" tabs to `PreviewDevToolsPanel.tsx`
- Import both panels and render them in the dev tools drawer
- Wire "Fix with AI" buttons to `sendMessage()` for auto-remediation

### Phase 44: Wire Seed Data Generator and Inline SQL Runner

**Problem**: `SeedDataGenerator.tsx` and `InlineSQLRunner.tsx` exist but are never imported.

**Fix**:
- Wire `SeedDataGenerator` into `DatabaseMigrationPanel` — show "Generate sample data" after a migration succeeds
- Wire `InlineSQLRunner` into `BuilderChatPanel` — detect ```sql blocks in AI responses and render the run button inline

### Phase 45: Wire Inline AI Edit (Cmd+I)

**Problem**: `useInlineAIEdit.ts` exists but is never imported into `AIAppBuilderWorkspace.tsx` or connected to `CodeEditor.tsx`.

**Fix**:
- Import `useInlineAIEdit` into the workspace
- Pass the `triggerInlineEdit` handler to `CodeEditor` as a prop
- Register `Cmd+I` / `Ctrl+I` keybinding in the Monaco editor that opens the inline prompt popover
- Wire accept/reject to `upsertFile()`

### Phase 46: Wire GitHub Sync Hook

**Problem**: `useGithubSync.ts` exists but is never imported into the workspace. The `GithubSyncButton` and `GitHubPanel` components exist but use separate, disconnected logic.

**Fix**:
- Import `useGithubSync` into the workspace
- Wire `pushToGitHub` and `pullFromGitHub` to the existing `GithubSyncButton` and `GitHubPanel`
- Show sync status in the header (last sync time, connected repo indicator)

### Phase 47: Wire Auto-Fix Loop (useAutoFixLoop)

**Problem**: `useAutoFixLoop.ts` exists but the workspace uses its own inline auto-fix logic (`handleAutoFixError`, `handleSmartFixError`) with manual attempt counting. The dedicated hook with exponential backoff, fix history, and structured prompts is unused.

**Fix**:
- Replace the manual fix counting in `AIAppBuilderWorkspace.tsx` with `useAutoFixLoop`
- Wire `attemptFix` to `handleAutoFixError`
- Wire `markFixSuccess` to the latestFiles change effect (errors cleared = fix succeeded)
- Display `fixHistory` in a "Fix History" section of the console panel

---

## Category B: Compiler and Preview Gaps (High Impact)

### Phase 48: React Router Support in Compiler

**Problem**: The React compiler has no awareness of `react-router-dom`. When AI generates multi-page apps with `<BrowserRouter>`, `<Routes>`, and `<Route>`, the preview breaks because router components are undefined and there is no history provider.

**Fix**:
- Detect `react-router-dom` imports in project files
- Auto-wrap the root component mount in `<MemoryRouter>` (from the CDN import map)
- Intercept iframe navigation via `postMessage` and update the URL bar in `BuilderPreviewPanel`
- Add back/forward navigation buttons that work within the iframe history

### Phase 49: Streaming Preview Hot-Apply

**Problem**: `useStreamingPreview` extracts files incrementally but the preview only recompiles after the full AI response completes. The `FileTabBar` shows dirty indicators but doesn't auto-switch to the currently streaming file.

**Fix**:
- In the `latestFiles` sync effect, detect partial file updates from `partialFiles` and trigger incremental recompile
- Auto-switch the active file tab to the file currently being streamed (last partial file)
- Add a pulsing indicator on the tab of the file being written

### Phase 50: Supabase Client Bridge for Preview

**Problem**: The Supabase client is injected into the preview HTML as a UMD script, but `supabase` is assigned to `window.supabase.createClient(...)` which shadows the global `window.supabase` object from the SDK. This causes `supabase.channel()` realtime calls to fail because `.createClient()` returns a different object than the SDK namespace.

**Fix**:
- Rename the client variable to `window.__supabaseClient` to avoid shadowing
- Inject a helper: `const supabase = window.__supabaseClient;` inside the Babel script block so generated code can reference `supabase` naturally
- Add realtime subscription cleanup on preview unmount to prevent channel leaks

---

## Category C: UX Hardening (Medium Impact)

### Phase 51: Keyboard Shortcuts Completion

**Problem**: Some shortcuts are registered in `KeyboardShortcutsPanel` and `EnhancedCommandPalette` but several standard IDE shortcuts are missing or non-functional.

**Fix**:
- Wire missing shortcuts in the workspace's `useEffect` keyboard handler:
  - `Cmd+S`: Save snapshot (trigger `saveProject`)
  - `Cmd+P`: Open quick file switcher
  - `Cmd+Shift+F`: Open multi-file search
  - `Cmd+B`: Toggle sidebar
  - `Cmd+J`: Toggle console
  - `Cmd+Enter`: Send message (already works in chat input)
  - `Cmd+.`: Toggle between preview/code tabs
- Add shortcut hints as tooltips on toolbar buttons

### Phase 52: Conversation Branching Polish

**Problem**: The fork/revert from message feature exists but lacks visual branch indicators and snapshot reliability. `handleForkFromMessage` renames the project but doesn't maintain a branch tree.

**Fix**:
- Track branch history as a flat list with parent references
- Show branch indicator badges on forked messages ("Branch 2 of 3")
- Ensure `filesSnapshot` is populated on every AI response message (currently may be null)
- Add a "Branches" dropdown in the header showing all forks with switch capability

### Phase 53: Template Gallery Expansion

**Problem**: `AppStarterTemplates.ts` and `TemplateLibrary.tsx` exist but the template count is limited and there is no community template system.

**Fix**:
- Expand to 15+ templates covering: SaaS dashboard, blog/CMS, e-commerce storefront, portfolio, admin panel, social feed, project management, chat app, landing page, documentation site, booking system, fitness tracker, finance dashboard, AI chatbot, recipe app
- Each template includes realistic multi-file React code, not just stubs
- Add category filters and search to the template picker

---

## Category D: Robustness and Error Handling

### Phase 54: Preview Error Boundary Hardening

**Problem**: Preview errors are captured via `window.onerror` and `unhandledrejection` but Babel transpilation errors are not caught — they silently produce blank previews. Also, infinite render loops in generated React code freeze the iframe without triggering any error.

**Fix**:
- Wrap the Babel `<script type="text/babel">` block in a try-catch that posts errors to the parent
- Add a render-loop detector: count React renders per second; if > 100, kill the render and report
- Add a "Preview timed out" state if the iframe doesn't send a `__PREVIEW_READY__` message within 10 seconds
- Show a clear error overlay instead of a blank white screen

### Phase 55: Context Budget Overflow Protection

**Problem**: The AI context system has budget calculations but when the project grows large, the entire file content is still sent, occasionally exceeding model limits and causing 400 errors. The retry with reduced context works but is reactive, not preventive.

**Fix**:
- Before sending, measure total context size against the budget
- If over budget, automatically switch to manifest mode (file names + hashes only) for unchanged files
- Only include full content for: active file, files mentioned in the prompt, files referenced by imports from mentioned files
- Show a "Context trimmed" indicator when files are omitted

### Phase 56: State Management Cleanup

**Problem**: `AIAppBuilderWorkspace.tsx` has 100+ `useState` calls, making it fragile and hard to maintain. State updates can cause cascading re-renders.

**Fix**:
- Group related state into reducer objects:
  - `panelState`: all `show*` booleans -> single `useReducer`
  - `configState`: supabase, github, stripe, vercel configs -> single object
  - `editorState`: activeFile, cursor, dirty files, split pane -> single object
- Memoize heavy computations (compiled HTML, file indices)
- Extract panel toggle logic into a `usePanelManager` hook

### Phase 57: End-to-End Test Suite

**Problem**: No automated tests exist for the builder's core compilation pipeline, streaming parser, or file system operations.

**Fix**:
- Add unit tests for:
  - `useReactCompiler.compileReactProject()` — verify HTML output for basic React projects
  - `useStreamingPreview.parseIncremental()` — verify file extraction from streaming content
  - `cdnPackageRegistry.resolveBareImport()` — verify CDN URL resolution
  - `useAutoFixLoop.buildFixPrompt()` — verify prompt structure
- Add integration test for the full cycle: files -> compile -> preview HTML contains expected elements

---

## Implementation Priority

```text
CRITICAL (do first — features are dead code without these):
Phase 41 (Wire Import Map)         -- NPM packages broken without it
Phase 48 (React Router in Compiler)-- Multi-page apps broken
Phase 50 (Supabase Client Bridge)  -- Realtime/DB broken in preview
Phase 54 (Error Boundary Hardening)-- Blank previews with no feedback

HIGH (features exist but invisible):
Phase 42 (Device Frames)           -- Component exists, not rendered
Phase 43 (Perf + A11y Panels)      -- Components exist, not rendered
Phase 44 (Seed Data + SQL Runner)  -- Components exist, not rendered
Phase 45 (Inline AI Edit)          -- Hook exists, not connected
Phase 46 (GitHub Sync)             -- Hook exists, not connected
Phase 47 (Auto-Fix Loop)           -- Hook exists, replaced by inline logic

MEDIUM (UX polish):
Phase 49 (Streaming Hot-Apply)     -- Preview only updates after full response
Phase 51 (Keyboard Shortcuts)      -- Some registered, many missing
Phase 52 (Branch Polish)           -- Works but no visual indicators
Phase 53 (Template Expansion)      -- Limited selection

MAINTENANCE (tech debt):
Phase 55 (Context Overflow)        -- Reactive, not preventive
Phase 56 (State Cleanup)           -- 100+ useState, fragile
Phase 57 (Test Suite)              -- No automated tests
```

---

## Technical Details

### Phase 41 -- Import Map Injection (in useReactCompiler.ts)

The `compileReactProject()` method will inject this before the React CDN scripts:

```html
<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "lucide-react": "https://esm.sh/lucide-react@0.462.0?external=react",
    "date-fns": "https://esm.sh/date-fns@3.6.0",
    "recharts": "https://esm.sh/recharts@3.1.0?external=react,react-dom",
    ...
  }
}
</script>
```

And `transpileFile()` will change from:
```javascript
// [external] lucide-react  // BROKEN
```
To:
```javascript
const { Search, X, Plus } = await import('lucide-react');  // WORKS
```

### Phase 48 -- Router Wrapping

When `react-router-dom` imports are detected, the mount script changes from:
```javascript
root.render(React.createElement(RootComponent));
```
To:
```javascript
const { MemoryRouter } = await import('react-router-dom');
root.render(React.createElement(MemoryRouter, null, React.createElement(RootComponent)));
```

### Phase 50 -- Supabase Client Fix

Current (broken shadowing):
```javascript
const supabase = window.supabase.createClient(URL, KEY);
// window.supabase is now the SDK namespace, not the client
```

Fixed:
```javascript
window.__supabaseClient = window.supabase.createClient(URL, KEY);
// Inside Babel block:
const supabase = window.__supabaseClient;
```

### Phase 54 -- Render Loop Detector

```javascript
let __renderCount = 0;
const __renderTimer = setInterval(() => {
  if (__renderCount > 100) {
    clearInterval(__renderTimer);
    window.parent.postMessage({
      type: '__PREVIEW_ERROR__',
      error: { message: 'Infinite render loop detected. A component is re-rendering too frequently.' }
    }, '*');
    document.getElementById('root').innerHTML = '<div style="padding:40px;color:#ef4444"><h2>Render Loop</h2><p>A component is stuck in an infinite loop.</p></div>';
  }
  __renderCount = 0;
}, 1000);
```

### Phase 56 -- Panel State Reducer

```typescript
type PanelAction = { type: 'toggle'; panel: string } | { type: 'closeAll' } | { type: 'open'; panel: string };

function panelReducer(state: Record<string, boolean>, action: PanelAction) {
  switch (action.type) {
    case 'toggle': return { ...state, [action.panel]: !state[action.panel] };
    case 'open': return { ...state, [action.panel]: true };
    case 'closeAll': return Object.fromEntries(Object.keys(state).map(k => [k, false]));
  }
}
```

This consolidates 40+ `useState<boolean>` calls into a single reducer.


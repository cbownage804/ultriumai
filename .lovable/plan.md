

# Phase 58-70: Final Production Hardening -- True Lovable Parity

After a thorough audit of the entire codebase, here is every remaining gap between the App Builder and a production-ready Lovable parity IDE. Each item below is either **dead code that needs wiring**, a **missing behavioral feature**, or a **reliability issue that would break real users**.

---

## Category A: Still-Unwired Code (Features built but never imported)

### Phase 58: Wire SeedDataGenerator into DatabaseMigrationPanel

**Problem**: `SeedDataGenerator.tsx` exists but is never imported by any component. After a migration creates a table, users see no option to populate it with sample data.

**Fix**:
- Import `SeedDataGenerator` into `DatabaseMigrationPanel.tsx`
- After a migration succeeds that contains `CREATE TABLE`, render the `SeedDataGenerator` component below the migration card with the table name and SQL passed as props
- Wire `onGenerate` to send the seed prompt through the chat pipeline

### Phase 59: Wire InlineSQLRunner into BuilderChatPanel

**Problem**: `InlineSQLRunner.tsx` exists but is never imported. SQL blocks in AI chat responses have no "Run Query" button.

**Fix**:
- Import `InlineSQLRunner` into `BuilderChatPanel.tsx`
- In the message renderer, detect fenced code blocks with language `sql` and render an `InlineSQLRunner` component below each one
- Pass the connected Supabase URL and service key from the workspace config

### Phase 60: Wire useContextBudget into useAIAppBuilder

**Problem**: `useContextBudget.ts` exists with priority scoring and manifest-mode trimming, but `useAIAppBuilder.ts` still uses its own inline context budget logic. When projects get large, the inline logic fails and falls back to reactive retries instead of proactively trimming.

**Fix**:
- Import `useContextBudget` into `useAIAppBuilder.ts`
- Before building the AI request payload, call `trimContext(files, activeFilePath, mentionedPaths)` to proactively reduce context size
- Use the `isOverBudget` flag to show a "Context trimmed" indicator in the chat
- Remove the duplicate inline budget logic

### Phase 61: Wire usePanelManager into AIAppBuilderWorkspace

**Problem**: `usePanelManager.ts` exists with a `useReducer`-based pattern for managing panel states, but the workspace still uses 40+ individual `useState<boolean>` calls for panel visibility. This causes unnecessary re-renders and makes the code fragile.

**Fix**:
- Import `usePanelManager` and replace the 40+ `show*` state variables with a single `panelManager` instance
- Update all `setShow*` calls to use `panelManager.toggle('panelName')` or `panelManager.exclusiveOpen('panelName')`
- This is a refactor-only change with no user-facing impact but significantly improves maintainability

---

## Category B: Missing Behavioral Features

### Phase 62: Chat SQL Block Detection and Rendering

**Problem**: Even once `InlineSQLRunner` is imported, `BuilderChatPanel` renders AI messages using `ReactMarkdown` which treats SQL blocks as plain code. There is no detection logic to intercept SQL blocks and render interactive components.

**Fix**:
- Add a custom `code` component to the `ReactMarkdown` renderer that detects `language === 'sql'` and renders an `InlineSQLRunner` instead of a plain `<pre>` block
- Similarly detect `language === 'bash'` or `language === 'sh'` and offer a "Copy" button

### Phase 63: Preview URL Bar Navigation

**Problem**: The URL bar in `BuilderPreviewPanel` shows `localhost:3000/` but is static. When React Router navigation happens inside the iframe, the URL bar doesn't update. Back/forward buttons exist but don't actually work because iframe postMessage navigation events from Phase 48 are sent but never received.

**Fix**:
- Add a `message` event listener in `BuilderPreviewPanel` for `__PREVIEW_NAV__` messages
- Update `currentUrl` state when navigation events are received
- Wire back/forward buttons to push/pop from `urlHistory` and postMessage a `__NAVIGATE__` event back to the iframe
- In the compiler output, add a listener for `__NAVIGATE__` that calls `window.history.pushState()`

### Phase 64: Refresh Button Actually Reloads Preview

**Problem**: The refresh button in the workspace header (line ~1578) has an empty `onClick` handler: `onClick={() => { /* refresh preview */ }}`. It does nothing.

**Fix**:
- Wire the refresh button to increment the iframe's `iframeKey` state (which forces a full re-render of the srcdoc)
- This can be done by lifting `setIframeKey` from `BuilderPreviewPanel` or passing a `onRefresh` callback prop

### Phase 65: Inline AI Edit (Cmd+I) Keybinding in Monaco

**Problem**: `useInlineAIEdit` is initialized in the workspace but never connected to the Monaco editor. Pressing Cmd+I does nothing because the keybinding is never registered.

**Fix**:
- In `CodeEditor.tsx`, register a Monaco `addAction` for `Cmd+I` / `Ctrl+I`
- When triggered, get the current selection text and cursor position
- Show an inline input popover (can use a Monaco overlay widget or a React portal positioned at cursor)
- On submit, call the `triggerInlineEdit` function from `useInlineAIEdit`
- Display the AI's suggested replacement as a diff decoration (green for additions)

### Phase 66: GitHub Panel Wiring to useGithubSync

**Problem**: `useGithubSync` is initialized in the workspace but `GitHubPanel.tsx` uses its own separate logic with `localStorage` for PAT storage and direct fetch calls. The two systems are disconnected.

**Fix**:
- Pass `githubSync` props (pushToGitHub, pullFromGitHub, syncStatus, lastSyncTime) into `GitHubPanel`
- Replace the panel's internal push/pull logic with calls to the hook
- Show sync status indicator in the workspace header when a repo is connected

---

## Category C: Robustness and Edge Cases

### Phase 67: Babel Transpilation Error Capture

**Problem**: The render loop detector and preview timeout (Phase 54) are wired, but Babel transpilation errors inside `<script type="text/babel">` are NOT caught. When Babel fails to parse generated JSX (common with complex TypeScript), the preview shows a blank white screen with no error message to the user.

**Fix**:
- Replace the single `<script type="text/babel">` block with a two-stage approach:
  1. Load Babel standalone
  2. Use `Babel.transform(code, { presets: ['react', 'typescript'] })` in a try-catch inside a regular `<script>` block
  3. If transform succeeds, `eval()` the result
  4. If transform fails, post the Babel error message to parent via `__PREVIEW_ERROR__`
- This ensures ALL transpilation errors are captured and surfaced

### Phase 68: Import Map + UMD React Conflict

**Problem**: The compiler injects BOTH a `<script type="importmap">` (which maps `react` to `esm.sh`) AND UMD React scripts (`unpkg.com/react@18/umd/react.production.min.js`). This creates two React instances -- the UMD global `React` and the ESM module `react`. Components using `await import('react')` get a different React than those using the global `React`, causing "Invalid hook call" errors.

**Fix**:
- Remove the UMD React/ReactDOM `<script>` tags
- Rely entirely on the import map for React resolution: `"react": "https://esm.sh/react@18.3.1"` 
- OR: Remove React from the import map and keep the UMD globals, but ensure that `await import('react')` returns the global `window.React` object by adding a shim in the import map: `"react": "data:text/javascript,export default window.React;export const useState=React.useState;..."`
- The second approach is safer and avoids double-download

### Phase 69: Console Log Deduplication in Preview

**Problem**: Console interceptors are injected TWICE into the preview HTML -- once by the React compiler in `useReactCompiler.ts` (lines 471-498) and once by `BuilderPreviewPanel.tsx` (lines 68-177 via `htmlWithErrorCapture`). This causes every console message to appear twice in the DevTools panel and every error to trigger two auto-fix attempts.

**Fix**:
- Remove the console/error interceptor injection from `BuilderPreviewPanel.tsx` (`htmlWithErrorCapture`)
- Rely solely on the interceptors injected by the compiler (which are more complete and include the `__builderInjected` guard)
- OR: Add the `__builderInjected` guard to `BuilderPreviewPanel`'s injection so it skips if already injected

### Phase 70: Template Gallery Expansion

**Problem**: `AppStarterTemplates.ts` has only a handful of templates (CRUD app, landing page, dashboard). Lovable offers 15+ polished templates. The current templates are Vanilla JS only -- no React templates exist despite the builder supporting React.

**Fix**:
- Add 10+ React templates: SaaS Dashboard, Blog/CMS, E-commerce Storefront, Portfolio, Chat App, Project Management Board, Social Feed, AI Chatbot, Booking System, Finance Dashboard
- Each template should include 3-5 React files (App.tsx, components, styles) with working Tailwind CSS
- Add category filters to `StarterTemplatePicker` (App, Site, Tool, React, Vanilla)
- Add preview thumbnails (can be emoji-based for now)

---

## Implementation Priority

```text
CRITICAL (causes user-visible bugs):
Phase 68 (Import Map + UMD Conflict)  -- Dual React = broken hooks
Phase 69 (Console Log Deduplication)   -- Double errors, double fix attempts
Phase 67 (Babel Error Capture)         -- Blank screen with no feedback
Phase 64 (Refresh Button)             -- Button does nothing

HIGH (features built but invisible):
Phase 58 (Seed Data Generator)         -- Never rendered
Phase 59 (Inline SQL Runner)           -- Never rendered
Phase 62 (SQL Block Detection)         -- Renders as plain code
Phase 65 (Cmd+I Keybinding)            -- Never registered
Phase 66 (GitHub Panel Wiring)         -- Disconnected systems
Phase 63 (URL Bar Navigation)          -- Static, non-functional

MAINTENANCE (tech debt, no user impact):
Phase 60 (Context Budget Wiring)       -- Reactive instead of proactive
Phase 61 (Panel Manager Wiring)        -- 40+ useStates
Phase 70 (Template Expansion)          -- Limited selection
```

---

## Technical Details

### Phase 68 -- React Instance Deduplication

Current (broken -- two React instances):
```html
<script type="importmap">{ "imports": { "react": "https://esm.sh/react@18.3.1" } }</script>
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
```

Fixed (single React via shim):
```html
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
<script type="importmap">{
  "imports": {
    "react": "data:text/javascript,const R=window.React;export default R;export const{useState,useEffect,useCallback,useMemo,useRef,useContext,createContext,memo,forwardRef,Fragment,useReducer,useLayoutEffect,Children,cloneElement,isValidElement,createElement,Suspense,lazy,StrictMode}=R;",
    "react-dom": "data:text/javascript,const RD=window.ReactDOM;export default RD;export const{createRoot,createPortal,flushSync}=RD;",
    "react-dom/client": "data:text/javascript,export const{createRoot}=window.ReactDOM;",
    "lucide-react": "https://esm.sh/lucide-react@0.462.0?external=react",
    ...
  }
}</script>
```

This ensures `await import('react')` returns the same React instance as the UMD global.

### Phase 67 -- Babel Try-Catch Wrapping

Replace:
```html
<script type="text/babel" data-presets="react,typescript" data-type="module">
  // all transpiled code...
</script>
```

With:
```html
<script>
(async function() {
  try {
    var code = `...all transpiled code...`;
    var transformed = Babel.transform(code, {
      presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
      filename: 'app.tsx',
    });
    var fn = new Function('React', 'ReactDOM', transformed.code);
    fn(React, ReactDOM);
  } catch(e) {
    console.error('[Babel] Transpilation error:', e.message);
    window.parent.postMessage({
      type: '__PREVIEW_ERROR__',
      error: { message: 'Syntax Error: ' + e.message, source: 'babel', critical: true }
    }, '*');
    document.getElementById('root').innerHTML = '<div style="padding:40px;color:#ef4444"><h2>Syntax Error</h2><pre>' + e.message + '</pre></div>';
  }
})();
</script>
```

### Phase 69 -- Deduplication Fix

In `BuilderPreviewPanel.tsx`, change `htmlWithErrorCapture` to skip injection when the compiler has already injected interceptors:

```typescript
const htmlWithErrorCapture = html ? (
  html.includes('__builderInjected')
    ? html  // Compiler already injected interceptors
    : html.replace('</head>', `<script>...</script></head>`)
) : null;
```

### Phase 62 -- ReactMarkdown SQL Detection

```typescript
// In BuilderChatPanel message renderer:
<ReactMarkdown
  components={{
    code({ node, className, children, ...props }) {
      const lang = className?.replace('language-', '');
      const codeStr = String(children).trim();
      if (lang === 'sql' && codeStr.length > 10) {
        return <InlineSQLRunner sql={codeStr} supabaseUrl={supabaseConfig?.url} />;
      }
      return <code className={className} {...props}>{children}</code>;
    }
  }}
/>
```


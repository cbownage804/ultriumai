

# AI Studio App Builder -- Final Polish and Remaining Gaps

## Current Status

All three phases from the roadmap have been implemented. The builder has: streaming preview, visual edits with AI prompts, smart error fixing with retries, multi-file bundler, package manager, multi-file context awareness, collaborative presence, project remixing, custom subdomain publishing, onboarding tour, Monaco editor with remote cursors, and much more.

What remains is **integration wiring, bug fixes, and polish** to make everything actually work end-to-end rather than just exist as UI scaffolding.

---

## Remaining Work

### 1. Wire Up Collaborative Editing (Currently UI-only)

The `CollaborativePresence` component shows online users but does NOT broadcast file changes or cursor positions. The `CodeEditor` accepts `remoteCursors` and `onCursorChange` props but they are never passed from the workspace.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Pass `remoteCursors` and `onCursorChange` to `CodeEditor`, broadcast cursor position and file changes via Supabase Realtime channel, listen for remote changes and apply them.

### 2. Wire Up Project Remixing (Button exists, handler missing)

`ProjectManager` has a `onRemix` prop and renders a fork button, but the workspace never passes a remix handler.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add a `handleRemix` callback that loads a project, clears the `currentProjectId` (so the next save creates a new copy), and renames it with a "Remix of..." prefix.

### 3. Use the Bundler in Preview Compilation

`useProjectBundler` exists with `bundleForBrowser` and `resolveImportOrder`, but the preview still uses the simple `getCompiledHTML` from `useProjectFileSystem` which just concatenates files. Multi-file imports won't resolve.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: When computing `compiledHTML`, use `useProjectBundler().bundleForBrowser()` to process JS files instead of naive concatenation, and pass the bundled output to the preview.
- `useProjectFileSystem.ts`: Update `getCompiledHTML` to accept an optional bundler function, or create a new `getBundledHTML` that uses the bundler for JS resolution.

### 4. Inject CDN Packages into Preview

The `PackageManager` tracks `cdnPackages` state but they are never injected into the compiled HTML.

**Changes:**
- `AIAppBuilderWorkspace.tsx` / `useProjectFileSystem.ts`: Pass `cdnPackages` to `getCompiledHTML` and inject their CDN script tags into the `<head>`.

### 5. Wire Env Variables Panel to Compilation

The `EnvVarsPanel` manages `envVariables` state but this is separate from the `envVars` state used in compilation. There are two disconnected env var systems.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Sync `envVariables` from `EnvVarsPanel` into the `envVars` array that gets passed to `getCompiledHTML`, or unify them into one state.

### 6. Add data-tour Attributes for Onboarding

The `OnboardingTour` targets elements by `data-tour` attributes (e.g., `data-tour="chat-input"`, `data-tour="preview"`), but these attributes don't exist on any elements in the workspace.

**Changes:**
- `AIAppBuilderWorkspace.tsx`: Add `data-tour="preview"`, `data-tour="code-editor"`, `data-tour="command-palette"` to the relevant wrapper elements.
- `BuilderChatPanel.tsx`: Add `data-tour="chat-input"` to the textarea container and `data-tour="mode-toggle"` to the mode toggle.

### 7. Console Log Forwarding to ConsolePanel

The `ConsolePanel` exists but it receives no log data from the iframe. The iframe posts `__CONSOLE_LOG__` messages but only `BuilderPreviewPanel` listens for them (and only for errors).

**Changes:**
- `AIAppBuilderWorkspace.tsx` or `BuilderPreviewPanel.tsx`: Forward `__CONSOLE_LOG__` messages to the `ConsolePanel` by lifting console log state up or passing a callback.

### 8. Fix Error Fix Retry Tracking

The `ErrorConsole` tracks `fixAttempts` on errors but the state is never updated after a fix is attempted -- the error objects in `BuilderPreviewPanel` are plain objects that don't get their `fixAttempts` incremented.

**Changes:**
- `BuilderPreviewPanel.tsx`: When `handleSmartFix` is called, update the error's `fixAttempts` count in the `errors` state.

---

## Technical Details

| File | Changes |
|------|---------|
| `AIAppBuilderWorkspace.tsx` | Wire remix handler, pass remote cursors to CodeEditor, add data-tour attrs, inject CDN packages, sync env vars, use bundler for preview |
| `BuilderPreviewPanel.tsx` | Forward console logs, increment fixAttempts on retry |
| `BuilderChatPanel.tsx` | Add data-tour attributes to textarea and mode toggle |
| `useProjectFileSystem.ts` | Extend `getCompiledHTML` to accept CDN packages and optional bundler |

### Estimated scope
- 4 files modified
- No new files needed
- Focuses entirely on wiring existing components together so everything actually works end-to-end


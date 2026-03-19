

# Production Readiness Roadmap — 20 Steps

This is a comprehensive plan to bring the App Builder to full production quality. Each step is self-contained and can be implemented incrementally.

---

## Already Done (recent sessions)

- Eliminated ERROR_FALLBACK_HTML — preview never shows error pages
- Soft validation gate — no longer blocks compilation on fixable issues
- Auto-heal bumped to 3 attempts with full file context
- LKG persisted to IndexedDB (survives tab close)
- Auto-retry with backoff for transient Vite Sandbox failures
- Streaming parser hardened (Unicode, control chars, path normalization)
- Test coverage for previewValidation and preCompileValidation

---

## Phase 1: Build Pipeline Hardening (Steps 1-5)

### Step 1 — Streaming truncation recovery
**Problem**: When AI output is cut mid-file (network drop, token limit), the parser silently accepts incomplete files. The `===END===` marker is missing, but there's no user-visible recovery.
**Fix**: When `===END===` is missing, mark ALL files as `incomplete`, trigger an automatic continuation prompt ("Please continue from where you left off — the output was truncated at `===FILE: {lastPath}===`"), and do NOT compile incomplete files. Instead, hold LKG.

### Step 2 — Duplicate compile suppression
**Problem**: React StrictMode double-effects and rapid file changes can trigger 2-3 overlapping compile requests that race. The `compilationInFlightRef` guard helps but the `recompileNeededRef` path still fires too eagerly.
**Fix**: Add a compile dedup hash (hash of filesDigest + runId). If the same hash is already in-flight or just completed (within 2s), skip. This eliminates wasted Vite Sandbox calls.

### Step 3 — Compile result caching
**Problem**: `useIncrementalCompileCache` exists but isn't verified to actually skip Vite calls on unchanged files. CSS-only changes still trigger full recompiles.
**Fix**: Audit the cache hit path. If `filesDigest` matches a cached result AND no package.json changed, return cached HTML immediately (0ms). Log cache hit/miss ratio to telemetry.

### Step 4 — Compile progress accuracy
**Problem**: The "Compiling..." state shows a generic animation. Users have no idea if compilation is at 10% or 90%.
**Fix**: The Vite Sandbox edge function should return progress events (dependency resolution → transform → bundle → render). Surface these as phase labels in CompilationProgress: "Installing dependencies..." → "Transforming files..." → "Bundling..." → "Done".

### Step 5 — Parallel CSS hot-reload verification
**Problem**: `useCSSHotReload` claims sub-100ms updates but CSS changes sometimes still trigger full recompiles. The hot-patch path in `liveSync.applyPatches` returns `false` when it shouldn't.
**Fix**: Ensure CSS-only changes (detected by comparing file extensions in the diff) always take the hot-patch path, never fall through to full recompile. Add telemetry logging for hot-patch success/failure.

---

## Phase 2: AI Generation Quality (Steps 6-9)

### Step 6 — Context window optimization
**Problem**: `useContextBudget` caps at 120K chars (~30K tokens) but doesn't prioritize intelligently. Large CSS files eat budget meant for component code.
**Fix**: Deprioritize CSS/config files in budget scoring. Add "skeleton mode" for large files: send first 50 + last 20 lines with a comment "// ... {N} lines omitted". Never omit the active file or files mentioned in the prompt.

### Step 7 — Smarter EDIT vs FILE selection
**Problem**: The AI often sends full `===FILE:===` rewrites for small changes (like updating a hero image), wasting tokens and increasing error risk.
**Fix**: Add a system prompt directive: "For changes affecting <20% of a file, use `===EDIT:===` hunks instead of full file rewrites. This is faster and less error-prone." Track FILE vs EDIT ratio in telemetry.

### Step 8 — Anti-pattern prompt injection
**Problem**: `useErrorPatternLearning` tracks error patterns but the learned anti-patterns are not consistently injected into the system prompt.
**Fix**: Wire `buildAntiPatternPrompt()` into the main generation system prompt in `useAIAppBuilder`. Include top-3 most frequent error patterns as explicit "DO NOT" instructions.

### Step 9 — Post-generation diff review
**Problem**: When the AI generates code, there's no summary of what changed. Users don't know if a "change hero image" prompt also accidentally rewrote their footer.
**Fix**: After generation completes, show a collapsible "Changes" summary in the chat: files modified, lines added/removed, key changes. Use the existing `EnhancedVersionDiffViewer` data but surface it inline.

---

## Phase 3: Preview Reliability (Steps 10-13)

### Step 10 — Runtime error capture and auto-fix
**Problem**: The preview can render but crash at runtime (undefined variable, failed API call). `useRuntimeErrorOverlay` exists but errors are hidden per the "no error UI" directive.
**Fix**: Capture runtime errors silently, feed them into the auto-heal loop as a "runtime error" category. The AI can fix runtime errors just like compile errors — "Your app compiled but crashed at runtime with: TypeError: Cannot read property 'map' of undefined in ProductList.tsx:42".

### Step 11 — White screen detection
**Problem**: The preview can show a valid HTML document that renders as a blank white screen (e.g., all content hidden by CSS, React fails to mount silently).
**Fix**: After compile success, inject a 2-second delayed check: query `document.getElementById('root').children.length`. If zero AND no visible text content, mark as "silent failure" and trigger auto-heal with context "The app compiled but rendered a blank screen."

### Step 12 — Preview navigation state preservation
**Problem**: When the preview recompiles, React Router state resets to `/`. Users browsing `/settings` lose their place.
**Fix**: Before recompile, capture `window.location.pathname` from the iframe. After new HTML loads, postMessage the saved path to the iframe so React Router navigates back. `useHMRStatePreservation` partially does this but doesn't handle router state.

### Step 13 — Asset loading resilience
**Problem**: External assets (Unsplash images, Google Fonts, CDN scripts) can fail silently, breaking the preview layout.
**Fix**: Add a preload check in the preview: if any `<img>` fails to load, replace with a styled placeholder. If a `<link>` font fails, fall back to system fonts. Log asset failures to console for debugging.

---

## Phase 4: Developer Experience (Steps 14-17)

### Step 14 — Build time telemetry dashboard
**Problem**: `useCompileTelemetry` collects data but `BuildHealthDashboard` is a hidden panel most users never see.
**Fix**: Add a subtle build time indicator next to the "Compiling..." status: "~3.2s" (rolling average). If builds consistently take >10s, show a tip: "Large projects may benefit from splitting into more files."

### Step 15 — Keyboard-first workflow
**Problem**: The builder requires mouse clicks for common actions (send message, switch tabs, open file).
**Fix**: Audit and document all keyboard shortcuts. Ensure `Cmd+Enter` sends message, `Cmd+P` opens file switcher, `Cmd+Shift+P` opens command palette, `Cmd+1/2/3` switches tabs. Show shortcuts in tooltips.

### Step 16 — Mobile preview accuracy
**Problem**: `ResponsivePreviewBar` resizes the iframe but doesn't account for touch events, viewport meta, or mobile-specific CSS (@media queries with device features).
**Fix**: When in mobile viewport mode, inject `<meta name="viewport" content="width=device-width">` and set the iframe's `width` via CSS (not just container), ensuring CSS media queries fire correctly.

### Step 17 — File tree performance
**Problem**: `ProjectFileTree` re-renders on every file change, which can lag with 50+ files.
**Fix**: Memoize the tree structure computation. Only re-render nodes whose content hash changed (using the existing file hash infrastructure).

---

## Phase 5: Production Infrastructure (Steps 18-20)

### Step 18 — Deploy gate enforcement
**Problem**: `useDeployGate` runs smoke tests but the results aren't blocking — users can still publish broken builds.
**Fix**: Wire the deploy gate into `PublishPanel`. Show a "Running pre-deploy checks..." step before publishing. If smoke tests fail, show specific failures and block with "Fix these issues before publishing."

### Step 19 — Preview hosting reliability
**Problem**: The `app_builder_live_previews` table stores HTML but there's no CDN layer or versioning.
**Fix**: Add a version column to the previews table. When uploading, keep the previous version. Add a "Preview History" in the publish panel showing last 5 versions with timestamps and one-click rollback.

### Step 20 — Error telemetry and alerting
**Problem**: Build failures, auto-heal attempts, and compilation timeouts are logged to console but not tracked centrally.
**Fix**: Send anonymized telemetry events to a Supabase table: build_success/failure, auto_heal_triggered/resolved, compile_duration, LKG_fallback_used. Build a simple admin dashboard showing success rate, P95 compile time, and most common error categories.

---

## Recommended Execution Order

**Highest impact first (do these immediately):**
1. Step 1 — Streaming truncation recovery (prevents silent data loss)
2. Step 10 — Runtime error auto-fix (catches errors compile gate misses)
3. Step 11 — White screen detection (catches silent mount failures)
4. Step 8 — Anti-pattern prompt injection (reduces error frequency)

**High impact (next batch):**
5. Step 2 — Duplicate compile suppression (saves Vite Sandbox resources)
6. Step 6 — Context window optimization (better AI output quality)
7. Step 18 — Deploy gate enforcement (prevents broken publishes)
8. Step 9 — Post-generation diff review (user trust)

**Medium impact (polish):**
9-20. Remaining steps in any order based on user feedback.

---

## Technical Notes

- All changes are contained within the existing architecture — no new services or infrastructure needed.
- Each step is independent and can be shipped + tested in isolation.
- Steps 1-3 directly reduce Vite Sandbox load (cost savings).
- Steps 10-11 close the gap between "compiles successfully" and "actually works."


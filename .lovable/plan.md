

## Production Readiness Roadmap — Progress

### Completed
- ✅ Eliminated ERROR_FALLBACK_HTML — preview never shows error pages
- ✅ Soft validation gate — no longer blocks compilation on fixable issues
- ✅ Auto-heal bumped to 3 attempts with full file context
- ✅ LKG persisted to IndexedDB (survives tab close)
- ✅ Auto-retry with backoff for transient Vite Sandbox failures
- ✅ Streaming parser hardened (Unicode, control chars, path normalization)
- ✅ Test coverage for previewValidation and preCompileValidation
- ✅ **Step 1 — Streaming truncation recovery**: Auto-continues generation when ===END=== is missing
- ✅ **Step 10 — Runtime error auto-fix**: Iframe runtime errors forwarded to parent, fed into auto-heal loop
- ✅ **Step 11 — White screen detection**: Already wired via usePreviewHealthMonitor, now triggers auto-heal
- ✅ **Step 8 — Anti-pattern prompt injection**: useErrorPatternLearning injected into knowledge context
- ✅ **Step 2 — Duplicate compile suppression**: lastCompiledDigestRef skips identical compiles within 2s
- ✅ **Step 6 — Context window optimization**: CSS/config deprioritized, skeleton mode for large files
- ✅ **Step 9 — Post-generation diff review**: Collapsible diff summary shown in chat after generation
- ✅ **Step 18 — Deploy gate enforcement**: Smoke tests block publishing, with escape hatch

- ✅ **Step 3 — Compile result caching**: Full HTML cached by filesDigest, returns cached preview in 0ms on unchanged files
- ✅ **Step 5 — CSS hot-reload verification**: CSS-only changes detected via hasCSSOnlyChanges and injected without full recompile
- ✅ **Step 7 — Smarter EDIT vs FILE selection**: System prompt directive instructs AI to use ===EDIT: hunks for <20% changes
- ✅ **Step 12 — Preview navigation state preservation**: Router path saved/restored across HMR reloads via history.replaceState

### Next Priority
- Step 4 — Compile progress accuracy
- Step 13 — Asset loading resilience
- Step 14 — Build time telemetry dashboard
- Step 15 — Keyboard-first workflow
- Step 16 — Mobile preview accuracy
- Step 17 — File tree performance
- Step 19 — Preview hosting reliability
- Step 20 — Error telemetry and alerting

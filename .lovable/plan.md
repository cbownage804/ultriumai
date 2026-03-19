

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

### Next Priority
- Step 3 — Compile result caching
- Step 4 — Compile progress accuracy
- Step 5 — Parallel CSS hot-reload verification
- Step 7 — Smarter EDIT vs FILE selection
- Step 12 — Preview navigation state preservation
- Step 13 — Asset loading resilience
- Step 14 — Build time telemetry dashboard
- Step 15 — Keyboard-first workflow
- Step 16 — Mobile preview accuracy
- Step 17 — File tree performance
- Step 19 — Preview hosting reliability
- Step 20 — Error telemetry and alerting



## Plan: Fix App Builder Preview Reliability

Three files, six targeted edits. No changes to site shell.

---

### Task 1: CompilationBridge hardening

**File: `src/components/ai-builder/CompilationBridge.tsx`**

**1A) Increase timeouts (lines 11-12)**
```
COMPILE_TIMEOUT_MS = 40_000
COMPILE_SAFETY_TIMEOUT_MS = 50_000
```

**1B) Add VALIDATING_FALLBACK_HTML (after line 41, after ERROR_FALLBACK_HTML)**

New constant with spinner + "Validating generated code…" message per the user's spec.

**1C) Fix validation gate (lines 290-311)**

Current code at line 306-309 sets `ERROR_FALLBACK_HTML` unconditionally when gated. Replace with:
```typescript
window.postMessage({ type: '__BUILD_GATED__', ... }, '*');
onCompilingChangeRef.current?.(false);
compilationInFlightRef.current = false;

if (stableHTMLRef.current) {
  // Preserve LKG — don't overwrite
  return;
}
// No LKG: show validating placeholder (never leave stableHTML null)
setStableHTML(VALIDATING_FALLBACK_HTML);
return;
```

**1D) Add timing logs (lines 319, 346-348, 322-334, 384, 394)**

Add `performance.now()` timestamps at:
- Compile start (line 319): `const t0 = performance.now(); console.info('[CompilationBridge] compile start', { runId: thisRunId, t0 });`
- After `runCompile()` resolves (line 348): `console.info('[CompilationBridge] compile resolved', { runId: thisRunId, ms: Math.round(performance.now() - t0) });`
- When `setStableHTML` is called (line 384): `console.info('[CompilationBridge] setStableHTML applied', { runId: thisRunId, ms: Math.round(performance.now() - t0) });`
- When safety timeout fires (line 324): `console.warn('[CompilationBridge] safety timeout', { runId: thisRunId, ms: Math.round(performance.now() - t0) });`

Note: `t0` needs to be declared outside the safety timeout. Will use a ref or declare `t0` at the scope where `thisRunId` is declared (line 315), which is the same `setTimeout` callback scope — both the safety timeout and the `try` block share this scope, so `t0` is accessible.

---

### Task 2: Workspace — guard forceCompile safety nets

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

**2A) Guard 20s safety net (line 476)**
```diff
- if (!stableHTMLRef.current) {
+ if (!stableHTMLRef.current && !pendingValidationFixRef.current) {
```

**2B) Guard 15s safety net (line 2544)**
```diff
- if (!stableHTMLRef.current && project.files.length > 0) {
+ if (!stableHTMLRef.current && project.files.length > 0 && !pendingValidationFixRef.current) {
```

---

### Task 3: Workspace — auto-fix watchdog

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

In the pending validation fix effect (line 1917-1933), add a 25s watchdog. When `pendingValidationFixRef.current` is set (line 512), start a timeout:

```typescript
// Inside handleBgComplete, right after line 515:
const watchdog = setTimeout(() => {
  if (pendingValidationFixRef.current) {
    console.warn('[Workspace] Auto-fix watchdog: 25s elapsed, clearing pending fix');
    pendingValidationFixRef.current = null;
    forceCompileRef.current?.();
  }
}, 25_000);
```

The watchdog is fire-and-forget (no cleanup needed — it only reads/writes refs). It runs once and either finds the ref already cleared (no-op) or clears it and forces one compile.

---

### Task 4: Preview panel — guard empty srcdoc

**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

In the effect at line 507-517 that sets `iframeRef.current.srcdoc`, add early return:

```diff
  useEffect(() => {
+   if (!html) return;
    setErrors([]); setCurrentUrl('/'); ...
```

This ensures the skeleton/placeholder renders when `html` is null instead of a blank iframe.

---

### Summary

| Edit | File | Lines | Effect |
|------|------|-------|--------|
| Timeouts 40s/50s | CompilationBridge | 11-12 | No more outer timeout racing internal chain |
| VALIDATING_FALLBACK_HTML | CompilationBridge | after 41 | Friendly placeholder during auto-fix |
| Gate preserves LKG | CompilationBridge | 290-311 | No blank preview during syntax fix |
| Timing logs | CompilationBridge | 315-395 | Diagnostic visibility |
| Guard forceCompile ×2 | Workspace | 476, 2544 | No forceCompile loop during auto-fix |
| Watchdog 25s | Workspace | near 515 | No indefinite "Validating…" state |
| Guard empty srcdoc | PreviewPanel | 507 | No blank iframe flash |




## Plan: Gate Loop Fix — Job-ID Guard + Observability + Image Dual Field

**Scope**: Only `AIAppBuilderWorkspace.tsx`, `CompilationBridge.tsx`, `image-generation/index.ts`. No `App.tsx`, `main.tsx`, `index.html`.

### Confirmed checks
- `handleBgComplete(job: BackgroundJob)` — uses `job.id` ✅
- `bg-job-started` event uses `detail?.jobId` (line 646) ✅
- Compile effect depends on `forceCompileTrigger` (line 436) — `setForceCompileTrigger(c => c + 1)` will retrigger ✅

---

### Edit 1 — `AIAppBuilderWorkspace.tsx`

**A.** Add 3 refs at line 1907, after `autoFixInFlightRef`:
```typescript
const validationFixInFlightRef = useRef(false);
const validationFixJobIdRef = useRef<string | null>(null);
const awaitingValidationFixJobStartRef = useRef(false);
```

**B.** Clear on generation reset — line 1912, after `autoFixInFlightRef.current = false`:
```typescript
validationFixInFlightRef.current = false;
validationFixJobIdRef.current = null;
awaitingValidationFixJobStartRef.current = false;
```

**C.** In pending-validation-fix effect (line 1937), immediately before `sendMessage(...)`:
```typescript
validationFixInFlightRef.current = true;
validationFixJobIdRef.current = null;
awaitingValidationFixJobStartRef.current = true;
```

**D.** In `bg-job-started` handler (line 648), after `backgroundGen.startWatching`, add:
```typescript
if (awaitingValidationFixJobStartRef.current && jobId) {
  validationFixJobIdRef.current = jobId;
  awaitingValidationFixJobStartRef.current = false;
  console.info('[Workspace] Captured validation fix jobId:', jobId);
}
```

**E.** In `handleBgComplete` at line 470, after "Files merged" log, before the 20s setTimeout:
```typescript
if (validationFixInFlightRef.current && validationFixJobIdRef.current === job.id) {
  console.info('[handleBgComplete] Auto-fix cycle completed — triggering compile', {
    jobId: job.id,
    captured: validationFixJobIdRef.current,
  });
  validationFixInFlightRef.current = false;
  validationFixJobIdRef.current = null;
  awaitingValidationFixJobStartRef.current = false;
  pendingValidationFixRef.current = null;
  setTimeout(() => forceCompileRef.current?.(), 300);
}
```

**F.** 20s safety net (line 476) — add `&& !validationFixInFlightRef.current`:
```typescript
if (!stableHTMLRef.current && !pendingValidationFixRef.current && !validationFixInFlightRef.current) {
```

**G.** 15s safety net (line 2553) — add `&& !validationFixInFlightRef.current`:
```typescript
if (!stableHTMLRef.current && project.files.length > 0 && !pendingValidationFixRef.current && !validationFixInFlightRef.current) {
```

**H.** 25s watchdog (line 518-521) — clear all 3 refs alongside existing clears:
```typescript
if (pendingValidationFixRef.current) {
  console.warn('[Workspace] Auto-fix watchdog: 25s elapsed, clearing pending fix');
  pendingValidationFixRef.current = null;
  validationFixInFlightRef.current = false;
  validationFixJobIdRef.current = null;
  awaitingValidationFixJobStartRef.current = false;
  forceCompileRef.current?.();
}
```

---

### Edit 2 — `CompilationBridge.tsx`

**A.** Add ref near line 98 (after `prevDigestRef`):
```typescript
const forceCompileRequestedRef = useRef(false);
```

**B.** Replace gate log at line 299 with actionable error details:
```typescript
console.warn('[CompilationBridge] VALIDATION GATE: skipping compile', {
  errorCount: syntaxErrors.length,
  errors: syntaxErrors.slice(0, 3).map(e => ({ file: e.file, message: e.message })),
});
```

**C.** Inside `forceCompile` callback (line 441), before `compileRunIdRef.current++`:
```typescript
forceCompileRequestedRef.current = true;
```

**D.** At line 331, before `compilationInFlightRef.current = true`, add trigger-reason log:
```typescript
const trigger = forceCompileRequestedRef.current ? 'forceCompile' : 'filesDigest';
forceCompileRequestedRef.current = false;
console.info('[CompilationBridge] Starting compile', {
  runId: thisRunId,
  trigger,
  fileCount: filesRef.current.length,
});
```

---

### Edit 3 — `image-generation/index.ts`

Add `imageUrl: FALLBACK_PNG` alongside `image: FALLBACK_PNG` in:
- 429 branch (line 49)
- 402 branch (line 55)
- no-image branch (line 72)
- catch branch (line 96)

Add `imageUrl: imageUrl` in success branch (line 88).

---

### Edit 4 — Deploy `image-generation` edge function.


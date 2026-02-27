

## Plan: Transactional Build + Bounded Repair Reliability Layer

**Scope**: `AIAppBuilderWorkspace.tsx`, `BuilderPreviewPanel.tsx`, `CompilationBridge.tsx` (observability only). No App.tsx/main.tsx/routing.

---

### Edit 1 — `AIAppBuilderWorkspace.tsx`

**A. Add refs/state** at line 301, after `pendingValidationFixRef`:

```typescript
const pendingFilesRef = useRef<ProjectFile[] | null>(null);
const lastKnownGoodFilesRef = useRef<ProjectFile[]>([]);
const repairAttemptRef = useRef(0);
const repairInFlightRef = useRef(false);
const repairJobIdRef = useRef<string | null>(null);
const awaitingRepairJobStartRef = useRef(false);
const [repairFailed, setRepairFailed] = useState(false);
const [repairErrors, setRepairErrors] = useState<{file: string; message: string}[]>([]);
```

**B. Add repair-job early-return branch in `handleBgComplete`** — at line 470, BEFORE the existing `validationFixInFlightRef` block and BEFORE the unconditional `setFiles(mergedFiles)` at line 436. This means we insert this block right after `mergedFiles` is fully constructed (after video marker resolution at ~line 432) but BEFORE any commit/persistence/tabs logic:

```typescript
// ── Transactional: repair job completion (job-id guarded) ──
if (repairInFlightRef.current && repairJobIdRef.current === job.id) {
  repairInFlightRef.current = false;
  repairJobIdRef.current = null;
  awaitingRepairJobStartRef.current = false;
  pendingFilesRef.current = mergedFiles;
  
  const revalidation = outputValidationRef.current.validate(mergedFiles);
  const errors = revalidation.issues.filter(i => i.severity === 'error');
  
  if (errors.length === 0) {
    // COMMIT repaired files
    setFiles(mergedFiles);
    pendingFilesRef.current = null;
    setRepairFailed(false);
    setRepairErrors([]);
    latestFilesRef.current = mergedFiles;
    saveDraftImmediateRef.current(project.name, mergedFiles, latestMessagesRef.current);
    console.info('[handleBgComplete] Repair succeeded — committed');
    setTimeout(() => forceCompileRef.current?.(), 200);
  } else {
    const errorSummary = errors.map(e => `${e.file}: ${e.message}`).join('\n');
    pendingValidationFixRef.current = { errorSummary, files: mergedFiles };
  }
  
  setIsGeneratingOverride(false);
  return; // Do NOT run normal merge logic
}
```

**C. Replace the unconditional `setFiles(mergedFiles)` at line 436 with transactional staging.** Replace lines 436–540 (from `setFiles(mergedFiles)` through the end of the validation block) with:

```typescript
// ── Transactional merge: snapshot LKG, stage, validate before commit ──
lastKnownGoodFilesRef.current = [...project.files];
pendingFilesRef.current = mergedFiles;
repairAttemptRef.current = 0;
setRepairFailed(false);
setRepairErrors([]);

const validationResult = outputValidationRef.current.validate(mergedFiles);
const valErrors = validationResult.issues.filter(i => i.severity === 'error');

if (valErrors.length === 0) {
  // COMMIT — validation passed
  setFiles(mergedFiles);
  pendingFilesRef.current = null;
  
  // Normal merge bookkeeping (tabs, persistence, snapshots, etc.)
  const changedPaths = [...parsedFiles.map(f => f.path), ...edits.map(e => e.path)];
  if (changedPaths.length > 0) {
    const mainFile = changedPaths.find(p => /App\.(tsx|jsx)$/.test(p)) || changedPaths[0];
    for (const p of changedPaths) { setActiveFileRef.current(p); }
    if (mainFile) setActiveFileRef.current(mainFile);
  }
  latestFilesRef.current = mergedFiles;
  saveDraftImmediateRef.current(project.name, mergedFiles, latestMessagesRef.current);
  
  // Self-contained HTML shortcut
  const hasReactFiles = mergedFiles.some(f => /\.(tsx|jsx)$/.test(f.path));
  const newIndexFile = parsedFiles.find(f => f.path === 'index.html');
  const editedIndex = edits.some(e => e.path === 'index.html');
  const indexFile = newIndexFile || (editedIndex ? mergedFiles.find(f => f.path === 'index.html') : null);
  const hasLocalModuleScripts = /src=["']\.?\/(?:src|main|app|index)\b/i.test(indexFile?.content || '');
  if (indexFile && !hasReactFiles && !hasLocalModuleScripts &&
      indexFile.content.includes('<!DOCTYPE html') &&
      indexFile.content.includes('</html>')) {
    console.info('[handleBgComplete] Self-contained index.html detected — setting preview directly');
    stableHTMLRef.current = indexFile.content;
    setStableHTML(indexFile.content);
    setPreviewRefreshKey(k => k + 1);
  }

  console.info('[handleBgComplete] Files merged & committed (%d files)', mergedFiles.length);
  setTimeout(() => forceCompileRef.current?.(), 200);

  // Safety net: if CompilationBridge hasn't produced HTML after 20s
  setTimeout(() => {
    if (!stableHTMLRef.current && !pendingValidationFixRef.current && !validationFixInFlightRef.current && !repairInFlightRef.current && !awaitingRepairJobStartRef.current) {
      console.warn('[handleBgComplete] Safety net: stableHTML still null 20s after merge — forcing compile');
      forceCompileRef.current?.();
    }
  }, 20_000);

  // Auto-switch to preview
  if (rightTabRef.current !== 'preview' && rightTabRef.current !== 'split') {
    setRightTabRef.current('preview');
  }
  if (isMobileRef.current) { setMobileTabRef.current('preview'); }

  // Post-build snapshot
  const totalChanges = parsedFiles.length + edits.length;
  addSnapshotRef.current(
    `Build: ${totalChanges} files${edits.length ? ` (${edits.length} patched)` : ''}`,
    mergedFiles, 'ai-generation'
  );
  dedupeToast('success', `Build complete — ${totalChanges} files updated`, { duration: 5000 });
} else {
  // DO NOT COMMIT — stage for repair
  console.warn('[handleBgComplete] Validation errors in generated output — staging for repair', valErrors.length);
  const errorSummary = valErrors.map(e => `${e.file}: ${e.message}`).join('\n');
  pendingValidationFixRef.current = { errorSummary, files: mergedFiles };
  
  // Auto-fix watchdog: clear pending state after 25s
  setTimeout(() => {
    if (pendingValidationFixRef.current) {
      console.warn('[Workspace] Auto-fix watchdog: 25s elapsed, clearing pending fix');
      pendingValidationFixRef.current = null;
      validationFixInFlightRef.current = false;
      validationFixJobIdRef.current = null;
      awaitingValidationFixJobStartRef.current = false;
      repairInFlightRef.current = false;
      repairJobIdRef.current = null;
      awaitingRepairJobStartRef.current = false;
      repairAttemptRef.current = 0;
      pendingFilesRef.current = null;
      forceCompileRef.current?.();
    }
  }, 25_000);
  
  // Still switch to preview and release generating state
  if (rightTabRef.current !== 'preview' && rightTabRef.current !== 'split') {
    setRightTabRef.current('preview');
  }
  if (isMobileRef.current) { setMobileTabRef.current('preview'); }
  dedupeToast('info', 'Validating generated code — auto-repair in progress…', { duration: 3000 });
}
```

**D. Capture repair jobId in bg-job-started** — at line 668, after the existing `validationFix` capture:

```typescript
if (awaitingRepairJobStartRef.current && jobId) {
  repairJobIdRef.current = jobId;
  awaitingRepairJobStartRef.current = false;
  console.info('[Workspace] Captured repair jobId:', jobId);
}
```

**E. Replace pending-validation-fix effect** (lines 1950–1970) with bounded repair pipeline:

```typescript
useEffect(() => {
  if (!isGenerating && !isCompiling && pendingValidationFixRef.current && !repairInFlightRef.current) {
    const { errorSummary, files } = pendingValidationFixRef.current;
    const attempt = repairAttemptRef.current + 1;
    
    if (attempt > 2) {
      // Terminal — repair exhausted
      pendingValidationFixRef.current = null;
      setRepairFailed(true);
      setRepairErrors(
        errorSummary.split('\n').slice(0, 3).map(line => {
          const colonIdx = line.indexOf(': ');
          return colonIdx >= 0
            ? { file: line.slice(0, colonIdx), message: line.slice(colonIdx + 2) }
            : { file: 'unknown', message: line };
        })
      );
      console.warn('[Workspace] Repair exhausted after 2 attempts — showing RepairFailed panel');
      return;
    }
    
    repairAttemptRef.current = attempt;
    pendingValidationFixRef.current = null;
    
    const timer = setTimeout(() => {
      const stricterPrompt = attempt === 2
        ? '\n\nSTRICTER RULES (attempt 2/2):\n- Replace ALL inline SVG with lucide-react icon imports\n- Wrap ALL JSX returns in parentheses\n- Ensure ALL tags are self-closing where appropriate\n- Remove any dangling expressions or invalid JSX'
        : '';
      
      console.info(`[Workspace] Repair attempt ${attempt}/2 for validation errors`);
      const diagCtx = buildErrorDiagnosisContext(
        { message: `Post-build validation failed:\n${errorSummary}${stricterPrompt}` },
        files, undefined, undefined,
      );
      
      repairInFlightRef.current = true;
      repairJobIdRef.current = null;
      awaitingRepairJobStartRef.current = true;
      sendMessage(diagCtx, files, supabaseConfig, stripeConfig, serviceKeys, null, selectedModel, undefined, true);
    }, 1200);
    return () => clearTimeout(timer);
  }
}, [isGenerating, isCompiling, sendMessage, supabaseConfig, stripeConfig, serviceKeys, selectedModel]);
```

**F. Update 15s safety net** (line 2582) — add `&& !repairInFlightRef.current && !awaitingRepairJobStartRef.current`:

```typescript
if (!stableHTMLRef.current && project.files.length > 0 && !pendingValidationFixRef.current && !validationFixInFlightRef.current && !repairInFlightRef.current && !awaitingRepairJobStartRef.current) {
```

**G. Clear repair refs on generation reset** (line 1935, after existing `awaitingValidationFixJobStartRef.current = false`):

```typescript
repairInFlightRef.current = false;
repairJobIdRef.current = null;
awaitingRepairJobStartRef.current = false;
repairAttemptRef.current = 0;
pendingFilesRef.current = null;
```

**H. Add callbacks** (after `handleSmartFixError` around line 1917):

```typescript
const handleRetryRepair = useCallback(() => {
  repairAttemptRef.current = 0;
  setRepairFailed(false);
  setRepairErrors([]);
  if (pendingFilesRef.current) {
    const validation = outputValidationRef.current.validate(pendingFilesRef.current);
    const errors = validation.issues.filter(i => i.severity === 'error');
    if (errors.length > 0) {
      const errorSummary = errors.map(e => `${e.file}: ${e.message}`).join('\n');
      pendingValidationFixRef.current = { errorSummary, files: pendingFilesRef.current };
    }
  }
}, []);

const handleDiscardChanges = useCallback(() => {
  setRepairFailed(false);
  setRepairErrors([]);
  pendingFilesRef.current = null;
  repairAttemptRef.current = 0;
  repairInFlightRef.current = false;
  repairJobIdRef.current = null;
  awaitingRepairJobStartRef.current = false;
  if (lastKnownGoodFilesRef.current.length > 0) {
    setFiles(lastKnownGoodFilesRef.current);
  }
  dedupeToast('info', 'Changes discarded — reverted to last working version');
}, [setFiles]);
```

**I. Pass new props to all 4 `<BuilderPreviewPanel>` usages** (lines 2817, 3187, 3204, and any others) — append:

```
repairFailed={repairFailed} repairErrors={repairErrors} onRetryRepair={handleRetryRepair} onDiscardChanges={handleDiscardChanges}
```

---

### Edit 2 — `BuilderPreviewPanel.tsx`

**A. Add props** to `BuilderPreviewPanelProps` (line 25, after `refreshKey`):

```typescript
repairFailed?: boolean;
repairErrors?: { file: string; message: string }[];
onRetryRepair?: () => void;
onDiscardChanges?: () => void;
```

**B. Destructure** in function signature (line 59) — add `, repairFailed, repairErrors, onRetryRepair, onDiscardChanges`.

**C. Add CSP/analytics noise filter** in error handler (line 470, before `const isHostDevError`):

```typescript
const isCSPNoise = /Content Security Policy|connect-src|report-only|__csp_report/i.test(msg);
const isAnalyticsNoise = /google-analytics|googletagmanager|gtag|fbevents|hotjar/i.test(msg);
if (isCSPNoise || isAnalyticsNoise) return;
```

**D. Render RepairFailed overlay** — insert at line 811, after the closing `</div>` of the preview area but before the error overlay at line 813:

```tsx
{repairFailed && (
  <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/60 backdrop-blur-sm">
    <div className="bg-[#1a1a2e] border border-red-500/30 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
        <h3 className="text-base font-semibold text-red-300">Repair Failed</h3>
      </div>
      <p className="text-sm text-white/60 mb-4">
        We couldn't automatically repair the generated code after 2 attempts.
      </p>
      {repairErrors && repairErrors.length > 0 && (
        <div className="bg-black/40 rounded-lg p-3 mb-4 space-y-1.5 max-h-32 overflow-y-auto">
          {repairErrors.slice(0, 3).map((err, i) => (
            <div key={i} className="text-xs">
              <span className="text-red-400 font-mono">{err.file}</span>
              <span className="text-white/40 ml-1.5">{err.message}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button onClick={onRetryRepair} className="flex-1 px-3 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-medium transition-colors">
          Retry repair
        </button>
        <button onClick={onDiscardChanges} className="flex-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/70 text-xs font-medium transition-colors">
          Discard changes
        </button>
      </div>
    </div>
  </div>
)}
```

Note: The outer `<div>` of the preview area (line 766) already has `relative` positioning, so `absolute inset-0` works correctly to layer above the iframe.

---

### Edit 3 — `CompilationBridge.tsx`

No structural changes. Confirm existing observability logs are in place:
- Line 300: `VALIDATION GATE` log with `errorCount` + first errors ✅
- Line 337: `Starting compile` with trigger + runId ✅
- Compile success log with `htmlLength` + `hasDoctype` (already present in the compile success branch) ✅

No edits needed.


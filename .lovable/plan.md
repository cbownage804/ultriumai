

## Plan: Add compile run-ID guard and early validation gate

### Task 1: Compile run-ID guard in CompilationBridge

**File: `src/components/ai-builder/CompilationBridge.tsx`**

Add a monotonically incrementing `compileRunIdRef` to prevent stale compilations from applying their results:

- Add `const compileRunIdRef = useRef(0);` alongside `compilationInFlightRef` (line 131)
- At compile start (line 285, inside the debounce timer callback), increment: `const thisRunId = ++compileRunIdRef.current;`
- After `runCompile()` resolves (line 316), guard: `if (thisRunId !== compileRunIdRef.current) { console.info('[CompilationBridge] Stale compile run', thisRunId, '— discarding'); return; }`
- In the safety timeout (line 290-300), when it fires: set `compileRunIdRef.current++` to invalidate any in-flight promise, then apply `ERROR_FALLBACK_HTML` or keep LKG if `stableHTMLRef.current` exists
- In the generation-start reset effect (line 214-226), reset `compileRunIdRef.current = 0`
- In `forceCompile` (line 376-384), increment `compileRunIdRef.current++` to invalidate any in-flight run

This ensures only the **latest** compile run can call `setStableHTML`. Race conditions between timeout and late-arriving results are eliminated deterministically.

### Task 2: Early validation gate — skip compile if syntax errors

**File: `src/components/ai-builder/CompilationBridge.tsx`**

Add a validation check before entering the compile pipeline. Currently validation only runs post-generation in `handleBgComplete` (AIAppBuilderWorkspace.tsx:501) — but that happens **after** files are set, and CompilationBridge still attempts to compile broken files.

Changes:
- Import `useOutputValidation` at top of file
- Add `const { validate } = useOutputValidation();` in the component body (or accept it as a prop — prop is cleaner since AIAppBuilderWorkspace already instantiates it)
- **Prop approach**: Add `validateFiles?: (files: ProjectFile[]) => { isValid: boolean; issues: { severity: string; message: string; file: string }[] }` to `CompilationBridgeProps`
- In the debounce timer callback (line 280), **before** `compilationInFlightRef.current = true`:
  ```typescript
  // Early validation gate — don't waste compile resources on broken files
  const currentFiles = filesRef.current;
  if (props.validateFiles) {
    const vResult = props.validateFiles(currentFiles);
    const syntaxErrors = vResult.issues.filter(i => i.severity === 'error');
    if (syntaxErrors.length > 0) {
      console.warn('[CompilationBridge] VALIDATION GATE: skipping compile —', syntaxErrors.length, 'errors');
      window.postMessage({
        type: '__BUILD_GATED__',
        payload: {
          reason: 'syntax_errors',
          errors: syntaxErrors.map(e => `${e.file}: ${e.message}`),
        },
        source: 'compilation-bridge',
      }, '*');
      // Don't set isCompiling, don't run sandbox/edge/worker
      return;
    }
  }
  ```
- This posts `__BUILD_GATED__` which the existing auto-fix listener in AIAppBuilderWorkspace can handle — the `pendingValidationFixRef` mechanism already triggers auto-fix for syntax errors

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Pass `validateFiles={outputValidation.validate}` as a prop to `<CompilationBridge>` where it's rendered (search for `<CompilationBridge`)

### Summary

| Guard | What it prevents |
|-------|-----------------|
| `compileRunIdRef` | Stale compile results overwriting newer ones; timeout vs late result race |
| Early validation gate | Wasting 30s on sandbox/edge/worker for files with obvious syntax errors |

Two files edited. No new dependencies. Both guards are cheap (ref increment, regex-based validation) and fire before any network/worker calls.


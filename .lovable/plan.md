

# Fix: Browser Freeze After Generation — Async Compilation

## Problem

When generation completes (`isGenerating` turns false), two heavy synchronous computations run inside `useMemo` in `CompilationBridge.tsx`:

1. **`compiledForHosting`** (line 89): Calls `getCompiledHTML()` synchronously during render
2. **`liveCompiledHTML`** (line 114): Calls `compileReactProject()` synchronously during render

`compileReactProject` (771 lines in `useReactCompiler.ts`) performs regex-based TypeScript stripping, topological dependency sorting, and full transpilation of every file. For projects with 15-30+ files, this locks the main thread for multiple seconds, freezing the browser on the skeleton screen.

## Solution

Convert both `useMemo` computations to `useEffect` + `setTimeout` so the browser can render a frame before heavy work starts.

### Change 1: `CompilationBridge.tsx` — Async `compiledForHosting`

Replace the `useMemo` (lines 89-97) with `useEffect` + `useState`:

```text
Before:
  const compiledForHosting = useMemo(() => {
    if (isGenerating) return null;
    return getCompiledHTML(...);  // BLOCKS main thread
  }, [...]);

After:
  const [compiledForHosting, setCompiledForHosting] = useState<string | null>(null);
  useEffect(() => {
    if (isGenerating) { setCompiledForHosting(null); return; }
    if (files.length === 0) return;
    const timer = setTimeout(() => {
      try {
        const result = getCompiledHTML(...);
        setCompiledForHosting(result);
      } catch (e) {
        console.error('[compiledForHosting] crashed:', e);
        setCompiledForHosting(null);
      }
    }, 100);  // yield to browser first
    return () => clearTimeout(timer);
  }, [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, isGenerating]);
```

### Change 2: `CompilationBridge.tsx` — Async `liveCompiledHTML`

Replace the `useMemo` (lines 114-136) with `useEffect` + `useState`:

```text
Before:
  const liveCompiledHTML = useMemo(() => {
    if (isGenerating) return null;
    return compileReactProject(files, options);  // BLOCKS main thread
  }, [...]);

After:
  const [liveCompiledHTML, setLiveCompiledHTML] = useState<string | null>(null);
  useEffect(() => {
    if (isGenerating || files.length === 0 || stableHTMLRef.current) {
      setLiveCompiledHTML(null);
      return;
    }
    const timer = setTimeout(() => {
      try {
        if (isReactProject) {
          const result = compileReactProject(files, { supabaseConfig, stripeConfig, envVars });
          if (result.errors.length > 0) console.warn('[ReactCompiler] Warnings:', result.errors);
          setLiveCompiledHTML(result.html || null);
        } else {
          setLiveCompiledHTML(getCompiledHTML(...) || null);
        }
      } catch (e) {
        console.error('[ReactCompiler] crashed:', e);
        setLiveCompiledHTML(null);
      }
    }, 50);  // yield to browser first
    return () => clearTimeout(timer);
  }, [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, isReactProject, isGenerating]);
```

### Change 3: `CompilationBridge.tsx` — Add `onCompilingChange` prop

Add a new callback prop so the parent workspace can show "Compiling preview..." in the overlay:

- Add `onCompilingChange?: (compiling: boolean) => void` to `CompilationBridgeProps`
- Call `onCompilingChange(true)` before starting compilation in both effects
- Call `onCompilingChange(false)` when compilation finishes

### Change 4: `AIAppBuilderWorkspace.tsx` — Wire `isCompiling` state

Pass `setIsCompiling` (which already exists in the workspace) to `CompilationBridge` as the `onCompilingChange` callback. The `GeneratingOverlay` already accepts `isCompiling` and shows "Compiling preview..." when true.

### Change 5: Safety timeout (10 seconds)

Wrap each compilation in a `Promise.race` with a 10-second timeout. If compilation hangs, set the error fallback HTML and stop blocking.

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/CompilationBridge.tsx` | Replace both `useMemo` with async `useEffect` + `setTimeout`, add `onCompilingChange` prop |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Pass `setIsCompiling` to CompilationBridge |

## Expected Result

- Browser never freezes after generation ends
- User sees "Compiling preview..." overlay for 0.5-3 seconds while compilation runs
- The workspace UI (chat, file tree, buttons) remains interactive throughout
- If compilation takes over 10 seconds, an error fallback page appears instead of an infinite freeze



## Fix: The Preview Deadlock (The REAL Root Cause)

### Why every previous fix failed

All previous fixes (type stripping, Proxy fallbacks, CDN timeouts, per-chunk isolation) operate **inside the iframe HTML**. They're correct and will help once the iframe actually loads. But the iframe never loads because the **outer React app** has a deadlock that prevents the compiled HTML from ever reaching the iframe.

### The Deadlock (step by step)

Here's exactly what happens every time you generate an app:

```text
1. AI finishes generating files
   -> isGenerating = false

2. CompilationBridge starts compiling (line 146)
   -> isCompiling = true
   -> Preview shows: <CompilationProgress /> (or <SkeletonPreview />)

3. Compilation finishes, sets liveCompiledHTML
   -> isCompiling = false

4. Preview update effect (line 291) fires
   -> Calls setStableHTML(liveCompiledHTML)
   -> stableHTML is now set
   -> Preview shows: <iframe srcDoc={stableHTML} />

5. Iframe loads. CDN package fails or Babel error occurs.
   -> Iframe posts error via postMessage

6. handleAutoFixError fires
   -> Calls sendMessage("Auto-fix error: ...")
   -> isGenerating = true   <-- THIS IS THE PROBLEM

7. CompilationBridge line 111: "if isGenerating just turned on"
   -> setStableHTML(null)   <-- NUKES the working preview

8. CompilationBridge line 136: "if isGenerating"
   -> setLiveCompiledHTML(null)   <-- KILLS compiled HTML

9. Preview panel line 451: html is null
   -> Shows <SkeletonPreview /> instead of iframe

10. Auto-fix generates new code, isGenerating = false
    -> Back to step 2, but now another error occurs
    -> LOOP repeats until fix attempts exhausted
    -> Final state: stableHTML = null, skeleton forever
```

The skeleton you see is NOT from the first generation -- it's from step 7 where the auto-fix loop nukes `stableHTML`.

### The Fix (3 targeted changes)

**Change 1: Don't reset stableHTML during auto-fix** (`CompilationBridge.tsx`, lines 109-115)

Currently, stableHTML is reset to null whenever `isGenerating` transitions to true. This makes sense for fresh user messages (you want a fresh preview) but is catastrophic during auto-fix (it destroys the existing preview).

Add an `isAutoFix` prop to CompilationBridge. When it's an auto-fix generation, skip the stableHTML reset so the previous preview stays visible while the fix runs.

Alternatively (simpler): just **never** null out stableHTML when transitioning to generating. Instead, let the new compiled result **replace** it when ready. The user sees the old preview (possibly with errors) while the fix runs, which is far better than a blank skeleton.

```typescript
// BEFORE (line 110-114):
useEffect(() => {
  if (isGenerating && !prevIsGeneratingForReset.current) {
    setStableHTML(null);  // <-- DESTROYS preview on every generation
  }
  prevIsGeneratingForReset.current = isGenerating;
}, [isGenerating, setStableHTML]);

// AFTER:
useEffect(() => {
  if (isGenerating && !prevIsGeneratingForReset.current) {
    // Only reset if there's no existing preview (fresh generation, not auto-fix)
    // If stableHTML already exists, keep showing it while fix runs
    if (!stableHTMLRef.current) {
      setStableHTML(null);
    }
  }
  prevIsGeneratingForReset.current = isGenerating;
}, [isGenerating, setStableHTML]);
```

**Change 2: Don't null liveCompiledHTML during generation** (`CompilationBridge.tsx`, line 136)

Currently: `if (isGenerating) { setLiveCompiledHTML(null); return; }` -- this prevents recompilation during generation AND destroys the existing compiled HTML.

Fix: Only skip starting a new compilation during generation, but don't null out the existing result.

```typescript
// BEFORE (line 135-139):
useEffect(() => {
  if (isGenerating || filesRef.current.length === 0 || stableHTMLRef.current) {
    setLiveCompiledHTML(null);
    return;
  }

// AFTER:
useEffect(() => {
  if (isGenerating || filesRef.current.length === 0 || stableHTMLRef.current) {
    // Don't null out liveCompiledHTML if we already have it -- 
    // prevents flashing skeleton during auto-fix
    return;
  }
```

**Change 3: Remove compilation lock that prevents recompilation after auto-fix** (`CompilationBridge.tsx`, line 142)

The `compilationLockRef` prevents recompilation within the same generation cycle. But after an auto-fix completes (new files), we NEED to recompile. Reset the lock when `filesDigest` changes.

```typescript
// BEFORE (lines 122-128):
useEffect(() => {
  if (isGenerating) {
    compilationAttemptedRef.current = false;
    compilationLockRef.current = false;
  }
}, [isGenerating]);

// AFTER:
useEffect(() => {
  if (isGenerating) {
    compilationAttemptedRef.current = false;
    compilationLockRef.current = false;
  }
}, [isGenerating, filesDigest]);  // Also reset when files change (auto-fix produced new code)
```

### Files to Edit

1. **`src/components/ai-builder/CompilationBridge.tsx`** (3 targeted changes):
   - Line 111: Don't null stableHTML if it already exists (keep showing old preview during fix)
   - Line 137: Remove `setLiveCompiledHTML(null)` to prevent destroying compiled result
   - Line 127: Add `filesDigest` dependency to reset compilation lock after auto-fix

### Why This Actually Fixes It

- Step 7 above no longer happens: stableHTML is preserved during auto-fix
- The iframe stays visible showing the previous preview while the fix runs
- When the fix produces new files and `isGenerating` goes false, recompilation runs normally
- The new compiled HTML replaces the old one in the iframe
- No more skeleton deadlock

### What About Fresh Generations?

For a brand new generation (user types a prompt from scratch), `stableHTMLRef.current` will be `null` (it was never set). The `if (!stableHTMLRef.current)` check in Change 1 means it WILL reset to null for fresh generations, correctly showing the skeleton/generating overlay for the initial build.

### Risk Assessment

- Zero risk to fresh generations (stableHTML is null, so the reset fires normally)
- Auto-fix preserves existing preview instead of showing skeleton -- strictly better UX
- The compilation lock reset on `filesDigest` change ensures recompilation fires after fixes
- All previous iframe-level fixes (Proxy fallbacks, CDN timeouts, per-chunk isolation) will now actually take effect since the iframe will be rendered

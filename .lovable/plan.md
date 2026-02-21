

## Fix: Prevent Preview Freeze by Stabilizing All Compilation Effects

### Problem
The preview freezes ("This page isn't responding") because three `useEffect` hooks inside `CompilationBridge.tsx` still depend on the raw `files` array, which creates a new reference on every render. This causes:
1. The `compiledForHosting` effect to re-run heavy compilation repeatedly
2. The preview update effect to re-fire constantly
3. The hot-patch effect to loop indefinitely

Only the `liveCompiledHTML` effect was previously fixed to use `filesDigest` -- the other three were missed.

### Fix (single file: `CompilationBridge.tsx`)

1. **Store `files` in a ref** so effects can access the latest file data without depending on the array reference:
   - Add `const filesRef = useRef(files); filesRef.current = files;`
   
2. **Replace `files` with `filesDigest`** in the dependency arrays of all three remaining effects:
   - `compiledForHosting` effect (line 226): change `[files, ...]` to `[filesDigest, ...]`
   - Preview update effect (line 257): change `[..., files, ...]` to `[..., filesDigest, ...]`
   - Hot-patch effect (line 264): change `[files, ...]` to `[filesDigest, ...]`
   
3. **Use `filesRef.current`** inside those effect bodies wherever `files` is read (e.g., passing to `getCompiledHTMLRef.current(...)` or `liveSync.applyPatches(...)`)

4. **Add a lock for `compiledForHosting`** similar to `compilationLockRef` to prevent the hosting compilation from running more than once per cycle

5. **Fix `detectReactProject` memo** (line 86): change dependency from `[files]` to `[filesDigest]` and use `filesRef.current` inside, since it also re-runs on every files reference change

### Technical Details

```text
Current deps (BROKEN - fires every render):
  compiledForHosting:  [files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, isGenerating, liveCompiledHTML]
  preview update:      [isGenerating, liveCompiledHTML, files, stableHTML, setStableHTML]
  hot-patch:           [files, isGenerating, stableHTML]

Fixed deps (stable - fires only on real changes):
  compiledForHosting:  [filesDigest, isGenerating, liveCompiledHTML]
  preview update:      [isGenerating, liveCompiledHTML, filesDigest, stableHTML, setStableHTML]
  hot-patch:           [filesDigest, isGenerating, stableHTML]
```

All config props (`supabaseConfig`, `stripeConfig`, `envVars`, etc.) will also be removed from the `compiledForHosting` dependency array since they are already accessed via refs and rarely change -- their inclusion was causing additional unnecessary re-fires.


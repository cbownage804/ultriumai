

## Fix: CompilationBridge Never Receives Generation Signal

### Root Cause

`CompilationBridge` receives `isGenerating={isGeneratingOverride}` (line 2326 in `AIAppBuilderWorkspace.tsx`), but `isGeneratingOverride` is **only set to `true` during background job recovery** (line 475). During normal generation, it stays `false` the entire time.

This means:
- The generation-ending effect in CompilationBridge (which watches for `isGenerating` transitioning from `true` to `false`) **never fires** because there is no transition
- The `compileNowRef.current()` function is **never scheduled**
- The main effect hits the early return added in the last fix (line 256: "deferring to compileNow for initial compilation") and **bails out**
- Result: no compilation ever happens, preview stays blank

This was broken by the combination of:
1. Previous fix that changed the prop from `isGenerating` (which correctly reflects generation state) to `isGeneratingOverride` (which doesn't)
2. The early return added to defer initial compilation to `compileNowRef` (which never gets called)

### Fix (2 changes)

#### 1. `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (line 2326)

Change the `isGenerating` prop to use the correct combined signal:

```typescript
// Before:
isGenerating={isGeneratingOverride}

// After:
isGenerating={isGenerating || isGeneratingOverride}
```

This ensures CompilationBridge sees `true` during normal generation (from `isGenerating` via useAIAppBuilder) AND during background job recovery (from `isGeneratingOverride`). The true-to-false transition will now fire correctly, triggering `compileNowRef`.

#### 2. `src/components/ai-builder/CompilationBridge.tsx` (lines 255-259)

Remove the early return that defers to `compileNowRef`, since it creates a deadlock when the generation-ending effect doesn't fire. Instead, let the main effect handle compilation as a fallback:

```typescript
// Remove these lines entirely:
// if (!stableHTMLRef.current && !compilationAttemptedRef.current && filesRef.current.length > 0) {
//   console.info('[CompilationBridge] Main effect: deferring to compileNow for initial compilation');
//   return;
// }
```

With both changes, the flow becomes:
1. Generation starts: `isGenerating` becomes `true`, CompilationBridge blocks
2. Generation ends: `isGenerating` becomes `false`
3. Generation-ending effect fires, schedules `compileNowRef.current()` in 200ms (primary path)
4. Main effect also fires but `compileNowRef` handles it first via the lock mechanism
5. Preview appears

### Why This Is Safe

- `compileNowRef` sets `compilationLockRef = true` before async work, preventing the main effect's debounced compilation from running concurrently
- If `compileNowRef` somehow fails to run, the main effect will handle compilation as a fallback (no more early return blocking it)
- The `isGenerating || isGeneratingOverride` pattern covers both normal and recovery flows


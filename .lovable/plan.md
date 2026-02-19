

# Fix Browser Freezing and Build Failures

## Root Cause Analysis

The browser freezes during builds because of a **cascade of expensive side effects** triggered every time a streamed file chunk arrives. Here's what happens on EVERY chunk during AI streaming:

1. `upsertFile()` updates `project.files` state
2. This triggers THREE separate auto-save effects simultaneously:
   - Cloud auto-save (`scheduleAutoSave`)
   - IndexedDB save (`idbPersistence.saveToIDB`)
   - localStorage save (`saveDraft`)
3. Even though `liveCompiledHTML` now correctly skips compilation during generation, the auto-saves serialize the entire file tree to JSON on every chunk -- for a large project this means megabytes of JSON.stringify per chunk
4. After generation ends, any "Failed to load" error still calls `forwardErrorToChat()` BEFORE hitting the guard, polluting the chat with error messages that confuse the next AI call
5. The auto-fix loop can still fire immediately after generation ends, sending another full AI request before the user even sees the result

## Plan (3 targeted changes, 1 file)

All changes are in `src/components/ai-builder/AIAppBuilderWorkspace.tsx`:

### 1. Skip ALL auto-saves during streaming

Guard the three auto-save `useEffect` blocks so they do nothing while `isGenerating` is true. Saves will fire once after generation completes (when `isGenerating` flips to false and `project.files` is finalized).

**Lines ~1147-1161** -- add `if (isGenerating) return;` at the top of each auto-save effect:

```typescript
// Auto-save (cloud)
useEffect(() => {
  if (isGenerating) return; // skip during streaming
  if (project.files.length > 0) scheduleAutoSave(...);
}, [project.files, ...deps, isGenerating]);

// Auto-save to IndexedDB
useEffect(() => {
  if (isGenerating) return;
  idbPersistence.saveToIDB(...);
}, [...deps, isGenerating]);

// Auto-save draft to localStorage
useEffect(() => {
  if (isGenerating) return;
  saveDraft(...);
}, [...deps, isGenerating]);
```

This eliminates the main source of main-thread blocking during streaming.

### 2. Move "Failed to load" guard BEFORE forwardErrorToChat

Currently in `handleAutoFixError` (line ~1435-1455), `forwardErrorToChat()` runs first, THEN the guard checks for "Failed to load". This means resource errors still pollute the chat and can confuse subsequent AI calls. Move the guard up:

```typescript
const handleAutoFixError = useCallback((error) => {
  // Skip resource load errors FIRST — don't even forward to chat
  if (error.message?.includes('Failed to load')) return;
  if (isGenerating) return;

  forwardErrorToChat({ ... });
  // ... rest of auto-fix logic
}, [...]);
```

### 3. Add post-generation cooldown for auto-fix

After generation ends, the preview compiles and renders. If any transient errors fire during initial render (e.g., images loading, fonts), the auto-fix loop grabs them immediately. Add a 3-second cooldown after `isGenerating` flips to false before allowing auto-fix:

```typescript
const generationEndedAt = useRef<number>(0);

useEffect(() => {
  if (!isGenerating) {
    generationEndedAt.current = Date.now();
  }
}, [isGenerating]);

// In handleAutoFixError:
if (Date.now() - generationEndedAt.current < 3000) return; // cooldown
```

## Files to Change

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | 1. Guard 3 auto-save effects with `isGenerating` check 2. Reorder guards in `handleAutoFixError` 3. Add 3s post-generation cooldown for auto-fix |

## Expected Result

- **No more browser freezes**: Auto-saves (the heaviest I/O) are completely skipped during streaming
- **No more phantom errors in chat**: "Failed to load" errors are silenced before reaching the chat
- **No more wasted auto-fix credits**: 3-second cooldown prevents transient render errors from triggering fix loops
- **Builds complete reliably**: The only work happening during streaming is lightweight state updates for the code editor


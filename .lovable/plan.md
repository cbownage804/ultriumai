

## Fix: Infinite Auto-Fix Loop and Permanent Skeleton Preview

### Problem Diagnosis

From the screenshots, the issue flow is:

1. User asks to generate a landing page
2. AI generates App.tsx + index.html (2 files, "Preview ready")
3. Compilation runs but the generated code has 2 errors:
   - **lucide-react default import** ("React received 'undefined'" - the AI used `import LucideIcon from 'lucide-react'` instead of named imports)
   - **Vitest specifier** (a test file or utility referencing `vitest` gets bundled into the browser preview)
4. These errors cause the preview iframe to crash (blank white screen)
5. The auto-fix detects errors and triggers a fix generation
6. The fix generation produces new files, which get compiled, but the SAME errors reappear
7. This creates an infinite "Fixing issues" loop consuming credits endlessly
8. Meanwhile the preview never renders because `compiledHTML` is always `null` or crashing

### Root Causes

**Issue 1: Auto-fix loop has no global circuit breaker.** The `useAutoFixLoop` tracks attempts per-error-message, but the fix often changes the error message slightly (e.g., different line number), resetting the counter. There's no global "stop after N total fix attempts across all errors" limit.

**Issue 2: The `handleAutoFixError` dependency array is stale.** It lists `isCompiling` but doesn't include it in the useCallback deps (line 1307), so the `isCompiling` check may use stale closure values.

**Issue 3: No cooldown between fix rounds.** After one fix attempt completes (generation + compilation), the preview immediately reports errors, which triggers another fix attempt. The 5-second `compilationEndedAt` cooldown should help but the auto-fix loop's own `baseDelayMs` is only 500ms with exponential backoff that maxes at 2s.

**Issue 4: The preview compiler doesn't filter out test files.** Files like `*.test.ts` or files importing `vitest` get transpiled into the preview bundle, causing runtime errors.

### Fix Plan

#### 1. Add global fix attempt cap to `handleAutoFixError`
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add a `totalFixAttemptsRef` that tracks ALL fix attempts across all error messages. Cap at 3 total attempts per generation cycle. Reset when user sends a new message.

```typescript
const totalFixAttemptsRef = useRef(0);

// In handleAutoFixError:
if (totalFixAttemptsRef.current >= 3) {
  dedupeToast('error', 'Auto-fix limit reached. Try describing the issue differently.');
  return;
}
totalFixAttemptsRef.current++;
```

Reset in the generation start handler:
```typescript
totalFixAttemptsRef.current = 0;
```

#### 2. Fix stale closure in `handleAutoFixError`
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add `isCompiling` to the dependency array of `handleAutoFixError` useCallback (it's referenced in the body but missing from deps at line 1307).

#### 3. Filter test files from React compilation
**File: `src/hooks/useReactCompiler.ts`**

In `compileReactProject`, filter out files matching test patterns BEFORE transpilation:

```typescript
const reactFiles = files
  .filter(f => /\.(tsx?|jsx?)$/.test(f.path))
  .filter(f => !/\.(test|spec)\.(tsx?|jsx?)$/.test(f.path))
  .filter(f => !f.content.includes("from 'vitest'") && !f.content.includes('from "vitest"'));
```

This prevents the "Vitest specifier" error entirely.

#### 4. Increase post-compilation cooldown
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Increase the post-compilation cooldown from 5 seconds to 8 seconds. This gives the iframe more time to fully load CDN resources (React, Tailwind, etc.) before error detection kicks in, reducing false-positive "undefined" errors from race conditions.

#### 5. Suppress duplicate auto-fix triggers within the same compilation cycle
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

Add a flag `autoFixInFlightRef` that prevents new fix attempts while one is already in-flight (generation is happening from a previous auto-fix). Currently `isGenerating` should handle this, but the 500ms delay in `useAutoFixLoop` means the error fires before `isGenerating` flips to true.

```typescript
const autoFixInFlightRef = useRef(false);

// In handleAutoFixError:
if (autoFixInFlightRef.current) return;
autoFixInFlightRef.current = true;

// Reset when generation ends:
autoFixInFlightRef.current = false;
```

### Files to Edit

1. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** - Global fix cap, stale closure fix, cooldown increase, in-flight guard
2. **`src/hooks/useReactCompiler.ts`** - Filter test files from compilation

### Expected Impact

```
Before:
  Error detected --> auto-fix --> new error --> auto-fix --> infinite loop
  Credits consumed: unlimited
  Preview: permanently blank

After:
  Error detected --> auto-fix (attempt 1/3) --> same error --> auto-fix (2/3) --> still failing --> auto-fix (3/3) --> STOP
  Credits consumed: max 3 per generation
  Preview: shows error fallback after exhaustion, not blank skeleton
  Test files: excluded from compilation entirely
```


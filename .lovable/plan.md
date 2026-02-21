

## Fix: Await Module Registration — The Real Root Cause of Blank Previews

### Problem

Every transpiled file is wrapped in an **un-awaited async IIFE** (line 385 of `useReactCompiler.ts`):

```javascript
// Current (broken):
(async function() {
  let __pkg_lucide_react;
  try { __pkg_lucide_react = await import('lucide-react'); } catch(e) { ... }
  const { Star, Heart } = __pkg_lucide_react;
  // ... component code ...
  __modules['App.tsx'] = __modules['App.tsx'] || {};
  __modules['App.tsx'].default = App;
})();   // <-- fire-and-forget! Never awaited!
```

Because these IIFEs are not awaited, the execution flow is:

```text
1. File A async IIFE starts (not awaited) --> pending Promise
2. File B async IIFE starts (not awaited) --> pending Promise
3. Mount script runs IMMEDIATELY
4. __modules['App.tsx'] is undefined --> nothing renders --> blank screen
5. File A resolves (too late)
6. File B resolves (too late)
```

The `AsyncFunction` fix from the last edit made the **outer** wrapper support `await`, but the **inner** per-file wrappers still fire-and-forget. The `await` inside each file (for CDN imports) works within that file's scope, but the file's registration never completes before the mount script runs.

### The Fix

Add `await` before each file's async IIFE so modules register sequentially before the mount script runs.

**File: `src/hooks/useReactCompiler.ts`** (line 385)

```typescript
// Before (broken):
return `/* === ${file.path} === */\n(async function() {\n${code}\n${registration.join('\n')}\n})();`;

// After (fixed):
return `/* === ${file.path} === */\nawait (async function() {\n${code}\n${registration.join('\n')}\n})();`;
```

This single word (`await`) ensures each file fully resolves (including CDN imports) and registers its exports into `__modules` before the next file or the mount script runs.

### Why This Is the Actual Fix

All previous fixes were correct but insufficient:
- AsyncFunction constructor: allows `await` in the outer scope (correct, needed)
- try-catch CDN wrappers: prevents crash on CDN failure (correct, needed)
- NO_DEFAULT_EXPORT set: prevents undefined components (correct, needed)

But none of them matter if the module registrations never complete before mounting. This single missing `await` is why every template shows a blank screen.

### Expected Result

```text
Before:
  File IIFEs fire-and-forget --> mount script finds empty __modules --> blank screen

After:
  await File A IIFE --> __modules['utils.tsx'] registered
  await File B IIFE --> __modules['App.tsx'] registered  
  Mount script runs --> finds App component --> renders successfully
```

### Files to Edit

1. **`src/hooks/useReactCompiler.ts`** (line 385) -- Add `await` before the async IIFE


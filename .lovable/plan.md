

## Fix: Preview Never Loads — Critical Runtime Bug

### Root Cause

**Line 722 of `useReactCompiler.ts` kills every template.**

The transpiler converts all external package imports (lucide-react, framer-motion, etc.) into `await import('...')` expressions. These end up inside the code string that gets passed through:

```
var fn = new Function(transformed.code);  // <-- SYNCHRONOUS function
fn();                                       // <-- runs the code
```

`new Function()` creates a **synchronous** function. `await` is only valid inside `async` functions. So every time the preview tries to run code with `await import('lucide-react')`, it throws:

```
SyntaxError: await is only valid in async functions and the top level bodies of modules
```

This crashes silently inside the try-catch, sends a `__PREVIEW_ERROR__` message, and the preview stays blank forever. Every single template that uses lucide-react (all of them) hits this exact crash.

### The Fix

**Change `new Function()` to `new AsyncFunction()`** so `await import()` works inside the transpiled code.

```javascript
// Before (broken):
var fn = new Function(transformed.code);
fn();

// After (fixed):
var AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
var fn = new AsyncFunction(transformed.code);
await fn();
```

This is a 3-line change in the HTML template string at line 722-723 of `useReactCompiler.ts`. Since the outer wrapper is already `(async function() { ... })()`, the `await fn()` works naturally.

### Files to Edit

1. **`src/hooks/useReactCompiler.ts`** (lines 722-723) -- Replace `new Function` with `new AsyncFunction` and `await fn()`

### Why This Is the Only Fix Needed

- The `await import()` transpilation logic (Phase 85) is correct
- The try-catch wrapping is correct
- The CDN preloading is correct
- The import map is correct

The ONLY problem is that `new Function()` can't execute `await`. Changing to `AsyncFunction` makes all of the previous fixes actually work at runtime.

### Expected Impact

```
Before:
  Every template with external imports --> SyntaxError: await is only valid in async functions
  --> Preview shows blank white screen
  --> Auto-fix triggers but can never fix a runtime engine bug

After:
  AsyncFunction supports await --> await import('lucide-react') resolves via CDN
  --> Components render --> Preview shows the app
```


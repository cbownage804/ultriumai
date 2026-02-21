

## Fix: Enable Top-Level Await in Babel Transform

### The Problem

The previous fixes correctly added `await` before each file's async IIFE (line 385) and switched to `AsyncFunction` (line 722). However, there is one remaining blocker:

The transpiled code passes through `Babel.transform()` (line 718) before reaching `AsyncFunction`. Babel's default parsing mode is `sourceType: 'script'`, which does NOT allow top-level `await`. Babel throws a SyntaxError during parsing, before the code ever reaches the `AsyncFunction` runtime.

### The Fix

Add `sourceType: 'module'` to the Babel transform options. This tells Babel's parser that top-level `await` is valid syntax.

**File: `src/hooks/useReactCompiler.ts`** (line 718-720)

```typescript
// Before:
var transformed = Babel.transform(code, {
  presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
  filename: 'app.tsx',
});

// After:
var transformed = Babel.transform(code, {
  presets: ['react', ['typescript', { isTSX: true, allExtensions: true }]],
  filename: 'app.tsx',
  sourceType: 'module',
});
```

This is safe because:
- The transpiled chunks have already had all `import`/`export` statements stripped and replaced with `await import()` calls
- There are no remaining ES module statements for Babel to transform
- The only effect of `sourceType: 'module'` is enabling the parser to accept top-level `await`

### Technical Details

**File to edit:** `src/hooks/useReactCompiler.ts` (line 719)

Add `sourceType: 'module'` to the Babel.transform options object.

### Expected Result

```
Before:
  Code contains "await (async function() {...})()"
  --> Babel.transform (sourceType: 'script') --> SyntaxError: await is not allowed
  --> catch block shows error --> blank preview

After:
  Code contains "await (async function() {...})()"
  --> Babel.transform (sourceType: 'module') --> parses successfully
  --> AsyncFunction executes --> modules register sequentially --> preview renders
```


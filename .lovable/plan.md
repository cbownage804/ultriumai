

## Fix: Two Remaining Runtime Errors

### Issue 1: "Cannot create property '__compileTimer' on number"

In `CompilationBridge.tsx` line 193, `rafId` is the return value of `requestAnimationFrame()`, which is a plain number. The code tries to attach a property to it:
```js
(rafId as any).__compileTimer = compileTimer;
```
This is illegal in JavaScript -- you cannot set properties on primitive numbers.

**Fix**: Store `compileTimer` in a separate `let` variable declared alongside `rafId`, so cleanup can clear both independently.

```typescript
let compileTimerId: ReturnType<typeof setTimeout>;
// ...
const rafId = requestAnimationFrame(() => {
  compileTimerId = setTimeout(() => { ... }, 50);
});

return () => {
  cancelled = true;
  cancelAnimationFrame(rafId);
  clearTimeout(compileTimerId);
  clearTimeout(safetyTimeout);
};
```

### Issue 2: "Cannot access 'ReactDOM' before initialization"

In `useReactCompiler.ts` line 201, when the import is `import ReactDOM from 'react-dom'`, the compiler generates:
```js
const ReactDOM = ReactDOM;
```
This creates a Temporal Dead Zone -- the local `const` shadows the global `ReactDOM` before the right-hand side can read it.

**Fix**: Add the same guard used for React -- skip the declaration when the default import name matches the global:

```typescript
if (specifier === 'react-dom' || specifier === 'react-dom/client') {
  if (defaultImport && defaultImport !== 'ReactDOM') return `const ${defaultImport} = ReactDOM;`;
  if (namedImports) {
    const names = namedImports.split(',').map(n => n.trim().split(/\s+as\s+/));
    return names
      .filter(([orig, alias]) => {
        const target = (alias || orig).trim();
        return target !== orig.trim() || !['createRoot','hydrateRoot','render','hydrate'].includes(target);
      })
      .map(([orig, alias]) => `const ${(alias || orig).trim()} = ReactDOM.${orig.trim()};`)
      .join('\n');
  }
  return '';
}
```

This prevents `const createRoot = ReactDOM.createRoot;` when `createRoot` is already destructured from the global, and prevents `const ReactDOM = ReactDOM;` entirely.

### Files to Edit

1. **`src/components/ai-builder/CompilationBridge.tsx`** -- fix `__compileTimer` property assignment on number
2. **`src/hooks/useReactCompiler.ts`** -- fix ReactDOM TDZ, same pattern as the React fix


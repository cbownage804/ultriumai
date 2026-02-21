

## Fix: Handle `export default { ... }` (Object Literal Exports)

### Problem

The generated `tailwind.config.js` file contains:
```js
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  ...
}
```

The React compiler wraps all file code inside `(async function() { ... })()`, which means `export` statements are illegal. The compiler already transforms several `export default` patterns:
- `export default function Name` -- handled
- `export default function(` -- handled  
- `export default () =>` -- handled
- `export default Name` (identifier) -- handled

But it does NOT handle `export default {` (object literal), which is what `tailwind.config.js` uses. This leaves a raw `export default` inside the async wrapper, causing the syntax error.

### Fix (single file: `src/hooks/useReactCompiler.ts`)

Add one more regex replacement after the existing anonymous default export handlers (around line 289) to catch `export default {`:

```javascript
// export default { ... } → const __DefaultExport = { ... }
code = code.replace(
  /^export\s+default\s+(\{)/gm,
  'const __DefaultExport = $1'
);
```

This transforms `export default { content: [...] }` into `const __DefaultExport = { content: [...] }`, which is valid inside a function scope.

### Technical Detail

The new regex is inserted after line 289 (after the anonymous function handler) and before line 291 (the named default handler). It catches the one remaining pattern: object literal default exports. The existing module registration logic at the bottom of `transpileFile` will pick up `__DefaultExport` and register it as the module's default export.


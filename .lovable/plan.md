

## Fix: Syntax Error Caused by Type Annotation Stripping

### Root Cause

In `src/hooks/useReactCompiler.ts`, line 142, the `stripTypeAnnotations` function has this regex:

```
/: (?:React\.(?:FC|ReactNode|...)|string|number|boolean|...|object|Record<...>|Array<...>|\w+(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*)/g
```

The final catch-all alternative `\w+` is meant to match custom TypeScript type names (e.g., `Props`, `MyType`), but `\w` includes digits (`[a-zA-Z0-9_]`). This causes it to match numeric values inside object literals:

- `duration: 0.5` -- matches `: 0`, leaving `duration.5` (broken)
- `delay: 1` -- matches `: 1`, leaving `delay` (broken)
- `key: value` -- matches `: value`, leaving `key` (broken)

This is why the preview shows "Unexpected token, expected `,`" on `transition={{ duration: 0.5 }}`.

### Fix (single file: `src/hooks/useReactCompiler.ts`)

**Change the `\w+` catch-all to `[A-Z]\w*`** so it only matches identifiers starting with an uppercase letter (which is the TypeScript convention for custom types like `Props`, `State`, `ReactNode`, etc.):

```text
Before:  \w+(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*
After:   [A-Z]\w*(?:\[\])?(?:\s*\|\s*[A-Z]\w*(?:\[\])?)*
```

This preserves matching for all real type annotations:
- `param: Props` -- still matched (starts with uppercase)
- `value: MyCustomType` -- still matched
- `items: Item[]` -- still matched
- `x: String | Number` -- still matched

But stops matching object literal values:
- `duration: 0.5` -- no longer matched (starts with digit)
- `color: red` -- no longer matched (starts with lowercase)
- `key: value` -- no longer matched (starts with lowercase)

Built-in lowercase types (`string`, `number`, `boolean`, `void`, `any`, `null`, `undefined`, `never`, `unknown`, `object`) are already explicitly listed in the regex, so they continue to work.

### Technical Detail

The exact edit is on line 142 of `useReactCompiler.ts`. The replacement changes the regex from:

```javascript
result = result.replace(/: (?:React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject)(?:<[^>]+>)?|string|number|boolean|void|any|null|undefined|never|unknown|object|Record<[^>]+>|Array<[^>]+>|\w+(?:\[\])?(?:\s*\|\s*\w+(?:\[\])?)*)/g, '');
```

to:

```javascript
result = result.replace(/: (?:React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject)(?:<[^>]+>)?|string|number|boolean|void|any|null|undefined|never|unknown|object|Record<[^>]+>|Array<[^>]+>|[A-Z]\w*(?:\[\])?(?:\s*\|\s*[A-Z]\w*(?:\[\])?)*)/g, '');
```

Only two character sequences change: `\w+` becomes `[A-Z]\w*` in two places within the regex.


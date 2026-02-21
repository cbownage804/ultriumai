

## Fix: Comprehensive Type Stripping Overhaul

### Problem

The preview has been broken for 4 days. Two fixes have been applied (two-phase package loading + expanded generic stripping) but multiple critical gaps remain in the `stripTypeAnnotations` function that will still cause Babel syntax errors or runtime "X is not defined" errors.

### Remaining Bugs

**Bug 1: Dotted type paths partially stripped (line 142)**
```
Input:  const el: JSX.Element = ...
Output: const el .Element = ...   <-- SYNTAX ERROR
```
The regex `[A-Z]\w*` matches `JSX` but stops at the dot, leaving `.Element`.

**Bug 2: Nested generics explode (lines 142 + 154)**
```
Input:  useState<SetStateAction<boolean>>(false)
Output: useState<boolean>>(false)   <-- Stray > causes JSX parse error
```
The `[^>]+` pattern stops at the first `>`, not the matching one.

**Bug 3: Function return types not stripped**
```
Input:  function App(): React.ReactElement {
Output: function App(): React.ReactElement {   <-- Babel sees `: React` as label
```
Return type annotations between `)` and `{` or `=>` are never handled.

**Bug 4: Complex union/intersection types**
```
Input:  const x: string | number | null = ...
Output: const x | number | null = ...   <-- Only first type stripped
```

### Solution

Replace the fragile regex-based type stripper with a **bracket-depth-aware scanner** that handles all TypeScript annotation patterns reliably.

### Implementation

**File: `src/hooks/useReactCompiler.ts`** -- Replace `stripTypeAnnotations` function (lines 84-167)

**Change 1: Add a nested-angle-bracket matcher utility**

Instead of `[^>]+`, use a function that counts `<` and `>` depth to find the matching closing bracket:

```typescript
// Match from opening < to its balanced closing >, handling nesting
function matchBalancedAngles(str: string, startIdx: number): number {
  if (str[startIdx] !== '<') return -1;
  let depth = 1;
  let i = startIdx + 1;
  while (i < str.length && depth > 0) {
    if (str[i] === '<') depth++;
    else if (str[i] === '>') depth--;
    i++;
  }
  return depth === 0 ? i : -1;
}
```

**Change 2: Replace line 142 with a comprehensive type annotation stripper**

Instead of the long alternation regex, use a two-pass approach:

Pass A -- Strip `: Type` annotations (including dotted paths and generics):
```typescript
// Match ': ' followed by a type expression (handles dotted paths, generics, unions, arrays)
result = result.replace(
  /:\s*(?=[A-Za-z_])([A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)(?:\s*[|&]\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)*/g,
  (match, _type, offset) => {
    // Don't strip object property definitions (key: value in { })
    // Check if this looks like it's inside an object literal or ternary
    const before = result.slice(Math.max(0, offset - 20), offset);
    if (/[{,]\s*\w+\s*$/.test(before)) return match; // object property
    if (/\?\s*$/.test(before)) return match; // ternary
    return '';
  }
);
```

But this is too complex and fragile. A better approach:

**Revised approach: Targeted passes that are each simple and correct**

1. Strip return type annotations: `): Type =>` and `): Type {`
2. Strip parameter types with nested generics  
3. Strip variable type annotations
4. Fix the generic stripping to handle nesting

**Change 3: Fix the safety pass for nested generics (line 153-156)**

Replace `[^>]+` with a nested-aware pattern:
```typescript
// Handle nested generics: useState<SetStateAction<boolean>>
result = result.replace(
  /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|createContext|forwardRef|memo|lazy|useImperativeHandle|useLayoutEffect|Set|Map|Array|Promise|Record)\s*<((?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*)>/g,
  '$1'
);
```
The pattern `(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*` handles up to 3 levels of nesting.

**Change 4: Add return type stripping**

```typescript
// Strip return types: ): string => or ): ReactElement {
result = result.replace(
  /\)\s*:\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?(?:\s*[|&]\s*[A-Za-z_][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?)*(?=\s*(?:=>|\{))/g,
  ')'
);
```

**Change 5: Fix the broad type annotation regex (line 142)**

Expand to handle dotted type paths and nested generics:
```typescript
result = result.replace(
  /:\s*(?:React\.(?:FC|ReactNode|MouseEvent|ChangeEvent|FormEvent|CSSProperties|RefObject|Dispatch|SetStateAction|MutableRefObject|HTMLAttributes|ComponentProps|ComponentType|ElementType|ReactElement|JSX\.Element)(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?|string|number|boolean|void|any|null|undefined|never|unknown|object|Record<(?:[^<>]|<[^<>]*>)*>|Array<(?:[^<>]|<[^<>]*>)*>|[A-Z][\w.]*(?:<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?(?:\[\])?)(?:\s*[|&]\s*(?:string|number|boolean|null|undefined|[A-Z][\w.]*(?:<(?:[^<>]|<[^<>]*>)*>)?(?:\[\])?))*(?![:\w])/g,
  ''
);
```

### Files to Edit

**`src/hooks/useReactCompiler.ts`** -- `stripTypeAnnotations` function (lines 84-167):
- Line 142: Expand type annotation regex to handle dotted paths (`JSX.Element`) and nested generics
- Lines 152-156: Fix safety pass regex to handle nested angle brackets  
- Add new pass for function return type annotations (after `)`, before `{` or `=>`)
- Lines 157-158: Update broad generic strip to handle nested generics

**`src/hooks/__tests__/useReactCompiler.test.ts`** -- Add test cases:
- `JSX.Element` return type is fully stripped
- Nested generics like `SetStateAction<boolean>` are stripped
- Function return types are stripped
- Object literal `{ icon: Star }` property values are NOT stripped
- Union types like `string | number | null` are fully stripped

### Execution Order

1. Update `stripTypeAnnotations` with all fixes
2. Update test file with new test cases
3. Verify existing tests still pass

### Risk Assessment

- The nested angle bracket pattern `(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*` handles up to 3 levels deep, which covers all practical TypeScript patterns
- Object literal properties (`{ icon: Star }`) are protected because the `: ` in those is NOT followed by an uppercase type name alone -- it's followed by a value expression
- JSX is protected because JSX tags are standalone `<div>`, not preceded by `: `


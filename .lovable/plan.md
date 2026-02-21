

## Fix: Strip TypeScript Generics That Babel Misparses as JSX

### Root Cause

The preview has been broken for 4 days because of a single regex gap in the type-stripping pipeline.

When the AI generates standard TypeScript like:
```
useState<boolean>(false)
useRef<HTMLDivElement>(null)
useCallback<() => void>(...)
```

The type stripper (line 152 of useReactCompiler.ts) only removes generics named `T`, `K`, `V`, `Props`, or `State`. Concrete types like `<boolean>`, `<string>`, `<HTMLDivElement>` are left in.

Babel is configured with `isTSX: true`, so it interprets `<boolean>` as a JSX opening tag, looks for `</boolean>`, can't find it, and throws "Expected corresponding JSX closing tag." The auto-fix AI regenerates the same valid TypeScript patterns, so every attempt fails identically.

### The Fix

**File: `src/hooks/useReactCompiler.ts`** -- Two changes:

**1. Expand the generic stripping regex (line 152)**

Replace the narrow pattern that only handles single-letter generics with a broad one that handles all TypeScript generic parameters:

```
Before:
/<(?:T|K|V|Props|State)(?:\s+extends\s+\w+)?(?:,\s*\w+(?:\s+extends\s+\w+)?)*>/g

After:
/<(?:[A-Za-z][\w.]*(?:\[\])?(?:\s*\|\s*[\w.]+(?:\[\])?)*(?:\s*,\s*[\w.]+(?:\[\])?(?:\s*\|\s*[\w.]+)?)*)>/g
```

This matches any `<TypeName>` pattern including:
- `<boolean>`, `<string>`, `<number>` (primitives)
- `<HTMLDivElement>`, `<React.FC>` (DOM/React types)
- `<string, number>` (multi-param generics like Map, Record)
- `<string | null>` (union types in generics)

But it does NOT match JSX because:
- JSX tags are followed by attributes/whitespace/`>`, not `)` or `;`
- JSX self-closing tags have ` />` which doesn't match this pattern
- The pattern only matches when preceded by an identifier (function name), not `<` on its own line

**2. Add a safety pass to strip generics after known function names**

Add a targeted regex that strips `<...>` specifically after common React hook calls and utility functions, as a safety net:

```typescript
// Strip generics after known function calls: useState<X>(...) -> useState(...)
result = result.replace(
  /\b(useState|useRef|useCallback|useMemo|useReducer|useContext|createContext|forwardRef|memo|lazy|useImperativeHandle|useLayoutEffect|Set|Map|Array|Promise|Record)\s*<[^>]+>/g,
  '$1'
);
```

This runs BEFORE the broad generic strip as a guaranteed catch for the most common patterns.

### Why This Fixes Everything

- `useState<boolean>(false)` becomes `useState(false)` -- valid JS
- `useRef<HTMLDivElement>(null)` becomes `useRef(null)` -- valid JS
- Babel no longer misinterprets generics as JSX opening tags
- Auto-fix no longer enters an infinite loop of identical failures
- The fix is backwards-compatible: code without generics is unaffected

### Technical Details

**File to edit:** `src/hooks/useReactCompiler.ts`

**Change 1** (around line 147-152): Add the targeted function-name generic strip before the broad strip.

**Change 2** (line 152): Expand the existing generic regex to handle all TypeScript type parameter patterns, not just single-letter ones.

Both changes are in the `stripTypeAnnotations` function.


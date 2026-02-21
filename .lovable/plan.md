

## Fix: "Failed to resolve module specifier 'lucide-react'"

### Root Cause

In `src/hooks/useReactCompiler.ts` line 473:
```javascript
const importMap = generateImportMap(options?.userPackages || []);
```

The `generateImportMap` function only adds the packages passed to it. `DEFAULT_PACKAGES` (defined in `cdnPackageRegistry.ts`) contains lucide-react, framer-motion, recharts, react-router-dom, and 20+ other common packages -- but they are never passed in. The resulting import map only has react and react-dom entries.

When the transpiler converts `import { Home } from 'lucide-react'` into `await import('lucide-react')`, the browser tries to resolve the bare specifier via the import map, finds no entry, and throws "Failed to resolve module specifier 'lucide-react'".

### Fix (single line change in `src/hooks/useReactCompiler.ts`)

Change line 473 from:
```javascript
const importMap = generateImportMap(options?.userPackages || []);
```

to:
```javascript
const importMap = generateImportMap([...DEFAULT_PACKAGES, ...(options?.userPackages || [])]);
```

This ensures all default CDN packages (lucide-react, framer-motion, recharts, date-fns, clsx, zustand, etc.) are included in the HTML import map, allowing the browser to resolve them at runtime.

`DEFAULT_PACKAGES` is already imported at line 3 of the file, so no new imports are needed.

### Files to Edit

1. **`src/hooks/useReactCompiler.ts`** -- line 473: include `DEFAULT_PACKAGES` in the import map generation call


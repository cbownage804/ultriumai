

## Fix: Templates Failing Due to CDN Import Errors

### Problem
Every template generates code that imports from `lucide-react` and `framer-motion`, but these imports frequently fail at runtime inside the preview iframe, causing a blank screen and triggering the auto-fix loop. The auto-fix loop then burns credits trying to fix import errors it can never resolve because the root cause is in the compiler, not the generated code.

### Root Causes

**1. Default import mismatch for lucide-react**
The AI generates `import LucideIcon from 'lucide-react'` (a default import), but lucide-react has NO default export. The transpiler converts this to:
```javascript
const LucideIcon = (await import('lucide-react')).default || (await import('lucide-react'));
```
Since `.default` is undefined, `LucideIcon` becomes the entire module namespace object, which is not a valid React component. This causes "React received undefined" errors.

**2. CDN loading race conditions**
The esm.sh CDN URLs for lucide-react (~500KB) and framer-motion (~800KB) take 2-5 seconds to load. During this time, Babel's `new Function()` block is executing, and any `await import()` that hasn't resolved causes the entire preview to hang or error out.

**3. The auto-fix loop diagnoses symptoms, not causes**
The auto-fix detects "lucide-react icons imported incorrectly" and rewrites the imports, but the transpiler transforms them the same way every time, so the same error recurs.

### Fix Plan

#### 1. Harden default import handling for known named-export-only packages
**File: `src/hooks/useReactCompiler.ts`** (transpileFile function, ~line 214-223)

For packages known to have NO default export (lucide-react, date-fns, recharts), convert default imports to namespace imports:

```typescript
// Before (current):
const LucideIcon = (await import('lucide-react')).default || (await import('lucide-react'));

// After (fixed):
const LucideIcon = await import('lucide-react');
// AND for named imports alongside:
const { Star, Heart } = await import('lucide-react');
```

Add a set of packages that are known to not have a default export, and skip the `.default` fallback for them. This prevents the "undefined component" error entirely.

#### 2. Add import error resilience wrapper
**File: `src/hooks/useReactCompiler.ts`** (transpileFile function)

Wrap each external `await import()` in a try-catch so one failed CDN fetch doesn't crash the entire app:

```typescript
let lucideReact;
try { lucideReact = await import('lucide-react'); } 
catch(e) { console.warn('Failed to load lucide-react:', e); lucideReact = {}; }
const { Star, Heart } = lucideReact;
```

This way if framer-motion CDN is slow, the rest of the app still renders.

#### 3. Add CDN preload hints to the HTML head
**File: `src/hooks/useReactCompiler.ts`** (compileReactProject HTML template, ~line 576)

Scan the generated code for external package imports and add `<link rel="modulepreload">` tags for the corresponding CDN URLs. This tells the browser to start fetching these modules immediately instead of waiting for the JavaScript to execute:

```html
<link rel="modulepreload" href="https://esm.sh/lucide-react@0.462.0?external=react" />
<link rel="modulepreload" href="https://esm.sh/framer-motion@12.23.0?external=react,react-dom" />
```

#### 4. Suppress auto-fix for CDN/import errors
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`** (handleAutoFixError)

Add pattern matching to suppress auto-fix attempts for errors that originate from CDN loading failures or import resolution. These are infrastructure errors, not code errors:

```typescript
if (error.message?.includes('Failed to fetch dynamically imported module') ||
    error.message?.includes('error loading dynamically imported module') ||
    error.message?.includes('esm.sh')) return;
```

### Files to Edit

1. **`src/hooks/useReactCompiler.ts`** -- Fix default import handling, add try-catch wrappers, add modulepreload hints
2. **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** -- Suppress auto-fix for CDN errors

### Expected Impact

```
Before:
  Template generates code --> lucide-react default import fails --> blank preview
  --> auto-fix triggers --> same error --> loop burns 3+ credits --> still blank

After:
  Template generates code --> lucide-react imported as namespace (no .default) --> works
  CDN slow? --> try-catch catches it, rest of app renders with fallback
  CDN error detected? --> auto-fix skips it (infrastructure issue, not code bug)
```

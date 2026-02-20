

# Fix: Persistent React Error #310 -- Protect ALL File-Processing useMemo Calls

## Problem

Error #310 ("Rendered fewer hooks than expected") keeps crashing the App Builder after generation completes. The previous fix only wrapped `liveCompiledHTML` in try/catch, but there are **three more useMemo calls** that also process `project.files` and can throw uncaught exceptions during render. When any one of them throws, React stops executing hooks mid-render, detects a hook count mismatch, and crashes the entire component.

## Root Cause

When generation completes, `project.files` updates, which triggers re-evaluation of every `useMemo` that depends on it. These three are unprotected:

1. **`compiledForHosting`** (line 1058) -- calls `getCompiledHTML()` which can throw on malformed files
2. **`isReactProject`** (line 1650) -- calls `detectReactProject()` which scans files
3. **`bundleForBrowser`** (line 304) -- calls `astBundler.buildDependencyGraph()` and `incrementalCompiler.compileIncremental()` which can throw on invalid imports/syntax

Any one of these throwing = Error #310.

## Fix (1 file, 3 changes)

**File**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`

### Change 1: Wrap `compiledForHosting` in try/catch

```typescript
const compiledForHosting = useMemo(
  () => {
    try {
      if (isGenerating) return null;
      return getCompiledHTML(supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser);
    } catch (e) {
      console.error('[compiledForHosting] Compilation crashed:', e);
      return null;
    }
  },
  [project.files, supabaseConfig, stripeConfig, envVars, serviceKeys, cdnPackages, bundleForBrowser, isGenerating]
);
```

### Change 2: Wrap `isReactProject` in try/catch

```typescript
const isReactProject = useMemo(() => {
  try {
    return detectReactProject(project.files);
  } catch (e) {
    console.error('[detectReactProject] crashed:', e);
    return false;
  }
}, [project.files]);
```

### Change 3: Wrap `bundleForBrowser` in try/catch

```typescript
const bundleForBrowser = useCallback((files: ProjectFile[]) => {
  try {
    const result = incrementalCompiler.compileIncremental(
      files,
      (file) => {
        const graph = astBundler.buildDependencyGraph([file]);
        const node = graph.get(file.path);
        if (!node) return file.content;
        return `/* ... */\n(function() {\n"use strict";\n${astBundler.stripModuleSyntax(file.content, node)}\n})();`;
      },
      (f) => astBundler.topologicalSort(astBundler.buildDependencyGraph(f)).filter(p => f.some(file => file.path === p)),
    );
    return result.output;
  } catch (e) {
    console.error('[bundleForBrowser] Bundling crashed:', e);
    return '';
  }
}, [astBundler, incrementalCompiler]);
```

## Why This Fixes It

With all four file-processing computations protected by try/catch (`liveCompiledHTML` + these three), no render-time exception can escape and disrupt React's hook execution order. The component will always complete its full render cycle with all ~60 hooks called, preventing Error #310.

## Risk

Very low. Each fallback value (`null`, `false`, `''`) is already handled by downstream consumers. The preview will show "Compilation Error" fallback if compilation fails, which is far better than crashing the entire App Builder.

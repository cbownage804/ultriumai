

# Fix: Persistent Error #310 — Isolate Compilation Into a Safe Child Component

## Problem

Error #310 ("Rendered fewer hooks than expected") continues to crash the App Builder after generation completes, despite wrapping all useMemo/useCallback bodies in try/catch. The try/catch approach prevents exceptions from propagating, but React still detects hook count mismatches if any render-time code path causes an interruption in the 100+ hook chain inside AIAppBuilderWorkspace.tsx.

## Root Cause

The component has 2658 lines and 100+ hooks. When generation finishes and `project.files` updates, multiple useMemo hooks re-evaluate simultaneously. If ANY intermediate computation (even outside our wrapped hooks) throws during this cascade, React counts fewer executed hooks and throws #310. The error boundary catches it, but the entire workspace crashes.

## Solution: Extract Compilation Into a Dedicated Child Component

Instead of trying to protect every possible throw site in a 100+ hook component, move the compilation logic into a small, isolated child component wrapped in its own error boundary. If compilation crashes, only the preview fails — the chat, file tree, and editor remain functional.

### Change 1: Create `CompilationBridge.tsx`

**New file**: `src/components/ai-builder/CompilationBridge.tsx`

A small component that:
- Receives `project.files`, configs, and `isGenerating` as props
- Internally calls `useReactCompiler()`, `detectReactProject()`, and compilation useMemo
- Exposes the compiled HTML via a callback prop (`onCompiled`)
- Has its own try/catch in ALL computation paths
- If it crashes, its parent error boundary catches it without affecting the workspace's hook count

```
CompilationBridge (isolated component)
  - useReactCompiler()
  - isReactProject useMemo
  - liveCompiledHTML useMemo
  - compiledForHosting useMemo
  - Reports results via onCompiled(html) callback
```

### Change 2: Update AIAppBuilderWorkspace.tsx

- Remove the `useReactCompiler()`, `isReactProject`, `liveCompiledHTML`, and `compiledForHosting` hooks from the workspace
- Render `<CompilationBridge>` as a child, wrapped in a `<PanelErrorBoundary>`
- Receive compiled HTML via callback into a useState
- This reduces the hook count in the workspace by ~5 and isolates the most crash-prone code

### Change 3: Wrap CompilationBridge in error boundary

In the workspace JSX, render:
```tsx
<PanelErrorBoundary panelName="Compiler">
  <CompilationBridge
    files={project.files}
    isGenerating={isGenerating}
    supabaseConfig={supabaseConfig}
    stripeConfig={stripeConfig}
    envVars={envVars}
    serviceKeys={serviceKeys}
    cdnPackages={cdnPackages}
    bundleForBrowser={bundleForBrowser}
    linkedGPT={linkedGPT}
    onCompiled={setStableHTML}
    getCompiledHTML={getCompiledHTML}
  />
</PanelErrorBoundary>
```

## Why This Fixes Error #310

- The compilation hooks are moved OUT of the 100+ hook component, so if they crash, they don't affect the workspace's hook count
- The workspace retains all its other hooks in stable order
- CompilationBridge has only ~5 hooks, making it trivially safe
- If CompilationBridge crashes, PanelErrorBoundary catches it — the workspace shows "Compiler failed to load" in the preview area but the chat and editor remain fully functional

## Files Changed

1. **New**: `src/components/ai-builder/CompilationBridge.tsx` — isolated compilation component
2. **Edit**: `src/components/ai-builder/AIAppBuilderWorkspace.tsx` — remove compilation hooks, render CompilationBridge

## Risk

Low. This is a pure refactor that moves existing logic into a child component. No behavior changes. The compilation output is identical — only the error isolation boundary changes.

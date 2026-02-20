
# Fix React Error #310: "Rendered more hooks than during the previous render"

## Problem

The App Builder crashes with React error #310: "Rendered more hooks than during the previous render." This is a hooks ordering violation caused by having 350+ hooks in a single component (`AIAppBuilderWorkspace`). With this many hooks, React's internal fiber tracking becomes fragile, and any Suspense boundary resolution or conditional rendering path can cause hook count mismatches between renders.

## Root Cause

`AIAppBuilderWorkspace.tsx` has:
- **~160 individual `useState(false)` calls** for panel visibility (lines 288-565)
- **~50 custom hooks** (useCodeSmellDetector, useGithubSync, useReactCompiler, etc.)
- **~80 additional `useState` calls** for other state
- Total: **~290+ individual hook calls** in one component

React tracks hooks by call order. When this many hooks exist, any variation in execution path (e.g., a Suspense fallback resolving, an error boundary recovery, or a component prop change affecting which lazy components load) can cause the hook count to differ between renders, triggering error #310.

## Solution: Consolidate 160 useState into 1 usePanelManager

Replace all ~160 panel visibility `useState(false)` declarations with a single `usePanelManager` reducer call. This reduces the hook count from ~290 to ~130 -- well within React's safe operating range.

## Implementation Steps

### Step 1: Create panel keys constant file

Create `src/components/ai-builder/panelKeys.ts` containing a `PANEL_KEYS` array with all ~160 panel state key strings extracted from the current `useState` declarations.

### Step 2: Replace useState declarations in AIAppBuilderWorkspace

Remove lines 288-565 (the ~160 `const [showX, setShowX] = useState(false)` declarations) and replace with:

```typescript
import { usePanelManager } from '@/hooks/usePanelManager';
import { PANEL_KEYS } from './panelKeys';

const { panels, toggle, open, close, exclusiveOpen } = usePanelManager(PANEL_KEYS);
```

Then destructure all `showX` booleans from `panels` and create a `setShowX` compatibility layer:

```typescript
// Destructure for backward compatibility
const showDockerCompose = !!panels.showDockerCompose;
const showK8s = !!panels.showK8s;
// ... etc for all 160 keys

// Create setter helpers
const sp = (key: string) => (v: boolean | ((prev: boolean) => boolean)) => {
  const val = typeof v === 'function' ? v(!!panels[key]) : v;
  val ? open(key) : close(key);
};
const setShowDockerCompose = sp('showDockerCompose');
const setShowK8s = sp('showK8s');
// ... etc
```

### Step 3: Simplify the panelSetters map

Replace the ~200-line `panelSetters` useMemo (lines 1677-1882) with a 5-line auto-generator:

```typescript
const panelSetters = useMemo(() => {
  const map: Record<string, (v: boolean) => void> = {};
  for (const key of PANEL_KEYS) {
    map[key] = (v: boolean) => v ? open(key) : close(key);
  }
  return map;
}, [open, close]);
```

### Step 4: Simplify openPanel function

Replace the 20-line `openPanel` function (lines 1647-1668) with:

```typescript
const openPanel = (panel: string) => {
  exclusiveOpen('show' + panel.charAt(0).toUpperCase() + panel.slice(1), 
    EXCLUSIVE_PANEL_GROUP);
};
```

### Step 5: Update panel group props

Panel groups and `WorkspacePanelLayer` that receive individual `showX`/`setShowX` props will continue working because the destructured variables and setter functions have identical signatures.

## Impact

| Metric | Before | After |
|--------|--------|-------|
| useState calls | ~290 | ~130 |
| Total hooks | ~350 | ~180 |
| panelSetters map | ~200 lines | ~5 lines |
| Risk of #310 | High | Low |

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/panelKeys.ts` | New: defines PANEL_KEYS constant |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Replace 160 useState with usePanelManager, simplify panelSetters |
| `src/hooks/usePanelManager.ts` | No changes needed |

## Risk

- **Low**: Pure refactor. Every `useState(false)` becomes a key in the reducer's `Record<string, boolean>` initialized to `false`. The destructured booleans and setter functions maintain identical signatures, so all downstream components (panel groups, WorkspacePanelLayer) continue working without changes.

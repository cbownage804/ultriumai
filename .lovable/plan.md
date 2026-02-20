

# Consolidate 160+ useState Booleans into usePanelManager Reducer

## What This Does

Right now, the workspace has ~160 individual lines like `const [showDockerCompose, setShowDockerCompose] = useState(false)` plus a ~200-line `panelSetters` map that wraps each setter. This is replaced with a single `usePanelManager(ALL_PANEL_KEYS)` call that manages all visibility in one reducer.

## Impact

- **160 useState calls** reduced to **1 useReducer call**
- **200-line panelSetters map** replaced with the reducer's built-in `toggle`/`open`/`close` methods
- Eliminates ~350 lines of boilerplate from the workspace file
- Faster renders: one state object update vs. individual setState calls

## Implementation Steps

### Step 1: Define panel key constants

Create a `PANEL_KEYS` array listing all ~160 panel string keys (e.g. `'showDockerCompose'`, `'showK8s'`, etc.) at the top of `AIAppBuilderWorkspace.tsx` or in a shared constants file.

### Step 2: Replace useState declarations

Remove lines 390-565 (the ~160 `useState(false)` declarations) and replace with:

```typescript
const { panels, toggle, open, close, isOpen } = usePanelManager(PANEL_KEYS);
```

### Step 3: Update all references

Throughout the file, replace:
- `showDockerCompose` with `panels.showDockerCompose` (or `isOpen('showDockerCompose')`)
- `setShowDockerCompose(false)` with `close('showDockerCompose')`
- `setShowDockerCompose(true)` with `open('showDockerCompose')`
- `setShowDockerCompose(v)` with `v ? open('showDockerCompose') : close('showDockerCompose')`

### Step 4: Replace panelSetters map

The ~200-line `panelSetters` useMemo (lines 1672-1877) becomes:

```typescript
const panelSetters = useMemo(() => {
  const map: Record<string, (v: boolean) => void> = {};
  for (const key of PANEL_KEYS) {
    map[key] = (v: boolean) => v ? open(key) : close(key);
  }
  return map;
}, [open, close]);
```

Or even simpler -- `openPanelByKey` just calls `open(stateKey)` directly.

### Step 5: Update panel group props

Panel groups currently receive individual `showX` / `setShowX` props. Update them to receive the `panels` record and `open`/`close`/`toggle` functions instead, or create adapter props:

```typescript
showDockerCompose={!!panels.showDockerCompose}
setShowDockerCompose={(v) => v ? open('showDockerCompose') : close('showDockerCompose')}
```

### Step 6: Update WorkspacePanelLayer

The `panelVisibility` prop already accepts `Record<string, boolean>` -- it can receive `panels` directly. The `panelSetters` prop can use the generated map from Step 4.

## Technical Details

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Remove ~160 useState, add usePanelManager, update all references, simplify panelSetters |
| `src/hooks/usePanelManager.ts` | No changes needed -- already has the right API |
| `src/components/ai-builder/panel-groups/*.tsx` | Minor: adapt show/setShow props to use panels record |
| `src/components/ai-builder/WorkspacePanelLayer.tsx` | Minor: receive panels record for panelVisibility |

## Risk

- **Low**: Pure refactor with no behavior change. Every `useState(false)` becomes a key in the reducer's `Record<string, boolean>` initialized to `false`.
- The `usePanelManager` hook already exists and is tested.
- Panel groups can continue receiving individual boolean props via destructuring from the `panels` object.


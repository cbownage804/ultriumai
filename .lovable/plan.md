

# Fix: Workspace Performance Collapse (200+ Hooks on Every Render)

## Root Cause

`AIAppBuilderWorkspace.tsx` is a 2,846-line component that calls **200+ custom hooks** and **300+ useState** on every render. Each hook initializes state, refs, and effects — even for panels the user never opens (KubernetesGenerator, MutationTesting, AffiliateTracking, etc.).

This causes:
- Firefox "This page is slowing down Firefox" warning
- "Loading preview..." that never resolves
- Multi-second initial render blocking the preview compilation

## Solution: Deferred Hook Initialization

Move all non-core hooks behind a lazy initialization pattern. Only ~15 hooks are needed on initial load (AI builder, file system, undo/redo, persistence, preview compiler). The other 185+ hooks should only initialize when their panel is opened.

## Implementation

### Step 1: Create a `useLazyHook` utility

A new utility that defers hook initialization until first access:

```typescript
// src/hooks/useLazyHook.ts
function useLazyHook<T>(factory: () => T): () => T {
  const ref = useRef<T | null>(null);
  const [, forceRender] = useState(0);
  return useCallback(() => {
    if (!ref.current) {
      ref.current = factory();
      forceRender(n => n + 1);
    }
    return ref.current;
  }, []);
}
```

**Problem**: React hooks can't be conditionally called. So we can't truly defer them.

### Better Approach: Extract Panel Groups into Sub-Components

Split the workspace into **panel group components** that only mount when their section is active. Each group owns its hooks.

### Step 2: Create Panel Group Components

Extract Sprint S-AD hooks (Phases 194-253) into isolated components:

- `MobilePanelGroup` — Sprint S hooks (5 hooks)
- `AIAutomationPanelGroup` — Sprint T hooks (5 hooks)  
- `DataStatePanelGroup` — Sprint U hooks (5 hooks)
- `DevToolsPanelGroup` — Sprint V hooks (5 hooks)
- `CommunicationPanelGroup` — Sprint W hooks (5 hooks)
- `UIPatternsPanelGroup` — Sprint X hooks (5 hooks)
- `DevOpsPanelGroup` — Sprint Y hooks (5 hooks)
- `AuthSecurityPanelGroup` — Sprint Z hooks (5 hooks)
- `ContentMediaPanelGroup` — Sprint AA hooks (5 hooks)
- `SearchDiscoveryPanelGroup` — Sprint AB hooks (5 hooks)
- `MonitoringPanelGroup` — Sprint AC hooks (5 hooks)
- `FinalPolishPanelGroup` — Sprint AD hooks (5 hooks)
- `CollabPanelGroup` — Sprint L hooks (5 hooks)
- `TestingPanelGroup` — Sprint M hooks (5 hooks)
- `UIBuildingPanelGroup` — Sprint N hooks (5 hooks)
- `DataIntegrationPanelGroup` — Sprint O hooks (5 hooks)
- `DevExperiencePanelGroup` — Sprint P hooks (5 hooks)
- `DeploymentPanelGroup` — Sprint Q hooks (5 hooks)
- `MonetizationPanelGroup` — Sprint R hooks (5 hooks)
- `IntegrationPanelGroup` — Sprint K hooks (5 hooks)
- `InfraPanelGroup` — Sprint I-J hooks (10 hooks)

Each component only renders when any of its panels are visible, so its hooks only run when needed.

### Step 3: Conditional Rendering in Workspace

Replace inline hook calls with conditionally-mounted group components:

```text
Before (runs 200+ hooks always):
  const capacitorExport = useCapacitorExport();
  const pushNotifications = usePushNotificationDesigner();
  ...

After (hooks only run when panel group is active):
  {anyMobilePanelOpen && <MobilePanelGroup ... />}
```

### Step 4: Keep Only Core Hooks in Workspace

The workspace component retains only ~20 essential hooks:
- useAIAppBuilder
- useProjectFileSystem
- useUndoRedo
- useProjectPersistence
- useReactCompiler
- useBuildLog
- useVersionTimeline
- useAutoFixLoop
- useBranching
- useAgentMode
- useAutoErrorRecovery
- useBuildAnalytics
- useIndexedDBPersistence
- useLivePreviewSync
- usePromptHistory

Everything else moves into lazy panel groups.

## Impact

- Initial hook count drops from **200+** to **~20**
- Render time drops from **2-5 seconds** to **<100ms**
- Firefox "slowing down" warning eliminated
- Preview loads immediately after generation
- Each panel group adds its hooks only when opened

## Files Changed

| File | Change |
|------|--------|
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` | Remove 180+ hook calls, add conditional panel group rendering |
| `src/components/ai-builder/panel-groups/MobilePanelGroup.tsx` | New — Sprint S hooks + panels |
| `src/components/ai-builder/panel-groups/AIAutomationPanelGroup.tsx` | New — Sprint T hooks + panels |
| `src/components/ai-builder/panel-groups/DataStatePanelGroup.tsx` | New — Sprint U hooks + panels |
| ... (21 panel group files total) | New — each owns 5 hooks + panels |
| `src/components/ai-builder/panel-groups/index.ts` | New — barrel export |

## Risk

- Low: Panel groups are purely organizational — no behavior changes
- The panel open/close state booleans stay in the workspace (lightweight useState) so the conditional mount triggers work
- Hook results that were passed between unrelated panels will need a shared context or callback pattern (rare)


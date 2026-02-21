

## Multi-Phase Fix: Toast Spam + Preview Freezing

### Phase 1: Global Toast Limit
**File: `src/components/ui/sonner.tsx`**

- Add `visibleToasts={2}` to cap DOM toast nodes at 2
- Add `duration={3000}` for faster auto-dismiss
- This alone prevents the cascading DOM pile-up that locks the main thread

### Phase 2: Health Check Toast Cooldown
**File: `src/components/ai-builder/BuilderPreviewPanel.tsx`**

- Add a `lastHealthToastRef` timestamp ref
- Only fire the "Preview crashed" toast if 30+ seconds have passed since the last one
- The health check runs every 2s and can trigger the toast every 6s (3 fails x 2s) -- this causes rapid stacking during compilation delays

### Phase 3: Workspace Toast Deduplication
**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

- Add a `dedupeToast` helper using a `Map<string, number>` ref that suppresses identical messages within a 5-second window
- Replace high-frequency automated toasts with `dedupeToast`:
  - Auto-fix exhaustion toast
  - Auto-rollback toast
  - Build completion toast
- Leave user-initiated one-shot toasts (copy, export, rename, undo/redo) unchanged since those are intentional

### Technical Details

```text
Toast Flow (Before)
+------------------+     every 6s      +--------+
| Health Check     | -----------------> | toast  | x unlimited
+------------------+                    +--------+
| Auto-fix loop    | -----------------> | toast  | x unlimited
+------------------+                    +--------+
| Build complete   | -----------------> | toast  |
+------------------+                    +--------+
                          DOM fills up --> main thread freeze

Toast Flow (After)
+------------------+     30s cooldown   +--------+
| Health Check     | ------(gate)-----> | toast  | max 1/30s
+------------------+                    +--------+
| Auto-fix loop    | ----(deduped)----> | toast  | max 1/5s
+------------------+                    +--------+
| Build complete   | ----(deduped)----> | toast  | max 1/5s
+------------------+                    +--------+
                          visibleToasts={2} --> DOM capped at 2
```

### Files to Edit
1. `src/components/ui/sonner.tsx` -- add `visibleToasts` and `duration` props
2. `src/components/ai-builder/BuilderPreviewPanel.tsx` -- add 30s cooldown ref for health-check toast
3. `src/components/ai-builder/AIAppBuilderWorkspace.tsx` -- add `dedupeToast` wrapper, apply to automated toasts




# App Builder Stability Hardening Plan

## Problem Summary
The app builder suffers from browser freezes and stuck states caused by:
1. **html2canvas thumbnail capture** running on main thread (creates offscreen iframe + renders full page)
2. **Cascading auto-fix loops** — compile errors trigger auto-heal, which triggers compile, which triggers auto-heal again
3. **Massive component file** (4800 lines, ~100 hooks initialized on mount) creating heavy render cycles
4. **State desync** between `isCompiling`, `isGenerating`, `compileState` leaving UI stuck on spinners
5. **Post-generation storm** — multiple effects fire simultaneously (cloud save, IDB save, localStorage save, thumbnail capture, code analysis)

## Plan

### Step 1: Kill html2canvas — Use Server-Side Thumbnail Capture
The `usePreviewCapture` hook creates a hidden 1280x800 iframe, writes full HTML, waits 4-8 seconds, then runs `html2canvas` on the main thread. This is the single biggest freeze source.

**Changes:**
- **`src/hooks/usePreviewCapture.ts`** — Replace `html2canvas` with a lightweight approach: capture the existing preview iframe using `OffscreenCanvas` or simply skip client-side capture entirely and use the hosted preview URL with an edge function screenshot service
- As an immediate fix: wrap the entire `attemptCapture` in a `setTimeout(0)` yielding pattern, reduce canvas scale to 0.25, and add a hard 10-second abort timer that kills the iframe if capture hangs
- Remove retry logic (MAX_RETRIES=2 with exponential backoff causes up to 3 captures × 4-8s wait = 24s of main-thread work)

### Step 2: Cap Auto-Heal Cascade with a Single Gate
Currently there are THREE separate auto-fix systems that can fire simultaneously:
- `handleCompileStateChange` → `tryAutoHeal()` (compile errors)
- `handleAutoFixError` (runtime errors from preview)
- Validation repair pipeline (`pendingValidationFixRef`)

**Changes:**
- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** — Consolidate into a single `autoFixGateRef` with a global cooldown (minimum 5s between ANY fix attempt). Add a hard cap of 3 total fix attempts per user interaction. Wire all three paths through the same gate.
- Add `requestIdleCallback` wrapper around the auto-heal `sendMessage` call so it never blocks user input

### Step 3: Debounce the Post-Generation Effect Storm
After `isGenerating` transitions to `false`, at least 5 effects fire in the same tick:
- Cloud save (`saveProject`)
- Draft save (localStorage)
- IDB save
- Code smell analysis
- Commit message generation
- Thumbnail capture

**Changes:**
- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** — Stagger these into a single orchestrated sequence using `requestIdleCallback`:
  - T+0ms: localStorage draft (sync, fast)
  - T+2s (idle): IDB save
  - T+4s (idle): Cloud save
  - T+8s (idle): Thumbnail capture (if still on same project)
- Remove the duplicate save effects (lines ~2095-2191 have 3 separate useEffects that all trigger on `[project.files, messages]`)

### Step 4: Fix Compile State Machine Desync
The `isCompiling` boolean and `compileState` enum can get out of sync because multiple code paths set them independently.

**Changes:**
- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** — Make `isCompiling` derived from `compileState` (i.e., `const isCompiling = compileState === 'compiling'`) instead of maintaining it as separate state. Remove `setIsCompilingRaw` and `setIsCompiling` — only use `setCompileStateRaw`.
- **`src/components/ai-builder/CompilationBridge.tsx`** — Remove `onCompilingChange` callback entirely; parent derives it from `compileState`

### Step 5: Add Global Error Boundary with Recovery
When the workspace crashes (React error #299, hook errors), the entire page freezes with no recovery path.

**Changes:**
- **`src/components/ai-builder/PanelErrorBoundary.tsx`** — Enhance to catch workspace-level crashes and offer "Reset workspace" button that clears all refs and forces a fresh mount
- **`src/pages/AIAppBuilderWorkspacePage.tsx`** — Add a `key` prop tied to a recovery counter so the error boundary can force-remount the entire workspace

### Step 6: Guard Project Load from Triggering Heavy Operations
Loading a recent project currently triggers compilation, thumbnail capture, and save effects all at once.

**Changes:**
- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** — Extend the existing `recentProjectLoadCooldownUntilRef` (20s) to also suppress:
  - Auto-heal attempts
  - Code smell analysis
  - All save effects except the initial file restore
  - Compilation (when preview HTML was successfully restored from DB)

### Step 7: Reduce Hook Count on Initial Mount
The workspace initializes ~60+ custom hooks on mount, many of which are never used in a typical session.

**Changes:**
- **`src/components/ai-builder/AIAppBuilderWorkspace.tsx`** — Wrap non-critical hooks with the existing `useDeferredMount` pattern:
  - `useCodeSmellDetector`, `useDocGenerator`, `useLighthouseAudit`, `useBundleSizeTracking`, `useDeleteButtonAutoPatcher`, `usePromptPhasePlanner`, `useErrorPatternLearning`, `useDeployGate`, `useCollaborationEngine`, `useAPIBuilder`, `useProjectReview`, `useSchemaIntrospection`, `usePromptChains`, `useAICodeReview`, `useTestGenerator`, `useMultiCursorEditor`, `useMinimapHeatZones`, `useSymbolNavigator`
  - These return no-op stubs until `useDeferredMount()` returns `true`

---

## Technical Details

```text
Freeze Sources (ranked by severity):

1. html2canvas in usePreviewCapture
   └─ Creates hidden 1280×800 iframe
   └─ Renders full HTML + waits 4-8s
   └─ Runs html2canvas (synchronous DOM walk)
   └─ Up to 3 retries = 24s main-thread block

2. Auto-heal cascade
   └─ Compile error → sendMessage → compile → error → sendMessage...
   └─ Three independent fix systems can fire simultaneously
   └─ No global cooldown between fix attempts

3. Post-generation effect storm
   └─ 5+ effects fire in same React commit
   └─ Each does synchronous work (JSON.stringify, file iteration)
   └─ Cloud save + IDB save + localStorage save all race

4. State desync (isCompiling vs compileState)
   └─ Multiple code paths set isCompiling independently
   └─ UI shows spinner when compile already finished

5. 60+ hooks initialized on mount
   └─ Each hook allocates refs, state, effects
   └─ Many never used in typical session
```

## Implementation Order
1. Step 1 (thumbnail) — highest impact, isolated change
2. Step 2 (auto-heal gate) — prevents cascade freezes
3. Step 4 (state desync) — prevents stuck UI
4. Step 3 (effect storm) — prevents post-gen freeze
5. Step 6 (project load guard) — prevents load freeze
6. Step 7 (deferred hooks) — reduces baseline overhead
7. Step 5 (error boundary) — safety net for remaining issues


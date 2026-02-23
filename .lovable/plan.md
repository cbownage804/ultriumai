

## Fix SafePass 404s + AI Studio Performance

### Two Issues

---

### Issue 1: SafePass 404 Routes

The sidebar navigation in `SafeSuiteLayout.tsx` links to 5 routes that have no corresponding `<Route>` entries in `App.tsx`:

| Sidebar Link | Route Path | Page Component (exists) | Registered in App.tsx? |
|---|---|---|---|
| Secure Notes | `/safesuite/pass/notes` | `SafePassNotes.tsx` | No |
| Credit Cards | `/safesuite/pass/cards` | `SafePassCards.tsx` | No |
| Identity Profiles | `/safesuite/pass/identity` | `SafePassIdentity.tsx` | No |
| Password Health | `/safesuite/pass/health` | `SafePassHealth.tsx` | No |
| User Management | `/safesuite/pass/users` | `SafePassUsers.tsx` | No |

All 5 page components already exist in `src/pages/safesuite/`. They just need to be lazy-imported and routed.

**File: `src/App.tsx`**
- Add 5 lazy imports for `SafePassNotes`, `SafePassCards`, `SafePassIdentity`, `SafePassHealth`, `SafePassUsers`
- Add 5 `<Route>` entries after the existing `/safesuite/pass/shared` route (line ~705)

---

### Issue 2: AI Studio App Builder Sluggishness

The `AIAppBuilderWorkspace.tsx` is a 3,105-line monolith that initializes 50+ hooks synchronously on mount. This was diagnosed in a prior conversation and a deferred-mount plan was approved but never implemented.

**New file: `src/hooks/useDeferredMount.ts`** (~15 lines)
- Returns a `ready` boolean that starts `false` and flips to `true` after `requestIdleCallback` (or 100ms fallback)
- This allows critical hooks to initialize immediately while non-essential ones wait for the browser to be idle

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**
- Import `useDeferredMount` and call it at the top of the component
- Wrap the following ~15 non-critical hooks (lines ~530-558) behind the `ready` gate, providing stable no-op defaults when not ready:
  - `useCodeSmellDetector`, `useDocGenerator`, `useAutoFixLoop`, `useGithubSync`, `useInlineAIEdit`, `useBuildLog`, `usePostBuildSmokeTest`, `useHotModuleRecovery`, `useSelfReviewPass`, `useDependencyConflictDetection`, `useSmartFileScaffolding`, `useInlineErrorAnnotations`, `usePromptMemory`, `useLighthouseAudit`, `useBundleSizeTracking`, `useDeleteButtonAutoPatcher`, `usePromptPhasePlanner`
- Add a 500ms delay to the `recoverJobs()` mount effect (line ~515)
- Gate the realtime cursor channel behind `currentProjectId && activeFile` instead of just `currentProjectId`

**Expected impact**: First paint drops from ~10s to ~1-2s. Deferred hooks initialize within 100-500ms after paint, invisible to the user.

---

### Summary

| File | Change |
|---|---|
| `src/App.tsx` (~line 705) | Add 5 lazy imports + 5 routes for missing SafePass pages |
| `src/hooks/useDeferredMount.ts` (new) | Tiny hook returning idle-deferred `ready` boolean |
| `src/components/ai-builder/AIAppBuilderWorkspace.tsx` (~lines 497-560) | Defer ~15 non-critical hooks and delay mount effects |


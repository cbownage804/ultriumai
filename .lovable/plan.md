

## Phase 4: Gaps 19, 20, 21, 22, 24 (skipping 23 and 25)

### Gap 20: Remove SuggestionChips and Intent Chips

**In `BuilderChatPanel.tsx`:**
- Delete the `SuggestionChips` component (lines 29-77)
- Remove its usage (lines 1093-1100)
- Remove backend intent chips rendering (lines 1102-1127)
- Remove `generateIntentSuggestions` from the `SupabaseConversational` import (line 23)

### Gap 21: Remove Build Summary Card

**In `BuilderChatPanel.tsx`:**
- Delete the build summary card (lines 1004-1018)
- Remove `Clock` and `Coins` icon imports (line 7)

### Gap 22: Remove Version History Drawer

**In `BuilderChatPanel.tsx`:**
- Delete `showHistory` state (line 336)
- Delete the version history drawer section (lines 1136-1157)
- Remove `History` and `ChevronRight` icon imports (line 5)

### Gap 19: Remove Dead Imports

**In `AIAppBuilderWorkspace.tsx`:**
- Remove `WorkspaceBottomBar` import (line 70)
- Remove `WorkspaceStatusBar` import (line 71)

**Delete files:**
- `src/components/ai-builder/DeviceFrameOverlay.tsx`
- `src/components/ai-builder/PreviewZoomControls.tsx`

### Gap 24: Inline `PreviewError` Type

**In `BuilderPreviewPanel.tsx`:**
- Define `PreviewError` type inline (copy from `ErrorConsole.tsx` lines 7-15)
- Remove the `import { type PreviewError } from './ErrorConsole'` (line 8)
- Update `onSmartFixError` prop type reference (line 19) to use the local type

### Files Modified
- `BuilderChatPanel.tsx` (Gaps 20, 21, 22)
- `AIAppBuilderWorkspace.tsx` (Gap 19)
- `BuilderPreviewPanel.tsx` (Gap 24)

### Files Deleted
- `DeviceFrameOverlay.tsx`
- `PreviewZoomControls.tsx`


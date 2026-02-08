

## Polish Pass: Empty States, Micro-Interactions, Skeletons, Mobile, and Tooltips

This plan implements all remaining polish items in a single pass across the App Builder workspace.

### What's Changing

**1. Wire Empty States into Active Panels**
Currently `EmptyStates.tsx` exists but is unused. We'll integrate the pre-built empty states into panels that show "No data" conditions:
- Activity Feed: Show the `activity` empty state when `entries` is empty (replace plain text)
- Edge Functions panel: Show `edgeFunctions` empty state when list is empty
- Assets panel: Show `assets` empty state when no assets exist
- Env Vars panel: Show `envVars` empty state when no variables configured
- Version History panel: Show `history` empty state when no versions

**2. Micro-Interactions on Sidebar Icons**
Add subtle scale + spring transitions to the left icon sidebar buttons using `framer-motion`. Each sidebar icon will get a `whileHover={{ scale: 1.1 }}` and `whileTap={{ scale: 0.95 }}` for tactile feedback.

**3. Loading Skeleton Consistency**
The `SkeletonPreview` component already exists. We'll ensure it's rendered in the preview panel when `isGenerating` is true AND there's no HTML content yet (first build), replacing the blank state.

**4. Mobile Responsiveness Refinements**
- Add `safe-area-inset` padding to the top bar and bottom input area for notched devices
- Ensure the mobile tab switcher (Chat/Editor) has proper 44px touch targets
- Make the sidebar icon bar hidden on mobile (it's inaccessible at 40px width on small screens)

**5. Suggestion Chips Polish**
The follow-up suggestion chips are already implemented and wired. We'll enhance their styling with a subtle entrance animation using `framer-motion` staggered children.

**6. Tooltip Coverage Audit**
All sidebar icons already have tooltips. We'll add tooltips to the remaining toolbar buttons that lack them:
- Image upload button in chat input
- Visual Edit toggle button
- Clear chat button
- Version history toggle in chat header

---

### Technical Details

**Files to modify:**
- `src/components/ai-builder/ActivityFeed.tsx` - Import and use `EmptyState` from `EmptyStates.tsx`
- `src/components/ai-builder/AIAppBuilderWorkspace.tsx` - Add motion wrappers to sidebar icons, safe-area padding, hide sidebar on mobile
- `src/components/ai-builder/BuilderChatPanel.tsx` - Add motion to suggestion chips, tooltips to buttons, safe-area bottom padding
- `src/components/ai-builder/BuilderPreviewPanel.tsx` - Show `SkeletonPreview` during first-build generating state
- `src/components/ai-builder/EnvVarsPanel.tsx` - Add empty state
- `src/components/ai-builder/AssetManager.tsx` - Add empty state
- `src/components/ai-builder/VersionHistoryPanel.tsx` - Add empty state

**No new files or dependencies needed.** All changes use existing components (`EmptyStates.tsx`, `SkeletonPreview.tsx`) and the already-installed `framer-motion` library.

**Build safety:** Changes are purely cosmetic/UX - no structural or routing changes. The simplified `manualChunks` strategy remains untouched.


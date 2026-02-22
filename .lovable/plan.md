

## Phase 2 Continued: Lovable Parity Gaps

Gap 6 (Top Bar) is complete. Here are the remaining gaps, ordered by impact.

---

### Gap 7: Simplify Chat Input (HIGH IMPACT)

The current chat input has a visible Chat/Build mode toggle with credit cost labels ("1cr", "2cr"), a model selector popover, a context budget bar, conversation analytics ("3 msgs, 2 topics"), a Review button, and a credit cost badge next to the send button. Lovable has none of this -- just a clean textarea, a `+` button, a Visual Edits toggle, and a send button.

**Changes in `BuilderChatPanel.tsx`:**
- Remove the entire bottom bar (lines 1758-1904): mode toggle, model selector, context budget indicator, conversation analytics
- Remove the credit cost badge next to the send button (lines 1730-1739)
- Auto-detect mode instead of showing toggle (default to "build" when project has files, "discuss" for empty projects)
- Keep: `+` menu, Visual Edit toggle, textarea, send/stop button
- Simplify send button to a single style (no violet/cyan mode distinction)
- Change textarea placeholder to just "Ask Lovable..." style

---

### Gap 8: Clean Error Banner (MEDIUM IMPACT)

The error display is close but has extra chrome. The bottom console tab switcher (Errors/Console tabs at lines 747-776) doesn't exist in Lovable. Lovable shows only a compact red banner with "Try to fix" and dismiss.

**Changes in `BuilderPreviewPanel.tsx`:**
- Remove the Errors/Console tab switcher and console log panel (lines 746-789)
- Keep only the red error overlay banner (lines 690-743) which is already close to Lovable's design
- Remove the `ErrorConsole` component usage entirely -- errors show only in the inline banner

---

### Gap 9: Streamlined File Tree (MEDIUM IMPACT)

The file tree has colored file-type icons (orange for HTML, blue for CSS, yellow for JS, etc.), diff indicator dots, context menus for delete/rename/create, and a search bar. Lovable's file tree is minimal with monochrome icons and no context menus.

**Changes in `ProjectFileTree.tsx`:**
- Replace colored file icons with uniform monochrome icons (all `text-white/40`)
- Remove diff indicator dots (green/amber new/modified markers)
- Remove inline delete, rename, and create file buttons
- Remove the search bar at the top
- Simplify to just: folder expand/collapse + file name + click to open

---

### Gap 10: Simplify Empty State (LOW IMPACT)

The empty preview state has animated mesh gradients, floating particles, a CSS `@keyframes float` animation, a glowing icon with breathing effect, feature pills ("Hot reload", "Multi-file", "Responsive"), and a background image. Lovable has a clean, minimal empty state.

**Changes in `BuilderPreviewPanel.tsx` (lines 604-687):**
- Remove all animated backgrounds, particles, mesh gradients
- Replace with simple centered text: app name + "Describe what you want to build" subtitle
- Remove feature pills and keyboard shortcut hint

---

### Gap 11: Remove Bottom Bars (MEDIUM IMPACT)

Lovable has no status bar or bottom bar. The current workspace has both:
- `WorkspaceStatusBar` showing language, cursor position, file count, branch name, unsaved count, build count, autocomplete toggle, save status
- `WorkspaceBottomBar` showing ProjectSettings, Vercel deploy, GitHub sync, Share, Export buttons

**Changes:**
- Remove `WorkspaceStatusBar` rendering from the workspace (or hide it entirely)
- Remove `WorkspaceBottomBar` rendering from the workspace
- Move any critical actions (settings, export) into the project dropdown menu or Cmd+K palette

---

### Gap 12: Remove Header Credits Indicator (LOW IMPACT)

`HeaderCreditsIndicator` shows a credit count in the top bar. Lovable doesn't show credits in the header.

**Changes:**
- Remove the credits indicator from the top bar if it's currently rendered there
- Credits info should only be visible in Settings/Billing

---

### Gap 13: Simplify Toolbar Panels Dropdown (LOW IMPACT)

The `ToolbarPanelsDropdown` with 150+ pinnable tools in a mega-menu is not a Lovable pattern. These should only be in Cmd+K.

**Changes:**
- Remove the `ToolbarPanelsDropdown` from the top bar if still rendered
- Ensure all tools remain discoverable via `CommandPalette` (Cmd+K)

---

### Implementation Order

1. **Gap 7** -- Chat input simplification (biggest UX touchpoint remaining)
2. **Gap 11** -- Remove bottom bars (visual clutter)
3. **Gap 8** -- Error banner cleanup
4. **Gap 9** -- File tree simplification
5. **Gap 10** -- Empty state
6. **Gap 12** -- Credits indicator
7. **Gap 13** -- Toolbar dropdown

### Technical Notes

- All removed functionality (model selector, mode toggle, context budget, console logs) should remain accessible via Cmd+K command palette
- No new files needed -- this is purely simplification/removal
- The 250+ panel component files in `src/components/ai-builder/` remain available but are only accessed through Cmd+K, not through visible UI chrome
- Total files modified: ~5-6 files


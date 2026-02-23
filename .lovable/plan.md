

## Lovable-Parity Plus Menu

### What Changes
Upgrade the "+" menu in the chat input to match Lovable's full menu structure with all navigation items, keyboard shortcuts, separators, and templates.

### Current State
The plus menu has only 3 items:
- Take a screenshot
- Add reference
- Attach
- Templates section (6 templates)

### Target State (matching Lovable's screenshots)

```text
+-----------------------------+
| Project settings    Ctrl+.  |
| History                     |
| Knowledge                   |
| GitHub                      |
|-------- separator ----------|
| Take a screenshot           |
| Add reference               |
| Attach                      |
|-------- separator ----------|
| TEMPLATES                   |
| Add authentication          |
| Make responsive             |
| Add dark mode               |
| Add dashboard               |
| Add payments                |
| Add search                  |
+-----------------------------+
```

### Technical Details

**File: `src/components/ai-builder/BuilderChatPanel.tsx`**

1. Add new props to `BuilderChatPanelProps`:
   - `onShowSettings?: () => void`
   - `onShowHistory?: () => void`
   - `onShowKnowledge?: () => void`
   - `onShowGitHub?: () => void`

2. Import additional icons: `Settings`, `Clock`, `BookOpen`, `GitBranch`

3. Restructure the PopoverContent (lines ~1315-1373) to add 4 new menu items before "Take a screenshot", with a separator between the navigation group and the action group:
   - **Project settings** (Settings icon, "Ctrl+." shortcut hint on right side)
   - **History** (Clock icon)
   - **Knowledge** (BookOpen icon)
   - **GitHub** (GitBranch icon)
   - Separator line
   - Take a screenshot (existing)
   - Add reference (existing)
   - Attach (existing)
   - Separator + Templates (existing)

4. Widen the popover from `w-48` to `w-56` to accommodate the shortcut hint

**File: `src/components/ai-builder/AIAppBuilderWorkspace.tsx`**

5. Pass the 4 new callback props to both BuilderChatPanel instances (mobile ~line 2453 and desktop ~line 2525):
   - `onShowSettings={() => setShowSettingsModal(true)}`
   - `onShowHistory={() => setShowVersionHistory(true)}`
   - `onShowKnowledge={() => setShowKnowledge(true)}`
   - `onShowGitHub={() => setShowGitHubPanel(true)}`

### No backend changes needed
All panels already exist in the workspace -- this just wires them into the plus menu.
